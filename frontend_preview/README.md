# GitWorld Frontend Preview (Local Playground)

> **⚠️ NOTE**: This folder is **NOT** part of the git repository. It is a completely isolated local sandbox created outside `useless_project_temp1` so you can test all backend features without touching Person 1's code.

---

### How to Run:

1. Make sure your backend server is running in another terminal:
   ```powershell
   cd "..\useless_project_temp1\server"
   npm run dev
   ```

2. Start this frontend preview server:
   ```powershell
   node server.js
   ```

3. Open your browser to:
   ```text
   http://localhost:5173
   ```

---

### Features You Can Test:

1. **Fantasy Gate & Login Screen**:
   - Live Gatekeeper greeting & dialogue from `/api/auth/me`.
   - "Knock on the Gate" button redirects to GitHub OAuth.
   - "Quick Test" button logs in with dev mock session.
   - "Explore Realm" search bar generates ANY public GitHub user's world on the fly (e.g. `octocat`, `torvalds`)!

2. **2D Canvas World**:
   - Smooth **WASD / Arrow Key** movement with obstacle collisions (buildings, walls, and water are impassable).
   - Dynamic camera follow.
   - Biome tiles (Mystic Forest, Volcanic Forge, Stone City, Meadow, Deep Water).
   - Minimap in the bottom-right corner.
   - Proximity prompt: walk up to any building and press **[E]** to interact!

3. **Repository & File Inspector (Parchment Modal)**:
   - **Overview Tab**: Live stars, forks, issues, language badge, description, and link to GitHub.
   - **File Inspector Tab**: Interactive file tree! Click folders to explore subdirectories and click any code file (e.g. `README.md`, `package.json`) to read its decoded source code!
   - **Chronicles Tab**: Timeline of recent commits with author and commit messages.

4. **Developer RPG Profile**:
   - Click **[Profile]** in the top bar to see your developer level, Realm Power score, language breakdown percentage bars, and unlocked achievements.

5. **Settings Panel**:
   - Toggle retro CRT scanlines, tile grid lines, and minimap visibility.

---

### How to Delete:
Whenever you are done with this preview, simply delete this entire `frontend_preview` folder:
```powershell
Remove-Item -Recurse -Force "..\frontend_preview"
```
It will leave your git repository and backend 100% untouched!
