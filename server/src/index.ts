import express from 'express';
import cors from 'cors';
import cookieSession from 'cookie-session';
import { config } from './config';
import { authRouter } from './routes/auth';
import { worldRouter } from './routes/world';
import { reposRouter } from './routes/repos';
import { userRouter } from './routes/user';
import { settingsRouter } from './routes/settings';

const app = express();

// Trust proxy for secure cookies in production/reverse proxies
app.set('trust proxy', 1);

// CORS configuration to allow credentials (cookies) from frontend
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);

app.use(express.json());

// Session middleware using HTTP-only cookies
app.use(
  cookieSession({
    name: 'gitworld_session',
    keys: [config.sessionSecret],
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  })
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GitWorld Core Backend is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Authentication and Gatekeeper routes (Module 1)
app.use('/api/auth', authRouter);

// World Generation API (Modules 2, 3, 4)
app.use('/api/world', worldRouter);

// Repositories & File Inspection API
app.use('/api/repos', reposRouter);

// Developer Profile & RPG Stats API
app.use('/api/user', userRouter);

// Game Settings & Preferences API
app.use('/api/settings', settingsRouter);

// Start server
app.listen(config.port, () => {
  console.log(`🏰 GitWorld Backend Server running on http://localhost:${config.port}`);
  console.log(`🛡️  Auth endpoints ready:`);
  console.log(`   - Login:          http://localhost:${config.port}/api/auth/github`);
  console.log(`   - Mock Login:     http://localhost:${config.port}/api/auth/mock-login`);
  console.log(`   - Session/Me:     http://localhost:${config.port}/api/auth/me`);
  console.log(`   - World API:      http://localhost:${config.port}/api/world`);
  console.log(`   - Public Realm:   http://localhost:${config.port}/api/world/:username`);
  console.log(`   - Repos/Files:    http://localhost:${config.port}/api/repos`);
  console.log(`   - RPG Profile:    http://localhost:${config.port}/api/user/profile`);
  console.log(`   - Settings API:   http://localhost:${config.port}/api/settings`);
  console.log(`   - Health:         http://localhost:${config.port}/api/health`);
});

export default app;
