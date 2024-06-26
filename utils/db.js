const { MongoClient, ObjectId } = require('mongodb');

// get environmental variables
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
    this.host = HOST;
  }

  // checks if the mongo client is connected succesfully
  isAlive() {
    return this.client.isConnected();
  }

  // counts the number of documents of the collection users
  async nbUsers() {
    try {
      const db = this.client.db(this.database);
      const users = db.collection('users');
      return await users.countDocuments();
    } catch (err) {
      console.error('Error counting documents in "users" collection');
    }
  }

  // count the number of documents in the collection files
  async nbFiles() {
    try {
      const db = this.client.db(this.database);
      const files = db.collection('files');
      return await files.countDocuments();
    } catch (err) {
      console.error('Error counting documents in "files" collection');
    }
  }

  // looks for parent file by id
  async findFileById(id) {
    try {
      const db = this.client.db(this.database);
      const files = db.collection('files');
      const results = await files.findOne({ _id: ObjectId(id) }); // use objectid
      return results;
    } catch (err) {
      throw Error('Cant find file by "id"');
    }
  }

  // create new file
  async createNewFile(fileObject) {
    try {
      const db = this.client.db(this.database);
      const files = db.collection('files');
      return await files.insertOne(fileObject);
    } catch (err) {
      throw Error('Cant create new file');
    }
  }

  // get file linked to user by user_id
  async findFileByUserId(userId) {
    try {
      const db = this.client.db(this.database);
      const files = db.collection('files');
      return await files.findOne({ userId });
    } catch (err) {
      throw Error('Error occured while looking for file with "userId"');
    }
  }

  // update or replace in file
  async replaceValue(idObject, updatedObject) {
    try {
      const db = this.client.db(this.database);
      const files = db.collection('files');
      return await files.replaceOne(idObject, updatedObject);
    } catch (err) {
      throw Error('Error occured while updating collection files');
    }
  }

  // gets the user from database matching the email
  async getUserWithEmail(email) {
    try {
      const db = this.client.db(this.database);
      const users = db.collection('users');
      const result = await users.findOne({ email });
      return result;
    } catch (err) {
      throw Error('Error occured while finding user in "users" collection');
    }
  }

  async getUserWithId(id) {
    // get user details from id
    try {
      const db = this.client.db(this.database);
      const users = db.collection('users');
      const result = await users.findOne({ _id: ObjectId(id) });
      return result;
    } catch (err) {
      throw Error('Error occured while finding user in "users" collection');
    }
  }

  // creates new user
  async createUser(email, hashedPassword) {
    // store user
    try {
      const db = this.client.db(this.database);
      const users = db.collection('users');
      await users.insertOne({ email, password: hashedPassword });

      // get the user and return the user object
      const user = await users.findOne({ email }, { projection: { _id: 1 } });
      return user;
    } catch (err) {
      throw Error('Error occured while finding user in "users" collection');
    }
  }

  async aggregateFiles(userId, parentId, skip, limit) {
    const pipeline = [
      // Match files belonging to the specified user and parent folder
      {
        $match: {
          userId,
          parentId,
        },
      },
      // Skip documents based on pagination
      { $skip: skip },
      // Limit the number of documents per page
      { $limit: limit },
    ];

    try {
      const db = this.client.db(this.database);
      const filesCollection = db.collection('files');
      const result = await filesCollection.aggregate(pipeline).toArray();
      return result;
    } catch (err) {
      throw new Error('Error aggregating files');
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
