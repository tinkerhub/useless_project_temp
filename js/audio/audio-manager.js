/**
 * Useless 3.0 - Central Audio Manager
 * Handles transition sound cues and deadpan robotic quote delivery.
 * Complies with strict transition-only policy (no frame-by-frame spam or overlapping speech).
 */
export class AudioManager {
  constructor() {
    this.muted = false;
    this.audioCtx = null;
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.lastPlayedState = null;
    this.isInitialized = false;

    // PRD-defined voice reactions
    this.STATE_QUOTES = {
      TALKING: "Apparently, you had something to say.",
      SILENT: "Finally. Some peace.",
      NO_FACE: "You can't escape the camera."
    };
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn("AudioContext not supported or blocked", e);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stop();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }

  /**
   * Play reaction for state transition.
   * Ensures identical states do not restart or overlap.
   */
  playForState(newState, prevState) {
    if (this.muted || !newState || newState === prevState) return;
    if (newState === 'IDLE' || newState === 'INITIALIZING') return;

    this.lastPlayedState = newState;

    // 1. Play subtle futuristic transition tone
    this.playTransitionChime(newState);

    // 2. Speak the deadpan reaction quote
    const quote = this.STATE_QUOTES[newState];
    if (quote) {
      this.speak(quote, newState);
    }
  }

  playTransitionChime(state) {
    if (!this.audioCtx || this.muted) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (state === 'TALKING') {
        // Upward energetic blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (state === 'SILENT') {
        // Calming downward chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.22);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (state === 'NO_FACE') {
        // Mysterious low buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.3);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
      }
    } catch (e) {
      // Audio autoplay policy or error
    }
  }

  speak(text, state) {
    if (!this.synth || this.muted) return;

    try {
      // Cancel previous speech to avoid queue pileup
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = state === 'TALKING' ? 1.05 : (state === 'SILENT' ? 0.95 : 0.85);

      // Attempt to pick a clean English voice if available
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(v => (v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Samantha'))));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error", err);
    }
  }
}
