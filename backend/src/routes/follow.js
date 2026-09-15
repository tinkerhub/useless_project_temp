const express = require('express');
const db = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /follow/:userId
router.post('/:userId', auth, (req, res) => {
  const targetId = parseInt(req.params.userId);
  if (targetId === req.user.id) {
    return res.status(400).json({ error: "You cannot follow yourself. (Though emotionally, that might be healthy.)" });
  }

  const target = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: 'User not found.' });

  const existing = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, targetId);
  if (existing) return res.status(409).json({ error: 'Already following.' });

  db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, targetId);
  db.prepare('INSERT INTO notifications (user_id, type, actor_id) VALUES (?, ?, ?)').run(targetId, 'follow', req.user.id);

  res.json({ following: true, message: `You are now following ${target.username}. You still cannot see their posts.` });
});

// DELETE /follow/:userId
router.delete('/:userId', auth, (req, res) => {
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user.id, req.params.userId);
  res.json({ following: false });
});

// GET /follow/:userId/status
router.get('/:userId/status', auth, (req, res) => {
  const row = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, req.params.userId);
  res.json({ following: !!row });
});

module.exports = router;
