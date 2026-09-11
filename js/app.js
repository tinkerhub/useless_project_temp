/**
 * TALK.EXE — Main Application Controller
 * Orchestrates camera, detection pipeline, UI, and all button hooks.
 */
import { CameraManager }    from './vision/camera-manager.js';
import { FaceDetector }     from './vision/face-detector.js';
import { MouthAnalyzer }    from './vision/mouth-analyzer.js';
import { StateClassifier }  from './vision/state-classifier.js';
import { AudioManager }     from './audio/audio-manager.js';

class AppController {
  constructor() {
    // ── DOM ──────────────────────────────────────────
    this.videoEl    = document.getElementById('camera-video');
    this.canvasEl   = document.getElementById('camera-canvas');
    this.placeholderEl = document.getElementById('cam-placeholder');

    // Start buttons (all trigger same action)
    this.startBtns = [
      document.getElementById('btn-start-cam'),
      document.getElementById('btn-start-main'),
      document.getElementById('btn-start-nav'),
      document.getElementById('btn-start-cta'),
    ].filter(Boolean);

    // State UI
    this.hudStateLabel   = document.getElementById('hud-state-label');
    this.heroStateText   = document.getElementById('hero-state-text');
    this.heroStateDot    = document.getElementById('hero-state-dot');
    this.heroFpsText     = document.getElementById('hero-fps-text');
    this.heroConfText    = document.getElementById('hero-conf-text');
    this.heroActivityPct = document.getElementById('hero-activity-pct');
    this.heroActivityBar = document.getElementById('hero-activity-bar');

    // Demo section UI (mirrors hero state)
    this.demoDot          = document.getElementById('demo-dot');
    this.demoStateDisplay = document.getElementById('demo-state-display');
    this.demoFpsLabel     = document.getElementById('demo-fps-label');
    this.demoActivityPct  = document.getElementById('demo-activity-pct');
    this.demoActivityBar  = document.getElementById('demo-activity-bar');
    this.demoConfPct      = document.getElementById('demo-conf-pct');
    this.demoConfBar      = document.getElementById('demo-conf-bar');
    this.demoLandmarks    = document.getElementById('demo-landmarks');
    this.demoLatency      = document.getElementById('demo-latency');
    this.demoPlaceholder  = document.getElementById('demo-placeholder');
    this.demoDot2         = document.getElementById('demo-system-dot');

    // State cards (demo section)
    this.stateCards = {
      TALKING:  document.getElementById('state-card-talking'),
      SILENT:   document.getElementById('state-card-silent'),
      NO_FACE:  document.getElementById('state-card-noface'),
    };

    // Feature cards (hero strip)
    this.featureCards = document.querySelectorAll('.feature-card');

    // ── Modules ──────────────────────────────────────
    this.audioMgr     = new AudioManager();
    this.cameraMgr    = new CameraManager(this.videoEl);
    this.detector     = new FaceDetector(this.canvasEl);
    this.mouthAnalyzer = new MouthAnalyzer(15);
    this.classifier   = new StateClassifier({
      enterTalkingDelay: 350,
      exitTalkingDelay:  600,
      noFaceDelay:       500,
      onStateChange: (n, o) => this.onStateChanged(n, o),
    });

    this.audioMgr = new AudioManager();

    // ── Internal ─────────────────────────────────────
    this.isRunning  = false;
    this.fpsCount   = 0;
    this.fpsTimer   = performance.now();
    this.latencyStart = 0;
  }

  // ────────────────────────────────────────────────────
  async init() {
    this._setupScrollProgress();
    this._setupRevealObserver();
    this._setupConnectorObserver();
    this._bindButtons();
    this.detector.init().catch(e => console.warn('Detector preload:', e));
    console.log('%cTALK.EXE — initialized.', 'color:#e8967a;font-weight:bold;');
  }

  // ────────────────────────────────────────────────────
  _bindButtons() {
    this.startBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.audioMgr.init();
        // If clicked from CTA/nav, smoothly scroll to live-demo first
        const isHeroBtn = ['btn-start-cam','btn-start-main'].includes(btn.id);
        if (!isHeroBtn) {
          document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' });
        }
        if (!this.isRunning) this.startExperience();
      });
    });
  }

  // ────────────────────────────────────────────────────
  async startExperience() {
    try {
      this._syncCanvasSize();
      this._hidePlaceholder();
      this._setUIState('INITIALIZING');

      await this.cameraMgr.start();
      this.isRunning = true;

      this.videoEl.style.display   = 'block';
      this.canvasEl.style.display  = 'block';
      if (this.demoPlaceholder) this.demoPlaceholder.style.display = 'none';

      this._visionLoop();
    } catch (err) {
      console.error('Camera start failed:', err);
      this._handleError(err.message);
    }
  }

  stopExperience() {
    this.isRunning = false;
    this.cameraMgr.stop();
    this.mouthAnalyzer.reset();
    this.classifier.setState('IDLE');
    this._showPlaceholder();
    this.videoEl.style.display  = 'none';
    this.canvasEl.style.display = 'none';
    const ctx = this.canvasEl.getContext('2d');
    ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    this._setUIState('IDLE');
  }

  // ────────────────────────────────────────────────────
  async _visionLoop() {
    if (!this.isRunning) return;

    const now = performance.now();
    this.fpsCount++;
    if (now - this.fpsTimer >= 1000) {
      const fps = this.fpsCount;
      if (this.heroFpsText) this.heroFpsText.textContent = `${fps} FPS`;
      if (this.demoFpsLabel) this.demoFpsLabel.textContent = `${fps} FPS`;
      this.fpsCount = 0;
      this.fpsTimer = now;
    }

    const t0 = performance.now();
    await this.detector.send(this.videoEl);
    const latency = Math.round(performance.now() - t0);
    if (this.demoLatency) this.demoLatency.textContent = `${latency}ms`;

    const landmarks = this.detector.getLandmarks();
    const hasFace   = landmarks !== null && landmarks.length > 0;

    let mar = 0, mouthData = { isMoving: false, activity: 0 };
    if (hasFace) {
      mar = this.mouthAnalyzer.calculateMAR(landmarks);
      mouthData = this.mouthAnalyzer.processFrame(mar);
    } else {
      this.mouthAnalyzer.reset();
    }

    this.classifier.update({ hasFace, isMouthMoving: mouthData.isMoving, now });

    // Metrics
    const conf     = hasFace ? 98 : 0;
    const activity = mouthData.activity || 0;
    const lmCount  = hasFace ? '468' : '0';

    if (this.heroConfText)    this.heroConfText.textContent = hasFace ? '98%' : '—';
    if (this.heroActivityPct) this.heroActivityPct.textContent = `${activity}%`;
    if (this.heroActivityBar) this.heroActivityBar.style.width = `${activity}%`;

    if (this.demoConfPct) this.demoConfPct.textContent = `${conf}%`;
    if (this.demoConfBar) this.demoConfBar.style.width = `${conf}%`;
    if (this.demoActivityPct) this.demoActivityPct.textContent = `${activity}%`;
    if (this.demoActivityBar) this.demoActivityBar.style.width = `${activity}%`;
    if (this.demoLandmarks) this.demoLandmarks.textContent = lmCount;

    // Draw overlay
    this.detector.drawOverlay(this.classifier.state, activity);

    requestAnimationFrame(() => this._visionLoop());
  }

  // ────────────────────────────────────────────────────
  onStateChanged(newState, oldState) {
    console.log(`[STATE] ${oldState} → ${newState}`);
    this._setUIState(newState);
    this.audioMgr.playForState(newState, oldState);
  }

  _setUIState(state) {
    // Feature card highlights
    this.featureCards.forEach(card => {
      const match = card.dataset.state === state;
      card.style.borderColor = match ? 'var(--border-accent)' : '';
      card.style.boxShadow   = match ? 'var(--shadow-accent)' : '';
    });

    // State cards in demo section
    Object.entries(this.stateCards).forEach(([s, el]) => {
      if (!el) return;
      el.classList.toggle('active', s === state);
    });

    // Dot class and text
    const dotClassMap = {
      TALKING: 'talking', SILENT: 'silent', NO_FACE: 'noface',
      INITIALIZING: 'online', ERROR: 'error',
    };
    const dotCls = dotClassMap[state] || '';

    [this.heroStateDot, this.demoDot, this.demoDot2].forEach(dot => {
      if (!dot) return;
      dot.className = `status-dot ${dotCls}`;
    });

    // Text labels
    const labelMap = {
      TALKING:      'TALKING',
      SILENT:       'SILENT',
      NO_FACE:      'NO FACE',
      INITIALIZING: 'CALIBRATING',
      ERROR:        'BLOCKED',
      IDLE:         'STANDBY',
    };
    const label = labelMap[state] || 'STANDBY';
    if (this.heroStateText)   this.heroStateText.textContent   = label;
    if (this.hudStateLabel)   this.hudStateLabel.textContent   = `STATE: ${label}`;
    if (this.demoStateDisplay) this.demoStateDisplay.textContent = label;
  }

  // ────────────────────────────────────────────────────
  _handleError(reason) {
    this._showPlaceholder();
    const iconEl  = this.placeholderEl?.querySelector('.cam-placeholder-icon');
    const title   = this.placeholderEl?.querySelector('h3');
    const desc    = this.placeholderEl?.querySelector('p');
    const btn     = this.placeholderEl?.querySelector('button');

    if (reason === 'PERMISSION_DENIED') {
      if (iconEl) iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
      if (title) title.textContent = 'Camera Access Denied';
      if (desc)  desc.innerHTML    = 'Your browser blocked camera access.<br><span style="font-size:0.72rem;opacity:0.6;">To fix: click the 🔒 icon in your browser address bar and allow camera access, then click Try Again.</span>';
      if (btn)  { btn.textContent = 'TRY AGAIN'; btn.style.display = 'inline-flex'; }
    } else if (reason === 'NO_CAMERA_FOUND') {
      if (title) title.textContent = 'No Camera Found';
      if (desc)  desc.textContent  = 'The useless machine requires a camera. Connect one and try again.';
      if (btn)  { btn.textContent = 'TRY AGAIN'; btn.style.display = 'inline-flex'; }
    } else if (reason === 'UNSUPPORTED_BROWSER') {
      if (title) title.textContent = 'Browser Not Supported';
      if (desc)  desc.textContent  = 'This browser isn\'t ready for this level of uselessness. Try Chrome or Firefox.';
      if (btn)  btn.style.display = 'none';
    } else {
      if (title) title.textContent = 'Camera Unavailable';
      if (desc)  desc.textContent  = 'Something went wrong. Check browser permissions and try again.';
      if (btn)  { btn.textContent = 'TRY AGAIN'; btn.style.display = 'inline-flex'; }
    }
    this._setUIState('ERROR');
  }

  _hidePlaceholder() {
    if (this.placeholderEl) this.placeholderEl.style.display = 'none';
  }
  _showPlaceholder() {
    if (this.placeholderEl) this.placeholderEl.style.display = 'flex';
  }

  _syncCanvasSize() {
    if (this.canvasEl && this.canvasEl.parentElement) {
      const r = this.canvasEl.parentElement.getBoundingClientRect();
      this.canvasEl.width  = r.width;
      this.canvasEl.height = r.height;
    }
  }

  // ────────────────────────────────────────────────────
  _setupScrollProgress() {
    const bar = document.getElementById('scroll-prog');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      bar.style.width = `${Math.min(pct, 100)}%`;
    }, { passive: true });
  }

  _setupRevealObserver() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  _setupConnectorObserver() {
    const connectors = document.querySelectorAll('.step-connector');
    if (!connectors.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 250);
        }
      });
    }, { threshold: 0.5 });
    connectors.forEach(c => obs.observe(c));
  }
}

// ── Bootstrap ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
  window.__TALKEXE__ = app;
});
