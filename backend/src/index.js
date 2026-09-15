require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Run migrations on startup
require('./db/migrate');

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for hackathon demo convenience
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/posts', require('./routes/posts'));
app.use('/likes', require('./routes/likes'));
app.use('/comments', require('./routes/comments'));
app.use('/follow', require('./routes/follow'));
app.use('/notifications', require('./routes/notifications'));
app.use('/users', require('./routes/users'));
app.use('/premium', require('./routes/premium'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running. Content is still null.',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found.',
    note: 'The post content is also not found. Coincidence? No.'
  });
});

app.listen(PORT, () => {
  console.log(`\n🫥 Anti-Social backend running on http://localhost:${PORT}`);
  console.log(`   Content is being stored in the database.`);
  console.log(`   Content is not being returned to anyone.\n`);
});
