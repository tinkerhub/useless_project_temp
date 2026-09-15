const express = require('express');
const db = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /users/search?q=query
router.get('/search', auth, (req, res) => {
  const query = (req.query.q || '').toString().trim();
  if (!query) return res.json([]);

  const results = db.prepare(`
    SELECT id, username, bio, avatar_url, is_premium
    FROM users
    WHERE username LIKE ? OR bio LIKE ?
    ORDER BY username ASC
    LIMIT 20
  `).all(`%${query}%`, `%${query}%`);

  res.json(results.map(u => ({
    id: u.id,
    username: u.username,
    bio: u.bio || '',
    avatar_url: u.avatar_url || '',
    is_premium: !!u.is_premium
  })));
});

// GET /users/:username
router.get('/:username', auth, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, bio, avatar_url, is_premium, created_at FROM users WHERE username = ?'
  ).get(req.params.username);

  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { c: followers } = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(user.id);
  const { c: following } = db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(user.id);
  const { c: postCount } = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(user.id);
  const isFollowing = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, user.id);

  const posts = db.prepare(`
    SELECT p.id, p.created_at,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
    FROM posts p WHERE p.user_id = ?
    ORDER BY p.created_at DESC LIMIT 12
  `).all(user.id);

  res.json({
    id: user.id,
    username: user.username,
    bio: user.bio || '',
    avatar_url: user.avatar_url || '',
    is_premium: !!user.is_premium,
    followers: Number(followers),
    following: Number(following),
    post_count: Number(postCount),
    is_following: !!isFollowing,
    posts: posts.map(p => ({
      id: p.id,
      timestamp: p.created_at,
      likes: Number(p.like_count),
      comments: Number(p.comment_count),
      content: null
    }))
  });
});

// PUT /users/me/profile
router.put('/me/profile', auth, (req, res) => {
  const { bio, avatar_url } = req.body;
  db.prepare('UPDATE users SET bio = ?, avatar_url = ? WHERE id = ?').run(bio || '', avatar_url || '', req.user.id);
  res.json({ message: 'Profile updated. Your posts are still hidden.' });
});

module.exports = router;
