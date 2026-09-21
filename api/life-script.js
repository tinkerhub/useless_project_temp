import 'dotenv/config';
import { raceLifeScript, getFallbackLifeScript } from '../server.js';

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

  const { dna } = req.body || {};
  if (!dna) {
    return res.status(400).json({ error: 'No object DNA provided' });
  }

  try {
    const script = await raceLifeScript(dna);
    return res.json({ success: true, script });
  } catch (err) {
    console.error('[API/LIFE SCRIPT ERROR]', err.message);
    return res.json({ success: true, script: getFallbackLifeScript(dna) });
  }
}
