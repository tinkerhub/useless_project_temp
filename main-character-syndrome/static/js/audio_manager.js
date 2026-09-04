class AudioManager {
  constructor() {
    this.audioContext = null;
    this.currentTrack = null;
    this.currentCategory = null;
    this.currentPriority = "medium";
    this.remoteProvider = new RemoteAudioProvider();
    this.spotifyProvider = new SpotifyProvider();
    this.proceduralProvider = new ProceduralAudioProvider();
    this.currentProvider = "procedural";
    this.masterVolume = 0.7;
    this.muted = false;
    this.fadeDuration = 550;
    this.mode = "offline";
  }

  setMode(mode) {
    this.mode = mode || "offline";
  }

  initializeAudio() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      console.log("[AUDIO ERROR] This browser does not support Web Audio API.");
      return null;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioCtor();
      console.log("[AUDIO DEBUG] AudioContext created.");
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    this.proceduralProvider.initialize();
    this.currentProvider = this.currentProvider || "procedural";
    console.log("[AUDIO DEBUG] AudioContext is running.");
    return this.audioContext;
  }

  async playCategory(category, metadata = {}) {
    const options = typeof metadata === "string" ? { priority: metadata } : metadata;
    const normalizedCategory = category || "mass_entry";
    const selectedMode = options.mode || document.getElementById("musicMode")?.value || this.mode || "offline";

    this.currentCategory = normalizedCategory;
    this.currentPriority = options.priority || "medium";
    this.mode = selectedMode;

    this.initializeAudio();

    if (selectedMode === "spotify") {
      console.log("[AUDIO DEBUG] Spotify mode disabled in local BGM build; using procedural soundtrack.");
      this.currentProvider = "procedural";
      return this._playProcedural(normalizedCategory, this.currentPriority);
    }

    if (selectedMode === "offline") {
      this.currentProvider = "procedural";
      return this._playProcedural(normalizedCategory, this.currentPriority);
    }

    this.currentProvider = "remote";
    const remoteResult = await this.remoteProvider.play(
      normalizedCategory,
      ({ audio, track }) => {
        this.currentTrack = audio;
        this.currentProvider = "remote";
        if (this.muted) audio.muted = true;
        this.fadeIn(audio);
        this.setVolume(this.masterVolume);
        console.log("[AUDIO SUCCESS] Remote soundtrack active:", track?.title || normalizedCategory);
      },
      () => this._playProcedural(normalizedCategory, this.currentPriority),
      () => this._playProcedural(normalizedCategory, this.currentPriority)
    );

    if (!remoteResult) {
      this.currentProvider = "procedural";
      return this._playProcedural(normalizedCategory, this.currentPriority);
    }

    return remoteResult;
  }

  _playProcedural(category, priority) {
    const procedural = this.proceduralProvider.play(category, priority);
    this.currentTrack = procedural;
    this.currentProvider = "procedural";
    return procedural;
  }

  stopCurrentTrack() {
    if (this.currentTrack && this.currentTrack instanceof HTMLAudioElement) {
      this.fadeOut(this.currentTrack, () => {
        this.currentTrack.pause();
        this.currentTrack.currentTime = 0;
      });
      return;
    }

    if (this.currentTrack && this.currentTrack.provider === "procedural") {
      this.proceduralProvider.stop();
      this.currentTrack = null;
    }
  }

  stop() {
    this.stopCurrentTrack();
    if (this.spotifyProvider && this.spotifyProvider.player) {
      try {
        this.spotifyProvider.player.pause();
      } catch (error) {
        console.log("[AUDIO ERROR] Could not pause Spotify playback.", error);
      }
    }
  }

  pause() {
    if (this.currentProvider === "spotify") {
      return this.spotifyProvider.pause();
    }
    if (this.currentTrack && this.currentTrack instanceof HTMLAudioElement) {
      this.currentTrack.pause();
    }
    return { success: true };
  }

  resume() {
    if (this.currentProvider === "spotify") {
      return this.spotifyProvider.resume();
    }
    if (this.currentTrack && this.currentTrack instanceof HTMLAudioElement) {
      this.currentTrack.play();
    }
    return { success: true };
  }

  fadeIn(audio) {
    if (!audio) return;
    audio.volume = 0.01;
    audio.play().catch((error) => {
      console.log("[AUDIO ERROR] Failed to play audio:", error);
      console.log("[AUDIO FALLBACK] Trying procedural fallback.");
      this._playProcedural(this.currentCategory || "mass_entry", this.currentPriority);
    });

    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / this.fadeDuration, 1);
      audio.volume = Math.min(this.masterVolume, 0.05 + progress * this.masterVolume);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }

  fadeOut(audio, callback) {
    if (!audio) {
      callback && callback();
      return;
    }

    const start = performance.now();
    const startVol = audio.volume || this.masterVolume;
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / this.fadeDuration, 1);
      audio.volume = Math.max(0, startVol * (1 - progress));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        callback && callback();
      }
    };
    requestAnimationFrame(tick);
  }

  setVolume(volume) {
    this.masterVolume = Math.min(1, Math.max(0, volume));
    if (this.currentTrack && this.currentTrack instanceof HTMLAudioElement) {
      this.currentTrack.volume = this.muted ? 0 : this.masterVolume;
    }
    if (this.proceduralProvider && this.proceduralProvider.masterGain) {
      this.proceduralProvider.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    }
    if (this.spotifyProvider && this.spotifyProvider.player && this.spotifyProvider.player.setVolume) {
      this.spotifyProvider.setVolume(this.masterVolume);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.currentTrack && this.currentTrack instanceof HTMLAudioElement) {
      this.currentTrack.muted = this.muted;
    }
    if (this.proceduralProvider && this.proceduralProvider.masterGain) {
      this.proceduralProvider.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    }
    if (this.spotifyProvider && this.spotifyProvider.player && this.spotifyProvider.player.setVolume) {
      this.spotifyProvider.setVolume(this.muted ? 0 : this.masterVolume);
    }
    return this.muted;
  }

  getAudioStatus() {
    return {
      provider: this.currentProvider,
      category: this.currentCategory,
      muted: this.muted,
      playing: !!this.currentTrack,
      volume: this.masterVolume,
    };
  }

  testAudio() {
    this.initializeAudio();
    this.proceduralProvider.initialize();
    this.proceduralProvider.ctx.resume();
    const procedural = this.proceduralProvider.play("mass_entry", "high");
    this.currentTrack = procedural;
    this.currentProvider = "procedural";
    console.log("[AUDIO DEBUG] Test tone triggered.");
    return procedural;
  }
}
