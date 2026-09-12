import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/manavalan-listen")({
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

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size < 2048) {
          return new Response("A longer recording is required", { status: 400 });
        }
        if (file.size > 14 * 1024 * 1024) {
          return new Response("Recording too large", { status: 413 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || "audio/wav";
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "Transcribe the following audio recording accurately. Output ONLY the transcribed text.",
                    },
                    {
                      inlineData: {
                        mimeType,
                        data: buffer.toString("base64"),
                      },
                    },
                  ],
                },
              ],
            }),
          },
        );

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return new Response(detail || "Transcription failed", { status: res.status });
        }

        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const transcribedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        return new Response(JSON.stringify({ text: transcribedText }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
