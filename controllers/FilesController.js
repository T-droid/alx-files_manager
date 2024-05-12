import redisClient from '../utils/redis';
const dbClient = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const asyncWriteFile = promisify(fs.writeFile);


export async function postUpload(req, res) {
    const { token, name, type, parentId = 0, isPublic = false, data } = req.body;
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
        return res.status(201).send(createdFile);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }

}