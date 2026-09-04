class ProceduralAudioProvider {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeNodes = [];
    this.currentPattern = null;
    this.isPlaying = false;
  }

  initialize() {
    if (!this.ctx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) {
        console.log("[AUDIO ERROR] Web Audio API not supported.");
        return null;
      }
      this.ctx = new AudioCtor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    return this.ctx;
  }

  stop() {
    this.isPlaying = false;
    this.activeNodes.forEach((node) => {
      try {
        node.stop && node.stop();
      } catch (error) {
        // silent cleanup on repeated stops
      }
    });
    this.activeNodes = [];
    if (this.currentPattern) {
      clearInterval(this.currentPattern);
      this.currentPattern = null;
    }
  }

  play(category, priority = "medium") {
    const ctx = this.initialize();
    if (!ctx || !this.masterGain) {
      console.log("[AUDIO ERROR] Cannot initialize procedural audio.");
      return null;
    }

    this.ctx.resume();
    this.stop();
    this.isPlaying = true;
    console.log("[AUDIO SUCCESS] Procedural fallback active for:", category);

    const baseFrequency = { mass_entry: 110, cartoon_chase: 220, dreamy: 180, comedy_thinking: 280, horror: 90, royal: 196, chaos: 140, emotional: 174, action: 160, dramatic_reveal: 130 }[category] || 180;

    this._makeOsc("triangle", baseFrequency, 0.22, 0.45, 0);
    this._makeOsc("sine", baseFrequency * 1.5, 0.18, 0.3, 0.04);
    this._makeImmediatePulse(baseFrequency, 0.9, 0.18);

    if (category === "mass_entry") {
      this._playImpactPattern(baseFrequency, 0.14, 0.7);
    } else if (category === "cartoon_chase" || category === "action") {
      this._playChasePattern(baseFrequency, 0.08, 0.6);
    } else if (category === "dreamy") {
      this._playDreamyPad(baseFrequency, 0.25);
    } else if (category === "comedy_thinking" || category === "comedy_confusion") {
      this._playQuirkyPattern(baseFrequency, 0.12, 0.8);
    } else if (category === "horror") {
      this._playHorrorDrone(baseFrequency, 0.18);
    } else if (category === "royal") {
      this._playRoyalFanfare(baseFrequency, 0.15, 0.7);
    } else if (category === "chaos") {
      this._playChaosPattern(baseFrequency, 0.1, 0.9);
    } else if (category === "emotional" || category === "dramatic_reveal") {
      this._playEmotionalChord(baseFrequency, 0.2, 0.85);
    } else {
      this._playImpactPattern(baseFrequency, 0.15, 0.65);
    }

    return { provider: "procedural", category, priority };
  }

  _makeOsc(type, freq, duration, gainValue, delay = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(gainValue, this.ctx.currentTime + delay + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
    this.activeNodes.push(osc);
  }

  _playImpactPattern(baseFrequency, step, volume) {
    for (let i = 0; i < 6; i++) {
      const factor = 1 + i * 0.12;
      this._makeOsc("sawtooth", baseFrequency * factor, 0.25, volume * (1 - i * 0.08), i * step);
      this._makeOsc("triangle", baseFrequency / 2, 0.4, volume * 0.5, i * step + 0.04);
    }
  }

  _playChasePattern(baseFrequency, step, volume) {
    const pattern = [0, 2, 4, 7, 9, 7, 4, 2];
    this.currentPattern = setInterval(() => {
      for (let i = 0; i < pattern.length; i++) {
        const frequency = baseFrequency * Math.pow(2, pattern[i] / 12);
        this._makeOsc("square", frequency, 0.09, volume * 0.7, i * 0.02);
      }
    }, 220);
  }

  _playDreamyPad(baseFrequency, duration) {
    for (let i = 0; i < 5; i++) {
      const offset = i * 0.18;
      this._makeOsc("sine", baseFrequency * (1 + i * 0.08), duration, 0.14, offset);
      this._makeOsc("triangle", baseFrequency * (1.5 + i * 0.06), duration + 0.2, 0.1, offset + 0.05);
    }
  }

  _playQuirkyPattern(baseFrequency, step, volume) {
    const notes = [0, 3, 7, 10, 3, 12];
    this.currentPattern = setInterval(() => {
      notes.forEach((interval, index) => {
        const frequency = baseFrequency * Math.pow(2, interval / 12);
        this._makeOsc("triangle", frequency, 0.08, volume * 0.7, index * 0.03);
      });
    }, 320);
  }

  _playHorrorDrone(baseFrequency, duration) {
    this._makeOsc("sawtooth", baseFrequency, duration, 0.22, 0);
    this._makeOsc("sine", baseFrequency / 2, duration + 0.2, 0.17, 0.05);
    for (let i = 0; i < 5; i++) {
      this._makeOsc("square", baseFrequency * 1.3, 0.09, 0.1, i * 0.5 + 0.1);
    }
  }

  _playRoyalFanfare(baseFrequency, step, volume) {
    const chord = [0, 4, 7];
    for (let i = 0; i < chord.length; i++) {
      this._makeOsc("sine", baseFrequency * Math.pow(2, chord[i] / 12), 0.35, volume * 0.8, i * step);
    }
    for (let i = 0; i < 4; i++) {
      this._makeOsc("triangle", baseFrequency * (1 + i * 0.08), 0.18, volume * 0.55, i * step + 0.3);
    }
  }

  _playChaosPattern(baseFrequency, step, volume) {
    this.currentPattern = setInterval(() => {
      const freq = baseFrequency * (0.7 + Math.random() * 1.6);
      this._makeOsc("sawtooth", freq, 0.11, volume * 0.8, 0);
      this._makeOsc("square", freq / 2, 0.08, volume * 0.7, 0.02);
    }, 160);
  }

  _playEmotionalChord(baseFrequency, duration, volume) {
    const chord = [0, 5, 9];
    chord.forEach((interval, index) => {
      this._makeOsc("sine", baseFrequency * Math.pow(2, interval / 12), duration, volume * (0.8 - index * 0.15), index * 0.05);
    });
  }

  _makeImmediatePulse(freq, gainValue, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, this.ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
    this.activeNodes.push(osc);
  }
}
