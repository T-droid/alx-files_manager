const bull = require('bull');
const dbClient = require('./utils/db');
const imageThumbNail = require('image-thumbnail');
const path = require('path');
const fs = require('fs');

const fileQueue = new bull('fileQueue');

fileQueue.process( async (job) => {
    if (!job.data.fileId) {
        throw new Error('Missing fileId');
    }
    if (!job.data.userId) {
        throw new Error('Missing userId');
    }

    const file = dbClient.findFileById(job.data.fileId);
    if (!(file || dbClient.findFileByUserId(job.data.userId))) {
        throw new Error('File not found');
    }

    const localPath = file.localPath;

    [500, 250, 100].forEach( async (size) => {
        let buffer = await imageThumbNail(localPath, {width: size});
        let imagePath = `${localPath}_${size}.png`;
        fs.writeFile(imagePath, buffer, err => {
            if (err) {
                console.error(err);
            }
        });
    });

});

const userQueue = new bull('userQueue');

userQueue.process( async (job) => {
    if (!job.data.userId) {
        throw new Error('Missing userId');
    }
    const user = await dbClient.getUserWithId(job.data.userId);
    if (!user) {
        throw new Error('User not found');
    }

    console.log(`Welcome ${user.email}`)

})

