import 'dotenv/config';
import { raceAIs, callGeminiText, callNvidiaText } from '../server.js';

const ACTION_PROMPT = `You are a concise GAME JUDGE for "Enne Kolland Irikkan Patto?".

Task: Given the object's DNA and current state, EVALUATE the player's free-action request and RETURN ONLY valid JSON with the exact schema:
{
  "consequence": "short narration (1-2 sentences)",
  "stateChanges": { "money": number (optional), "mood": string (optional), "condition": string (optional), "location": string (optional), "wantedStatus": boolean (optional) },
  "memory": "short memory summary",
  "newRelationship": { "name": "string", "status": "string" } (optional)
}

Rules:
- Keep consequences short and plausible for the object.
- State changes must be small (money between -500 and +500) and realistic.
- Use Manglish or English; avoid long paragraphs.
- Do NOT include any surrounding explanation, markdown, or non-JSON text. RETURN JSON ONLY.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dna, state, actionText } = req.body || {};
  if (!dna || !actionText) {
    return res.status(400).json({ error: 'Missing dna or actionText' });
  }

  try {
    const userPrompt = `OBJECT: ${dna.name} (${dna.objectType})\nSTATE: ${JSON.stringify(state)}\nACTION: ${actionText}`;
    const parsed = await raceAIs(api => api === 'gemini' ? callGeminiText(ACTION_PROMPT, userPrompt, 'EvalAction') : callNvidiaText(ACTION_PROMPT, userPrompt, 'EvalAction'));
    if (parsed && typeof parsed === 'object' && parsed.consequence) {
      return res.json({ success: true, result: parsed });
    }
    throw new Error('Invalid structure from AI');
  } catch (err) {
    console.error('[API/EVAL ACTION ERROR]', err.message);
    return res.json({ success: true, result: { consequence: 'Nothing much happened.', stateChanges: {}, memory: 'Attempted action; no notable effect.' } });
  }
}
