import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export function getStatus(req, res){
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();
    res.status(200).send({ "redis": redisStatus, "db": dbStatus })
}

export async function getStats (req, res) {
    // return number of users and fles in db
    const [ totalUsers ] = await Promise.allSettled([dbClient.nbUsers()]);
    const [ totalFiles ] = await Promise.allSettled([dbClient.nbFiles()]);
    res.status(200).send({ "users": totalUsers.value, "files": totalFiles.value });
}
