import express from 'express';
import { generateMoodResponse } from '../services/llm.js';
import { getRandomInitialMood, validateMoodState } from '../services/mood.js';
import { getLocalFallbackResponse } from '../utils/fallbacks.js';

const router = express.Router();

// GET /api/health
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'moodpet-backend',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/initial-mood
router.get('/initial-mood', (req, res) => {
  const initialMood = getRandomInitialMood();
  res.json({
    success: true,
    mood: initialMood,
  });
});

// POST /api/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, mood, history, forcedMood } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        errorType: 'invalid_input',
        message: 'Message must be a non-empty string.',
      });
    }

    if (message.length > 10000) {
      return res.status(400).json({
        success: false,
        errorType: 'message_too_long',
        message: 'Message exceeds maximum limit of 10,000 characters.',
      });
    }

    const currentMoodState = validateMoodState(mood);

    const result = await generateMoodResponse({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      currentMood: currentMoodState,
      forcedMood: typeof forcedMood === 'string' ? forcedMood : null,
    });

    const statusCode = result.success ? 200 : 200; // Keep 200 so frontend renders in-character fallback bubble cleanly
    return res.status(statusCode).json(result);
  } catch (err) {
    console.error('[MoodPet Chat Route Error]', err);
    const fallback = getLocalFallbackResponse('server_error', req.body?.mood);
    return res.status(200).json(fallback);
  }
});

export default router;
