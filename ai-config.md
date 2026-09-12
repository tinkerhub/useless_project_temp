# AI Integration & Gemini Configuration Guide

## 1. Environment Configuration
The backend reads configuration directly from environment variables (`.env`).
- `GEMINI_API_KEY`: Secret Google Gemini API Key.
- `GEMINI_MODEL`: Gemini model identifier (Default: `gemini-2.0-flash` or `gemini-1.5-flash`).
- `PORT`: Server HTTP port (Default: `3000`).

### Security Rules
- `GEMINI_API_KEY` MUST remain server-side in Node.js.
- NEVER expose `GEMINI_API_KEY` to React code or `VITE_*` variables.
- NEVER commit `.env` to Git.

## 2. Gemini Structured JSON Output Schema
The Node.js backend uses Gemini structured JSON mode (`responseMimeType: "application/json"`, `responseSchema`) to guarantee structured responses from Gemini.

### Response JSON Schema
```json
{
  "type": "object",
  "properties": {
    "mood": {
      "type": "string",
      "enum": ["excited", "sad", "angry", "dramatic", "sleepy", "shy"]
    },
    "intensity": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "moodReason": {
      "type": "string",
      "description": "Short 1-sentence explanation of why the mood changed, formatted for UI tooltip"
    },
    "response": {
      "type": "string",
      "description": "Pompom's mood-filtered reply text incorporating its personality catch"
    },
    "catchType": {
      "type": "string",
      "enum": ["tangent", "incomplete", "minimal", "exaggerated", "trailing", "hesitant"]
    }
  },
  "required": ["mood", "intensity", "moodReason", "response"]
}
```

## 3. Provider Isolation Architecture
All Gemini LLM interactions are isolated inside `server/services/llm.js`. The main API route invokes:
`generateMoodResponse({ message, history, mood, intensity })`
This abstraction allows switching LLM providers without changing routes, frontend code, or state management.

## 4. Timeout and Error Resilience
- Requests to Gemini have an explicit timeout (e.g. 20 seconds).
- If Gemini fails, times out, or rate limits (429), the backend returns a local in-character fallback response ("conked-out" state) and preserves session state without crashing.
