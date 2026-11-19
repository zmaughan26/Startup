const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const {
  ObjectId,
  closeDatabase,
  connectDatabase,
  getDatabase,
  respondWithDatabaseError,
  sessionStore,
} = require('./database');

const port = process.argv.length > 2 ? process.argv[2] : 4000;
const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
};

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production.');
}

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(session({
  name: 'studytrack.sid',
  secret: sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    ...sessionCookieOptions,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));
app.use(express.static(path.join(__dirname, 'public')));

async function requireAuthentication(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }

  try {
    const database = await getDatabase();
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
  try {
    const database = await getDatabase();
    const users = database.collection('users');
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
    const database = await getDatabase();
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
    const database = await getDatabase();
    const completed = req.query.completed === 'true';
    const assignments = await database.collection('assignments')
      .find(
        {
          userId: req.session.userId,
          completed: completed ? true : { $ne: true },
        },
        { projection: { userId: 0 } }
      )
      .sort({ _id: 1 })
      .toArray();
    res.json(assignments.map(({ _id, id, ...assignment }) => ({
      ...assignment,
      id: id || _id.toHexString(),
    })));
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
    const database = await getDatabase();
    const assignment = {
      userId: req.session.userId,
      name: name.trim(),
      className: className.trim(),
      dueDate: dueDate.trim(),
      completed: false,
    };

    const { insertedId } = await database.collection('assignments').insertOne(assignment);
    const { userId, ...responseAssignment } = assignment;
    responseAssignment.id = insertedId.toHexString();
    res.status(201).json(responseAssignment);
  } catch (error) {
    respondWithDatabaseError(res, 'Saving assignment failed', error);
  }
});

app.patch('/api/assignments/:id', requireAuthentication, async (req, res) => {
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
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  try {
    const database = await getDatabase();
    const assignments = database.collection('assignments');
    const filter = {
      userId: req.session.userId,
      $or: [
        { _id: new ObjectId(req.params.id) },
        { id: req.params.id },
      ],
    };
    const result = await assignments.updateOne(filter, {
      $set: {
        name: name.trim(),
        className: className.trim(),
        dueDate: dueDate.trim(),
      },
    });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const assignment = await assignments.findOne(
      filter,
      { projection: { userId: 0 } }
    );
    const { _id, id, ...responseAssignment } = assignment;
    res.json({
      ...responseAssignment,
      id: id || _id.toHexString(),
    });
  } catch (error) {
    respondWithDatabaseError(res, 'Updating assignment failed', error);
  }
});

app.patch('/api/assignments/:id/completion', requireAuthentication, async (req, res) => {
  const { completed } = req.body;
  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Completion status must be true or false.' });
  }
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  try {
    const database = await getDatabase();
    const assignments = database.collection('assignments');
    const filter = {
      userId: req.session.userId,
      $or: [
        { _id: new ObjectId(req.params.id) },
        { id: req.params.id },
      ],
    };
    const update = completed
      ? {
          $set: { completed: true, completedOn: new Date().toISOString() },
        }
      : {
          $set: { completed: false },
          $unset: { completedOn: '' },
        };
    const result = await assignments.updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const assignment = await assignments.findOne(
      filter,
      { projection: { userId: 0 } }
    );
    const { _id, id, ...responseAssignment } = assignment;
    res.json({
      ...responseAssignment,
      id: id || _id.toHexString(),
    });
  } catch (error) {
    respondWithDatabaseError(res, 'Updating assignment completion failed', error);
  }
});

app.delete('/api/assignments/:id', requireAuthentication, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  try {
    const database = await getDatabase();
    const result = await database.collection('assignments').deleteOne({
      userId: req.session.userId,
      $or: [
        { _id: new ObjectId(req.params.id) },
        { id: req.params.id },
      ],
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

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log('Connected to MongoDB.');
      console.log(`Listening on port ${port}`);
    });
  })
  .catch(async (error) => {
    console.error('Could not connect to MongoDB. Check your connection settings and network access.', error);
    await closeDatabase();
    process.exitCode = 1;
  });
