import dbClient from '../utils/db';
const crypto = require('crypto');

export async function postNew(req, res) {
    try {
        const { email, password } = req.body;
    if (!email) {
        return res.status(400).json({error: 'Missing email'});
    }
    if (!password) {
        return res.status(400).json({error: 'Missing password'});
    }

    const exists = await dbClient.getUserWithEmail(email);
    if (exists) {
        return res.status(400).json({error: 'Already exist'});
    }

    const hshPassword = encryptPassword(password)
    const user = await dbClient.createUser(email, hshPassword);
    return res.status(201).json({email: email, id: user._id});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: 'server error'});
    }
}

function encryptPassword(password) {
    const sha1 = crypto.createHash('sha1');
    sha1.update(password);
    const hashedPassword = sha1.digest('hex');
    return hashedPassword;
}