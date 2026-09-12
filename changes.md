# MoodPet — Project Changes Log

## Phase 1 — Initial Setup & Documentation Specs

- **`pompom.md`**: Created character specification & personality guide for Pompom (hybrid chibi bunny-cat, `#BCE7FD`, 6 mood behaviors, caught answers, factual integrity, user relationship).
- **`ai-config.md`**: Documented Google Gemini integration setup, structured JSON schema outputs (`responseSchema`), environment configuration, and LLM isolation rules.
- **`.gitignore`**: Added `node_modules/`, `.env`, `dist/`.
- **`.env`**: Configured environment secrets for `GEMINI_API_KEY`, `GEMINI_MODEL`, and `PORT`.
- **`.env.example`**: Secured template for `GEMINI_API_KEY`, `GEMINI_MODEL`, and `PORT`.
- **`package.json`**: Created package dependencies for Express, `@google/genai`, React, Lucide icons, Vite, nodemon, concurrently.
- **`vite.config.js`**: Configured Vite dev server with proxy settings forwarding `/api` to Express backend on port 3000.

## Phase 2 — Backend Architecture & Gemini LLM Integration

- **`server/services/mood.js`**: Implemented initial random mood picker (1 of 6, intensity 30-70), mood validation, intensity clamping, and avatar state event contracts.
- **`server/utils/fallbacks.js`**: Created in-character local fallback responses for API errors, rate limits, timeouts, or JSON parsing failures.
- **`server/prompts/moodpet.js`**: Built system prompt for Pompom character, tone drift rules, 6 moods, intensity effects, answer-first rule, and structured JSON output constraints.
- **`server/services/llm.js`**: Implemented isolated Gemini integration using `@google/genai`, responseSchema JSON output, timeout handling, and fallback resilience.
- **`server/routes/chat.js`**: Created `/api/health`, `/api/initial-mood`, and `/api/chat` endpoints with validation and error handling.
- **`server/index.js`**: Created Express server bootstrap with CORS, JSON body parsing, and route mounting.

## Phase 3 — Frontend Integration & Mascot UI

- **`index.html`**: Added viewport, title, and Google Fonts (`Fredoka`, `Outfit`, `Inter`).
- **`src/main.jsx`**: Created React root entry point.
- **`src/index.css`**: Created design system with CSS custom properties for 6 mood colors (`#FF4B4B`, `#FAD2E1`, `#1E1B4B`, `#FFD166`, `#5A189A`, `#4A6B82`), glassmorphism, animations (vibration, bounce, breath, zzz, swoon), and speech bubble styles.
- **`src/components/MoodEnvironment.jsx`**: Built dynamic background environment morphing with ambient mood particle FX (confetti, rain, steam, spotlight, Zzz, sparkles).
- **`src/components/PompomAvatar.jsx`**: Built interactive SVG mascot for Pompom (`#BCE7FD` chibi bunny-cat) with distinct mood face layers, eyes, ears, mouth, paws, and micro-animations.
- **`src/components/MoodIndicator.jsx`**: Built floating mood badge with emoji, name, intensity %, and hover tooltip displaying `moodReason`.
- **`src/components/ThinkingState.jsx`**: Created thinking indicator for when requests are processing.
- **`src/components/ChatWindow.jsx`**: Built scrollable conversation container rendering speech bubbles with mood entrance animations.
- **`src/components/ChatInput.jsx`**: Built rounded chat input bar with send button, length checks, auto-disable during request.
- **`src/components/LandingScreen.jsx`**: Built landing screen hero view ("Meet Pompom. You never know what mood you'll get.") with start button.
- **`src/App.jsx`**: Built main application container managing conversation state, Gemini backend API calls, initial mood fetch, and developer keyboard shortcuts (`Ctrl+Shift+1..6`, `Ctrl+Shift+R`).

## Phase 4 — API Key Configuration & Model Fix

- **`.env`**: Populated with real `GEMINI_API_KEY` and corrected `GEMINI_MODEL=gemini-3.6-flash` (previous model names `gemini-2.0-flash` / `gemini-2.5-flash` were deprecated; Gemini API recommends `gemini-3.6-flash` for this API key).
- **`.env.example`**: Updated model name placeholder to `gemini-3.6-flash`.
- **`server/services/llm.js`**: Updated model fallback list to `['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite']` to reflect available Gemini models. Added automatic model fallback loop — if the primary model returns 404, server retries with backup models before falling back to local in-character fallback.
- **End-to-end Verified**: Full HTTP API flow tested. Pompom correctly drifts mood (Excited → Sad on sad input), applies personality catch (incomplete trailing response), and returns structured avatar state (`state: "droopy"`, `event: "mood-change"`).

## 2026-09-12 — MoodPet V2 Implementation

### Implemented
- Added Confused mood
- Added Toddler mood
- Added Overprotective Parent mood
- Added Bargainer mood
- Integrated all 10 moods
- Added controlled mood randomness
- Added developer mood shortcuts
- Added automatic SpeechSynthesis
- Added mood-based voice behavior
- Added interactive response behavior
- Added response variety
- Added mood-specific visual states
- Added mood transitions
- Updated Gemini mood integration

### Files Modified
- `src/index.css`
- `src/components/MoodEnvironment.jsx`
- `src/components/PompomAvatar.jsx`
- `src/App.jsx`
- `server/prompts/moodpet.js`
- `server/services/mood.js`
- `server/services/llm.js`

### Files Added
- None

### Files Removed
- None

### Testing
- Existing moods tested
- New moods tested
- Developer shortcuts tested
- Random mood behavior tested
- Voice tested
- Conversation history tested
- Error handling tested
# MoodPet — Project Changes Log

## Phase 1 — Initial Setup & Documentation Specs

- **`pompom.md`**: Created character specification & personality guide for Pompom (hybrid chibi bunny-cat, `#BCE7FD`, 6 mood behaviors, caught answers, factual integrity, user relationship).
- **`ai-config.md`**: Documented Google Gemini integration setup, structured JSON schema outputs (`responseSchema`), environment configuration, and LLM isolation rules.
- **`.gitignore`**: Added `node_modules/`, `.env`, `dist/`.
- **`.env`**: Configured environment secrets for `GEMINI_API_KEY`, `GEMINI_MODEL`, and `PORT`.
- **`.env.example`**: Secured template for `GEMINI_API_KEY`, `GEMINI_MODEL`, and `PORT`.
- **`package.json`**: Created package dependencies for Express, `@google/genai`, React, Lucide icons, Vite, nodemon, concurrently.
- **`vite.config.js`**: Configured Vite dev server with proxy settings forwarding `/api` to Express backend on port 3000.

## Phase 2 — Backend Architecture & Gemini LLM Integration

- **`server/services/mood.js`**: Implemented initial random mood picker (1 of 6, intensity 30-70), mood validation, intensity clamping, and avatar state event contracts.
- **`server/utils/fallbacks.js`**: Created in-character local fallback responses for API errors, rate limits, timeouts, or JSON parsing failures.
- **`server/prompts/moodpet.js`**: Built system prompt for Pompom character, tone drift rules, 6 moods, intensity effects, answer-first rule, and structured JSON output constraints.
- **`server/services/llm.js`**: Implemented isolated Gemini integration using `@google/genai`, responseSchema JSON output, timeout handling, and fallback resilience.
- **`server/routes/chat.js`**: Created `/api/health`, `/api/initial-mood`, and `/api/chat` endpoints with validation and error handling.
- **`server/index.js`**: Created Express server bootstrap with CORS, JSON body parsing, and route mounting.

## Phase 3 — Frontend Integration & Mascot UI

- **`index.html`**: Added viewport, title, and Google Fonts (`Fredoka`, `Outfit`, `Inter`).
- **`src/main.jsx`**: Created React root entry point.
- **`src/index.css`**: Created design system with CSS custom properties for 6 mood colors (`#FF4B4B`, `#FAD2E1`, `#1E1B4B`, `#FFD166`, `#5A189A`, `#4A6B82`), glassmorphism, animations (vibration, bounce, breath, zzz, swoon), and speech bubble styles.
- **`src/components/MoodEnvironment.jsx`**: Built dynamic background environment morphing with ambient mood particle FX (confetti, rain, steam, spotlight, Zzz, sparkles).
- **`src/components/PompomAvatar.jsx`**: Built interactive SVG mascot for Pompom (`#BCE7FD` chibi bunny-cat) with distinct mood face layers, eyes, ears, mouth, paws, and micro-animations.
- **`src/components/MoodIndicator.jsx`**: Built floating mood badge with emoji, name, intensity %, and hover tooltip displaying `moodReason`.
- **`src/components/ThinkingState.jsx`**: Created thinking indicator for when requests are processing.
- **`src/components/ChatWindow.jsx`**: Built scrollable conversation container rendering speech bubbles with mood entrance animations.
- **`src/components/ChatInput.jsx`**: Built rounded chat input bar with send button, length checks, auto-disable during request.
- **`src/components/LandingScreen.jsx`**: Built landing screen hero view ("Meet Pompom. You never know what mood you'll get.") with start button.
- **`src/App.jsx`**: Built main application container managing conversation state, Gemini backend API calls, initial mood fetch, and developer keyboard shortcuts (`Ctrl+Shift+1..6`, `Ctrl+Shift+R`).

## Phase 4 — API Key Configuration & Model Fix

- **`.env`**: Populated with real `GEMINI_API_KEY` and corrected `GEMINI_MODEL=gemini-3.6-flash` (previous model names `gemini-2.0-flash` / `gemini-2.5-flash` were deprecated; Gemini API recommends `gemini-3.6-flash` for this API key).
- **`.env.example`**: Updated model name placeholder to `gemini-3.6-flash`.
- **`server/services/llm.js`**: Updated model fallback list to `['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite']` to reflect available Gemini models. Added automatic model fallback loop — if the primary model returns 404, server retries with backup models before falling back to local in-character fallback.
- **End-to-end Verified**: Full HTTP API flow tested. Pompom correctly drifts mood (Excited → Sad on sad input), applies personality catch (incomplete trailing response), and returns structured avatar state (`state: "droopy"`, `event: "mood-change"`).

## 2026-09-12 — MoodPet V2 Implementation

### Implemented
- Added Confused mood
- Added Toddler mood
- Added Overprotective Parent mood
- Added Bargainer mood
- Integrated all 10 moods
- Added controlled mood randomness
- Added developer mood shortcuts
- Added automatic SpeechSynthesis
- Added mood-based voice behavior
- Added interactive response behavior
- Added response variety
- Added mood-specific visual states
- Added mood transitions
- Updated Gemini mood integration

### Files Modified
- `src/index.css`
- `src/components/MoodEnvironment.jsx`
- `src/components/PompomAvatar.jsx`
- `src/App.jsx`
- `server/prompts/moodpet.js`
- `server/services/mood.js`
- `server/services/llm.js`

### Files Added
- None

### Files Removed
- None

### Testing
- Existing moods tested
- New moods tested
- Developer shortcuts tested
- Random mood behavior tested
- Voice tested
- Conversation history tested
- Error handling tested
- Production build tested

### Build Status
- Development: PASS
- Production: PASS

### Notes
- Existing MoodPet architecture preserved.
- Desktop Pet was NOT introduced.
- No unrelated functionality intentionally changed.

## Phase 5 — Landing Page Polish

### Implemented
- Generated custom images for the Mochi chatbot hero section and mood visual.
- Generated cute polaroid-style photos for the Mochi photo section.
- Included actual chatbot screenshots from the `assets` folder into the landing page screenshot gallery.
- Wrote funny and characteristic chatbot responses for the snippet cards (Sleepy, Chaotic, Happy, Angry moods).
- Updated the `index.html` file to properly source and display these images in their respective placeholders.
