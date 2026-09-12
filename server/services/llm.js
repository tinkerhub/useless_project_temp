import { GoogleGenAI, Type } from '@google/genai';
import { buildSystemPrompt } from '../prompts/moodpet.js';
import { validateMoodState, buildAvatarContract, CATCH_MAP, applyControlledRandomness } from './mood.js';
import { getLocalFallbackResponse } from '../utils/fallbacks.js';

const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

export async function generateMoodResponse({ message, history = [], currentMood, forcedMood = null }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[MoodPet Server] GEMINI_API_KEY is missing from environment.');
    return getLocalFallbackResponse('missing_api_key', currentMood);
  }

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = buildSystemPrompt(currentMood, forcedMood);

  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      if (msg.content) {
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      mood: {
        type: Type.STRING,
        enum: ['excited', 'sad', 'angry', 'dramatic', 'sleepy', 'shy', 'confused', 'toddler', 'overprotective', 'bargainer'],
      },
      intensity: {
        type: Type.INTEGER,
      },
      moodReason: {
        type: Type.STRING,
      },
      response: {
        type: Type.STRING,
      },
      catchType: {
        type: Type.STRING,
        enum: ['tangent', 'incomplete', 'minimal', 'exaggerated', 'trailing', 'hesitant', 'second-guessing', 'distracted', 'safety-warning', 'transactional'],
      },
    },
    required: ['mood', 'intensity', 'moodReason', 'response'],
  };

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[MoodPet LLM] Trying model: ${modelName}...`);
      const timeoutMs = 25000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('LLM request timed out')), timeoutMs);
      });

      const llmPromise = ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.7,
        },
      });

      const result = await Promise.race([llmPromise, timeoutPromise]);
      const rawText = result.text;

      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseErr) {
        console.warn('[MoodPet LLM] Failed to parse JSON response:', rawText);
      }

      if (!parsed || !parsed.response || !parsed.mood) {
        console.warn('[MoodPet LLM] Malformed data from Gemini, trying fallback parsing');
        return getLocalFallbackResponse('malformed_json', currentMood);
      }

      // Check if we should override mood with a controlled random event
      const randomMood = applyControlledRandomness(parsed.mood);
      const finalMood = forcedMood || randomMood || parsed.mood;

      const validatedMood = validateMoodState({
        mood: finalMood,
        intensity: randomMood ? Math.max(70, parsed.intensity) : parsed.intensity, // Boost intensity if randomly changed to make it obvious
      });

      const catchType = parsed.catchType || CATCH_MAP[validatedMood.mood] || 'tangent';
      const moodReason = parsed.moodReason || `Pompom is feeling ${validatedMood.mood}.`;
      const avatar = buildAvatarContract(validatedMood, currentMood);

      console.log(`[MoodPet LLM Success] Model ${modelName} responded. Mood: ${validatedMood.mood} (${validatedMood.intensity}%)`);

      return {
        success: true,
        mood: validatedMood,
        moodReason,
        response: parsed.response,
        catchType,
        avatar,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[MoodPet LLM] Model ${modelName} failed:`, err.message || err);

      if (err.message?.includes('404') || err.message?.includes('not found') || err.message?.includes('no longer available')) {
        // Continue loop to try next model
        continue;
      }
      break;
    }
  }

  console.error('[MoodPet LLM Error] All models failed:', lastError?.message || lastError);

  if (lastError?.message?.includes('429') || lastError?.message?.includes('quota') || lastError?.message?.includes('rate')) {
    return getLocalFallbackResponse('rate_limit', currentMood);
  }
  if (lastError?.message?.includes('timed out')) {
    return getLocalFallbackResponse('timeout', currentMood);
  }

  return getLocalFallbackResponse('provider_error', currentMood);
}
