/**
 * Useless 3.0 - Main Application Controller
 */
import { CameraManager } from './vision/camera-manager.js';
import { FaceDetector } from './vision/face-detector.js';
import { MouthAnalyzer } from './vision/mouth-analyzer.js';
import { StateClassifier } from './vision/state-classifier.js';
import { AudioManager } from './audio/audio-manager.js';
import { HudScanner } from './ui/hud-scanner.js';
import { MetricsAnimator } from './ui/metrics-animator.js';
import { initFaqAccordion } from './ui/faq-accordion.js';

class AppController {
  constructor() {
    // DOM Elements
    this.videoEl = document.getElementById('camera-video');
    this.canvasEl = document.getElementById('camera-canvas');
    this.placeholderEl = document.getElementById('camera-placeholder');
    this.hudCanvasEl = document.getElementById('hero-hud-canvas');

    this.startCamBtnMain = document.getElementById('btn-start-camera-main');
    this.startCamBtn = document.getElementById('btn-start-camera');
    this.stopCamBtn = document.getElementById('btn-stop-camera');
    this.audioToggleBtn = document.getElementById('btn-audio-toggle');
    this.audioIcon = document.getElementById('audio-icon');

    this.stateBadgeEl = document.getElementById('current-state-badge');
    this.stateStatusDot = document.getElementById('state-status-dot');
    this.stateQuoteEl = document.getElementById('current-state-quote');
    this.stateMetaNotice = document.getElementById('state-meta-notice');

    this.metricConfEl = document.getElementById('metric-confidence');
    this.metricActEl = document.getElementById('metric-activity');
    this.metricFpsEl = document.getElementById('metric-fps');

    this.simTalkBtn = document.getElementById('btn-sim-talk');
    this.simSilentBtn = document.getElementById('btn-sim-silent');
    this.simNoFaceBtn = document.getElementById('btn-sim-noface');

    // Modules
    this.audioMgr = new AudioManager();
    this.cameraMgr = new CameraManager(this.videoEl);
    this.detector = new FaceDetector(this.canvasEl);
    this.mouthAnalyzer = new MouthAnalyzer(15);
    this.hudScanner = new HudScanner(this.hudCanvasEl);
    this.metricsAnimator = new MetricsAnimator('#scores');

    // State Classifier FSM with hysteresis
    this.classifier = new StateClassifier({
      enterTalkingDelay: 350,
      exitTalkingDelay: 600,
      noFaceDelay: 500,
      onStateChange: (newState, oldState) => this.onStateChanged(newState, oldState)
    });

    this.isCameraRunning = false;
    this.isSimulating = false;
    this.lastFrameTime = performance.now();
    this.fpsCounter = 0;
    this.fpsTimer = performance.now();
  }

  async init() {
    // 1. Start Hero HUD Scanner centerpiece
    this.hudScanner.start();

    // 2. Initialize FAQ & Metrics
    initFaqAccordion();
    this.metricsAnimator.init();

    // 3. Attach Event Listeners
    this.bindEvents();

    // 4. Preload detector
    this.detector.init().catch(e => console.warn(e));

    console.log("Useless 3.0 successfully initialized.");
  }

  bindEvents() {
    // Start Camera
    this.startCamBtnMain?.addEventListener('click', () => this.startExperience());
    this.startCamBtn?.addEventListener('click', () => this.startExperience());
    document.querySelectorAll('.btn-launch-exp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const demoSection = document.getElementById('experience');
        if (demoSection) {
          demoSection.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => this.startExperience(), 400);
        }
      });
    });

    // Stop Camera
    this.stopCamBtn?.addEventListener('click', () => this.stopExperience());

    // Audio Mute Toggle
    this.audioToggleBtn?.addEventListener('click', () => {
      this.audioMgr.init();
      const isMuted = this.audioMgr.toggleMute();
      if (this.audioIcon) {
        this.audioIcon.textContent = isMuted ? '🔇' : '🔊';
      }
    });

    // Interactive Simulation Mode (Judges fallback)
    this.simTalkBtn?.addEventListener('click', () => this.simulateState('TALKING'));
    this.simSilentBtn?.addEventListener('click', () => this.simulateState('SILENT'));
    this.simNoFaceBtn?.addEventListener('click', () => this.simulateState('NO_FACE'));

    // Resize canvas on resize
    window.addEventListener('resize', () => this.syncCanvasSize());
  }

  syncCanvasSize() {
    if (this.canvasEl && this.canvasEl.parentElement) {
      const rect = this.canvasEl.parentElement.getBoundingClientRect();
      this.canvasEl.width = rect.width;
      this.canvasEl.height = rect.height;
    }
  }

  async startExperience() {
    this.audioMgr.init();

    try {
      this.syncCanvasSize();
      if (this.placeholderEl) this.placeholderEl.style.display = 'none';
      if (this.videoEl) this.videoEl.style.display = 'block';
      if (this.canvasEl) this.canvasEl.style.display = 'block';

      this.updateStateUI('INITIALIZING');
      await this.cameraMgr.start();
      this.isCameraRunning = true;

      if (this.startCamBtnMain) this.startCamBtnMain.style.display = 'none';
      if (this.startCamBtn) this.startCamBtn.style.display = 'none';
      if (this.stopCamBtn) this.stopCamBtn.style.display = 'inline-flex';

      // Start Vision Processing Loop
      this.processVisionLoop();
    } catch (err) {
      console.error("Camera start failed:", err);
      this.handleCameraError(err.message);
    }
  }

  stopExperience() {
    this.isCameraRunning = false;
    this.cameraMgr.stop();
    this.mouthAnalyzer.reset();
    this.classifier.setState('IDLE');

    if (this.placeholderEl) this.placeholderEl.style.display = 'flex';
    if (this.videoEl) this.videoEl.style.display = 'none';
    if (this.canvasEl) this.canvasEl.style.display = 'none';
    if (this.startCamBtnMain) this.startCamBtnMain.style.display = 'inline-flex';
    if (this.startCamBtn) this.startCamBtn.style.display = 'inline-flex';
    if (this.stopCamBtn) this.stopCamBtn.style.display = 'none';

    // Clear canvas
    const ctx = this.canvasEl.getContext('2d');
    ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

    this.updateStateUI('IDLE');
  }

  handleCameraError(reason) {
    if (this.placeholderEl) {
      this.placeholderEl.style.display = 'flex';
      const icon = this.placeholderEl.querySelector('.placeholder-icon');
      const title = this.placeholderEl.querySelector('.placeholder-title');
      const text = this.placeholderEl.querySelector('.placeholder-text');

      if (reason === 'PERMISSION_DENIED') {
        if (icon) icon.textContent = '🔒';
        if (title) title.textContent = 'Camera Access Denied';
        if (text) text.textContent = 'Your webcam has chosen privacy. You can still test all reactions with the interactive simulator below.';
      } else {
        if (icon) icon.textContent = '📷';
        if (title) title.textContent = 'Camera Unavailable';
        if (text) text.textContent = 'No webcam was detected or browser blocked access. Use the interactive simulator below.';
      }
    }
    if (this.startCamBtnMain) this.startCamBtnMain.style.display = 'inline-flex';
    if (this.startCamBtn) this.startCamBtn.style.display = 'inline-flex';
    if (this.stopCamBtn) this.stopCamBtn.style.display = 'none';
  }

  async processVisionLoop() {
    if (!this.isCameraRunning) return;

    const now = performance.now();
    this.fpsCounter++;
    if (now - this.fpsTimer >= 1000) {
      if (this.metricFpsEl) {
        this.metricFpsEl.textContent = `${this.fpsCounter} FPS`;
      }
      this.fpsCounter = 0;
      this.fpsTimer = now;
    }

    // Process face detection
    await this.detector.send(this.videoEl);
    const landmarks = this.detector.getLandmarks();
    const hasFace = landmarks !== null && landmarks.length > 0;

    let mar = 0;
    let mouthData = { isMoving: false, activity: 0 };

    if (hasFace) {
      mar = this.mouthAnalyzer.calculateMAR(landmarks);
      mouthData = this.mouthAnalyzer.processFrame(mar);
    } else {
      this.mouthAnalyzer.reset();
    }

    // Update FSM classifier
    const currentState = this.classifier.update({
      hasFace,
      isMouthMoving: mouthData.isMoving,
      now
    });

    // Update HUD metrics
    if (this.metricConfEl) {
      this.metricConfEl.textContent = hasFace ? '98%' : '0%';
    }
    if (this.metricActEl) {
      this.metricActEl.textContent = hasFace ? `${mouthData.activity}%` : '0%';
    }

    // Draw landmark mesh and mouth box on overlay canvas
    this.detector.drawOverlay(currentState, mouthData.activity);

    // Continue loop
    requestAnimationFrame(() => this.processVisionLoop());
  }

  /**
   * Called strictly on state transitions
   */
  onStateChanged(newState, oldState) {
    console.log(`[STATE TRANSITION] ${oldState} -> ${newState}`);
    this.updateStateUI(newState);
    this.hudScanner.setState(newState);
    this.audioMgr.playForState(newState, oldState);
  }

  updateStateUI(state) {
    if (!this.stateBadgeEl) return;

    if (state === 'TALKING') {
      this.stateBadgeEl.innerHTML = `🗣️ <span>TALKING</span>`;
      this.stateBadgeEl.style.color = 'var(--accent-rose)';
      if (this.stateStatusDot) this.stateStatusDot.className = 'status-dot talking';
      if (this.stateQuoteEl) this.stateQuoteEl.textContent = `“Apparently, you had something to say.”`;
      if (this.stateMetaNotice) this.stateMetaNotice.textContent = 'Sustained mouth movement detected';
    } else if (state === 'SILENT') {
      this.stateBadgeEl.innerHTML = `🤫 <span>SILENT</span>`;
      this.stateBadgeEl.style.color = 'var(--accent-cyan)';
      if (this.stateStatusDot) this.stateStatusDot.className = 'status-dot silent';
      if (this.stateQuoteEl) this.stateQuoteEl.textContent = `“Finally. Some peace.”`;
      if (this.stateMetaNotice) this.stateMetaNotice.textContent = 'Face detected · Zero speech activity';
    } else if (state === 'NO_FACE') {
      this.stateBadgeEl.innerHTML = `👻 <span>NO FACE</span>`;
      this.stateBadgeEl.style.color = 'var(--accent-yellow)';
      if (this.stateStatusDot) this.stateStatusDot.className = 'status-dot noface';
      if (this.stateQuoteEl) this.stateQuoteEl.textContent = `“You can't escape the camera.”`;
      if (this.stateMetaNotice) this.stateMetaNotice.textContent = 'Subject has left the frame';
    } else if (state === 'INITIALIZING') {
      this.stateBadgeEl.innerHTML = `⚡ <span>CALIBRATING</span>`;
      this.stateBadgeEl.style.color = 'var(--text-secondary)';
      if (this.stateStatusDot) this.stateStatusDot.className = 'status-dot active';
      if (this.stateQuoteEl) this.stateQuoteEl.textContent = `Aligning facial landmarks...`;
      if (this.stateMetaNotice) this.stateMetaNotice.textContent = 'Activating computer-vision pipeline';
    } else {
      this.stateBadgeEl.innerHTML = `⏸️ <span>IDLE</span>`;
      this.stateBadgeEl.style.color = 'var(--text-muted)';
      if (this.stateStatusDot) this.stateStatusDot.className = 'status-dot';
      if (this.stateQuoteEl) this.stateQuoteEl.textContent = `Press "Launch Experience" or use the Simulator below.`;
      if (this.stateMetaNotice) this.stateMetaNotice.textContent = 'Camera offline · Ready for input';
    }

    // Highlight corresponding personality card on page
    document.querySelectorAll('.state-card').forEach(card => {
      if (card.getAttribute('data-personality') === state) {
        card.classList.add('highlight');
      } else {
        card.classList.remove('highlight');
      }
    });
  }

  /**
   * Fallback simulator for users without a camera
   */
  simulateState(targetState) {
    this.audioMgr.init();
    this.isSimulating = true;
    const oldState = this.classifier.state;
    this.classifier.setState(targetState);

    // Mock metrics
    if (this.metricConfEl) this.metricConfEl.textContent = targetState === 'NO_FACE' ? '0%' : '96%';
    if (this.metricActEl) this.metricActEl.textContent = targetState === 'TALKING' ? '74%' : '0%';
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
  window.__USELESS_APP__ = app;
});
