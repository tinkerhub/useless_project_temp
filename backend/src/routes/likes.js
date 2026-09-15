const express = require('express');
const db = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /likes/:postId — toggle like
router.post('/:postId', auth, (req, res) => {
  const postId = parseInt(req.params.postId);
  const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(req.user.id, postId);

  if (existing) {
    // Unlike
    db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(req.user.id, postId);
    const { count } = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId);
    return res.json({ liked: false, likes: Number(count) });
  }

  // Like
  db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(req.user.id, postId);

  // Notify post author
  if (post.user_id !== req.user.id) {
    db.prepare('INSERT INTO notifications (user_id, type, actor_id, post_id) VALUES (?, ?, ?, ?)')
      .run(post.user_id, 'like', req.user.id, postId);
  }

  const { count } = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId);
  res.json({ liked: true, likes: Number(count) });
});

module.exports = router;
