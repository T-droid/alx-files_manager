import redisClient from '../utils/redis';
const dbClient = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const asyncWriteFile = promisify(fs.writeFile);


export async function postUpload(req, res) {
    const { name, type, parentId = 0, isPublic = false, data } = req.body;
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    //retrieve user id from redis
    let user_id;
    try {
        user_id = await redisClient.get(key);
        if (!user_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }

    //get user from database
    let user;
    try {
        user = await dbClient.getUserWithId(user_id);
        if (!user) {
            return res.status(401).json({error: 'Unauthorized'});
        }
    } catch (err) {
        console.error(err);
    }

    //validate recieved fields
    if (!name) {
        return res.status(400).json({error: 'Missing name'});
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({error: 'Missing type'});
    }

    if (!data && type !== 'folder') {
        return res.status(400).json({error: 'Missing data'});
    }

    //check if parent is valid
    if (parentId !== 0) {
        try {
            const parentFile = await dbClient.findFileById(parentId);
            if (!parentFile) {
                return res.status(400).json({error: 'Parent not found'});
            }
            if (parentFile.type !== 'folder') {
                return res.status(400).json({error: 'Parent is not a folder'});
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    //create path and store file locally
    const filename = uuidv4();
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const localPath = path.join(folderPath, filename);

    try {
        await asyncWriteFile(localPath, Buffer.from(data, 'base64'));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }

    const newFile = {
        userId: user_id,
        name: name,
        type: type,
        isPublic: isPublic,
        parentId: parentId,
        localPath: localPath
    }
    try {
        const createdFile = await dbClient.createNewFile(newFile);
        // return only needed data not the whole db results
        const neededData = createdFile.ops;
        
        const msg = {
            "id": neededData[0]._id,"userId": neededData[0].userId,
            "name": neededData[0].name,"type": neededData[0].type,
            "isPublic": neededData[0].isPublic,"parentId": neededData[0].parentId
        }
        res.status(201).send(msg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }

}


export async function putPublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    //retrieve user id from redis
    let user_id;
    try {
        user_id = await redisClient.get(key);
        if (!user_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }

    //get the file linked to this user
    let file;
    try {
        file = await dbClient.findFileByUserId(user_id);
        if (!file) {
            return res.status(404).json({error: 'Not found'});
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }

    //update isPublic
    file.isPublic = true;

    try {
        const updatedFile = await dbClient.replaceValue({_id: file._id}, file);
        return res.status(200).send(updatedFile);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function putUnpublish( req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    //retrieve user id from redis
    let user_id;
    try {
        user_id = await redisClient.get(key);
        if (!user_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }

    //get the file linked to this user
    let file;
    try {
        file = await dbClient.findFileByUserId(user_id);
        if (!file) {
            return res.status(404).json({error: 'Not found'});
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }

    //update isPublic
    file.isPublic = false;

    try {
        const updatedFile = await dbClient.replaceValue({_id: file._id}, file);
        return res.status(200).send(updatedFile);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getShow(req, res) {
    // retrieve file based on file ID
    const token = req.headers['x-token'];
    const fileId = req.params.id;
    const userId = await redisClient.get(`auth_${token}`);
    if(!userId) {
        res.status(401).send({'error': "Unauthorized"});
    }
    try{
        const file = await dbClient.findFileById(fileId);
        const fileFound = (file.userId === userId);

        const msg = {
            "id": file._id,"userId": file.userId,
            "name": file.name,"type": file.type,
            "isPublic": file.isPublic,"parentId": file.parentId
        }
        if (fileFound) {
            res.status(200).send(msg);
        } else{
            res.status(404).send({'error': "Not found"});
        }

    } catch(error) {
        res.status(404).send({'error': "Not found"});
    }
    
}

export async function getIndex(req, res) {
    // retrieve all users file documents for a specific parentId and with pagination
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const parentId = req.query.parentId || 0;
    const page = req.query.page || 0;
    const pageSize = 20;
    const skip = parseInt(page) * pageSize;

    if(!userId) {
        res.status(401).send({ 'error': 'Unauthorized'});
    } else {
        try{
            const results = await dbClient.aggregateFiles(userId, parentId, skip, pageSize);
            res.status(200).send(results);
        } catch(error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }


}