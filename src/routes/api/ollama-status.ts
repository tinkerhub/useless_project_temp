import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ollama-status")({
  server: {
    handlers: {
      GET: async () => {
        const ollamaHost = process.env["OLLAMA_HOST"] || "http://localhost:11434";
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(`${ollamaHost}/api/tags`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            return new Response(
              JSON.stringify({
                connected: false,
                error: `Ollama returned HTTP ${res.status}`,
                models: [],
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const data = (await res.json()) as {
            models?: Array<{ name: string; size?: number }>;
          };
          const models = Array.isArray(data.models) ? data.models.map((m) => m.name) : [];
          const visionModel = models.find(
            (m) => m.includes("vision") || m.includes("qwen2.5-vl") || m.includes("llava"),
          );
          const defaultModel =
            visionModel ||
            models.find((m) => m.includes("llama3.2")) ||
            models[0] ||
            "llama3.2-vision";
          return new Response(
            JSON.stringify({
              connected: true,
              models,
              defaultModel,
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              connected: false,
              error: err instanceof Error ? err.message : "Cannot connect to Ollama",
              models: [],
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
