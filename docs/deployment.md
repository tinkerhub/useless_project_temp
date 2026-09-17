# Hosting Willow

## Build and deploy

Use Node.js 22 or newer. `npm ci && npm run build` produces a self-contained `dist/` (~16 MB uncompressed, mostly the Python runtime). `npm run preview` serves that output on port 4173. First play downloads and initializes the runtime; subsequent page loads benefit from the browser cache.

For Vercel, import the repository and select **Other**. The committed configuration uses `npm run build` and publishes `dist/`. Do not set a Python entry point, install a database, or add an owner API key. The obsolete shared-world `api/index.py` has been removed. The build publishes an explicit asset allowlist and never copies `data/`, environment files, or local saves.

For another host, publish the contents of `dist/` at the domain root over HTTPS. Serve `.mjs` / `.js` as JavaScript and `.wasm` as `application/wasm`. Copy the security headers from `vercel.json` if the host supports them. No URL rewrites or application server are required.

## What belongs to a player

The full Python world runs in a Web Worker. Rendering and direct provider requests run in the page. Existing actions, collisions, citizen context scoping, and AI decision validation use the same engine as `server.py`.

Each browser profile and site origin has one private town in IndexedDB. The town is saved every three seconds and after interactions, AI replies, or returning to the menu. Closing immediately after movement can lose the last few seconds. The simulation pauses on the title screen or when the document is hidden, and it does not run while the page is closed. There is no account, cross-device synchronization, or shared multiplayer state. Changing the deployment domain starts a separate save. Clearing site data or using an ephemeral/private session can remove it.

Web Locks prevents two tabs on the same origin from overwriting that save. Close the other tab and retry if prompted. The title screen can export the world JSON as a backup (which can also be passed to `python3 server.py --save /path/to/willow-world.json`). API keys are never in that backup. Local saves contain the player's conversations and citizen memories; treat exported files accordingly.

Browser mode requires WebAssembly, module workers, IndexedDB, and Web Locks in a modern browser. The initial engine download and runtime use more resources than the original thin client. Low-power device performance depends on the browser and hardware.

## AI setup

Open **Set up AI** on the title screen, or the AI button in game.

### OpenAI / bring your own key

Select OpenAI, enter an exact chat model ID (the existing default is `gpt-5-mini`), and paste your own API key. Connect verifies the key and available model list. Actual inference can still fail due to model compatibility, billing, quota, or provider availability; these errors appear in the conversation.

Requests go directly from the player's browser to `https://api.openai.com/v1`; the key is never sent to Willow or Vercel. The key stays only in tab memory, is cleared from the input after connection, and is forgotten on disconnect/reload/close. There is no analytics or third-party script on the page. Use a personal limited-budget key on a trusted device. The provider receives the selected citizen's context and dialogue needed for that inference. Chat requests use `store: false`; provider retention policies still apply.

By default, AI runs for player conversations. **Let neighbors think on their own** opts into up to four extra background requests per minute, round-robin across residents, while playing. Decisions still pass through the engine validator. Disconnecting invalidates outstanding results. Normal citizen schedules continue without AI.

### LM Studio

Load a chat model. In Developer, start the local server and enable **CORS** in Server Settings. Use `http://127.0.0.1:1234/v1`. Leave Model blank to detect the first non-embedding model, or enter the loaded model's exact ID. The endpoint must support OpenAI-style `/models` and `/chat/completions`.

### Ollama

Install/pull a chat model, allow the exact website origin using `OLLAMA_ORIGINS`, and restart Ollama. For a shell-launched instance:

```sh
OLLAMA_ORIGINS="https://your-town.vercel.app" ollama serve
```

If the macOS app manages the service, set the environment for that app and restart it:

```sh
launchctl setenv OLLAMA_ORIGINS "https://your-town.vercel.app"
```

Then use `http://127.0.0.1:11434/v1` in Willow. The help panel shows the actual origin to allow. Avoid enabling every origin when only this site needs access.

### Browser access to local models

Allow local network access if the browser prompts. Local inference works only when the model is running on the computer opening the page. Loopback HTTP (`localhost`, `127.0.0.1`) is supported; remote endpoints must use HTTPS. Browser mixed-content and private-network policies vary, so local inference from a hosted HTTPS page cannot be promised in every browser. If it is blocked, try a current Chromium browser with permission granted, configure an HTTPS endpoint with CORS, or use the original local `python3 server.py` mode. The game and OpenAI setup remain available independently.

## Verification

```sh
python3 -m pytest -q
npm test
npm run test:browser
```

The browser tests use installed Google Chrome (see `playwright.config.js`). They check movement, saved-world reloads, different visitor profiles, tab locking, mobile layout, mocked provider errors, and disconnect behavior. The Node suite runs the real Python engine under WebAssembly and validates private worlds and AI result handling. Provider tests use fake credentials and mocked HTTP responses; successful live inference requires the player's own configured provider.

## References

- [Vercel builds and output directories](https://vercel.com/docs/builds)
- [Pyodide in a Web Worker](https://pyodide.org/en/stable/usage/webworker.html)
- [LM Studio server settings / CORS](https://lmstudio.ai/docs/developer/core/server/settings)
- [Ollama environment variables and allowed origins](https://docs.ollama.com/faq)
- [OpenAI Chat API](https://developers.openai.com/api/reference/resources/chat)
