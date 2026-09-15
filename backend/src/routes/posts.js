const express = require('express');
const db = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper: format a post for public consumption — content deliberately nulled (THIS IS THE BIT)
function sanitizePost(post, currentUserId) {
  return {
    id: post.id,
    author: {
      id: post.user_id,
      username: post.username,
      avatar_url: post.avatar_url || ''
    },
    timestamp: post.created_at,
    likes: Number(post.like_count) || 0,
    comments: Number(post.comment_count) || 0,
    liked_by_me: !!post.liked_by_me,
    content: null  // ← The entire product. Do not change this.
  };
}

// POST /posts — create a post (content stored forever, never seen again)
router.post('/', auth, (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Content cannot be empty. (Not that anyone will see it.)" });
  }

  const result = db.prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)').run(req.user.id, content.trim());
  const postId = Number(result.lastInsertRowid);

  // Notify all followers
  const followers = db.prepare('SELECT follower_id FROM follows WHERE following_id = ?').all(req.user.id);
  const notifStmt = db.prepare('INSERT INTO notifications (user_id, type, actor_id, post_id) VALUES (?, ?, ?, ?)');
  for (const f of followers) {
    notifStmt.run(f.follower_id, 'new_post', req.user.id, postId);
  }

  res.status(201).json({
    message: "Post created. It has been safely hidden from everyone, including you.",
    id: postId
  });
});

// GET /posts/feed
router.get('/feed', auth, (req, res) => {
  const posts = db.prepare(`
    SELECT
      p.id, p.user_id, p.created_at,
      u.username, u.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
    ORDER BY p.created_at DESC
    LIMIT 50
  `).all(req.user.id, req.user.id);

  res.json(posts.map(p => sanitizePost(p, req.user.id)));
});

// GET /posts/explore — trending
router.get('/explore', auth, (req, res) => {
  const posts = db.prepare(`
    SELECT
      p.id, p.user_id, p.created_at,
      u.username, u.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
      0 AS liked_by_me
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY (SELECT COUNT(*) FROM likes WHERE post_id = p.id) + (SELECT COUNT(*) FROM comments WHERE post_id = p.id) DESC
    LIMIT 20
  `).all();

  res.json(posts.map(p => sanitizePost(p, req.user.id)));
});

// GET /posts/:id
router.get('/:id', auth, (req, res) => {
  const post = db.prepare(`
    SELECT
      p.id, p.user_id, p.created_at,
      u.username, u.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(req.user.id, req.params.id);

  if (!post) return res.status(404).json({ error: "Post not found. (Also the content would have been null anyway.)" });
  res.json(sanitizePost(post, req.user.id));
});

// DELETE /posts/:id
router.delete('/:id', auth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!post) return res.status(404).json({ error: 'Not found or not yours.' });
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Post deleted. Nobody knew what it said anyway.' });
});

module.exports = router;
