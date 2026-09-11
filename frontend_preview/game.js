/**
 * GitWorld 2D Canvas Game Engine
 * Features:
 * - Custom Pixel-Art Spritesheets & SVG models for Player, Gatekeeper, Buildings, and Ground
 * - Smooth Tilemap Rendering with Biome Textures
 * - Player Movement (WASD/Arrows) with Walking Animation & Directional Flipping
 * - Obstacle Collision & Proximity Interactions
 * - Dynamic Particle Effects (Forge Embers & Wizard Tower Sparkles)
 * - Real-time Minimap Radar
 */

class GameEngine {
  constructor(canvasId, minimapId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.minimap = document.getElementById(minimapId);
    this.mCtx = this.minimap.getContext('2d');

    this.world = null;
    this.tileSize = 32;

    // Player state
    this.player = {
      x: 3 * 32,
      y: 12 * 32,
      width: 28,
      height: 32,
      speed: 3.5,
      direction: 'down',
      isMoving: false,
      frame: 0
    };

    // Camera viewport
    this.camera = { x: 0, y: 0, width: 0, height: 0 };

    // Input state
    this.keys = {};
    this.activeInteraction = null;

    // Callbacks
    this.onInteract = null;

    // Settings
    this.showGrid = false;
    this.showMinimap = true;

    // Particle systems (Embers & Magic Sparkles)
    this.particles = [];

    // Preload Custom Sprites & Building Models
    this.loadAssets();

    this.initListeners();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.lastFrameTime = performance.now();
    this.waterAnimTime = 0;
  }

  loadAssets() {
    this.assets = {
      characters: {
        player: this.createAssetImage('assets/characters/player.svg'),
        gatekeeper: this.createAssetImage('assets/characters/gatekeeper.svg')
      },
      buildings: {
        castle_large: this.createAssetImage('assets/buildings/castle_large.svg'),
        hall_large: this.createAssetImage('assets/buildings/castle_large.svg'),
        tower_medium: this.createAssetImage('assets/buildings/tower_medium.svg'),
        forge_medium: this.createAssetImage('assets/buildings/forge_medium.svg'),
        cottage_small: this.createAssetImage('assets/buildings/cottage_small.svg')
      },
      tiles: {
        0: this.createAssetImage('assets/tiles/water.svg'),
        1: this.createAssetImage('assets/tiles/water.svg'),
        2: this.createAssetImage('assets/tiles/grass.svg'),
        3: this.createAssetImage('assets/tiles/dirt.svg'),
        4: this.createAssetImage('assets/tiles/stone.svg'),
        5: this.createAssetImage('assets/tiles/forest.svg'),
        6: this.createAssetImage('assets/tiles/volcano.svg'),
        7: this.createAssetImage('assets/tiles/sand.svg'),
        8: this.createAssetImage('assets/tiles/wall.svg')
      }
    };
  }

  createAssetImage(src) {
    const img = new Image();
    img.src = src;
    img.isLoaded = false;
    img.onload = () => { img.isLoaded = true; };
    img.onerror = () => { console.warn(`Asset failed to load: ${src}`); };
    return img;
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.camera.width = this.canvas.width;
    this.camera.height = this.canvas.height;
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      if (window.app && window.app.is3D) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      this.keys[e.key.toLowerCase()] = true;

      if (e.key.toLowerCase() === 'e' && this.activeInteraction) {
        if (this.onInteract) {
          this.onInteract(this.activeInteraction);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (window.app && window.app.is3D) return;
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  loadWorld(worldModel) {
    this.world = worldModel;
    this.tileSize = worldModel.dimensions.tileSize || 32;

    if (worldModel.spawnPoint) {
      this.player.x = worldModel.spawnPoint.x * this.tileSize;
      this.player.y = worldModel.spawnPoint.y * this.tileSize;
    }

    const mapW = worldModel.dimensions.width;
    const mapH = worldModel.dimensions.height;
    this.minimap.width = 140;
    this.minimap.height = Math.round((140 * mapH) / mapW);

    this.startLoop();
  }

  startLoop() {
    const loop = (time) => {
      const dt = (time - this.lastFrameTime) / 1000;
      this.lastFrameTime = time;
      this.waterAnimTime += dt;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    if (!this.world) return;

    let dx = 0;
    let dy = 0;

    if (this.keys['w'] || this.keys['arrowup']) { dy -= 1; this.player.direction = 'up'; }
    if (this.keys['s'] || this.keys['arrowdown']) { dy += 1; this.player.direction = 'down'; }
    if (this.keys['a'] || this.keys['arrowleft']) { dx -= 1; this.player.direction = 'left'; }
    if (this.keys['d'] || this.keys['arrowright']) { dx += 1; this.player.direction = 'right'; }

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.player.isMoving = dx !== 0 || dy !== 0;

    if (this.player.isMoving) {
      const moveDist = this.player.speed * (this.tileSize / 32) * (dt * 60);

      const targetX = this.player.x + dx * moveDist;
      if (!this.checkCollision(targetX, this.player.y)) {
        this.player.x = targetX;
      }

      const targetY = this.player.y + dy * moveDist;
      if (!this.checkCollision(this.player.x, targetY)) {
        this.player.y = targetY;
      }

      this.player.frame += dt * 8;
    }

    // Camera follow
    this.camera.x = this.player.x + this.player.width / 2 - this.camera.width / 2;
    this.camera.y = this.player.y + this.player.height / 2 - this.camera.height / 2;

    const worldW = this.world.dimensions.width * this.tileSize;
    const worldH = this.world.dimensions.height * this.tileSize;
    this.camera.x = Math.max(0, Math.min(worldW - this.camera.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(worldH - this.camera.height, this.camera.y));

    // Update particles (smoke, embers, magic sparkles)
    this.updateParticles(dt);

    this.checkInteractions();
  }

  updateParticles(dt) {
    // Spawn ambient building particles occasionally
    if (Math.random() < 0.3 && this.world) {
      for (const b of this.world.buildings) {
        const bx = b.x * this.tileSize;
        const by = b.y * this.tileSize;

        if (b.spriteType.includes('forge')) {
          // Volcanic ember from chimney
          this.particles.push({
            x: bx + b.width * this.tileSize - 10 + (Math.random() * 6 - 3),
            y: by + 4,
            vx: (Math.random() - 0.5) * 12,
            vy: -15 - Math.random() * 20,
            color: Math.random() > 0.5 ? '#f97316' : '#facc15',
            size: Math.random() * 2.5 + 1.5,
            life: 1.2,
            maxLife: 1.2
          });
        } else if (b.spriteType.includes('tower')) {
          // Arcane magic sparkle
          this.particles.push({
            x: bx + (b.width * this.tileSize) / 2 + (Math.random() * 24 - 12),
            y: by + 10 + Math.random() * 20,
            vx: (Math.random() - 0.5) * 8,
            vy: -8 - Math.random() * 12,
            color: Math.random() > 0.5 ? '#38bdf8' : '#c084fc',
            size: Math.random() * 2 + 1,
            life: 1.5,
            maxLife: 1.5
          });
        }
      }
    }

    // Advance particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  checkCollision(px, py) {
    if (!this.world || !this.world.terrain.collision) return false;

    const margin = 4;
    const left = Math.floor((px + margin) / this.tileSize);
    const right = Math.floor((px + this.player.width - margin) / this.tileSize);
    const top = Math.floor((py + margin) / this.tileSize);
    const bottom = Math.floor((py + this.player.height - margin) / this.tileSize);

    const collision = this.world.terrain.collision;
    const height = this.world.dimensions.height;
    const width = this.world.dimensions.width;

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        if (ty < 0 || ty >= height || tx < 0 || tx >= width) return true;
        if (collision[ty] && collision[ty][tx] === 1) return true;
      }
    }
    return false;
  }

  checkInteractions() {
    if (window.app && window.app.is3D) return;
    if (!this.world) return;
    const pTileX = (this.player.x + this.player.width / 2) / this.tileSize;
    const pTileY = (this.player.y + this.player.height / 2) / this.tileSize;

    let nearest = null;
    let minDist = 3.5;

    for (const bldg of this.world.buildings) {
      const ix = bldg.interactionPoint ? bldg.interactionPoint.x + 0.5 : bldg.x + bldg.width / 2;
      const iy = bldg.interactionPoint ? bldg.interactionPoint.y + 0.5 : bldg.y + bldg.height;
      const dist = Math.hypot(pTileX - ix, pTileY - iy);

      if (dist < minDist) {
        minDist = dist;
        nearest = {
          type: 'building',
          data: bldg,
          label: `Inspect ${bldg.repository ? bldg.repository.name : bldg.name}`
        };
      }
    }

    if (this.world.gatekeeper && this.world.gatekeeper.position) {
      const gx = this.world.gatekeeper.position.x + 0.5;
      const gy = this.world.gatekeeper.position.y + 0.5;
      const dist = Math.hypot(pTileX - gx, pTileY - gy);

      if (dist < minDist) {
        nearest = {
          type: 'gatekeeper',
          data: this.world.gatekeeper,
          label: `Speak with ${this.world.gatekeeper.name}`
        };
      }
    }

    this.activeInteraction = nearest;
    const promptEl = document.getElementById('interaction-prompt');
    const promptLabel = document.getElementById('interaction-label');

    if (nearest) {
      promptLabel.textContent = nearest.label;
      promptEl.style.display = 'flex';
    } else {
      promptEl.style.display = 'none';
    }
  }

  render() {
    if (!this.world) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // 1. Render Ground Tiles (using custom tile SVGs)
    this.renderGround();

    // 2. Render Gatekeeper NPC (using custom wizard sprite)
    this.renderGatekeeper();

    // 3. Render Buildings (using custom building models)
    this.renderBuildings();

    // 4. Render Particle Effects
    this.renderParticles();

    // 5. Render Player Character (using custom hero sprite)
    this.renderPlayer();

    this.ctx.restore();

    // 6. Minimap
    if (this.showMinimap) {
      this.renderMinimap();
    }
  }

  renderGround() {
    const ground = this.world.terrain.ground;
    const height = this.world.dimensions.height;
    const width = this.world.dimensions.width;

    const startX = Math.max(0, Math.floor(this.camera.x / this.tileSize));
    const endX = Math.min(width, Math.ceil((this.camera.x + this.camera.width) / this.tileSize));
    const startY = Math.max(0, Math.floor(this.camera.y / this.tileSize));
    const endY = Math.min(height, Math.ceil((this.camera.y + this.camera.height) / this.tileSize));

    const TILE_FALLBACKS = {
      0: '#0369a1',
      1: '#0284c7',
      2: '#2d6a4f',
      3: '#78350f',
      4: '#334155',
      5: '#14532d',
      6: '#1c1917',
      7: '#ca8a04',
      8: '#1e293b'
    };

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tileId = ground[y][x];
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        const tileImg = this.assets.tiles[tileId];

        if (tileImg && tileImg.isLoaded) {
          this.ctx.drawImage(tileImg, px, py, this.tileSize, this.tileSize);
        } else {
          this.ctx.fillStyle = TILE_FALLBACKS[tileId] || '#2d6a4f';
          this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
        }

        // Animated ocean ripple on deep water tiles
        if (tileId === 0) {
          const wave = Math.sin(this.waterAnimTime * 2 + x + y) * 2;
          this.ctx.fillStyle = 'rgba(224, 242, 254, 0.4)';
          this.ctx.fillRect(px + 6, py + 12 + wave, this.tileSize - 12, 2);
        }

        if (this.showGrid) {
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(px, py, this.tileSize, this.tileSize);
        }
      }
    }
  }

  renderGatekeeper() {
    if (!this.world.gatekeeper || !this.world.gatekeeper.position) return;
    const gk = this.world.gatekeeper;
    const gx = gk.position.x * this.tileSize;
    const gy = gk.position.y * this.tileSize;

    this.ctx.save();

    // Magical blue aura pulse
    const glow = Math.sin(this.waterAnimTime * 3) * 0.2 + 0.6;
    this.ctx.fillStyle = `rgba(56, 189, 248, ${glow * 0.35})`;
    this.ctx.beginPath();
    this.ctx.arc(gx + this.tileSize / 2, gy + this.tileSize / 2, 24, 0, Math.PI * 2);
    this.ctx.fill();

    const gkImg = this.assets.characters.gatekeeper;
    if (gkImg && gkImg.isLoaded) {
      this.ctx.drawImage(gkImg, gx, gy - 4, 32, 36);
    } else {
      // Fallback
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.beginPath();
      this.ctx.arc(gx + this.tileSize / 2, gy + 10, 8, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Name tag
    this.ctx.font = 'bold 10px Cinzel, serif';
    this.ctx.fillStyle = '#d4af37';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Grimwald', gx + this.tileSize / 2, gy - 8);

    this.ctx.restore();
  }

  renderBuildings() {
    for (const bldg of this.world.buildings) {
      const bx = bldg.x * this.tileSize;
      const by = bldg.y * this.tileSize;
      const bw = bldg.width * this.tileSize;
      const bh = bldg.height * this.tileSize;

      this.ctx.save();

      // Shadow beneath building
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.ctx.fillRect(bx + 4, by + bh - 6, bw - 8, 10);

      // Render building model
      const bldgImg = this.assets.buildings[bldg.spriteType] || this.assets.buildings.castle_large;

      if (bldgImg && bldgImg.isLoaded) {
        const imageAspect = bldgImg.naturalWidth / bldgImg.naturalHeight;
        const boxAspect = bw / bh;
        let drawWidth = bw;
        let drawHeight = bh;

        if (imageAspect > boxAspect) {
          drawHeight = bw / imageAspect;
        } else {
          drawWidth = bh * imageAspect;
        }

        const drawX = bx + (bw - drawWidth) / 2;
        const drawY = by + bh - drawHeight;
        this.ctx.drawImage(bldgImg, drawX, drawY, drawWidth, drawHeight);

        // Add a crisp foundation line to visually seat each house on its tile.
        this.ctx.fillStyle = bldg.spriteType.includes('forge') ? '#0c0a09' : '#451a03';
        this.ctx.fillRect(bx + 4, by + bh - 4, bw - 8, 4);

        if (bldg.spriteType.includes('cottage')) {
          // Small front posts and a door step add depth where the sprite is scaled down.
          this.ctx.fillStyle = '#451a03';
          this.ctx.fillRect(bx + bw * 0.2, by + bh - 18, 3, 18);
          this.ctx.fillRect(bx + bw * 0.43, by + bh - 18, 3, 18);
          this.ctx.fillStyle = '#78350f';
          this.ctx.fillRect(bx + bw * 0.15, by + bh - 3, bw * 0.34, 3);
        }
      } else {
        // Fallback
        this.ctx.fillStyle = bldg.spriteType.includes('forge') ? '#292524' : '#475569';
        this.ctx.fillRect(bx, by + 10, bw, bh - 10);
      }

      // Interaction marker
      if (bldg.interactionPoint) {
        const ix = bldg.interactionPoint.x * this.tileSize;
        const iy = bldg.interactionPoint.y * this.tileSize;
        this.ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(ix + 6, iy + 6, this.tileSize - 12, this.tileSize - 12);
      }

      // Title & Star Tag
      const repo = bldg.repository;
      const title = repo ? repo.name : bldg.name;
      const stars = repo ? repo.stars : 0;

      this.ctx.font = 'bold 11px Inter, sans-serif';
      this.ctx.textAlign = 'center';

      const textWidth = this.ctx.measureText(title).width;
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      this.ctx.fillRect(bx + bw / 2 - textWidth / 2 - 12, by - 20, textWidth + 24, 18);
      this.ctx.strokeStyle = repo?.languageColor || '#d4af37';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(bx + bw / 2 - textWidth / 2 - 12, by - 20, textWidth + 24, 18);

      this.ctx.fillStyle = '#f8fafc';
      this.ctx.fillText(title, bx + bw / 2, by - 7);

      if (stars > 0) {
        this.ctx.font = 'bold 10px Fira Code, monospace';
        this.ctx.fillStyle = '#facc15';
        this.ctx.fillText(`★${stars}`, bx + bw / 2, by - 24);
      }

      this.ctx.restore();
    }
  }

  renderParticles() {
    this.ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  renderPlayer() {
    const px = this.player.x;
    const py = this.player.y;

    this.ctx.save();

    // Walking bobbing effect
    const bob = this.player.isMoving ? Math.sin(this.player.frame) * 2 : 0;

    // Flip horizontally when facing left
    if (this.player.direction === 'left') {
      this.ctx.translate(px + this.player.width / 2, py + this.player.height / 2);
      this.ctx.scale(-1, 1);
      this.ctx.translate(-(px + this.player.width / 2), -(py + this.player.height / 2));
    }

    const playerImg = this.assets.characters.player;

    if (playerImg && playerImg.isLoaded) {
      this.ctx.drawImage(playerImg, px - 2, py - 2 + bob, 32, 34);
    } else {
      // Fallback
      this.ctx.fillStyle = '#3b82f6';
      this.ctx.fillRect(px + 4, py + 8 + bob, 16, 16);
      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.beginPath();
      this.ctx.arc(px + 12, py + 7 + bob, 7, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  renderMinimap() {
    if (!this.world || !this.minimap) return;

    const mw = this.minimap.width;
    const mh = this.minimap.height;
    const mapW = this.world.dimensions.width;
    const mapH = this.world.dimensions.height;

    this.mCtx.clearRect(0, 0, mw, mh);

    this.mCtx.fillStyle = '#0f172a';
    this.mCtx.fillRect(0, 0, mw, mh);

    // Buildings as golden icons
    this.mCtx.fillStyle = '#d4af37';
    for (const b of this.world.buildings) {
      const mx = (b.x / mapW) * mw;
      const my = (b.y / mapH) * mh;
      const bw = Math.max(4, (b.width / mapW) * mw);
      const bh = Math.max(4, (b.height / mapH) * mh);
      this.mCtx.fillRect(mx, my, bw, bh);
    }

    // Gatekeeper
    if (this.world.gatekeeper && this.world.gatekeeper.position) {
      const gx = (this.world.gatekeeper.position.x / mapW) * mw;
      const gy = (this.world.gatekeeper.position.y / mapH) * mh;
      this.mCtx.fillStyle = '#38bdf8';
      this.mCtx.beginPath();
      this.mCtx.arc(gx, gy, 3, 0, Math.PI * 2);
      this.mCtx.fill();
    }

    // Player blinking dot
    const pX = ((this.player.x / this.tileSize) / mapW) * mw;
    const pY = ((this.player.y / this.tileSize) / mapH) * mh;
    this.mCtx.fillStyle = '#22c55e';
    this.mCtx.beginPath();
    this.mCtx.arc(pX, pY, 4, 0, Math.PI * 2);
    this.mCtx.fill();
    this.mCtx.strokeStyle = '#ffffff';
    this.mCtx.lineWidth = 1;
    this.mCtx.stroke();
  }
}
