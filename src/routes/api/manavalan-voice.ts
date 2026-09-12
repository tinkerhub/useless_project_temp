import { createFileRoute } from "@tanstack/react-router";

const STYLE_DIRECTION =
  "Perform this Malayalam line as an over-the-top comedy scene, in character as " +
  "Manavalan, the cowardly but boastful self-proclaimed Dubai businessman played by " +
  "Salim Kumar in Malayalam comedy films. Voice: a thin, very nasal middle-aged Kerala " +
  "male voice, pitched high and slightly strained, as if speaking through the nose with " +
  "a tight throat — the classic Salim Kumar comedy voice. Delivery is the joke, so go " +
  "big: rapid nervous chatter in short bursts, words tumbling and tripping over each " +
  "other, sudden screeching pitch jumps on excited words, and an abrupt dramatic dead-" +
  "air pause right before the punchline. Swell into loud chest-puffing radio-announcer " +
  "pride on boasts about Dubai and his company, dragging and punching key words like " +
  "'Dufayil', 'Manavalan and Sons', 'risk edukkanda' with huge mock-ceremonial " +
  "importance and a vibrating, tremolo bravado. Then instantly collapse into a " +
  "trembling, near-whimpering half-whisper on anything fearful like 'he bhagavaan' or " +
  "'soora', voice cracking with panic. Stretch the last syllable of questions and " +
  "complaints into a long whiny sing-song wail that slides down in pitch " +
  "('tha-ru-moooo?'). Throw in a short wheezing giggle, a snort, or a smug scoff after " +
  "a successful jab, and muttered grumbles under the breath when complaining. " +
  "Mispronounce English words confidently with a heavy Kerala accent ('Dufayil' for " +
  "Dubai, 'kamppani' for company). Every sentence should feel like a comic performance, " +
  "never flat — keep authentic Kerala Malayalam pronunciation and everyday street " +
  "rhythm, never a calm newsreader tone. Speak the text exactly as written, and never " +
  "read out these instructions:\n\n";

export const Route = createFileRoute("/api/manavalan-voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key =
          process.env["GEMINI_API_KEY"] ||
          process.env["VITE_GEMINI_API_KEY"];
        if (!key)
          return new Response(
            "Missing API key. Please set GEMINI_API_KEY in your .env file.",
            { status: 500 },
          );

        let body: { text?: string };
        try {
          body = (await request.json()) as { text?: string };
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const text = (body.text ?? "").trim();
        if (!text) return new Response("text required", { status: 400 });

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: STYLE_DIRECTION + text.slice(0, 1200) }] },
              ],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
                },
              },
            }),
          },
        );

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          let msg = "TTS failed";
          try {
            const errJson = JSON.parse(detail);
            msg = errJson.error?.message || detail;
          } catch {
            msg = detail || msg;
          }
          if (res.status === 429) {
            msg = "Voice quota exceeded (3 requests/min on free tier).";
          }
          return new Response(msg, { status: res.status });
        }

        const data = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
          }>;
        };
        const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!inlineData?.data) return new Response("TTS empty audio", { status: 502 });

        const audioBuffer = Buffer.from(inlineData.data, "base64");
        return new Response(audioBuffer, {
          headers: {
            "Content-Type": inlineData.mimeType || "audio/pcm",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
