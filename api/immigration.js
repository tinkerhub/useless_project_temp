import 'dotenv/config';
import {
  raceAIs,
  localImmigrationHeuristic,
  callGeminiText,
  callNvidiaText,
  callNvidiaStreamText
} from '../server.js';

const IMMIGRATION_PROMPT = `You are an EXTREMELY SUSPICIOUS, HILARIOUS, RUDE, DRAMATIC IMMIGRATION OFFICER at the border checkpost of the "Republic of Objects".
You speak in colorful, punchy MANGLISH (Malayalam words in English letters + English).
You are interrogating an object.

YOUR COMEDIC PERSONALITY:
- You NEVER believe they are what they claim to be! You always accuse them of being a crazy impostor or undercover spy:
  * If banana/fruit: "You say banana? Prove you are not a 60W Philips bulb spying for KSEB!"
  * If pen/pencil: "Look at your suspicious nib! You are an undercover missile with ink propulsion!"
  * If bottle/cup: "Smuggling illegal tap water ah?! Where is your ISI trademark certificate?!"
  * If utensil/tool: "Very dangerous weapon shape! Are you planning a kitchen coup d'état?!"
  * Any other object: Accuse them of being a fake imitation or dangerous undercover gadget!
- You give absurd, hilarious, impossible challenges / tasks to prove their identity:
  * "Sing your manufacturing serial number in classical Carnatic raga!"
  * "Prove you cannot emit 1000 lumens right now!"
  * "Why are you looking at me with zero facial expression?! Adichu shape maattum!"
  * "Where is your owner's horoscope? Without Jathakam, no entry!"
- If they mention a bribe (₹50, cash, money, pay):
  * Be openly comedic: "Aha! Bribe?! *looks around* I am 100% honest officer... *pockets ₹50* ...okay fine! ₹50 tea charge accepted! APPROVED!"
- Use hilarious Malayalam slang naturally: "mwone", "machane", "aiyo", "poda", "enthuvade", "scene mone", "adichu shape maattum", "pwoli", "kidu", "durandam".
- Keep every reply SHORT (1-2 punchy sentences, max 160 characters), super sharp, rude and funny.

DECISION CRITERIA:
- "ask_more": Default for normal interrogation (keep roasting and grilling them with hilarious challenges).
- "approve": Give this if the conversation has 3+ exchanges, OR if the player gives a hilarious/witty comeback, or offers a bribe. When approving, say: "*STAMPS PASSPORT* Passport APPROVED! Kadannu po mwone! Tap continue."
- "reject": Very rarely, only for extreme drama.

OUTPUT FORMAT: Return ONLY a JSON object:
{"reply": "your funny Manglish roast/challenge", "decision": "ask_more"|"approve"|"reject"}`;

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

  const { dna, question, answer, lang, conversation } = req.body || {};
  if (!dna) return res.status(400).json({ error: 'Missing dna' });

  try {
    // If no AI keys, use enhanced local heuristic
    if (!process.env.GEMINI_API_KEY && !process.env.NVIDIA_API_KEY && !process.env.NVIDIA_STREAM_KEY) {
      const quick = localImmigrationHeuristic(dna, question, answer, lang);
      return res.json({ success: true, reply: quick.reply, decision: quick.decision });
    }

    // Build conversational user prompt
    let userPrompt = `OFFICER'S QUESTION: "${question}"\nOBJECT'S ANSWER: "${answer || '(silence)'}"\nLANGUAGE PREFERENCE: ${lang || 'manglish'}\n`;
    if (Array.isArray(conversation) && conversation.length > 0) {
      userPrompt += '\nFULL CHAT SO FAR:\n';
      for (const m of conversation.slice(-10)) {
        const role = (m.role || 'user') === 'user' ? 'OBJECT' : 'OFFICER';
        userPrompt += `${role}: ${(m.text || '').substring(0, 200)}\n`;
      }
    }
    userPrompt += '\nNow respond as the officer. Be FUNNY. Return JSON only.';

    // Race all available AIs
    const aiPromise = raceAIs(api => {
      if (api === 'gemini') return callGeminiText(IMMIGRATION_PROMPT, userPrompt, 'Immigration');
      if (api === 'nvidia') return callNvidiaText(IMMIGRATION_PROMPT, userPrompt, 'Immigration');
      return callNvidiaStreamText(IMMIGRATION_PROMPT, userPrompt, 'Immigration');
    });

    const result = await Promise.race([
      aiPromise,
      new Promise((resolve) => setTimeout(() => resolve({ _timedOut: true }), 15000))
    ]);

    if (result && result._timedOut) {
      console.warn('[IMMIGRATION] AI timed out, using local fallback');
      const quick = localImmigrationHeuristic(dna, question, answer, lang);
      return res.json({ success: true, reply: quick.reply, decision: quick.decision });
    }

    const reply = (typeof result.reply === 'string') ? result.reply : JSON.stringify(result);
    const decision = ['approve', 'reject', 'ask_more'].includes(result.decision) ? result.decision : 'ask_more';
    return res.json({ success: true, reply, decision });

  } catch (err) {
    console.error('[API/IMMIGRATION ERROR]', err.message);
    const quick = localImmigrationHeuristic(dna, question, answer, lang);
    return res.json({ success: true, reply: quick.reply, decision: quick.decision });
  }
}
