import dbClient from '../utils/db';
import redisClient from '../utils/redis';
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
    return res.status(201).send({id: user._id, email: email});
    } catch (error) {
        console.error(error);
        return res.status(500).send({error: 'server error'});
    }
}

function encryptPassword(password) {
    const sha1 = crypto.createHash('sha1');
    sha1.update(password);
    const hashedPassword = sha1.digest('hex');
    return hashedPassword;
}

export async function getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
        return res.status(401).send({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key); // get user id from token

    if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
    }

    // returns the user object
    const user = await dbClient.getUserWithId(userId);

    if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
    }

    return res.status(200).send({ id: user._id, email: user.email });
}