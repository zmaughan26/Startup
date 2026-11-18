const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const { MongoClient, ObjectId } = require('mongodb');

const port = process.argv.length > 2 ? process.argv[2] : 4000;
const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const databaseName = process.env.MONGODB_DATABASE || 'studytrack';
const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
};

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

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production.');
}

if (isProduction) {
  app.set('trust proxy', 1);
}

const mongoConfig = getMongoConfiguration();
const mongoClient = new MongoClient(mongoConfig.uri, {
  serverSelectionTimeoutMS: 10000,
});
const mongoClientPromise = mongoClient.connect();
const mongoSessionStore = MongoStore.create({
  clientPromise: mongoClientPromise,
  dbName: mongoConfig.databaseName,
  collectionName: 'sessions',
  ttl: 60 * 60 * 24,
});
mongoSessionStore.collectionP.catch(() => {});
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

app.use(express.json());
app.use(session({
  name: 'studytrack.sid',
  secret: sessionSecret,
  store: mongoSessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    ...sessionCookieOptions,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));
app.use(express.static(path.join(__dirname, 'public')));

function logDatabaseError(action, error) {
  console.error(`${action}:`, error);
}

function respondWithDatabaseError(res, action, error) {
  logDatabaseError(action, error);
  res.status(500).json({ error: 'A database error occurred. Please try again.' });
}

async function requireAuthentication(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }

  try {
    const database = await databasePromise;
    const user = await database.collection('users').findOne(
      { usernameKey: req.session.userId },
      { projection: { username: 1 } }
    );
    if (!user) {
      return res.status(401).json({ error: 'Please log in to continue.' });
    }

    req.user = user;
    next();
  } catch (error) {
    respondWithDatabaseError(res, 'Authentication lookup failed', error);
  }
}

function establishSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        reject(regenerateError);
        return;
      }

      req.session.userId = userId;
      req.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }
        resolve();
      });
    });
  });
}

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (
    typeof username !== 'string' ||
    !/^[a-zA-Z0-9_]{3,32}$/.test(username.trim()) ||
    typeof password !== 'string' ||
    Buffer.byteLength(password, 'utf8') < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      error: 'Use a 3–32 character username (letters, numbers, underscores) and a password of 8–72 bytes.',
    });
  }

  const usernameKey = username.trim().toLowerCase();
  const database = await databasePromise;
  const users = database.collection('users');

  try {
    const user = {
      username: username.trim(),
      usernameKey,
      passwordHash: await bcrypt.hash(password, 12),
    };
    await users.insertOne(user);
    await establishSession(req, usernameKey);
    res.status(201).json({ username: user.username });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'That username is already registered.' });
    }
    respondWithDatabaseError(res, 'Registration failed', error);
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const database = await databasePromise;
    const usernameKey = username.trim().toLowerCase();
    const user = await database.collection('users').findOne({ usernameKey });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    await establishSession(req, usernameKey);
    res.json({ username: user.username });
  } catch (error) {
    respondWithDatabaseError(res, 'Login failed', error);
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Logout failed:', error);
      res.status(500).json({ error: 'Could not log out. Please try again.' });
      return;
    }

    res.clearCookie('studytrack.sid', sessionCookieOptions);
    res.status(204).end();
  });
});

app.get('/api/auth/me', requireAuthentication, (req, res) => {
  res.json({ username: req.user.username });
});

app.get('/api/assignments', requireAuthentication, async (req, res) => {
  try {
    const database = await databasePromise;
    const assignments = await database.collection('assignments')
      .find({ userId: req.session.userId }, { projection: { _id: 0, userId: 0 } })
      .sort({ _id: 1 })
      .toArray();
    res.json(assignments);
  } catch (error) {
    respondWithDatabaseError(res, 'Loading assignments failed', error);
  }
});

app.post('/api/assignments', requireAuthentication, async (req, res) => {
  const { name, className, dueDate } = req.body;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof className !== 'string' ||
    !className.trim() ||
    typeof dueDate !== 'string' ||
    !dueDate.trim()
  ) {
    return res.status(400).json({
      error: 'Name, class, and due date are required.',
    });
  }

  try {
    const database = await databasePromise;
    const assignment = {
      id: new ObjectId().toHexString(),
      userId: req.session.userId,
      name: name.trim(),
      className: className.trim(),
      dueDate: dueDate.trim(),
      completed: false,
    };

    await database.collection('assignments').insertOne(assignment);
    const { userId, ...responseAssignment } = assignment;
    res.status(201).json(responseAssignment);
  } catch (error) {
    respondWithDatabaseError(res, 'Saving assignment failed', error);
  }
});

app.delete('/api/assignments/:id', requireAuthentication, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  try {
    const database = await databasePromise;
    const result = await database.collection('assignments').deleteOne({
      userId: req.session.userId,
      id: req.params.id,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    res.status(204).end();
  } catch (error) {
    respondWithDatabaseError(res, 'Deleting assignment failed', error);
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

databasePromise
  .then(() => {
    app.listen(port, () => {
      console.log(`Connected to MongoDB database "${mongoConfig.databaseName}"`);
      console.log(`Listening on port ${port}`);
    });
  })
  .catch(async (error) => {
    console.error('Could not connect to MongoDB. Check your connection settings and network access.', error);
    await mongoClient.close();
    process.exitCode = 1;
  });
