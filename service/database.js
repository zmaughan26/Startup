const fs = require('node:fs');
const path = require('node:path');
const MongoStore = require('connect-mongo').default;
const { MongoClient, ObjectId } = require('mongodb');

const databaseName = process.env.MONGODB_DATABASE || 'studytrack';

function getMongoConfiguration() {
  if (process.env.MONGODB_URI) {
    return {
      uri: process.env.MONGODB_URI,
      databaseName,
    };
  }

  const configPath = path.join(__dirname, '..', 'dbconfig.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Set MONGODB_URI or provide the ignored dbconfig.json file.');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (
    typeof config.hostname !== 'string' ||
    typeof config.userName !== 'string' ||
    typeof config.password !== 'string'
  ) {
    throw new Error('dbconfig.json must define hostname, userName, and password.');
  }

  const connectionString = /^(mongodb|mongodb\+srv):\/\//.test(config.hostname)
    ? config.hostname
    : `mongodb+srv://${config.hostname}`;
  const mongoUrl = new URL(connectionString);
  mongoUrl.username = config.userName;
  mongoUrl.password = config.password;

  return {
    uri: mongoUrl.toString(),
    databaseName: process.env.MONGODB_DATABASE || config.databaseName || databaseName,
  };
}

const mongoConfig = getMongoConfiguration();
const mongoClient = new MongoClient(mongoConfig.uri, {
  serverSelectionTimeoutMS: 10000,
});
const mongoClientPromise = mongoClient.connect();
const sessionStore = MongoStore.create({
  clientPromise: mongoClientPromise,
  dbName: mongoConfig.databaseName,
  collectionName: 'sessions',
  ttl: 60 * 60 * 24,
});
sessionStore.collectionP.catch(() => {});

const databasePromise = mongoClientPromise.then(async (client) => {
  const database = client.db(mongoConfig.databaseName);
  await Promise.all([
    database.collection('users').createIndex({ usernameKey: 1 }, { unique: true }),
    database.collection('assignments').createIndex(
      { userId: 1, id: 1 },
      { unique: true }
    ),
  ]);
  return database;
});

function getDatabase() {
  return databasePromise;
}

function connectDatabase() {
  return databasePromise;
}

function closeDatabase() {
  return mongoClient.close();
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
