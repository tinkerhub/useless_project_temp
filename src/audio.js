/**
 * audio.js — Sound effect loader and player.
 *
 * Manages audio playback for game events.
 * Gracefully handles missing files (plays nothing instead of crashing).
 *
 * The user will provide 2 signature MP3s which should be placed in public/sounds/.
 * Additional SFX can be added as needed.
 */

export class AudioManager {
  constructor() {
    this.sounds = {};
    this.isLoaded = false;
    this.isMuted = false;
    this.audioCtx = null;
  }

  _getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Preload audio files that actually exist.
   */
  async loadSounds() {
    const soundMap = {
      v: '/v.mp3',
      chath: '/chath.mp3',
      lst: '/lst.mp3'
    };

    const loadPromises = Object.entries(soundMap).map(async ([name, path]) => {
      try {
        const audio = new Audio(path);
        await new Promise((resolve, reject) => {
          audio.addEventListener('canplaythrough', resolve, { once: true });
          audio.addEventListener('error', reject, { once: true });
          audio.load();
        });
        this.sounds[name] = audio;
      } catch {
        // Fallback or skip silently
      }
    });

    await Promise.allSettled(loadPromises);
    this.isLoaded = true;
    console.log(`[AUDIO] Ready. Loaded tracks:`, Object.keys(this.sounds));
  }

  playIntroVoice() {
    if (this.isMuted) return null;
    const a = this.sounds.v;
    if (!a) return null;
    const clone = a.cloneNode();
    clone.play().catch(() => {});
    return clone;
  }

  playDeathSound() {
    if (this.isMuted) return;
    if (this._deathPlaying) return;
    const a = this.sounds.chath;
    if (a) {
      this._deathPlaying = true;
      const clone = a.cloneNode();
      clone.addEventListener('ended', () => { this._deathPlaying = false; });
      clone.play().catch(() => { this._deathPlaying = false; });
    } else {
      this._synthBeep(120, 0.6, 'sawtooth');
    }
  }

  resetDeathFlag() {
    this._deathPlaying = false;
  }

  play(name, volume = 0.7) {
    if (this.isMuted) return;

    if (this.sounds[name]) {
      const clone = this.sounds[name].cloneNode();
      clone.volume = Math.max(0, Math.min(1, volume));
      clone.play().catch(() => {});
      return;
    }

    // Synthesize UI sounds dynamically with Web Audio
    try {
      if (name === 'click') {
        this._synthBeep(800, 0.05, 'sine', volume * 0.4);
      } else if (name === 'scan') {
        this._synthBeep(520, 0.15, 'triangle', volume * 0.5);
      } else if (name === 'stamp') {
        this._synthStamp(volume);
      } else if (name === 'reveal') {
        this._synthChord([440, 554, 659, 880], 0.35, volume * 0.4);
      } else if (name === 'death') {
        this.playDeathSound();
      }
    } catch {}
  }

  _synthBeep(freq, duration, type = 'sine', vol = 0.3) {
    const ctx = this._getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  _synthStamp(vol = 0.7) {
    const ctx = this._getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(vol * 0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  _synthChord(freqs, duration, vol = 0.3) {
    const ctx = this._getAudioContext();
    if (!ctx) return;
    freqs.forEach((f, i) => {
      setTimeout(() => {
        this._synthBeep(f, duration, 'sine', vol / freqs.length);
      }, i * 40);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}
