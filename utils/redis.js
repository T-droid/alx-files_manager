import redis from 'redis';

class RedisClient {
    constructor() {
        this.client = redis.createClient();

        this.changeStatus = true;

        this.client.on('error', (err) => {
            console.error('Redis connection error', err);
            this.changeStatus = false;

        });

    }

    isAlive() {
        // returns true if client is connected
        return this.changeStatus;

    }

    async get(key) {
        // get value of the key
        return new Promise((resolve, reject) => {
            this.client.get(key, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async set(key, value, durationInSeconds) {
        // set value for a key and also time for expiry
        return new Promise((resolve, reject) => {
            this.client.set(key, value, 'EX', durationInSeconds, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async del(key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }
}

const redisClient = new RedisClient();
module.exports =  redisClient;
