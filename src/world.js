/**
 * world.js — Simple top-down world with WASD movement and trigger zones.
 * Designed for a small hackathon vertical slice.
 */

export class World {
  constructor(ui, gameState, audio) {
    this.ui = ui;
    this.gameState = gameState;
    this.audio = audio;
    this.canvas = document.getElementById('world-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.player = { x: 320, y: 240, size: 16, speed: 120 };
    this.keys = {};
    this.lastTime = 0;
    this.running = false;

    // Define shop trigger rectangle
    this.shopRect = { x: 420, y: 180, w: 80, h: 80 };
    this.onEnterShop = null; // callback

    this._bindKeys();
  }

  _bindKeys() {
    window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
  }

  start(onEnterShop) {
    this.onEnterShop = onEnterShop;
    this.running = true;
    this.lastTime = performance.now();
    this._loop(this.lastTime);
    // show world screen
    this.ui.showScreen('world');
    this._updateHUD();
  }

  stop() {
    this.running = false;
  }

  _loop(now) {
    if (!this.running) return;
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this._update(dt);
    this._render();
    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx*dx + dy*dy);
      dx /= len; dy /= len;
      this.player.x += dx * this.player.speed * dt;
      this.player.y += dy * this.player.speed * dt;
      // clamp to canvas
      this.player.x = Math.max(8, Math.min(this.canvas.width - 8, this.player.x));
      this.player.y = Math.max(8, Math.min(this.canvas.height - 8, this.player.y));
    }

    // detect shop collision
    if (this._rectContainsPoint(this.shopRect, this.player.x, this.player.y)) {
      if (typeof this.onEnterShop === 'function') {
        // call and nullify to avoid repeated triggers until re-entered
        const cb = this.onEnterShop;
        this.onEnterShop = null;
        cb();
      }
    }
  }

  _rectContainsPoint(r, x, y) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    // background
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

    // street / ground
    ctx.fillStyle = '#131322';
    ctx.fillRect(50,50,this.canvas.width-100,this.canvas.height-100);

    // shop
    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(this.shopRect.x, this.shopRect.y, this.shopRect.w, this.shopRect.h);
    ctx.fillStyle = '#ffd700';
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillText('SHOP', this.shopRect.x + 18, this.shopRect.y + 45);

    // player
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI*2);
    ctx.fill();

    // player name
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px JetBrains Mono, monospace';
    const name = (this.gameState.objectDNA && this.gameState.objectDNA.name) || 'You';
    ctx.fillText(name, this.player.x - 20, this.player.y - 20);
  }

  _updateHUD() {
    const moneyEl = document.getElementById('hud-money');
    const condEl = document.getElementById('hud-condition');
    const locEl = document.getElementById('hud-location');
    if (moneyEl) moneyEl.textContent = String(this.gameState.currentState.money || 0);
    if (condEl) condEl.textContent = String(this.gameState.currentState.condition || 'Okay');
    if (locEl) locEl.textContent = String(this.gameState.currentState.location || 'Street');
  }
}
