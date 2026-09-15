const express = require('express');
const db = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /comments/:postId
router.get('/:postId', auth, (req, res) => {
  const comments = db.prepare(`
    SELECT c.id, c.user_id, c.created_at, u.username, u.avatar_url
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.postId);

  res.json(comments.map(c => ({
    id: c.id,
    author: { id: c.user_id, username: c.username, avatar_url: c.avatar_url || '' },
    timestamp: c.created_at,
    content: null  // Also hidden. We don't discriminate.
  })));
});

// POST /comments/:postId
router.post('/:postId', auth, (req, res) => {
  const { content } = req.body;
  const postId = parseInt(req.params.postId);

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required.' });
  }

  const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const result = db.prepare('INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)').run(req.user.id, postId, content.trim());

  if (post.user_id !== req.user.id) {
    db.prepare('INSERT INTO notifications (user_id, type, actor_id, post_id) VALUES (?, ?, ?, ?)')
      .run(post.user_id, 'comment', req.user.id, postId);
  }

  res.status(201).json({
    id: Number(result.lastInsertRowid),
    content: null,
    message: 'Comment posted. Nobody will see it, including you.'
  });
});

module.exports = router;
