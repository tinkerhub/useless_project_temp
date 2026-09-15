const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required.' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(username, email, hashed);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: "Account created. Your posts are already being hidden.",
      token,
      user: { id: Number(result.lastInsertRowid), username, email }
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username or email already taken.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio || '',
      avatar_url: user.avatar_url || '',
      is_premium: !!user.is_premium
    }
  });
});

// GET /auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, bio, avatar_url, is_premium, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ ...user, is_premium: !!user.is_premium });
});

module.exports = router;
