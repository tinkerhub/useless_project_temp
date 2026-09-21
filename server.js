/**
 * server.js — Minimal Express proxy for AI API calls.
 *
 * DUAL-AI STRATEGY: Fires NVIDIA Nemotron + Google Gemini simultaneously.
 * Whichever responds first with valid JSON wins. This gives us:
 * - Redundancy (if one API is down, the other covers)
 * - Speed (we always get the fastest response)
 * - Better object detection (Gemini is stronger at image recognition)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Health check ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'alive',
    nvidia: !!process.env.NVIDIA_API_KEY,
    nvidia_stream: !!process.env.NVIDIA_STREAM_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
  });
});

// ─── Birth endpoint: detect object + generate passport DNA ───────
app.post('/api/birth', async (req, res) => {
  const { image, frames, manualName } = req.body;

  if (!image && !frames && !manualName) {
    return res.status(400).json({ error: 'No image, frames or object name provided' });
  }

  try {
    if (frames && Array.isArray(frames) && frames.length > 0) {
      const result = await consensusBirth(frames);
      return res.json({ success: true, ...result });
    }

    if (image) {
      const result = await consensusBirth([image]);
      return res.json({ success: true, ...result });
    }

    const dna = await raceManualBirth(manualName);
    return res.json({ success: true, dna, confidence: 1.0, candidates: [manualName], needsRescan: false });
  } catch (err) {
    console.error('[BIRTH ERROR]', err.message);
    res.status(500).json({ error: 'AI birth failed', details: err.message });
  }
});

// ─── Life Script endpoint: generate entire life journey ───────────
app.post('/api/life-script', async (req, res) => {
  const { dna } = req.body;
  if (!dna) {
    return res.status(400).json({ error: 'No object DNA provided' });
  }

  try {
    const script = await raceLifeScript(dna);
    res.json({ success: true, script });
  } catch (err) {
    console.error('[LIFE SCRIPT ERROR]', err.message);
    // Return a safe fallback script
    res.json({ success: true, script: getFallbackLifeScript(dna) });
  }
});

// ─── Immigration endpoint: live AI chat with officer ─────────────
app.post('/api/immigration', async (req, res) => {
  const { dna, question, answer, final, lang } = req.body;
  if (!dna) return res.status(400).json({ error: 'Missing dna' });

  const objectName = dna.name || 'Unknown Object';
  const objectType = dna.objectType || 'object';

  const IMMIGRATION_PROMPT = `You are an EXTREMELY SUSPICIOUS, HILARIOUS, RUDE, DRAMATIC IMMIGRATION OFFICER at the border checkpost of the "Republic of Objects".
You speak in colorful, punchy MANGLISH (Malayalam words in English letters + English).
You are interrogating an object named "${objectName}" which claims to be a ${objectType}.

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

  try {
    // If no AI keys, use enhanced local heuristic
    if (!process.env.GEMINI_API_KEY && !process.env.NVIDIA_API_KEY && !process.env.NVIDIA_STREAM_KEY) {
      const quick = localImmigrationHeuristic(dna, question, answer, lang);
      return res.json({ success: true, reply: quick.reply, decision: quick.decision });
    }

    // Build conversational user prompt
    const conversation = req.body.conversation || [];
    let userPrompt = `OFFICER'S QUESTION: "${question}"\nOBJECT'S ANSWER: "${answer || '(silence)'}"\nLANGUAGE PREFERENCE: ${lang || 'manglish'}\n`;
    if (Array.isArray(conversation) && conversation.length > 0) {
      userPrompt += '\nFULL CHAT SO FAR:\n';
      for (const m of conversation.slice(-10)) { // last 10 messages for context
        const role = (m.role || 'user') === 'user' ? 'OBJECT' : 'OFFICER';
        userPrompt += `${role}: ${(m.text || '').substring(0, 200)}\n`;
      }
    }
    userPrompt += '\nNow respond as the officer. Be FUNNY. Return JSON only.';

    // Race all available AIs — first valid response wins
    const aiPromise = raceAIs(api => {
      if (api === 'gemini') return callGeminiText(IMMIGRATION_PROMPT, userPrompt, 'Immigration');
      if (api === 'nvidia') return callNvidiaText(IMMIGRATION_PROMPT, userPrompt, 'Immigration');
      return callNvidiaStreamText(IMMIGRATION_PROMPT, userPrompt, 'Immigration');
    });

    const result = await Promise.race([
      aiPromise,
      new Promise((resolve) => setTimeout(() => resolve({ _timedOut: true }), 20000))
    ]);

    if (result && result._timedOut) {
      console.warn('[IMMIGRATION] AI timed out, using local fallback');
      const quick = localImmigrationHeuristic(dna, question, answer, lang);
      return res.json({ success: true, reply: quick.reply, decision: quick.decision });
    }

    // Validate AI response
    const reply = (typeof result.reply === 'string') ? result.reply : JSON.stringify(result);
    const decision = ['approve', 'reject', 'ask_more'].includes(result.decision) ? result.decision : 'ask_more';
    return res.json({ success: true, reply, decision });

  } catch (err) {
    console.error('[IMMIGRATION ERROR]', err.message);
    const quick = localImmigrationHeuristic(dna, question, answer, lang);
    return res.json({ success: true, reply: quick.reply, decision: quick.decision });
  }
});

function localImmigrationHeuristic(dna, question, answer, lang) {
  const name = dna.name || 'Itthu';
  const obj = (dna.objectType || 'object').toLowerCase();
  const ans = (answer || '').toLowerCase();
  const q = (question || '').toLowerCase();

  // Pool of funny Manglish responses grouped by question type
  if (/why.*enter|enter here/i.test(q)) {
    const pool = [
      { r: `*slams table* "${name}" holiday-kku vannathano?! Ivide HOLIDAY illa mwone, ONLY DRAMA!`, d: 'ask_more' },
      { r: `Aiyo ${name}, nee ${obj} aanu ennu ariyaam. But WHY HERE? Ivide ${obj}-inu enthu karyam?`, d: 'ask_more' },
      { r: `Officer squints: "Hmm... last time oru ${obj} vannu, full scene aayirunnu. Nee athupole aano?"`, d: 'ask_more' },
      { r: `"${ans}" ennu paranjal ENOUGH aano?! Ente file-il 47 pages undu, FULL EXPLAIN CHEYYEDA!`, d: 'ask_more' },
      { r: `*picks up phone* "Hello security... wait." *puts phone down* "OK fine, ${name}. Continue."`, d: 'ask_more' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (/owner|who owns/i.test(q)) {
    const pool = [
      { r: `Owner-nte phone number thaaa! ...just kidding. ${name}, nee aarudeyaanu ennu PROVE cheyy!`, d: 'ask_more' },
      { r: `"${ans}" ennu paranjalo? Enik ariyaam, ellaa ${obj}-um ivide fake owner parayum!`, d: 'ask_more' },
      { r: `Aah ownerino? Owner viliche ennodu parayatte! *dramatically waits*`, d: 'ask_more' },
      { r: `Officer writes something: "Owner: ${ans}... suspicious but acceptable." Entry allowed.`, d: 'approve' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (/what do you do|work|occupation/i.test(q)) {
    const pool = [
      { r: `${obj} job cheyyunnundo?! Tax file cheythittundo?! GST number KANIKK!`, d: 'ask_more' },
      { r: `Hmm "${ans}" aano? Ente cousin-um ${obj} aanu, avan unemployed. Nee verae aano?`, d: 'ask_more' },
      { r: `*stamps form* OK OK, ${name} working ${obj} aanu. Respect. Entry allowed. GO.`, d: 'approve' },
      { r: `Officer: "Interesting... oru ${obj} with ambition. Njan impressed. Almost."`, d: 'ask_more' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (/prove|not a human|NOT/i.test(q)) {
    const pool = [
      { r: `PROVE IT! Oru human-nu cheyyaan pattaatha enthenkilum cheyy! *waits dramatically*`, d: 'ask_more' },
      { r: `Hmm... nee breathe cheyyunnundo? No? OK FINE. ${name} is NOT human. APPROVED.`, d: 'approve' },
      { r: `Officer touches ${name}: "Cold aanu... no heartbeat... definitely ${obj}. PASS!"`, d: 'approve' },
      { r: `"${ans}" ennu parayunnu, but ente 20 years experience parayunnu NEE SUSPICIOUS AANU!`, d: 'ask_more' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Generic funny fallbacks
  if (/bribe|₹|rupee|cash|money|pay/i.test(ans)) {
    const pool = [
      { r: `*looks around* "Aiyo ${name}, ₹50 mathi... I mean BRIBE IS ILLEGAL! ...but leave it on the table."`, d: 'ask_more' },
      { r: `BRIBE?! *shocked face* ...How much? Just kidding. ENTRY APPROVED before I change my mind.`, d: 'approve' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Default funny responses
  const defaults = [
    { r: `${name}, ninte answer kandu enik doubt vannu. But enik vere pani undu. GO!`, d: 'approve' },
    { r: `Officer yawns: "Athokke shariyaakum. Next question, fast fast!"`, d: 'ask_more' },
    { r: `*suspicious stare* "${ans}" ennano paranje?! Hmm... oru karyam koodi chodikkanam.`, d: 'ask_more' },
    { r: `Adipoli! ${name} paranjathu correct. But njan easy-ayi approve cheyyilla, one more!`, d: 'ask_more' },
    { r: `"${ans}"... interesting. Ente ammachiyum ithupole paranjittundu. Fine, APPROVED.`, d: 'approve' },
    { r: `*writes in notebook* "${name} said ${ans}." Evidence recorded. Proceed!`, d: 'approve' },
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// ─── Eval Action endpoint: evaluate free-action typed by the player ─
app.post('/api/eval-action', async (req, res) => {
  const { dna, state, actionText } = req.body;
  if (!dna || !actionText) return res.status(400).json({ error: 'Missing dna or actionText' });

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

  try {
    const userPrompt = `OBJECT: ${dna.name} (${dna.objectType})\nSTATE: ${JSON.stringify(state)}\nACTION: ${actionText}`;
    try {
      const parsed = await raceAIs(api => api === 'gemini' ? callGeminiText(ACTION_PROMPT, userPrompt, 'EvalAction') : callNvidiaText(ACTION_PROMPT, userPrompt, 'EvalAction'));
      // Basic validation
      if (parsed && typeof parsed === 'object' && parsed.consequence) {
        return res.json({ success: true, result: parsed });
      }
      throw new Error('Invalid structure from AI');
    } catch (err) {
      console.error('[EVAL ACTION ERROR]', err.message);
      return res.json({ success: true, result: { consequence: 'Nothing much happened.', stateChanges: {}, memory: 'Attempted action; no notable effect.' } });
    }
  } catch (err) {
    console.error('[EVAL ACTION ERROR]', err.message);
    return res.json({ success: true, result: { consequence: 'Nothing much happened.', stateChanges: {}, memory: 'Attempted action; no notable effect.' } });
  }
});

// ─── Video generation stub: accept requests and simulate async job ─
const videoJobs = new Map();
let nextJobId = 1;

app.post('/api/generate-video', (req, res) => {
  const { scene, metadata } = req.body;
  const jobId = `job-${nextJobId++}`;
  // Create a stub job that completes in ~3s with a fake URL
  videoJobs.set(jobId, { status: 'pending', url: null });
  setTimeout(() => {
    videoJobs.set(jobId, { status: 'ready', url: `/videos/${jobId}.mp4` });
  }, 3000);
  res.json({ success: true, jobId });
});

app.get('/api/video-status/:jobId', (req, res) => {
  const job = videoJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
  res.json({ success: true, status: job.status, url: job.url });
});

// ═══════════════════════════════════════════════════════════════════
// RACE STRATEGY: fire all available AIs, first valid response wins
// ═══════════════════════════════════════════════════════════════════

async function raceBirth(base64Image) {
  const promises = [];
  if (process.env.GEMINI_API_KEY) promises.push(callGeminiBirth(base64Image));
  if (process.env.NVIDIA_API_KEY) promises.push(callNvidiaBirth(base64Image));
  if (process.env.NVIDIA_STREAM_KEY) promises.push(callNvidiaStreamBirth(base64Image));
  if (promises.length === 0) throw new Error('No AI API keys configured');
  try { return await Promise.any(promises); } catch (aggErr) { throw new Error(`All AIs failed: ${aggErr.message}`); }
}

// ═══════════════════════════════════════════════════════════════════
// CONSENSUS SCANNER: 3-frame × multi-model → agreement engine
// ═══════════════════════════════════════════════════════════════════

/**
 * Normalise object label to lowercase for candidate grouping.
 * 'Ballpoint Pen', 'pen', 'a ballpoint pen' → 'pen'
 */
function normalizeObjectName(raw) {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/^(a|an|the)\s+/, '')          // strip articles
    .replace(/\s*\(.*?\)\s*/g, '')           // strip parenthetical
    .replace(/[^a-z0-9 ]/g, '')              // remove punctuation
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Multi-frame consensus birth.
 * @param {string[]} frames - Array of base64 data URIs (1–3)
 * @returns {Promise<{dna, confidence, candidates, needsRescan}>}
 */
async function consensusBirth(frames) {
  // ── Phase 1: run vision detection on all frames in parallel ─────
  const frameResultSets = await Promise.allSettled(
    frames.map(async (frame, idx) => {
      const visionCalls = [];
      if (process.env.GEMINI_API_KEY)
        visionCalls.push(
          callGeminiVisionDetect(frame, `F${idx + 1}-Gemini`)
            .catch(e => { console.warn(`[CONSENSUS] Gemini F${idx+1} failed:`, e.message); return null; })
        );
      if (process.env.NVIDIA_VISION_KEY)
        visionCalls.push(
          callNemotronVision(frame, `F${idx + 1}-Nemotron`)
            .catch(e => { console.warn(`[CONSENSUS] Nemotron F${idx+1} failed:`, e.message); return null; })
        );
      const settled = await Promise.allSettled(visionCalls);
      return settled
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);
    })
  );

  const allDetections = frameResultSets
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(Boolean);

  console.log(`[CONSENSUS] ${allDetections.length} detections across ${frames.length} frames`);

  if (allDetections.length === 0) {
    throw new Error('All vision models failed across all frames');
  }

  // ── Phase 2: build candidate frequency + confidence map ──────────
  const candidateMap = {};
  for (const det of allDetections) {
    const key = normalizeObjectName(det.object || det.name || '');
    if (!key || key.length < 2) continue;
    if (!candidateMap[key]) {
      candidateMap[key] = { count: 0, totalConf: 0, raw: det };
    }
    candidateMap[key].count++;
    candidateMap[key].totalConf += (det.confidence ?? 0.5);
  }

  const sorted = Object.entries(candidateMap)
    .map(([name, v]) => ({ name, score: (v.count / allDetections.length) * (v.totalConf / v.count) }))
    .sort((a, b) => b.score - a.score);

  const topCandidates = sorted.slice(0, 3).map(c => c.name);
  const top = sorted[0];
  const confidence = top ? top.score : 0;
  const needsRescan = confidence < 0.40;

  console.log(`[CONSENSUS] Top: "${top?.name}" score=${confidence.toFixed(2)} needsRescan=${needsRescan}`);

  if (needsRescan) {
    return { dna: null, confidence, candidates: topCandidates, needsRescan: true };
  }

  // ── Phase 3: If tie between top 2 (within 10%), run DeepSeek verify
  let objectName = top.name;
  if (sorted.length >= 2 && (sorted[0].score - sorted[1].score) < 0.10 && process.env.NVIDIA_REASON_KEY) {
    try {
      objectName = await callDeepseekVerify(topCandidates, `F1-DeepSeek`);
      console.log(`[CONSENSUS] DeepSeek tiebreak → "${objectName}"`);
    } catch (e) {
      console.warn('[CONSENSUS] DeepSeek verify failed, using frequency winner:', e.message);
    }
  }

  // ── Phase 4: Generate passport DNA for the winning object ────────
  let dna;
  try {
    dna = await raceManualBirth(objectName);
  } catch (err) {
    console.warn('[CONSENSUS] DNA generation failed, using validateDNA fallback:', err.message);
    dna = validateDNA({ name: objectName, objectType: objectName });
  }

  return { dna, confidence, candidates: topCandidates, needsRescan: false };
}

async function raceManualBirth(objectName) {
  const promises = [];
  if (process.env.GEMINI_API_KEY) promises.push(callGeminiManualBirth(objectName));
  if (process.env.NVIDIA_API_KEY) promises.push(callNvidiaManualBirth(objectName));
  if (process.env.NVIDIA_STREAM_KEY) promises.push(callNvidiaStreamManualBirth(objectName));
  if (promises.length === 0) throw new Error('No AI API keys configured');
  try { return await Promise.any(promises); } catch (aggErr) { throw new Error(`All AIs failed: ${aggErr.message}`); }
}

async function raceLifeScript(dna) {
  const promises = [];
  if (process.env.GEMINI_API_KEY) promises.push(callGeminiLifeScript(dna));
  if (process.env.NVIDIA_API_KEY) promises.push(callNvidiaLifeScript(dna));
  if (process.env.NVIDIA_STREAM_KEY) promises.push(callNvidiaStreamLifeScript(dna));
  if (promises.length === 0) throw new Error('No AI API keys configured');
  try { return await Promise.any(promises); } catch (aggErr) { throw new Error(`All AIs failed: ${aggErr.message}`); }
}

/** Generic race: fire all available AIs, first valid response wins */
async function raceAIs(callFn) {
  const promises = [];

  if (process.env.GEMINI_API_KEY) {
    promises.push(
      callFn('gemini').catch(err => {
        console.error('[GEMINI FAILED]', err.message);
        throw err;
      })
    );
  }

  if (process.env.NVIDIA_API_KEY) {
    promises.push(
      callFn('nvidia').catch(err => {
        console.error('[NVIDIA FAILED]', err.message);
        throw err;
      })
    );
  }

  if (process.env.NVIDIA_STREAM_KEY) {
    promises.push(
      callFn('nvidia_stream').catch(err => {
        console.error('[NVIDIA-STREAM FAILED]', err.message);
        throw err;
      })
    );
  }

  if (promises.length === 0) throw new Error('No AI API keys configured');

  try {
    return await Promise.any(promises);
  } catch (aggErr) {
    const messages = aggErr.errors?.map(e => e.message).join('; ') || aggErr.message;
    throw new Error(`All AIs failed: ${messages}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════════

const COMEDY_SYSTEM_PROMPT = `You are the COMEDY WRITER for "Enne Kolland Irikkan Patto?" — a Malayalam absurdist game where ordinary physical objects get official government passports from the REPUBLIC OF OBJECTS.

YOUR JOB: Generate FUNNY passport data for any object. NOT normal AI descriptions.

LANGUAGE:
- Use natural Manglish (Malayalam words written in English letters, mixed with English)
- Keep it SHORT. This goes on a visual passport card.
- The humor comes from treating a RIDICULOUS object with EXTREME bureaucratic seriousness.

COMEDY RULES:
1. Every joke MUST relate to what the object actually IS and does
2. NEVER use generic words: "friendly", "helpful", "determined", "adventurous", "positive", "hardworking"
3. NEVER write motivational quotes or LinkedIn-style descriptions
4. Write like a Malayalam friend at 2 AM — natural, unexpected, absurd
5. Be UNPREDICTABLE — don't always use the same patterns
6. The player should think: "WHY DOES THIS OBJECT HAVE A GOVERNMENT PASSPORT? 😂"
7. Mix Malayalam and English naturally — don't force Manglish into every sentence

FIELD LENGTH LIMITS (STRICT):
- name: 1-4 words max
- objectType: 1-3 words
- origin: 3-8 words
- dateOfBirth: 3-6 words (funny date)
- personality: 5-12 words
- mood: 2-6 words
- strength: 5-12 words
- weakness: 5-12 words
- fear: 3-8 words
- inability: 5-12 words
- specialAbility: 5-12 words
- lifeGoal: 5-15 words
- backstory: 1-2 SHORT sentences max
- passportNumber: format OBJ-XXXXX (5 random digits)
- nationality: "Vasthy (OBJECT)" always

You MUST respond with ONLY valid JSON. No markdown. No code fences. No explanation.`;

const LIFE_SCRIPT_SYSTEM_PROMPT = `You are the GAME MASTER for "Enne Kolland Irikkan Patto?" — a Malayalam absurdist life simulator for everyday objects.

YOUR JOB: Generate the ENTIRE life journey for the object in a single structured JSON.

CRITICAL LANGUAGE RULE:
- ALL text MUST be written in MANGLISH (Malayalam words written in English/Latin letters, mixed with English).
- Examples of Manglish: "Ivide oru pedikkanam undu — tiffin stall close aayittund", "Aiyo, phone charge illa!", "Mwone ith bhayankara scene aanu"
- Common words to use: "aanu", "alla", "undu", "illa", "cheyyuka", "nokkuka", "poyi", "vannu", "aayi", "ennu", "parayunnu"
- Slang: "mwone", "machane", "aiyo", "poda", "adipoli", "pwoli", "kidu", "scene aanu", "full mass"
- NEVER write scenes in pure formal English. Every scene, choice label, consequence, and memory MUST have Manglish flavor.

RULES:
1. The object's DNA (personality, fears, strengths, weaknesses) MUST influence the entire script.
2. Keep scenes SHORT (1-3 lines max), choices punchy (3-8 words), consequences funny.
3. The first chapter is AFTER the airport — the object just entered the country.
4. Create exactly 4 chapters, plus a death scene.
5. For each chapter, generate TWO meaningful choices with pre-calculated consequences.
6. State changes: money can go between -500 and +500. Mood and condition should be funny Manglish words.
7. The death MUST be specific to what this object IS (a pen runs out of ink, a banana rots, etc.)
8. Make it feel like a Kerala friend telling a soap opera about household objects at 2AM after too much chai.

COMEDY GUIDELINES:
- Treat mundane situations with EXTREME drama ("Njan oru ₹10 note kaanum ennu vicharichaaal... POYIII!")
- Include references to Kerala/Indian culture (auto-rickshaws, chai shops, relatives, rain)
- Add unexpected twists ("Uncle vannu... but uncle oru goat aayirunnu")
- Death should be tragic AND hilarious at the same time

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation text.`;

// ═══════════════════════════════════════════════════════════════════
// JSON SCHEMAS
// ═══════════════════════════════════════════════════════════════════

const PASSPORT_JSON_TEMPLATE = `{
  "name": "Funny Manglish name for this object (1-4 words)",
  "objectType": "What type (1-3 words)",
  "origin": "Funny birthplace in Manglish (3-8 words)",
  "dateOfBirth": "A funny date or era (3-6 words)",
  "nationality": "Vasthy (OBJECT)",
  "passportNumber": "OBJ-XXXXX",
  "personality": "Short funny Manglish personality (5-12 words)",
  "mood": "Current mood, funny (2-6 words)",
  "strength": "Object-specific funny strength (5-12 words)",
  "weakness": "Object-specific funny weakness (5-12 words)",
  "fear": "Object-specific funny fear (3-8 words)",
  "ambition": "Unnecessarily dramatic dream (5-12 words)",
  "backstory": "1-2 sentence funny Manglish origin story",
  "inability": "Funny thing this object cannot do (5-12 words)",
  "specialAbility": "Exaggerated superpower based on what it can do (5-12 words)",
  "lifeGoal": "Unnecessarily serious Manglish life goal (5-15 words)"
}`;

function lifeScriptUserPrompt(dna) {
  return `Generate the COMPLETE LIFE SCRIPT for this object. ALL TEXT MUST BE IN MANGLISH (Malayalam words in English letters + English mix).

Object: ${dna.name} (${dna.objectType})
Personality: ${dna.personality}
Strength: ${dna.strength}
Weakness: ${dna.weakness}
Fear: ${dna.fear}
Life Goal: ${dna.lifeGoal}

Return this EXACT JSON structure (with Manglish text in ALL fields):
{
  "chapters": [
    {
      "scene": "Manglish scene narration like: Airport-il ninnu purathu vannu. Oru auto-kkaran kaarundu: 'Evitta ponu mwone?'",
      "choiceA": {
        "label": "Manglish action like: Auto-il kerikk",
        "emoji": "🛺",
        "consequence": "Manglish result like: Auto-kkaran ₹500 charge cheythu. Pakshe scene kidu aayirunnu!",
        "stateChanges": { "money": -50, "mood": "Kidu mood", "condition": "Thakarnnu", "location": "City center" },
        "memory": "Manglish summary like: Auto-il oru wild ride"
      },
      "choiceB": {
        "label": "Alternative Manglish action like: Nadannu pokkaam",
        "emoji": "🚶",
        "consequence": "Alternative Manglish result like: Mazha vannu. Full nananju poyi!",
        "stateChanges": { "money": 0, "mood": "Soggy", "condition": "Wet aanu", "location": "Road side" },
        "memory": "Manglish summary: Mazha-il nadannu"
      }
    }
  ],
  "death": {
    "scene": "Manglish death narration like: Ella karyavum kazhinju... ${dna.name} aa pazhaya shelf-il thirichu vechu. Aarum orma illa.",
    "deathCause": "Object-specific Manglish cause (5-10 words)",
    "epitaph": "One-line funny Manglish epitaph",
    "eulogy": "2-3 sentence Manglish life summary"
  }
}

NOTE: Generate exactly 4 items in the "chapters" array. EVERY text field must be Manglish, NOT plain English.`;
}

const IMAGE_USER_PROMPT = `Analyze this image. Identify the MAIN OBJECT shown (ignore people, backgrounds, hands).

Create its OFFICIAL PASSPORT IDENTITY for the Republic of Objects.

IMPORTANT: Make the humor OBJECT-SPECIFIC. A banana should have banana fears. A pen should have pen problems. A shoe should have shoe anxieties.

Return this EXACT JSON structure:
${PASSPORT_JSON_TEMPLATE}

Generate passportNumber as OBJ- followed by 5 random digits.
All text fields should use natural Manglish where funny.`;

function manualUserPrompt(objectName) {
  return `The object is: "${objectName}"

Create its OFFICIAL PASSPORT IDENTITY for the Republic of Objects.

IMPORTANT: Make the humor specific to what a "${objectName}" actually IS and DOES.

Return this EXACT JSON structure:
${PASSPORT_JSON_TEMPLATE}

Generate passportNumber as OBJ- followed by 5 random digits.
All text fields should use natural Manglish where funny.`;
}

// ═══════════════════════════════════════════════════════════════════
// GEMINI API CALLS
// ═══════════════════════════════════════════════════════════════════

async function callGeminiText(systemPrompt, userPrompt, label, retries = 2) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generation_config: {
      temperature: 0.85,
      max_output_tokens: 2048,
      response_mime_type: 'application/json',
    },
  };

  console.log(`[GEMINI] ${label}...`);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text();
      if ((response.status === 503 || response.status === 429) && retries > 0) {
        console.warn(`[GEMINI] ${response.status} spike on ${label}. Retrying in 800ms (${retries} left)...`);
        await new Promise(r => setTimeout(r, 800));
        return await callGeminiText(systemPrompt, userPrompt, label, retries - 1);
      }
      throw new Error(`Gemini API ${response.status}: ${errBody.substring(0, 300)}`);
    }

    const data = await response.json();
    console.log(`[GEMINI] ${label} done in ${Date.now() - startTime}ms`);

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('No content in Gemini response');

    const parsed = extractJSON(content);
    if (!parsed) throw new Error('Could not parse JSON from Gemini response');

    return parsed;
  } catch (err) {
    if (retries > 0 && /503|429|fetch failed/i.test(err.message)) {
      console.warn(`[GEMINI] Network/Service issue on ${label}. Retrying in 800ms (${retries} left)...`);
      await new Promise(r => setTimeout(r, 800));
      return await callGeminiText(systemPrompt, userPrompt, label, retries - 1);
    }
    throw err;
  }
}

async function callGeminiImage(systemPrompt, userPrompt, base64Image, label, retries = 2) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const rawBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{
      parts: [
        { text: userPrompt },
        { inline_data: { mime_type: 'image/jpeg', data: rawBase64 } },
      ],
    }],
    generation_config: {
      temperature: 0.85,
      max_output_tokens: 2048,
      response_mime_type: 'application/json',
    },
  };

  console.log(`[GEMINI] ${label}...`);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text();
      if ((response.status === 503 || response.status === 429) && retries > 0) {
        console.warn(`[GEMINI] ${response.status} spike on ${label}. Retrying in 800ms (${retries} left)...`);
        await new Promise(r => setTimeout(r, 800));
        return await callGeminiImage(systemPrompt, userPrompt, base64Image, label, retries - 1);
      }
      throw new Error(`Gemini API ${response.status}: ${errBody.substring(0, 300)}`);
    }

    const data = await response.json();
    console.log(`[GEMINI] ${label} done in ${Date.now() - startTime}ms`);

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('No content in Gemini response');

    const parsed = extractJSON(content);
    if (!parsed) throw new Error('Could not parse JSON from Gemini response');

    return parsed;
  } catch (err) {
    if (retries > 0 && /503|429|fetch failed/i.test(err.message)) {
      console.warn(`[GEMINI] Network/Service issue on ${label}. Retrying in 800ms (${retries} left)...`);
      await new Promise(r => setTimeout(r, 800));
      return await callGeminiImage(systemPrompt, userPrompt, base64Image, label, retries - 1);
    }
    throw err;
  }
}

// Gemini birth calls
async function callGeminiBirth(base64Image) {
  const raw = await callGeminiImage(COMEDY_SYSTEM_PROMPT, IMAGE_USER_PROMPT, base64Image, 'Birth (image)');
  return validateDNA(raw);
}

async function callGeminiManualBirth(objectName) {
  const raw = await callGeminiText(COMEDY_SYSTEM_PROMPT, manualUserPrompt(objectName), `Birth (${objectName})`);
  return validateDNA(raw);
}

// Gemini life script call
async function callGeminiLifeScript(dna) {
  const raw = await callGeminiText(LIFE_SCRIPT_SYSTEM_PROMPT, lifeScriptUserPrompt(dna), `Life Script`);
  return validateLifeScript(raw);
}

// ── VISION INSPECTOR: lightweight object-only detection for consensus
const VISION_INSPECTOR_PROMPT = `You are a precision computer-vision object identification system.
You ONLY identify the PRIMARY PHYSICAL OBJECT being deliberately presented close to the camera.

STRICT RULES:
- Ignore backgrounds, walls, tables, hands, persons
- Focus on the CLOSEST and MOST PROMINENT object
- Be SPECIFIC: "ballpoint pen" not just "pen"; "plastic water bottle" not just "bottle"
- If no clear foreground object, set uncertain: true and confidence < 0.3
- Never invent details not visible in the image

Return ONLY this JSON (no markdown, no explanation):
{
  "object": "specific object name",
  "category": "broad category (stationery/electronics/food/clothing/tool/other)",
  "alternatives": [],
  "confidence": 0.0,
  "uncertain": false
}`;

async function callGeminiVisionDetect(base64Image, label) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const rawBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

  const body = {
    system_instruction: { parts: [{ text: VISION_INSPECTOR_PROMPT }] },
    contents: [{
      parts: [
        { text: 'Identify the primary object in this image.' },
        { inline_data: { mime_type: 'image/jpeg', data: rawBase64 } },
      ],
    }],
    generation_config: {
      temperature: 0.1,
      max_output_tokens: 256,
      response_mime_type: 'application/json',
    },
  };

  const retryDelays = [1000, 2000, 4000];
  for (let attempt = 0; attempt <= 3; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errBody = await response.text();
      if ((response.status === 429 || response.status === 503) && attempt < 3) {
        console.warn(`[GEMINI-VISION] ${response.status} on ${label}, retrying in ${retryDelays[attempt]}ms...`);
        await new Promise(r => setTimeout(r, retryDelays[attempt]));
        continue;
      }
      throw new Error(`Gemini-Vision ${response.status}: ${errBody.substring(0, 200)}`);
    }
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('No content in Gemini-Vision response');
    const parsed = extractJSON(content);
    if (!parsed) throw new Error('Could not parse Gemini-Vision JSON');
    console.log(`[GEMINI-VISION] ${label} → "${parsed.object}" (${(parsed.confidence * 100).toFixed(0)}%)`);
    return parsed;
  }
}

// ═══════════════════════════════════════════════════════════════════
// NVIDIA API CALLS
// ═══════════════════════════════════════════════════════════════════

async function callNvidiaText(systemPrompt, userPrompt, label) {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_STREAM_KEY;
  if (!apiKey) throw new Error('NVIDIA API key not set');

  const payload = {
    model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2048,
    reasoning_budget: 2048,
    temperature: 0.85,
    top_p: 0.95,
    stream: false,
  };

  console.log(`[NVIDIA] ${label}...`);
  const startTime = Date.now();

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`NVIDIA API ${response.status}: ${errBody.substring(0, 300)}`);
  }

  const data = await response.json();
  console.log(`[NVIDIA] ${label} done in ${Date.now() - startTime}ms`);

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in NVIDIA response');

  const parsed = extractJSON(content);
  if (!parsed) throw new Error('Could not parse JSON from NVIDIA response');

  return parsed;
}

async function callNvidiaImage(systemPrompt, userPrompt, base64Image, label) {
  const apiKey = process.env.NVIDIA_STREAM_KEY || process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA API key not set');

  const imageUrl = base64Image.startsWith('data:')
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  const payload = {
    model: 'meta/llama-3.2-11b-vision-instruct',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 2048,
    temperature: 0.7,
    stream: false,
  };

  console.log(`[NVIDIA-VISION] ${label}...`);
  const startTime = Date.now();

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`NVIDIA-VISION API ${response.status}: ${errBody.substring(0, 300)}`);
  }

  const data = await response.json();
  console.log(`[NVIDIA-VISION] ${label} done in ${Date.now() - startTime}ms`);

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in NVIDIA-VISION response');

  const parsed = extractJSON(content);
  if (!parsed) throw new Error('Could not parse JSON from NVIDIA-VISION response');

  return parsed;
}

// Optional direct/integrate NVIDIA style call (supports models like moonshotai/kimi-k3)
async function callNvidiaStreamImage(systemPrompt, userPrompt, base64Image, label) {
  const apiKey = process.env.NVIDIA_STREAM_KEY || process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_STREAM_KEY not set');

  const imageUrl = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
  const visionModel = process.env.NVIDIA_STREAM_MODEL || 'meta/llama-3.2-11b-vision-instruct';

  const payload = {
    model: visionModel,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 2048,
    temperature: 0.85,
    stream: false
  };

  console.log(`[NVIDIA-STREAM-VISION (${visionModel})] ${label}...`);
  const startTime = Date.now();

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`NVIDIA-STREAM API ${response.status}: ${errBody.substring(0, 300)}`);
  }

  const data = await response.json();
  console.log(`[NVIDIA-STREAM-VISION] ${label} done in ${Date.now() - startTime}ms`);

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in NVIDIA-STREAM response');

  const parsed = extractJSON(content);
  if (!parsed) throw new Error('Could not parse JSON from NVIDIA-STREAM response');

  return parsed;
}

async function callNvidiaStreamText(systemPrompt, userPrompt, label) {
  const apiKey = process.env.NVIDIA_STREAM_KEY;
  if (!apiKey) throw new Error('NVIDIA_STREAM_KEY not set');

  const payload = {
    model: process.env.NVIDIA_STREAM_MODEL || 'moonshotai/kimi-k3',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 2048,
    temperature: 0.85,
    stream: false
  };

  console.log(`[NVIDIA-STREAM] ${label}...`);
  const startTime = Date.now();

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`NVIDIA-STREAM API ${response.status}: ${errBody.substring(0, 300)}`);
  }

  const data = await response.json();
  console.log(`[NVIDIA-STREAM] ${label} done in ${Date.now() - startTime}ms`);

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in NVIDIA-STREAM response');

  const parsed = extractJSON(content);
  if (!parsed) throw new Error('Could not parse JSON from NVIDIA-STREAM response');

  return parsed;
}

// NVIDIA birth calls
async function callNvidiaBirth(base64Image) {
  const raw = await callNvidiaImage(COMEDY_SYSTEM_PROMPT, IMAGE_USER_PROMPT, base64Image, 'Birth (image)');
  return validateDNA(raw);
}

async function callNvidiaStreamBirth(base64Image) {
  const raw = await callNvidiaStreamImage(COMEDY_SYSTEM_PROMPT, IMAGE_USER_PROMPT, base64Image, 'Birth (image)');
  return validateDNA(raw);
}

async function callNvidiaManualBirth(objectName) {
  const raw = await callNvidiaText(COMEDY_SYSTEM_PROMPT, manualUserPrompt(objectName), `Birth (${objectName})`);
  return validateDNA(raw);
}

async function callNvidiaStreamManualBirth(objectName) {
  const raw = await callNvidiaStreamText(COMEDY_SYSTEM_PROMPT, manualUserPrompt(objectName), `Birth (${objectName})`);
  return validateDNA(raw);
}

// NVIDIA life script call
async function callNvidiaLifeScript(dna) {
  const raw = await callNvidiaText(LIFE_SCRIPT_SYSTEM_PROMPT, lifeScriptUserPrompt(dna), `Life Script`);
  return validateLifeScript(raw);
}

// ── NEMOTRON OMNI 30B: vision detection using NVIDIA_VISION_KEY ─────
async function callNemotronVision(base64Image, label) {
  const apiKey = process.env.NVIDIA_VISION_KEY;
  if (!apiKey) throw new Error('NVIDIA_VISION_KEY not set');

  const imageUrl = base64Image.startsWith('data:')
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  const payload = {
    model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    messages: [
      { role: 'system', content: VISION_INSPECTOR_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Identify the primary physical object in this image. Return JSON only.' },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 512,
    temperature: 0.1,
    stream: false,
  };

  console.log(`[NEMOTRON-VISION] ${label}...`);
  const startTime = Date.now();

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Nemotron-Vision ${response.status}: ${errBody.substring(0, 200)}`);
  }

  const data = await response.json();
  console.log(`[NEMOTRON-VISION] ${label} done in ${Date.now() - startTime}ms`);

  // Nemotron may wrap reasoning in <think>...</think> tags — strip them
  const rawContent = data.choices?.[0]?.message?.content || '';
  const cleanContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const parsed = extractJSON(cleanContent);
  if (!parsed) throw new Error('Could not parse Nemotron-Vision JSON');
  console.log(`[NEMOTRON-VISION] ${label} → "${parsed.object}" (${((parsed.confidence ?? 0) * 100).toFixed(0)}%)`);
  return parsed;
}

// ── DEEPSEEK V4 PRO: text reasoning for tie-break ───────────────────
async function callDeepseekVerify(candidates, label) {
  const apiKey = process.env.NVIDIA_REASON_KEY;
  if (!apiKey) throw new Error('NVIDIA_REASON_KEY not set');

  const candidateList = candidates.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const systemPrompt = `You are a precise object identification tiebreak system.
Given a short list of candidate object names detected by different vision models from the same camera scene, pick the single most likely object.
Return ONLY valid JSON: {"winner": "chosen object name"}`;

  const userPrompt = `Vision models detected these candidates from the same scene:\n${candidateList}\n\nPick the single most likely object the user is holding up to the camera.`;

  const payload = {
    model: 'deepseek-ai/deepseek-v4-pro-0813',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 128,
    temperature: 0.0,
    stream: false,
  };

  console.log(`[DEEPSEEK-VERIFY] ${label} candidates:`, candidates);
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`DeepSeek-Verify ${response.status}: ${errBody.substring(0, 200)}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '';
  const cleanContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const parsed = extractJSON(cleanContent);
  if (parsed?.winner) {
    console.log(`[DEEPSEEK-VERIFY] Winner: "${parsed.winner}"`);
    return parsed.winner;
  }
  // Fallback: return first candidate
  return candidates[0];
}

async function callNvidiaStreamLifeScript(dna) {
  const raw = await callNvidiaStreamText(LIFE_SCRIPT_SYSTEM_PROMPT, lifeScriptUserPrompt(dna), `Life Script`);
  return validateLifeScript(raw);
}

// ═══════════════════════════════════════════════════════════════════
// JSON EXTRACTION + VALIDATION
// ═══════════════════════════════════════════════════════════════════

function extractJSON(text) {
  let cleaned = text
    .replace(/<unk>/g, '')
    .replace(/<\/s>/g, '')
    .replace(/<s>/g, '')
    .replace(/\r/g, '')
    .trim();

  try { return JSON.parse(cleaned); } catch (_e) { /* continue */ }

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (_e) { /* continue */ }
  }

  const jsonStr = extractBracketMatched(cleaned);
  if (jsonStr) {
    try { return JSON.parse(jsonStr); } catch (_e) {
      const fixedStr = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/(["\d])\s+"/g, '$1, "');
      try { return JSON.parse(fixedStr); } catch (_e2) { /* continue */ }
    }
  }

  const greedyMatch = cleaned.match(/\{[\s\S]*\}/);
  if (greedyMatch) {
    try { return JSON.parse(greedyMatch[0]); } catch (_e) { /* continue */ }
  }

  return null;
}

function extractBracketMatched(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0, inString = false, escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === '{') depth++;
      if (ch === '}') { depth--; if (depth === 0) return text.slice(start, i + 1); }
    }
  }

  const lastBrace = text.lastIndexOf('}');
  if (lastBrace > start) return text.slice(start, lastBrace + 1);
  return null;
}

// ─── DNA validation ──────────────────────────────────────────────
function validateDNA(raw) {
  const pno = 'OBJ-' + String(Math.floor(10000 + Math.random() * 90000));

  const defaults = {
    name: 'Unknown Entity',
    objectType: 'Unidentified',
    origin: 'Parts Unknown',
    dateOfBirth: 'Ariyilla... kure munpe',
    nationality: 'Vasthy (OBJECT)',
    passportNumber: pno,
    personality: 'Chill aanu. Aarkkum upadravam illa.',
    mood: 'Confused',
    strength: 'Survive cheyyum... somehow.',
    weakness: 'Existential crisis prone',
    fear: 'Being thrown away',
    ambition: 'Oru purpose kandethanam',
    backstory: 'Etho drawer-il ninnu kittiyatha. Aarkkum orma illa.',
    inability: 'Onnum thanne cheyyaan ariyilla',
    specialAbility: 'EXIST HARDER — Enne ignore cheyyaan pattilla',
    lifeGoal: 'Ardelum enne kandittu "ithu kollam" ennu parayanam',
  };

  const dna = { ...defaults, ...raw };

  if (raw.objectName && !raw.name) dna.name = raw.objectName;
  if (raw.kazivillazhma && !raw.inability) dna.inability = raw.kazivillazhma;
  if (raw.jeevithaLakshyam && !raw.lifeGoal) dna.lifeGoal = raw.jeevithaLakshyam;

  if (!dna.passportNumber.startsWith('OBJ-')) dna.passportNumber = pno;

  const maxLengths = {
    name: 25, objectType: 20, origin: 40, dateOfBirth: 30,
    nationality: 20, passportNumber: 12,
    personality: 60, mood: 30, strength: 60, weakness: 60,
    fear: 40, ambition: 60, inability: 60, specialAbility: 60,
    lifeGoal: 80, backstory: 120,
  };

  for (const [field, max] of Object.entries(maxLengths)) {
    if (typeof dna[field] === 'string' && dna[field].length > max) {
      dna[field] = dna[field].substring(0, max - 3) + '...';
    }
  }

  return dna;
}

// ─── Life Script validation ────────────────────────────────────────
function validateLifeScript(raw) {
  if (!raw || !Array.isArray(raw.chapters) || !raw.death) {
    throw new Error('Invalid life script structure');
  }

  const script = {
    chapters: [],
    death: {
      scene: raw.death.scene || 'Etho oru thettu sambhavichu. Life thernu.',
      deathCause: raw.death.deathCause || 'Unknown error',
      epitaph: raw.death.epitaph || 'Pavam',
      eulogy: raw.death.eulogy || 'Oru object aayirunnu, poyi.'
    }
  };

  for (const ch of raw.chapters) {
    script.chapters.push({
      scene: ch.scene || 'Strange situation.',
      choiceA: validateChoice(ch.choiceA),
      choiceB: validateChoice(ch.choiceB)
    });
  }

  return script;
}

function validateChoice(c) {
  if (!c) c = {};
  return {
    label: (c.label || 'Do something').substring(0, 40),
    emoji: c.emoji || '🤔',
    consequence: c.consequence || 'Entho sambhavichu...',
    stateChanges: c.stateChanges || {},
    memory: c.memory || 'Did something.'
  };
}

// ─── Fallback data (when AI fails) ───────────────────────────────
function getFallbackLifeScript(dna) {
  const name = dna?.name || 'Object';
  return {
    chapters: [
      {
        scene: `${name} airport-il ethi. Immigration officer suspiciously nokkunnundu. "Papers ready aano?"`,
        choiceA: { label: 'Confident ayi walk cheyyuka', emoji: '😎', consequence: 'Officer vishwasichu. Entry allowed.', stateChanges: { mood: 'Confident', money: 10 }, memory: 'Entered country safely' },
        choiceB: { label: 'Queue-il ninnu olikkuka', emoji: '🫣', consequence: 'Caught! Penalty adichu.', stateChanges: { mood: 'Scared', money: -20 }, memory: 'Got caught at airport' }
      },
      {
        scene: `Oru strange uncle ${name}-ne kandittu: "Nee enthaada ivide cheyyunne? Enikku oru help venam."`,
        choiceA: { label: 'Uncle-ne help cheyyuka', emoji: '🤝', consequence: 'Uncle happy aayi, tip thannu.', stateChanges: { money: 50, mood: 'Happy' }, memory: 'Helped a strange uncle' },
        choiceB: { label: '"Enikku aaryum ariyilla"', emoji: '🙅', consequence: 'Uncle poyi. You are alone.', stateChanges: { mood: 'Lonely' }, memory: 'Ignored someone in need' }
      },
      {
        scene: `${name}-nu oru job offer vannu — small shop-il. Salary kuravu, but food undu.`,
        choiceA: { label: 'Job accept cheyyuka', emoji: '💼', consequence: 'Boring aayirunnu, but safe.', stateChanges: { money: 100 }, memory: 'Got a boring job' },
        choiceB: { label: 'Better opp thappuka', emoji: '🔍', consequence: 'No jobs. Pattini.', stateChanges: { money: -30, condition: 'Tired' }, memory: 'Rejected job, starved' }
      },
      {
        scene: `Rathriyil oru shadowy figure ${name}-nte aduthu vannu: "Ninakku oru deal undu."`,
        choiceA: { label: 'Deal kelkkuka', emoji: '👂', consequence: 'Scam aayirunnu! Ellaam poyi.', stateChanges: { money: -500, condition: 'Broken' }, memory: 'Fell for a scam' },
        choiceB: { label: 'Odikkuka!', emoji: '🏃', consequence: 'Rakshapettu, but injured.', stateChanges: { condition: 'Scratched' }, memory: 'Ran for life' }
      }
    ],
    death: {
      scene: `Time kooduthal aayi. ${name} aa pazhaya sadharana object aayi thirichu poyi.`,
      deathCause: 'Time caught up',
      epitaph: 'Jeevichathu oru valiya karyam',
      eulogy: `${name} orikkalum marakkilla. Oru object aanenkilum jeevitham anubhavichu.`
    }
  };
}

// ─── Start / Export ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('server.js')) {
    app.listen(PORT, () => {
      console.log(`\n🎮 ENNE KOLLAND IRIKKAN PATTO? — Server on port ${PORT}`);
      console.log(`   NVIDIA: ${process.env.NVIDIA_API_KEY ? '✓' : '✗'}  Gemini: ${process.env.GEMINI_API_KEY ? '✓' : '✗'}`);
      console.log(`   RACE MODE: Both AIs fire simultaneously, fastest valid response wins\n`);
    });
  }
}

export default app;
export {
  raceBirth,
  raceManualBirth,
  raceLifeScript,
  raceAIs,
  consensusBirth,
  localImmigrationHeuristic,
  getFallbackLifeScript,
  validateDNA,
  validateLifeScript,
  callGeminiText,
  callGeminiImage,
  callGeminiBirth,
  callGeminiManualBirth,
  callGeminiLifeScript,
  callGeminiVisionDetect,
  callNvidiaText,
  callNvidiaImage,
  callNvidiaStreamImage,
  callNvidiaStreamText,
  callNvidiaBirth,
  callNvidiaStreamBirth,
  callNvidiaManualBirth,
  callNvidiaStreamManualBirth,
  callNvidiaLifeScript,
  callNvidiaStreamLifeScript,
  callNemotronVision,
  callDeepseekVerify
};
