import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import {v4} from 'uuid';

export async function getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).send({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const email = credentials.split(':')[0];

    const user = await dbClient.getUserWithEmail(email);
    // user doesnt exist
    if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
    }

    // create the uuid
    const token = v4();
    const key = `auth_${token}`;

    // Storing user ID in Redis with an expiry of 24 hours which is 86400secs
    const userId = user._id.toString();
    await redisClient.set(key, userId, 86400);

    return res.status(200).json({ "token": token });
}

export async function getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete token from Redis
    await redisClient.del(key)

    return res.status(204).send();

}