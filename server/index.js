import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Vite frontend during dev
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Mount API routes
app.use('/api', chatRoutes);

// Root test route
app.get('/', (req, res) => {
  res.json({
    name: 'MoodPet API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      initialMood: 'GET /api/initial-mood',
      chat: 'POST /api/chat',
    },
  });
});

app.listen(PORT, () => {
  console.log(`[MoodPet Server] Server running on http://localhost:${PORT}`);
  console.log(`[MoodPet Server] Gemini Model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}`);
});
