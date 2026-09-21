/**
 * video-manager.js — lightweight video job manager + player
 *
 * Usage:
 *   const vm = new VideoManager(aiService, ui);
 *   vm.generateAndPlay(sceneText, { dna, result });
 */

export class VideoManager {
  constructor(aiService, ui) {
    this.ai = aiService;
    this.ui = ui;
    this.overlay = null;
  }

  async generateAndPlay(scene, metadata = {}) {
    try {
      const jobId = await this.ai.generateVideo({ scene, metadata });
      // Poll status
      const status = await this._pollJob(jobId, 1000, 15000);
      if (status && status.status === 'ready' && status.url) {
        await this._playVideo(status.url);
      }
    } catch (err) {
      console.warn('[VideoManager] generate/play failed', err);
    }
  }

  async _pollJob(jobId, interval = 1000, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const res = await this.ai.videoStatus(jobId);
        if (res && res.status === 'ready') return res;
      } catch (e) { /* ignore transient */ }
      await new Promise(r => setTimeout(r, interval));
    }
    return null;
  }

  async _playVideo(url) {
    // Create overlay
    this._createOverlay();
    return new Promise((resolve) => {
      const vid = document.createElement('video');
      vid.src = url;
      vid.autoplay = true;
      vid.controls = false;
      vid.style.maxWidth = '80%';
      vid.style.maxHeight = '80%';
      vid.style.borderRadius = '8px';
      vid.addEventListener('ended', () => {
        this._destroyOverlay();
        resolve();
      });
      vid.addEventListener('error', () => {
        this._destroyOverlay();
        resolve();
      });
      this.overlay.appendChild(vid);
    });
  }

  _createOverlay() {
    this._destroyOverlay();
    const o = document.createElement('div');
    o.className = 'video-overlay';
    o.style.position = 'fixed';
    o.style.inset = '0';
    o.style.display = 'flex';
    o.style.alignItems = 'center';
    o.style.justifyContent = 'center';
    o.style.background = 'rgba(0,0,0,0.85)';
    o.style.zIndex = 9999;
    o.addEventListener('click', () => this._destroyOverlay());
    document.body.appendChild(o);
    this.overlay = o;
  }

  _destroyOverlay() {
    if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    this.overlay = null;
  }
}
