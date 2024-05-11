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
        this.database = DATABASE;
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

    //gets the user from database matching the email
    async getUserWithEmail(email) {
        try {
            const db = this.client.db(this.database);
            const users = db.collection('users');
            const result = await users.findOne({ email: email });
            return result;
        } catch (err) {
            throw Error('Error occured while finding user in "users" collection');
        }
    }

    //creates new user
    async createUser(email, hashedPassword) {

        //store user
        try {
            const db = this.client.db(this.database);
            const users = db.collection('users');
            await users.insertOne({ email: email, password: hashedPassword });

            //get the user and return the user object
            const user = await users.findOne({ email: email }, { projection: { _id: 1 } });
            return user;

        } catch (err) {
            throw Error('Error occured while finding user in "users" collection');
        }
    }
}

const dbClient = new DBClient();
module.exports = dbClient;
