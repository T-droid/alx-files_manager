const { MongoClient } = require('mongodb');

//get environmental variables
const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || '27017';
const DATABASE = process.env.DB_DATABASE || 'files_manager';

const url = `mongodb://${HOST}:${PORT}`;


class DBClient {
    constructor() {
        // Set host, port, and database based on environment variables
        this.client = new MongoClient(url, { useUnifiedTopology: true });
        this.client.connect();
    }

    //checks if the mongo client is connected succesfully
    isAlive() {
        return this.client.isConnected()
    
    }

    //counts the number of documents of the collection users
    async nbUsers() {
        try {
            const db = this.client.db(this.database);
            const users = db.collection('users');
            return await users.countDocuments();
        } catch (err) {
            console.error('Error counting documents in "users" collection');
        }
    }

    //count the number of documents in the collection files
    async nbFiles() {
        try {
            const db = this.client.db(this.database);
            const files = db.collection('files');
            return await files.countDocuments();
        } catch (err) {
            console.error('Error counting documents in "files" collection');
        }
    }
}

const dbClient = new DBClient();
module.exports = dbClient;
