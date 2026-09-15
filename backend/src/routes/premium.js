const express = require('express');
const db = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /premium — show premium page info
router.get('/', auth, (req, res) => {
  const user = db.prepare('SELECT is_premium FROM users WHERE id = ?').get(req.user.id);
  res.json({
    is_premium: !!user.is_premium,
    price: '₹99/month',
    features: [
      '✓ See who posted',
      '✓ See when they posted',
      '✓ See the like count',
      '✓ See that there are comments',
      '✗ Still cannot see the post'
    ],
    fine_print: 'By subscribing, you acknowledge that content will remain inaccessible in perpetuity.'
  });
});

// POST /premium/subscribe — fake payment, upgrade to premium
router.post('/subscribe', auth, (req, res) => {
  // Simulate a "payment processing" moment
  // In a real demo, you'd fake a Razorpay-style UI on the frontend

  db.prepare('UPDATE users SET is_premium = 1 WHERE id = ?').run(req.user.id);

  res.json({
    success: true,
    message: 'Payment successful.',
    subtext: 'Congratulations.',
    fine_print: 'You still cannot see the post.',
    amount_charged: '₹99',
    is_premium: true,
    content: null  // just in case they were expecting it
  });
});

// POST /premium/cancel — cancel "subscription"
router.post('/cancel', auth, (req, res) => {
  db.prepare('UPDATE users SET is_premium = 0 WHERE id = ?').run(req.user.id);
  res.json({
    message: 'Subscription cancelled.',
    subtext: 'You couldn\'t see the posts before. You still can\'t. Nothing has changed.'
  });
});

module.exports = router;
