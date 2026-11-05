const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const port = process.argv.length > 2 ? process.argv[2] : 4000;
const app = express();
const users = new Map();
const assignmentsByUser = new Map();
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
  resave: false,
  saveUninitialized: false,
  cookie: {
    ...sessionCookieOptions,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));
app.use(express.static('public'));

function requireAuthentication(req, res, next) {
  if (!req.session.userId || !users.has(req.session.userId)) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
  next();
}

function getUserAssignments(userId) {
  if (!assignmentsByUser.has(userId)) {
    assignmentsByUser.set(userId, []);
  }
  return assignmentsByUser.get(userId);
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

  const normalizedUsername = username.trim().toLowerCase();
  if (users.has(normalizedUsername)) {
    return res.status(409).json({ error: 'That username is already registered.' });
  }

  try {
    const user = {
      username: username.trim(),
      passwordHash: await bcrypt.hash(password, 12),
    };
    users.set(normalizedUsername, user);
    await establishSession(req, normalizedUsername);
    res.status(201).json({ username: user.username });
  } catch (error) {
    users.delete(normalizedUsername);
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Could not create the account. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = users.get(username.trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  try {
    await establishSession(req, username.trim().toLowerCase());
    res.json({ username: user.username });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Could not log in. Please try again.' });
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
  res.json({ username: users.get(req.session.userId).username });
});

app.get('/api/assignments', requireAuthentication, (req, res) => {
  res.json(getUserAssignments(req.session.userId));
});

app.post('/api/assignments', requireAuthentication, (req, res) => {
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

  const assignment = {
    id: Date.now(),
    name: name.trim(),
    className: className.trim(),
    dueDate: dueDate.trim(),
    completed: false,
  };

  getUserAssignments(req.session.userId).push(assignment);
  res.status(201).json(assignment);
});

app.delete('/api/assignments/:id', requireAuthentication, (req, res) => {
  const assignmentId = Number(req.params.id);
  const assignments = getUserAssignments(req.session.userId);
  const assignmentIndex = assignments.findIndex(
    (assignment) => assignment.id === assignmentId
  );

  if (!Number.isSafeInteger(assignmentId) || assignmentIndex === -1) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  assignments.splice(assignmentIndex, 1);
  res.status(204).end();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
