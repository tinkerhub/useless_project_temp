/**
 * GitWorld App Controller
 * Connects frontend UI & Game Engine to Backend Endpoints
 */

const API_BASE = 'http://localhost:5000/api';

class GitWorldApp {
  constructor() {
    this.is3D = true;
    this.game2D = new GameEngine('game-canvas', 'minimap-canvas');
    this.game3D = new GameEngine3D('game-3d-container', 'minimap-canvas');
    this.currentUser = null;
    this.currentWorld = null;
    this.currentRepo = null;
    this.currentPath = '';

    this.initElements();
    this.initEvents();
    this.checkSession();
  }

  initElements() {
    this.gateOverlay = document.getElementById('gate-overlay');
    this.gateDialogue = document.getElementById('gatekeeper-dialogue-text');
    this.userPill = document.getElementById('user-pill');
    this.userAvatar = document.getElementById('user-avatar');
    this.userName = document.getElementById('user-name');
    this.userTitle = document.getElementById('user-title');
    this.statStars = document.getElementById('stat-stars');
    this.statForks = document.getElementById('stat-forks');
    this.statRepos = document.getElementById('stat-repos');
    this.realmLabel = document.getElementById('current-realm-label');

    // Modals
    this.parchmentModal = document.getElementById('parchment-modal');
    this.rpgModal = document.getElementById('rpg-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.gatekeeperModal = document.getElementById('gatekeeper-modal');
  }

  initEvents() {
    let modalOpenedThisTick = false;
    const handleInteract = (target) => {
      if (this.hasOpenModal()) {
        this.closeAllModals();
        return;
      }
      modalOpenedThisTick = true;
      setTimeout(() => { modalOpenedThisTick = false; }, 150);

      if (target.type === 'building') {
        this.openRepositoryModal(target.data.repository);
      } else if (target.type === 'gatekeeper') {
        this.openGatekeeperModal(target.data);
      }
    };

    this.game2D.onInteract = handleInteract;
    this.game3D.onInteract = handleInteract;

    // Allow clicking on on-screen interaction prompt
    const promptEl = document.getElementById('interaction-prompt');
    if (promptEl) {
      promptEl.addEventListener('click', () => {
        const active = this.is3D ? this.game3D.activeInteraction : this.game2D.activeInteraction;
        if (active) handleInteract(active);
      });
    }

    // Close modals on backdrop click, Escape, or pressing 'E'
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'Escape') {
        this.closeAllModals();
      } else if (e.key.toLowerCase() === 'e' && this.hasOpenModal() && !modalOpenedThisTick) {
        this.closeAllModals();
      }
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeAllModals();
        }
      });
    });

    // Public realm search from HUD
    const hudSearchInput = document.getElementById('hud-search-input');
    hudSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && hudSearchInput.value.trim()) {
        this.loadPublicRealm(hudSearchInput.value.trim());
      }
    });

    // Public realm search from Landing Page
    const gateSearchBtn = document.getElementById('btn-gate-search');
    const gateSearchInput = document.getElementById('gate-search-input');
    if (gateSearchBtn && gateSearchInput) {
      gateSearchBtn.addEventListener('click', () => {
        if (gateSearchInput.value.trim()) {
          this.loadPublicRealm(gateSearchInput.value.trim());
        }
      });
      gateSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && gateSearchInput.value.trim()) {
          this.loadPublicRealm(gateSearchInput.value.trim());
        }
      });
    }

    // Tab switching in Parchment Modal
    document.querySelectorAll('.parchment-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        document.querySelectorAll('.parchment-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');

        if (tabId === 'files' && this.currentRepo) {
          this.loadRepoContents(this.currentRepo.fullName, '');
        } else if (tabId === 'commits' && this.currentRepo) {
          this.loadRepoCommits(this.currentRepo.fullName);
        }
      });
    });
  }

  async checkSession() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      const data = await res.json();

      if (data.isAuthenticated && data.user) {
        this.currentUser = data.user;
        this.updateHUD(data.user);
        this.gateOverlay.classList.add('hidden');
        await this.loadMyWorld();
      } else {
        // Unauthenticated landing state
        if (data.gatekeeper) {
          this.gateDialogue.textContent = `"${data.gatekeeper.dialogue}"`;
        }
        this.gateOverlay.classList.remove('hidden');

        // Preload demo world in background so the 3D realm is visible right away
        try {
          const resDemo = await fetch(`${API_BASE}/world/octocat`);
          if (resDemo.ok) {
            const demoWorld = await resDemo.json();
            this.displayWorld(demoWorld);
            this.realmLabel.textContent = "Octocat's Realm (Demo)";
          }
        } catch (e) {
          console.warn('Preload demo realm skipped:', e);
        }
      }
    } catch (err) {
      console.warn('Backend not responding yet. Showing mock view:', err.message);
      this.gateDialogue.textContent = '"The mystical backend gate is resting. Start server with npm run dev!"';
    }
  }

  exploreAsGuest() {
    this.gateOverlay.classList.add('hidden');
    this.loadPublicRealm('octocat');
  }

  async loadMyWorld() {
    try {
      const res = await fetch(`${API_BASE}/world`, { credentials: 'include' });
      if (!res.ok) throw new Error('Could not load user world');
      const worldData = await res.json();
      this.displayWorld(worldData);
    } catch (err) {
      console.error('Error loading world:', err);
    }
  }

  async loadPublicRealm(username) {
    try {
      this.realmLabel.textContent = `⚡ Forging ${username}'s Realm...`;
      const res = await fetch(`${API_BASE}/world/${username}`);
      if (!res.ok) {
        alert(`Could not forge realm for user "${username}". Make sure username exists on GitHub!`);
        this.realmLabel.textContent = this.currentWorld ? `${this.currentWorld.user.username}'s Realm` : 'GitWorld';
        return;
      }
      const worldData = await res.json();
      this.gateOverlay.classList.add('hidden');
      this.displayWorld(worldData);
    } catch (err) {
      alert(`Error loading realm: ${err.message}`);
    }
  }

  displayWorld(worldData) {
    this.currentWorld = worldData;
    this.realmLabel.textContent = `${worldData.user.displayName || worldData.user.username}'s Realm`;

    // Update HUD Stats
    let totalStars = 0;
    let totalForks = 0;
    for (const b of worldData.buildings) {
      if (b.repository) {
        totalStars += b.repository.stars || 0;
        totalForks += b.repository.forks || 0;
      }
    }

    this.statStars.textContent = totalStars;
    this.statForks.textContent = totalForks;
    this.statRepos.textContent = worldData.buildings.length;

    // Load into both 3D WebGL and 2D canvas engines
    this.game2D.loadWorld(worldData);
    this.game3D.loadWorld(worldData);
  }

  toggle3DMode() {
    this.is3D = !this.is3D;
    const container3D = document.getElementById('game-3d-container');
    const canvas2D = document.getElementById('game-canvas');
    const btn = document.getElementById('btn-toggle-3d');

    if (this.is3D) {
      container3D.style.display = 'block';
      canvas2D.style.display = 'none';
      btn.innerHTML = '<span>🌐 3D Realm</span>';
      btn.classList.add('active');

      // Sync 2D position -> 3D position
      if (this.currentWorld) {
        const width = this.currentWorld.dimensions.width;
        const height = this.currentWorld.dimensions.height;
        const S = this.game3D.tileSize;
        const tileX = (this.game2D.player.x + this.game2D.player.width / 2) / this.game2D.tileSize;
        const tileY = (this.game2D.player.y + this.game2D.player.height / 2) / this.game2D.tileSize;
        this.game3D.player.x = (tileX - width / 2) * S;
        this.game3D.player.z = (tileY - height / 2) * S;
        if (this.game3D.player.mesh) {
          this.game3D.player.mesh.position.x = this.game3D.player.x;
          this.game3D.player.mesh.position.z = this.game3D.player.z;
        }
      }

      this.game3D.onResize();
    } else {
      container3D.style.display = 'none';
      canvas2D.style.display = 'block';
      btn.innerHTML = '<span>📜 2D Retro</span>';
      btn.classList.remove('active');

      // Sync 3D position -> 2D position
      if (this.currentWorld) {
        const width = this.currentWorld.dimensions.width;
        const height = this.currentWorld.dimensions.height;
        const S = this.game3D.tileSize;
        const tileX = (this.game3D.player.x + (width / 2) * S) / S;
        const tileY = (this.game3D.player.z + (height / 2) * S) / S;
        this.game2D.player.x = tileX * this.game2D.tileSize - this.game2D.player.width / 2;
        this.game2D.player.y = tileY * this.game2D.tileSize - this.game2D.player.height / 2;
      }

      this.game2D.resizeCanvas();
    }
  }

  updateHUD(user) {
    this.userAvatar.src = user.avatarUrl || 'https://avatars.githubusercontent.com/u/583231?v=4';
    this.userName.textContent = user.displayName || user.username;
    this.userTitle.textContent = `Lvl. ${Math.min(99, Math.max(1, user.publicRepos * 2))}`;
  }

  // === Modal Handlers ===
  openRepositoryModal(repo) {
    this.currentRepo = repo;
    this.closeAllModals();

    document.getElementById('p-repo-title').textContent = repo.name;
    document.getElementById('p-repo-lang').textContent = repo.primaryLanguage;
    document.getElementById('p-repo-stars').textContent = `★ ${repo.stars}`;
    document.getElementById('p-repo-forks').textContent = `🍴 ${repo.forks}`;
    document.getElementById('p-repo-issues').textContent = `🐛 ${repo.openIssues} Issues`;
    document.getElementById('p-repo-desc').textContent = repo.description || 'No description recorded in the ancient archives.';
    document.getElementById('p-repo-size').textContent = `${(repo.sizeKb / 1024).toFixed(1)} MB (${repo.sizeTier} tier)`;
    document.getElementById('p-repo-link').href = repo.htmlUrl;

    // Reset to Overview Tab
    document.querySelector('.parchment-tab[data-tab="overview"]').click();

    this.parchmentModal.classList.add('active');
  }

  async loadRepoContents(fullName, path = '') {
    const listEl = document.getElementById('file-tree-list');
    const codeEl = document.getElementById('code-content');
    const codeFilename = document.getElementById('code-filename');

    listEl.innerHTML = '<div style="padding:10px;color:#785530;">📜 Consulting ancient file scrolls...</div>';
    this.currentPath = path;

    try {
      const [owner, repo] = fullName.split('/');
      const res = await fetch(`${API_BASE}/repos/${owner}/${repo}/contents?path=${encodeURIComponent(path)}`, {
        credentials: 'include'
      });
      const files = await res.json();

      listEl.innerHTML = '';

      // Back navigation if in subdirectory
      if (path) {
        const parentPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
        const backItem = document.createElement('div');
        backItem.className = 'tree-node';
        backItem.innerHTML = '📁 <strong>.. (Back)</strong>';
        backItem.onclick = () => this.loadRepoContents(fullName, parentPath);
        listEl.appendChild(backItem);
      }

      files.forEach((file) => {
        const item = document.createElement('div');
        item.className = 'tree-node';
        item.innerHTML = `${file.type === 'dir' ? '📁' : '📄'} <span>${file.name}</span>`;

        item.onclick = () => {
          document.querySelectorAll('.tree-node').forEach((n) => n.classList.remove('active'));
          item.classList.add('active');

          if (file.type === 'dir') {
            this.loadRepoContents(fullName, file.path);
          } else {
            this.loadRepoFile(fullName, file.path);
          }
        };

        listEl.appendChild(item);
      });

      // Auto-preview README if at root
      const readme = files.find((f) => f.name.toLowerCase().startsWith('readme'));
      if (readme && !path) {
        this.loadRepoFile(fullName, readme.path);
      }
    } catch (err) {
      listEl.innerHTML = `<div style="color:#991b1b;padding:8px;">Failed to inspect files: ${err.message}</div>`;
    }
  }

  async loadRepoFile(fullName, filePath) {
    const codeEl = document.getElementById('code-content');
    const codeFilename = document.getElementById('code-filename');
    const codeSize = document.getElementById('code-size');

    codeFilename.textContent = filePath;
    codeEl.textContent = 'Reading runes...';

    try {
      const [owner, repo] = fullName.split('/');
      const res = await fetch(`${API_BASE}/repos/${owner}/${repo}/file?path=${encodeURIComponent(filePath)}`, {
        credentials: 'include'
      });
      const fileData = await res.json();

      codeSize.textContent = `${(fileData.size / 1024).toFixed(1)} KB`;
      codeEl.textContent = fileData.content || '// Empty scroll';
    } catch (err) {
      codeEl.textContent = `// Error reading file: ${err.message}`;
    }
  }

  async loadRepoCommits(fullName) {
    const container = document.getElementById('commit-timeline');
    container.innerHTML = '<div style="padding:12px;color:#785530;">📜 Unrolling recent chronicles...</div>';

    try {
      const [owner, repo] = fullName.split('/');
      const res = await fetch(`${API_BASE}/repos/${owner}/${repo}/commits`, {
        credentials: 'include'
      });
      const commits = await res.json();

      container.innerHTML = '';

      if (commits.length === 0) {
        container.innerHTML = '<div style="padding:12px;color:#785530;">No recent chronicles recorded.</div>';
        return;
      }

      commits.forEach((c) => {
        const card = document.createElement('div');
        card.className = 'commit-card';
        card.innerHTML = `
          <div class="commit-msg">${c.message.split('\n')[0]}</div>
          <div class="commit-meta">
            <span>🧙‍♂️ ${c.author}</span>
            <span>🔖 ${c.sha}</span>
            <span>📅 ${new Date(c.date).toLocaleDateString()}</span>
          </div>
        `;
        container.appendChild(card);
      });
    } catch (err) {
      container.innerHTML = `<div style="color:#991b1b;">Failed to fetch commits: ${err.message}</div>`;
    }
  }

  openGatekeeperModal(gk = {}) {
    this.closeAllModals();
    const text = gk?.dialogue?.greeting || gk?.dialogue?.success || (typeof gk?.dialogue === 'string' ? gk.dialogue : null) || 'Greetings, traveler! You stand within the Git realm. Walk forth and explore your creations!';
    const dialogueEl = document.getElementById('gk-dialogue');
    if (dialogueEl) dialogueEl.textContent = `"${text}"`;
    if (this.gatekeeperModal) this.gatekeeperModal.classList.add('active');
  }

  async openProfileModal() {
    this.closeAllModals();
    this.rpgModal.classList.add('active');

    try {
      const res = await fetch(`${API_BASE}/user/profile`, { credentials: 'include' });
      const data = await res.json();

      document.getElementById('rpg-char-title').textContent = data.rpg.title;
      document.getElementById('rpg-level-val').textContent = data.rpg.level;
      document.getElementById('rpg-power-val').textContent = data.rpg.realmPower;
      document.getElementById('rpg-stars-val').textContent = data.stats.totalStars;

      // Language Bars
      const langContainer = document.getElementById('rpg-languages-container');
      langContainer.innerHTML = '';
      data.stats.languageBreakdown.forEach((l) => {
        const row = document.createElement('div');
        row.style.marginBottom = '8px';
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
            <span>${l.language}</span>
            <span>${l.percentage}%</span>
          </div>
          <div style="background:rgba(255,255,255,0.1);height:6px;border-radius:3px;overflow:hidden;">
            <div style="background:${l.color};width:${l.percentage}%;height:100%;"></div>
          </div>
        `;
        langContainer.appendChild(row);
      });

      // Achievements
      const achContainer = document.getElementById('rpg-achievements-container');
      achContainer.innerHTML = '';
      data.achievements.forEach((ach) => {
        const el = document.createElement('div');
        el.className = `achieve-badge ${ach.unlocked ? 'unlocked' : ''}`;
        el.innerHTML = `
          <div class="ach-icon">${ach.icon}</div>
          <div>
            <div style="font-weight:700;font-size:13px;color:${ach.unlocked ? '#d4af37' : '#94a3b8'};">${ach.title}</div>
            <div style="font-size:11px;color:#94a3b8;">${ach.description}</div>
          </div>
        `;
        achContainer.appendChild(el);
      });
    } catch (err) {
      console.error('Failed to load RPG profile:', err);
    }
  }

  async openSettingsModal() {
    this.closeAllModals();
    this.settingsModal.classList.add('active');

    try {
      const res = await fetch(`${API_BASE}/settings`, { credentials: 'include' });
      const s = await res.json();

      document.getElementById('setting-crt').checked = s.graphics.retroFilter;
      document.getElementById('setting-grid').checked = s.graphics.showGrid;
      document.getElementById('setting-minimap').checked = s.graphics.showMinimap;
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  toggleCRT(enabled) {
    const crt = document.getElementById('crt-overlay');
    if (enabled) crt.classList.remove('disabled');
    else crt.classList.add('disabled');
  }

  toggleGrid(enabled) {
    this.game.showGrid = enabled;
  }

  toggleMinimap(enabled) {
    this.game.showMinimap = enabled;
    document.getElementById('minimap-card').style.display = enabled ? 'block' : 'none';
  }

  hasOpenModal() {
    return Array.from(document.querySelectorAll('.modal-backdrop')).some((m) => m.classList.contains('active'));
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('active'));
  }

  logout() {
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).then(() => {
      window.location.reload();
    });
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new GitWorldApp();
});
