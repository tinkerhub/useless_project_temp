const express = require('express');
const db = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /notifications
router.get('/', auth, (req, res) => {
  const notifs = db.prepare(`
    SELECT
      n.id, n.type, n.read, n.created_at, n.post_id,
      u.id AS actor_id, u.username AS actor_username, u.avatar_url AS actor_avatar
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(req.user.id);

  const formatted = notifs.map(n => {
    let message = '';
    switch (n.type) {
      case 'like':     message = `${n.actor_username} liked your post.`; break;
      case 'comment':  message = `${n.actor_username} commented on your post.`; break;
      case 'follow':   message = `${n.actor_username} started following you.`; break;
      case 'new_post': message = `${n.actor_username} posted something.`; break;
      default:         message = 'Something happened.';
    }
    return {
      id: n.id,
      type: n.type,
      read: !!n.read,
      message,
      post_id: n.post_id,
      actor: { id: n.actor_id, username: n.actor_username, avatar_url: n.actor_avatar || '' },
      timestamp: n.created_at
    };
  });

  res.json(formatted);
});

// PUT /notifications/read-all
router.put('/read-all', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: "All marked as read. The posts are still null." });
});

// GET /notifications/unread-count
router.get('/unread-count', auth, (req, res) => {
  const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(req.user.id);
  res.json({ count: Number(row.count) });
});

module.exports = router;
