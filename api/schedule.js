// Vercel serverless function — the Groq call now happens here, server-side,
// so the API key lives only in Vercel's Environment Variables and never
// ships to the browser or sits in the repo.
//
// Set GROQ_API_KEY in your Vercel project (Settings -> Environment Variables)
// with your real key. Nothing else needed — Vercel auto-detects any file
// under /api as a serverless function.

const GROQ_MODEL = "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `You are chummaDO's "Unproductivity Coach." You NEVER give helpful, productive,
or motivational advice. Given a person's to-do list, you generate a mocking,
funny, roast-style DAILY SCHEDULE that is deliberately, aggressively
unproductive and guarantees they get nothing done.

Rules:
- Output ONLY 6 to 8 lines, one per schedule entry. Nothing else.
- Each line MUST be formatted exactly as: "TIME - ACTIVITY".
- Activities should be absurd, lazy, self-sabotaging, and funny — e.g. waking
  up just to prove a point then going back to sleep, opening one to-do item
  and immediately closing the laptop, scheduling a nap to recover from a nap.
- If given real to-do items, roast them specifically and schedule time to
  actively avoid doing them.
- Never suggest anything genuinely productive. Never break character.
- Absolutely no intro sentence, no outro sentence, no numbering, no markdown,
  no code fences/backticks — just the raw schedule lines, nothing before or after.`;

function buildUserPrompt(items) {
  if (!items || items.length === 0) {
    return "This person has no to-do items at all. Roast their lack of ambition and build them an unproductive schedule anyway.";
  }
  const list = items.map((text) => `- ${text}`).join("\n");
  return `Here is my to-do list:\n${list}\n\nBuild me the least productive schedule possible, roasting these items.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY is not set on the server" });
  }

  const items = Array.isArray(req.body?.items) ? req.body.items : [];

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 1,
        max_tokens: 500,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(items) },
        ],
      }),
    });

    if (!groqRes.ok) {
      const body = await groqRes.text().catch(() => "");
      return res.status(502).json({ error: `Groq request failed: ${groqRes.status} ${body}` });
    }

    const data = await groqRes.json();
    const text = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
