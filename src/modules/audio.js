/**
 * RumorRadar - Procedural Web Audio Sound Synthesizer & Persona Speech Engine
 * Zero-dependency procedural audio engine for radar sweeps, blips, alert chimes,
 * and Web Speech API synthesis tailored to each chatbot persona.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.voiceEnabled = true;
    this.currentUtterance = null;
    this.isSpeakingNow = false;
    this.initContext = this.initContext.bind(this);
    this.voices = [];

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.voices = window.speechSynthesis.getVoices();
      };
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle(enableState) {
    if (enableState !== undefined) {
      this.enabled = enableState;
    } else {
      this.enabled = !this.enabled;
    }
    if (!this.enabled) {
      this.stopSpeaking();
    }
    return this.enabled;
  }

  toggleVoice(voiceState) {
    if (voiceState !== undefined) {
      this.voiceEnabled = voiceState;
    } else {
      this.voiceEnabled = !this.voiceEnabled;
    }
    if (!this.voiceEnabled) {
      this.stopSpeaking();
    }
    return this.voiceEnabled;
  }

  playSend() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  playRadarPing(isHighGossip = false) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = isHighGossip ? 780 : 540;
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 0.5, now);
      osc2.frequency.linearRampToValueAtTime(baseFreq * 0.8, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {}
  }

  playAlertChime() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C chord chime
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.1, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.45);
      });
    } catch (e) {}
  }

  /**
   * Procedural blip click sound for radar HUD
   */
  playBlipClick() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  /**
   * Speak response using Web Speech Synthesis API
   */
  speakText(text, personaId = 'auditor', onEndCallback = null) {
    if (!this.enabled || !this.voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.stopSpeaking();

    // Clean markdown symbols for natural speech
    const cleanText = text
      .replace(/^###\s+/gm, '')
      .replace(/^##\s+/gm, '')
      .replace(/^#\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^>\s+/gm, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // strip emojis
      .replace(/•/g, '')
      .replace(/[-]{3,}/g, '')
      .trim();

    // Limit read length for snappy UX
    const speechSlice = cleanText.split('\n\n').slice(0, 3).join('. ');

    const utterance = new SpeechSynthesisUtterance(speechSlice);
    this.currentUtterance = utterance;
    this.isSpeakingNow = true;

    // Load available voices
    if (this.voices.length === 0) {
      this.voices = window.speechSynthesis.getVoices();
    }

    // Persona-specific vocal characteristics
    if (personaId === 'teaQueen') {
      utterance.pitch = 1.25;
      utterance.rate = 1.05;
      const femaleVoice = this.voices.find(v => 
        (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Victoria')) && v.lang.startsWith('en')
      );
      if (femaleVoice) utterance.voice = femaleVoice;
    } else if (personaId === 'diplomat') {
      utterance.pitch = 0.92;
      utterance.rate = 0.95;
      const calmVoice = this.voices.find(v => 
        (v.name.includes('David') || v.name.includes('Daniel') || v.name.includes('George') || v.name.includes('Guy')) && v.lang.startsWith('en')
      );
      if (calmVoice) utterance.voice = calmVoice;
    } else {
      // Auditor: crisp, analytical
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
      const ukVoice = this.voices.find(v => v.lang.startsWith('en-GB') || v.name.includes('Oliver') || v.name.includes('Arthur'));
      if (ukVoice) utterance.voice = ukVoice;
    }

    utterance.onend = () => {
      this.isSpeakingNow = false;
      this.currentUtterance = null;
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      this.isSpeakingNow = false;
      this.currentUtterance = null;
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeakingNow = false;
      this.currentUtterance = null;
    }
  }

  isSpeaking() {
    return this.isSpeakingNow;
  }
}

export const sound = new SoundEngine();
