const { MongoClient } = require('mongodb');
const config = require('./dbconfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;

// Connect to the database cluster
const client = new MongoClient(url);
const db = client.db('studytrack');
const collection = db.collection('assignments');

const { ObjectId } = require('mongodb');
const MongoStore = require('connect-mongo').default;
const mongoClientPromise = client.connect();
const sessionStore = MongoStore.create({
  clientPromise: mongoClientPromise,
  dbName: 'studytrack',
  collectionName: 'sessions',
  ttl: 60 * 60 * 24,
});

const databasePromise = mongoClientPromise.then(async () => {
  await Promise.all([
    db.collection('users').createIndex({ usernameKey: 1 }, { unique: true }),
    collection.createIndex({ userId: 1, completed: 1, dueDate: 1 }),
  ]);
  return db;
});

function getDatabase() {
  return databasePromise;
}

function connectDatabase() {
  return databasePromise;
}

function closeDatabase() {
  return client.close();
}

function respondWithDatabaseError(res, action, error) {
  console.error(`${action}:`, error);
  res.status(500).json({ error: 'A database error occurred. Please try again.' });
}

module.exports = {
  ObjectId,
  closeDatabase,
  connectDatabase,
  getDatabase,
  respondWithDatabaseError,
  sessionStore,
};