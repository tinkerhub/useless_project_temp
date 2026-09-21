/**
 * intro.js — Cinematic code-based intro sequence
 * Plays /assets/audio/v.mp3 and animates title and boot sequence.
 */

export class GameIntro {
  constructor(ui, audio) {
    this.ui = ui;
    this.audioManager = audio;
    this.container = null;
    this.audioEl = null;
    this._skipped = false;
  }

  async run() {
    // Create intro DOM
    this._createDom();

    // Load audio element (graceful if missing)
    this.audioEl = new Audio('/assets/audio/v.mp3');
    this.audioEl.preload = 'auto';

    // Wire skip
    const skipBtn = this.container.querySelector('#intro-skip');
    const onSkip = () => this._finish(true);
    skipBtn.addEventListener('click', onSkip);

    const keyHandler = (e) => {
      if ([' ', 'Enter', 'Escape'].includes(e.key)) this._finish(true);
    };
    window.addEventListener('keydown', keyHandler);

    // Play audio and sequence
    const playPromise = this.audioEl.play().catch(() => null);

    // Sequence timings (approximate) — total ~9-11s
    // Scene 1: lines
    await this._showLine('EVERYTHING HAS A LIFE.', 900);
    if (this._skipped) return this._cleanup(keyHandler, onSkip);
    await this._showLine('EVERYTHING HAS A DESTINY.', 900);
    if (this._skipped) return this._cleanup(keyHandler, onSkip);
    await this._showLine('...apparently.', 900, 'quirk');
    if (this._skipped) return this._cleanup(keyHandler, onSkip);

    // Scene 2: system init (booting)
    await this._showBoot();
    if (this._skipped) return this._cleanup(keyHandler, onSkip);

    // Scene 3: scanning empty
    await this._showScanning();
    if (this._skipped) return this._cleanup(keyHandler, onSkip);

    // Scene 4: world assemble
    await this._showWorldAssemble();
    if (this._skipped) return this._cleanup(keyHandler, onSkip);

    // Scene 5: title reveal — synchronize to voice start if possible
    // If audio is playing, wait a moment for voice; otherwise reveal immediately
    await this._revealTitle();
    if (this._skipped) return this._cleanup(keyHandler, onSkip);

    // Hold title for 1.5s, then finish
    await this._delay(1500);
    this._finish(false);
    this._cleanup(keyHandler, onSkip);
  }

  _createDom() {
    // Use existing #app root
    const app = document.getElementById('app');
    const el = document.createElement('div');
    el.id = 'screen-intro';
    el.className = 'screen active';
    el.innerHTML = `
      <div class="intro-stage">
        <div class="intro-content">
          <div id="intro-lines" class="intro-lines"></div>
          <div id="intro-boot" class="intro-boot"></div>
          <canvas id="intro-canvas" width="1280" height="720"></canvas>
          <div id="intro-title" class="intro-title" aria-hidden="true"></div>
        </div>
        <button id="intro-skip" class="intro-skip">SKIP ▸</button>
      </div>
    `;
    // Insert at top so it's visible above other screens
    app.insertBefore(el, app.firstChild);
    this.container = el;
  }

  async _showLine(text, ms = 900, mode = 'normal') {
    const lines = this.container.querySelector('#intro-lines');
    lines.textContent = '';
    const span = document.createElement('div');
    span.className = `intro-line ${mode}`;
    span.textContent = text;
    lines.appendChild(span);
    await this._delay(ms);
  }

  async _showBoot() {
    const boot = this.container.querySelector('#intro-boot');
    boot.innerHTML = `
      <pre class="boot-lines">
OBJECT LIFE AUTHORITY
INITIALIZING...

IDENTITY ........ OK
PASSPORT ........ OK
DESTINY ......... UNKNOWN
DEATH ........... <span class="dram">GUARANTEED</span>
      </pre>
    `;
    await this._delay(1400);
  }

  async _showScanning() {
    const canvas = this.container.querySelector('#intro-canvas');
    const ctx = canvas.getContext('2d');
    // Dark background
    ctx.fillStyle = '#06060a';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Draw scanning frame center
    const fw = 420, fh = 260;
    const cx = canvas.width/2 - fw/2, cy = canvas.height/2 - fh/2;
    ctx.strokeStyle = '#e6e6e6'; ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, fw, fh);

    // Animate scan line
    const total = 1200;
    const start = performance.now();
    await new Promise((resolve) => {
      const step = (t) => {
        const p = Math.min(1, (t - start) / total);
        ctx.fillStyle = 'rgba(200,200,200,0.03)';
        ctx.fillRect(cx, cy, fw, fh);
        // redraw frame
        ctx.clearRect(cx, cy, fw, fh);
        ctx.strokeStyle = '#dcdcdc'; ctx.lineWidth = 2;
        ctx.strokeRect(cx, cy, fw, fh);
        // scan line
        const ly = cy + p * fh;
        const grad = ctx.createLinearGradient(cx, ly-6, cx, ly+6);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx, ly-6, fw, 12);
        if (p < 1 && !this._skipped) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });

    // show system lines
    const lines = this.container.querySelector('#intro-lines');
    lines.innerHTML = '<div class="intro-line small">SEARCHING FOR OBJECT...</div>';
    await this._delay(700);
    lines.innerHTML = '<div class="intro-line small">OBJECT NOT FOUND.</div>';
    await this._delay(700);
    lines.innerHTML = '<div class="intro-line small">PLEASE PROVIDE OBJECT.</div>';
    await this._delay(700);
    // Then simulate detection beep
    lines.innerHTML = '<div class="intro-line small">OBJECT DETECTED.</div>';
    await this._delay(600);
    lines.innerHTML = '<div class="intro-line small">IDENTITY: UNKNOWN</div>';
    await this._delay(500);
    lines.innerHTML = '<div class="intro-line small">PURPOSE: UNKNOWN</div>';
    await this._delay(600);
  }

  async _showWorldAssemble() {
    const canvas = this.container.querySelector('#intro-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Draw stylized nodes
    const nodes = ['AIRPORT','STREET','SHOP','TEA SHOP','HOME','UNKNOWN'];
    const cx = canvas.width/2, cy = canvas.height/2;
    ctx.fillStyle = '#0b0b0f'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.font = '18px JetBrains Mono, monospace'; ctx.fillStyle = '#ccc'; ctx.textAlign='center';
    for (let i=0;i<nodes.length;i++){
      const x = cx - 220 + i*88;
      const y = cy;
      ctx.beginPath(); ctx.fillStyle = '#2f2f34'; ctx.fillRect(x-56,y-28,112,56);
      ctx.fillStyle = '#f2f2f2'; ctx.fillText(nodes[i], x, y+6);
      await this._delay(180);
    }
    await this._delay(400);
  }

  async _revealTitle() {
    const titleEl = this.container.querySelector('#intro-title');
    // Malayalam main title
    const mal = 'എന്നെ കൊല്ലാണ്ട് ഇരിക്കാൻ പറ്റോ?';
    const eng = 'ENNE KOLLAND IRIKKAN PATTO?';
    const tag = 'SHOW US ANY OBJECT. WE\'LL GIVE IT A LIFE.';

    titleEl.innerHTML = `
      <div class="title-ml" id="title-ml"></div>
      <div class="title-en" id="title-en"></div>
      <div class="title-tag">${tag}</div>
    `;

    const mlEl = titleEl.querySelector('#title-ml');
    const enEl = titleEl.querySelector('#title-en');

    // Type-in Malayalam one glyph at a time (simple reveal)
    for (let i=0;i<mal.length;i++){
      if (this._skipped) return;
      mlEl.textContent = mal.slice(0,i+1);
      await this._delay(60);
    }
    // small glitch/settle
    mlEl.classList.add('glitch');
    await this._delay(220);
    mlEl.classList.remove('glitch');

    // English appears
    enEl.textContent = eng;
    enEl.classList.add('subtle');
  }

  _delay(ms){ return new Promise(r=>setTimeout(r,ms)); }

  _finish(skipped){
    this._skipped = true;
    // stop audio
    if (this.audioEl) try{ this.audioEl.pause(); this.audioEl.currentTime=0; }catch{};
    // remove intro DOM
    const el = document.getElementById('screen-intro');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  _cleanup(keyHandler, onSkip){
    window.removeEventListener('keydown', keyHandler);
    // ensure skip listener removed
    const skipBtn = this.container?.querySelector('#intro-skip');
    if (skipBtn) skipBtn.removeEventListener('click', onSkip);
  }
}
