/**
 * ==========================================================================
 * ATTORNEY GENERAL TAB-NEY WRIGHT - COURTROOM ENGINE
 * Dev 2 Scope: Audio Engine, Typewriter Dialogue, Judge Sprite State Machine,
 * Voice Dictation, 16-Bit Sound Synthesizer & Live Ollama/FastAPI AI Handshake
 * ==========================================================================
 */

// --- 1. CONFIGURATION & BACKEND HANDSHAKE ---
const CONFIG = {
  // Live Hugging Face ZeroGPU / FastAPI backend with automatic graceful mock fallback if offline
  USE_MOCK: false,
  API_URL: "https://arfananulal-attorney-general-tab-ney-wright.hf.space/gradio_api/call/adjudicate_case",
  DISCORD_INVITE_URL: "https://discord.gg/DDC8hVVDh",
  MOCK_LATENCY_MS: 1800,
  TYPEWRITER_SPEED_MS: 38,       // Natural retro dialogue cadence
  TYPEWRITER_SOUND_INTERVAL: 3,  // Balanced mechanical clack rhythm
  AUDIO_ENABLED: true,
  PARDON_CLOSE_DELAY_MS: 15000,      // 15 seconds screen stay duration after acquittal
  GUILTY_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes punishment detention for guilty tabs
  VERDICT_CLOSE_DELAY_MS: 15000
};

// --- 2. ASSET DICTIONARY ---
const ASSETS = {
  sprites: {
    normal_idle: 'assets/sprites/Judge_Normal_Idle.gif',
    normal_talking: 'assets/sprites/Judge_Normal_Talking.gif',
    thinking: 'assets/sprites/Judge_Thinking.gif',
    surprised: 'assets/sprites/Judge_Surprised.gif',
    stern_idle: 'assets/sprites/Judge_Stern_Idle.gif',
    stern_talking: 'assets/sprites/Judge_Stern_Talking.gif',
    gavel: 'assets/sprites/Judge_Gavel.gif',
    nodding: 'assets/sprites/Judge_Nodding.gif'
  },
  audio: {
    gavel: 'assets/audio/gavel.mp3',
    objection: 'assets/audio/objection.mp3',
    typewriter: 'assets/audio/typewriter.mp3',
    acquitted: 'assets/audio/acquitted.mp3'
  },
  backgrounds: {
    courtroom: 'assets/backgrounds/Court-Room.jpg'
  },
  icons: {
    favicon: 'assets/icons/Judge_Favicon.gif',
    icon128: 'assets/icons/Judge_Favicon_128.png'
  }
};

// --- 3. RUNTIME STATE ---
const STATE = {
  accusedTitle: '',
  accusedUrl: '',
  caseId: '',
  courtTabId: null,
  courtWinId: null,
  audioMuted: !CONFIG.AUDIO_ENABLED,
  audioUnlocked: false,
  isRecording: false,
  isSubmitting: false,
  currentPhase: 'INIT', // 'INIT' | 'AWAITING_UNLOCK' | 'ARRAIGNMENT' | 'AWAITING_PLEA' | 'DELIBERATING' | 'VERDICT_GUILTY' | 'VERDICT_PARDONED'
  currentJudgeSprite: 'normal_idle',
  submittedPlea: '',
  trialComplete: false
};

// --- 4. DOM ELEMENTS CACHE ---
const DOM = {
  container: null,
  accusedTitle: null,
  accusedUrl: null,
  caseId: null,
  engineStatus: null,
  audioBtn: null,
  audioUnlockPrompt: null,
  judgeSprite: null,
  dialogueContainer: null,
  dialogueSpeaker: null,
  dialogueContent: null,
  promptIndicator: null,
  deliberationBanner: null,
  pleaInput: null,
  micBtn: null,
  micBtnText: null,
  micIcon: null,
  micNotice: null,
  recordingStatus: null,
  charCounter: null,
  submitBtn: null,
  presetChips: [],
  verdictStampContainer: null,
  verdictStamp: null,
  resurrectAlert: null,
  pdfContainer: null,
  pdfDownloadBtn: null,
  adjournBanner: null,
  adjournText: null,
  gavelCutscene: null,
  gavelCutsceneImg: null
};

function initDOMReferences() {
  DOM.container = document.getElementById('courtroom-container');
  DOM.accusedTitle = document.getElementById('accused-title');
  DOM.accusedUrl = document.getElementById('accused-url');
  DOM.caseId = document.getElementById('case-id');
  DOM.engineStatus = document.getElementById('engine-status');
  DOM.audioBtn = document.getElementById('audio-btn');
  DOM.audioUnlockPrompt = document.getElementById('audio-unlock-prompt');
  DOM.judgeSprite = document.getElementById('judge-sprite');
  DOM.dialogueContainer = document.getElementById('dialogue-container');
  DOM.dialogueSpeaker = document.getElementById('dialogue-speaker');
  DOM.dialogueContent = document.getElementById('dialogue-content');
  DOM.promptIndicator = document.getElementById('prompt-indicator');
  DOM.deliberationBanner = document.getElementById('deliberation-banner');
  DOM.pleaInput = document.getElementById('plea-input');
  DOM.micBtn = document.getElementById('mic-btn');
  DOM.micBtnText = document.getElementById('mic-btn-text');
  DOM.micIcon = document.getElementById('mic-icon');
  DOM.micNotice = document.getElementById('mic-notice');
  DOM.recordingStatus = document.getElementById('recording-status');
  DOM.charCounter = document.getElementById('char-counter');
  DOM.submitBtn = document.getElementById('submit-btn');
  DOM.presetChips = document.querySelectorAll('.preset-chip');
  DOM.verdictStampContainer = document.getElementById('verdict-stamp-container');
  DOM.verdictStamp = document.getElementById('verdict-stamp');
  DOM.resurrectAlert = document.getElementById('resurrect-alert');
  DOM.pdfContainer = document.getElementById('pdf-container');
  DOM.pdfDownloadBtn = document.getElementById('pdf-download-btn');
  DOM.adjournBanner = document.getElementById('adjourn-banner');
  DOM.adjournText = document.getElementById('adjourn-text');
  DOM.gavelCutscene = document.getElementById('gavel-cutscene');
  DOM.gavelCutsceneImg = document.getElementById('gavel-cutscene-img');
}

// --- 5. AUDIO ENGINE (SOUND CONTROLLER & 16-BIT SYNTHESIZER) ---
class SoundController {
  constructor() {
    this.muted = STATE.audioMuted;
    this.unlocked = false;
    this.audioCtx = null;

    // Standard audio objects
    this.sounds = {
      gavel: new Audio(ASSETS.audio.gavel),
      objection: new Audio(ASSETS.audio.objection),
      acquitted: new Audio(ASSETS.audio.acquitted)
    };

    // Continuous typewriter audio loop
    this.typewriterAudio = new Audio(ASSETS.audio.typewriter);
    this.typewriterAudio.loop = true;
    this.typewriterAudio.volume = 0.55;

    // Set volumes for dramatic balance
    this.sounds.gavel.volume = 0.9;
    this.sounds.objection.volume = 0.85;
    this.sounds.acquitted.volume = 0.85;
    // Loop acquitted music continuously until court tab closes
    this.sounds.acquitted.loop = true;
  }

  /**
   * Check if browser allows autoplay without initial interaction
   */
  checkAutoplay(onAllowed, onBlocked) {
    const testAudio = new Audio(ASSETS.audio.objection);
    testAudio.volume = 0.001;
    const p = testAudio.play();

    if (p !== undefined) {
      p.then(() => {
        this.unlocked = true;
        STATE.audioUnlocked = true;
        testAudio.pause();
        testAudio.currentTime = 0;
        if (DOM.audioUnlockPrompt) DOM.audioUnlockPrompt.style.display = 'none';
        if (onAllowed) onAllowed();
      }).catch(() => {
        this.unlocked = false;
        STATE.audioUnlocked = false;
        if (DOM.audioUnlockPrompt) DOM.audioUnlockPrompt.style.display = 'block';
        if (onBlocked) onBlocked();
      });
    } else {
      if (onBlocked) onBlocked();
    }
  }

  /**
   * Unlock audio engine upon first user interaction
   */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    STATE.audioUnlocked = true;

    if (DOM.audioUnlockPrompt) {
      DOM.audioUnlockPrompt.style.display = 'none';
    }

    // Warm up Web Audio API context for zero-latency mechanical synth
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {}

    // Warm up all audio instances
    Object.values(this.sounds).forEach(snd => {
      snd.play().then(() => {
        snd.pause();
        snd.currentTime = 0;
      }).catch(() => {});
    });

    // If typewriter is currently in typing mode, resume typing sound immediately
    if (typewriter && typewriter.isTyping && !this.muted) {
      this.startTypewriter();
    }
  }

  /**
   * Synthesize a tactile 16-bit mechanical keyboard switch click (zero external assets needed)
   */
  playMechanicalClick() {
    if (this.muted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const t = this.audioCtx.currentTime;

      // 1. High crisp tactile click impulse (plastic key switch snap)
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1600, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.032);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.034);

      // 2. Low mechanical bottom-out thud (switch housing body resonance)
      const thudOsc = this.audioCtx.createOscillator();
      const thudGain = this.audioCtx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(280, t);
      thudOsc.frequency.exponentialRampToValueAtTime(70, t + 0.045);

      thudGain.gain.setValueAtTime(0.35, t);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      thudOsc.connect(thudGain);
      thudGain.connect(this.audioCtx.destination);

      thudOsc.start(t);
      thudOsc.stop(t + 0.047);
    } catch (e) {
      console.warn("[Audio] Mechanical click synth error:", e);
    }
  }

  /**
   * Synthesize an 8-bit digital chirp for microphone toggle (recording on/off)
   */
  playMicToggle(isStarting) {
    if (this.muted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      if (isStarting) {
        // High rising chirp (520Hz -> 880Hz) - mic active
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.setValueAtTime(880, t + 0.04);
      } else {
        // Descending chirp (880Hz -> 440Hz) - mic disengaged
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(440, t + 0.04);
      }

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.setValueAtTime(0.35, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {
      console.warn("[Audio] Mic synth error:", e);
    }
  }

  /**
   * Synthesize a heavy arcade button slam when submitting a plea
   */
  playSubmitClick() {
    if (this.muted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const t = this.audioCtx.currentTime;

      // Heavy tactile arcade plunger snap
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.05);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.055);

      // Low mechanical thud
      const thud = this.audioCtx.createOscillator();
      const thudGain = this.audioCtx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(200, t);
      thud.frequency.exponentialRampToValueAtTime(50, t + 0.07);

      thudGain.gain.setValueAtTime(0.4, t);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      thud.connect(thudGain);
      thudGain.connect(this.audioCtx.destination);

      thud.start(t);
      thud.stop(t + 0.075);
    } catch (e) {
      console.warn("[Audio] Submit synth error:", e);
    }
  }

  /**
   * Starts the typewriter audio loop
   */
  startTypewriter() {
    if (this.muted) return;
    try {
      this.typewriterAudio.currentTime = 0;
      const p = this.typewriterAudio.play();
      if (p !== undefined) p.catch(() => {});
    } catch (e) {}
  }

  /**
   * Immediately stops the typewriter audio loop
   */
  stopTypewriter() {
    try {
      this.typewriterAudio.pause();
      this.typewriterAudio.currentTime = 0;
    } catch (e) {}
  }

  /**
   * Play a named courtroom sound effect
   */
  play(name) {
    if (this.muted) return;
    const snd = this.sounds[name];
    if (snd) {
      snd.currentTime = 0;
      const p = snd.play();
      if (p !== undefined) {
        p.catch(err => console.warn(`[Audio] Play blocked for ${name}:`, err));
      }
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.muted = !this.muted;
    STATE.audioMuted = this.muted;
    if (this.muted) {
      this.stopTypewriter();
    } else {
      this.play('objection');
    }
    return this.muted;
  }
}

// Global Sound Controller Instance
const sound = new SoundController();

// --- 6. TYPEWRITER DIALOGUE ENGINE ---
class TypewriterEngine {
  constructor(soundController) {
    this.soundController = soundController;
    this.isTyping = false;
    this.timeoutId = null;
    this.fullText = '';
    this.charIndex = 0;
    this.onCompleteCallback = null;
    this.speed = CONFIG.TYPEWRITER_SPEED_MS;
  }

  type(text, options = {}) {
    this.stop();

    this.fullText = text;
    this.charIndex = 0;
    this.isTyping = true;
    this.speed = options.speed || CONFIG.TYPEWRITER_SPEED_MS;
    this.onStart = options.onStart || null;
    this.onComplete = options.onComplete || null;

    if (DOM.dialogueContainer) {
      DOM.dialogueContainer.classList.add('is-typing');
    }
    if (DOM.promptIndicator) {
      DOM.promptIndicator.style.display = 'none';
    }
    if (DOM.dialogueContent) {
      DOM.dialogueContent.textContent = '';
    }

    if (this.onStart) this.onStart();
    this.soundController.startTypewriter();

    return new Promise((resolve) => {
      this.onCompleteCallback = () => {
        this.soundController.stopTypewriter();
        if (DOM.dialogueContainer) {
          DOM.dialogueContainer.classList.remove('is-typing');
        }
        if (DOM.promptIndicator) {
          DOM.promptIndicator.style.display = 'block';
        }
        if (this.onComplete) this.onComplete();
        resolve();
      };

      this.step();
    });
  }

  step() {
    if (!this.isTyping) return;

    if (this.charIndex < this.fullText.length) {
      const char = this.fullText.charAt(this.charIndex);
      this.charIndex++;

      if (DOM.dialogueContent) {
        DOM.dialogueContent.textContent = this.fullText.substring(0, this.charIndex);
      }

      // Natural pauses at punctuation
      let delay = this.speed;
      if (char === '.' || char === '!' || char === '?') {
        delay = this.speed * 4.2;
        this.soundController.typewriterAudio.pause();
      } else if (char === ',' || char === ';' || char === ':') {
        delay = this.speed * 2.0;
      } else {
        if (!this.soundController.muted && this.soundController.typewriterAudio.paused) {
          this.soundController.typewriterAudio.play().catch(() => {});
        }
      }

      this.timeoutId = setTimeout(() => this.step(), delay);
    } else {
      this.finish();
    }
  }

  skip() {
    if (!this.isTyping) return;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.soundController.stopTypewriter();
    if (DOM.dialogueContent) {
      DOM.dialogueContent.textContent = this.fullText;
    }
    this.finish();
  }

  finish() {
    this.isTyping = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.soundController.stopTypewriter();
    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }

  stop() {
    this.isTyping = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.soundController.stopTypewriter();
    this.onCompleteCallback = null;
    if (DOM.dialogueContainer) {
      DOM.dialogueContainer.classList.remove('is-typing');
    }
  }
}

// Global Typewriter Engine Instance
const typewriter = new TypewriterEngine(sound);

// --- 7. VOICE RECOGNITION CONTROLLER ---
class VoiceController {
  constructor() {
    this.isRecording = false;
    this.recognition = null;
    this.baseText = '';
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!SpeechRec;

    if (this.supported) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.setupListeners();
      } catch (e) {
        console.warn("🎙️ [VOICE] Failed to initialize SpeechRecognition:", e);
        this.supported = false;
      }
    }
  }

  setupListeners() {
    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const spoken = (final + ' ' + interim).trim();
      if (DOM.pleaInput && spoken) {
        const combined = this.baseText ? `${this.baseText} ${spoken}` : spoken;
        DOM.pleaInput.value = combined.slice(0, 280);
        updateCharCounter();
      }
    };

    this.recognition.onerror = (event) => {
      console.warn("🎙️ [VOICE] Recognition error:", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.showNotice("⚠️ MIC PERMISSION DENIED — PLEASE TYPE YOUR PLEA BELOW");
      } else if (event.error === 'no-speech') {
        // Silence timeout
      } else {
        this.showNotice(`⚠️ VOICE NOTICE: ${event.error.toUpperCase()}`);
      }
      this.stop(true);
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        this.stop();
      }
    };
  }

  start() {
    if (!this.supported) {
      this.showNotice("⚠️ SPEECH RECOGNITION NOT SUPPORTED (TYPE DEFENSE BELOW)");
      return;
    }

    if (this.isRecording) return;
    this.hideNotice();

    this.baseText = DOM.pleaInput ? DOM.pleaInput.value.trim() : '';
    this.isRecording = true;
    STATE.isRecording = true;

    try {
      this.recognition.start();
    } catch (err) {
      console.warn("🎙️ [VOICE] Start exception:", err);
      this.stop(true);
      return;
    }

    sound.playMicToggle(true);

    // Update UI states
    if (DOM.micBtn) DOM.micBtn.classList.add('recording');
    if (DOM.micBtnText) DOM.micBtnText.textContent = "STOP [LISTENING]";
    if (DOM.micIcon) DOM.micIcon.textContent = "⏹️";
    if (DOM.recordingStatus) DOM.recordingStatus.style.display = 'flex';
  }

  stop(silent = false) {
    if (!this.isRecording) return;
    this.isRecording = false;
    STATE.isRecording = false;

    if (!silent) {
      sound.playMicToggle(false);
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    // Reset UI states
    if (DOM.micBtn) DOM.micBtn.classList.remove('recording');
    if (DOM.micBtnText) DOM.micBtnText.textContent = "VOICE PLEA";
    if (DOM.micIcon) DOM.micIcon.textContent = "🎙️";
    if (DOM.recordingStatus) DOM.recordingStatus.style.display = 'none';

    if (DOM.pleaInput) {
      DOM.pleaInput.focus();
    }
  }

  toggle() {
    if (this.isRecording) {
      this.stop();
    } else {
      this.start();
    }
  }

  showNotice(msg) {
    if (DOM.micNotice) {
      DOM.micNotice.textContent = msg;
      DOM.micNotice.classList.add('active');
      setTimeout(() => {
        this.hideNotice();
      }, 5000);
    }
  }

  hideNotice() {
    if (DOM.micNotice) {
      DOM.micNotice.classList.remove('active');
    }
  }
}

// Global Voice Controller Instance
const voice = new VoiceController();

/**
 * Updates the live character counter badge in the dock header
 */
function updateCharCounter() {
  if (!DOM.pleaInput || !DOM.charCounter) return;
  const len = DOM.pleaInput.value.length;
  DOM.charCounter.textContent = `${len}/280`;
  if (len >= 280) {
    DOM.charCounter.className = 'char-counter limit-reached';
  } else if (len >= 240) {
    DOM.charCounter.className = 'char-counter limit-near';
  } else {
    DOM.charCounter.className = 'char-counter';
  }
}

/**
 * Plays a tactile mechanical keyboard switch click on chip interaction
 */
function playChipClick() {
  sound.playMechanicalClick();
}

// --- 8. SPRITE STATE CONTROLLER ---
function setJudgeSprite(stateName) {
  const spriteSrc = ASSETS.sprites[stateName];
  if (!spriteSrc || !DOM.judgeSprite) return;

  STATE.currentJudgeSprite = stateName;
  DOM.judgeSprite.src = spriteSrc;

  if (stateName === 'gavel') {
    DOM.judgeSprite.classList.add('gavel-active');
  } else {
    DOM.judgeSprite.classList.remove('gavel-active');
  }
}

function preloadSprites() {
  Object.values(ASSETS.sprites).forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

// --- 8.5 VERDICT STAY & ADJOURN CONTROLLER ---
let dismissCountdownTimer = null;

function cancelScreenDismissCountdown() {
  if (dismissCountdownTimer) {
    clearInterval(dismissCountdownTimer);
    dismissCountdownTimer = null;
  }
  if (DOM.adjournBanner) {
    DOM.adjournBanner.classList.remove('active');
    DOM.adjournBanner.classList.remove('adjourn-critical');
    DOM.adjournBanner.classList.remove('adjourn-guilty');
  }
  if (DOM.promptIndicator) {
    DOM.promptIndicator.classList.remove('adjourn-countdown');
  }
}

function formatCountdownTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) {
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  }
  return `${s}s`;
}

function startScreenDismissCountdown(delayMs = 15000, verdictType = 'PARDONED') {
  cancelScreenDismissCountdown();

  const isGuilty = verdictType === 'GUILTY';
  const delaySec = Math.round(delayMs / 1000);

  // 1. Immediately schedule background worker auto-close as independent fail-safe authority
  if (window.chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      action: "SCHEDULE_AUTO_CLOSE",
      delaySeconds: delaySec,
      tabId: STATE.courtTabId,
      windowId: STATE.courtWinId
    }, (res) => {
      console.log("[COURT] Background auto-close scheduled:", res);
    });
  }

  if (DOM.adjournBanner) {
    DOM.adjournBanner.classList.remove('adjourn-critical');
    DOM.adjournBanner.classList.toggle('adjourn-guilty', isGuilty);
    DOM.adjournBanner.classList.add('active');
  }

  const updateDisplay = (sec) => {
    const formatted = formatCountdownTime(sec);
    if (DOM.adjournText) {
      DOM.adjournText.textContent = isGuilty 
        ? `COURT IN SESSION (30-MIN DETENTION): ${formatted} REMAINING...` 
        : `TAB CLOSING IN ${formatted}...`;
    }
    if (DOM.promptIndicator) {
      DOM.promptIndicator.classList.add('adjourn-countdown');
      DOM.promptIndicator.textContent = `[ ${formatted} ]`;
      DOM.promptIndicator.style.display = 'block';
    }
    if (!isGuilty && sec <= 3 && DOM.adjournBanner) {
      DOM.adjournBanner.classList.add('adjourn-critical');
    }
  };

  updateDisplay(delaySec);

  const startTime = Date.now();
  const endTime = startTime + delayMs;

  dismissCountdownTimer = setInterval(() => {
    const now = Date.now();
    const msLeft = Math.max(0, endTime - now);
    const sec = Math.ceil(msLeft / 1000);

    updateDisplay(sec);

    if (msLeft <= 0) {
      clearInterval(dismissCountdownTimer);
      dismissCountdownTimer = null;

      if (DOM.adjournText) {
        DOM.adjournText.textContent = isGuilty 
          ? "SENTENCE SERVED — COURT ADJOURNED" 
          : "TAB CLOSED — EUTHANASIA COMPLETE";
      }
      if (DOM.promptIndicator) {
        DOM.promptIndicator.textContent = "[ ADJOURNED ]";
      }

      STATE.trialComplete = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', snapFocusBackToCourt);
      sound.stopAll();

      // Close courtroom tab cleanly with full extension authority
      closeCourtroomTabCleanly();
    }
  }, 1000);
}

async function closeCourtroomTabCleanly() {
  console.log("⚖️ [COURT] Executing final clean adjournment and tab closure...", {
    tabId: STATE.courtTabId,
    winId: STATE.courtWinId
  });

  // 1. Remove unload and focus retention listeners
  STATE.trialComplete = true;
  window.removeEventListener('beforeunload', handleBeforeUnload);
  window.removeEventListener('blur', snapFocusBackToCourt);
  sound.stopAll();

  // 2. Disarm anti-escape in persistent storage
  if (window.chrome?.storage?.local) {
    await chrome.storage.local.set({
      isCourtActive: false,
      courtStatus: "ADJOURNED",
      activeCourtTabId: null
    }).catch(() => {});
  }

  // 3. Signal background service worker to close all courtroom tabs
  if (window.chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      action: "ADJOURN_AND_CLOSE",
      tabId: STATE.courtTabId,
      windowId: STATE.courtWinId
    }, (res) => {
      console.log("⚖️ [COURT] Background confirmed adjournment:", res);
    });
  }

  // 4. Direct tab removal via chrome.tabs API across all available vectors
  if (window.chrome?.tabs) {
    // Vector A: chrome.tabs.getCurrent
    if (chrome.tabs.getCurrent) {
      chrome.tabs.getCurrent((curTab) => {
        if (curTab?.id) {
          chrome.tabs.remove(curTab.id).catch(() => {});
        }
      });
    }

    // Vector B: Known courtTabId
    if (STATE.courtTabId) {
      chrome.tabs.remove(STATE.courtTabId).catch(() => {});
    }

    // Vector C: Query all tabs running courtroom.html
    if (chrome.tabs.query) {
      chrome.tabs.query({}, (tabs) => {
        if (tabs) {
          for (const t of tabs) {
            if (t.id && t.url && t.url.includes("courtroom.html")) {
              chrome.tabs.remove(t.id).catch(() => {});
            }
          }
        }
      });
    }
  }

  // 5. Fallback for non-extension / localhost browsers
  setTimeout(() => {
    attemptLocalClose();
  }, 150);
}

function attemptLocalClose() {
  try {
    window.open('', '_self', '');
    window.close();
  } catch (e) {
    console.log("[Courtroom] window.close() blocked by browser policy:", e);
  }
}

// --- 9. COURTROOM FINITE STATE MACHINE (FSM) WITH OLLAMA BACKEND ---
const CourtroomFSM = {
  transitionTo(newPhase, payload = {}) {
    console.log(`⚖️ [FSM] State Transition: ${STATE.currentPhase} -> ${newPhase}`, payload);
    STATE.currentPhase = newPhase;

    switch (newPhase) {
      case 'AWAITING_UNLOCK':
        this.enterAwaitingUnlock();
        break;

      case 'ARRAIGNMENT':
        this.enterArraignment();
        break;

      case 'AWAITING_PLEA':
        this.enterAwaitingPlea();
        break;

      case 'DELIBERATING':
        this.enterDeliberating(payload.plea);
        break;

      case 'VERDICT_GUILTY':
        this.enterVerdictGuilty(payload.plea, payload.verdictData);
        break;

      case 'VERDICT_PARDONED':
        this.enterVerdictPardoned(payload.plea, payload.verdictData);
        break;
    }
  },

  enterAwaitingUnlock() {
    setJudgeSprite('normal_idle');
    if (DOM.audioUnlockPrompt) {
      DOM.audioUnlockPrompt.style.display = 'block';
    }
    if (DOM.dialogueContent) {
      DOM.dialogueContent.innerHTML = '⚖️ COURT IS IN SESSION.<br><span style="color: #ffd700; font-size: 13px;">[ 🔊 CLICK ANYWHERE TO COMMENCE & UNMUTE AUDIO ]</span>';
    }
    if (DOM.promptIndicator) {
      DOM.promptIndicator.style.display = 'block';
    }
  },

  enterArraignment() {
    cancelScreenDismissCountdown();
    if (DOM.audioUnlockPrompt) {
      DOM.audioUnlockPrompt.style.display = 'none';
    }
    if (DOM.verdictStampContainer) {
      DOM.verdictStampContainer.classList.remove('active');
    }
    if (DOM.gavelCutscene) {
      DOM.gavelCutscene.classList.remove('active');
    }
    if (DOM.resurrectAlert) {
      DOM.resurrectAlert.classList.remove('active');
      DOM.resurrectAlert.style.display = 'none';
    }
    if (DOM.pdfContainer) {
      DOM.pdfContainer.classList.remove('active');
      DOM.pdfContainer.style.display = 'none';
    }

    const chargeSpeech = `Court is now in session! Defendant, you stand accused of UNAUTHORIZED TAB MURDER for the tab: "${STATE.accusedTitle}". How do you plead?!`;

    typewriter.type(chargeSpeech, {
      speed: CONFIG.TYPEWRITER_SPEED_MS,
      onStart: () => {
        setJudgeSprite('normal_talking');
      },
      onComplete: () => {
        setJudgeSprite('normal_idle');
        this.transitionTo('AWAITING_PLEA');
      }
    });
  },

  enterAwaitingPlea() {
    setJudgeSprite('normal_idle');
    if (DOM.pleaInput) {
      DOM.pleaInput.disabled = false;
      DOM.pleaInput.focus();
    }
    if (DOM.submitBtn) DOM.submitBtn.disabled = false;
    if (DOM.micBtn) DOM.micBtn.disabled = false;
    DOM.presetChips.forEach(chip => chip.disabled = false);
    updateCharCounter();
  },

  async enterDeliberating(pleaText) {
    cancelScreenDismissCountdown();
    // 1. Silence active voice recording
    if (voice && voice.isRecording) {
      voice.stop(true);
    }

    // 2. Play dramatic OBJECTION sting
    sound.play('objection');

    // 3. Lock docket controls
    if (DOM.pleaInput) DOM.pleaInput.disabled = true;
    if (DOM.submitBtn) DOM.submitBtn.disabled = true;
    if (DOM.micBtn) DOM.micBtn.disabled = true;
    DOM.presetChips.forEach(chip => chip.disabled = true);

    // 4. Set thinking magistrate
    setJudgeSprite('thinking');

    // 5. Reveal deliberation marquee
    if (DOM.deliberationBanner) {
      DOM.deliberationBanner.classList.add('active');
    }

    // 6. Judge deliberation statement
    typewriter.type("OBJECTION! The Court will now deliberate on your testimony with the local GPU jury...", {
      speed: 30
    });

    let verdictData = null;

    // 7. Live Hugging Face ZeroGPU (Gradio) or FastAPI / Ollama Backend Request
    if (!CONFIG.USE_MOCK) {
      try {
        console.log("⚡ [BACKEND] Contacting Judicial Endpoint at:", CONFIG.API_URL);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 16000);

        if (CONFIG.API_URL.includes("gradio_api") || CONFIG.API_URL.includes("hf.space")) {
          const callUrl = CONFIG.API_URL.includes("gradio_api")
            ? CONFIG.API_URL
            : `${CONFIG.API_URL.replace(/\/+$/, '')}/gradio_api/call/adjudicate_case`;

          const postRes = await fetch(callUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: [STATE.accusedTitle, STATE.accusedUrl, pleaText]
            }),
            signal: controller.signal
          });

          if (postRes.ok) {
            const queueData = await postRes.json();
            const eventId = queueData?.event_id;
            if (eventId) {
              const streamUrl = `${callUrl}/${eventId}`;
              const streamRes = await fetch(streamUrl, { signal: controller.signal });
              if (streamRes.ok) {
                const streamText = await streamRes.text();
                const lines = streamText.split('\n');
                for (const line of lines) {
                  if (line.startsWith('data:')) {
                    const raw = line.slice(5).trim();
                    try {
                      const parsed = JSON.parse(raw);
                      const item = Array.isArray(parsed) ? parsed[0] : parsed;
                      if (item && item.verdict) {
                        verdictData = item;
                        break;
                      }
                    } catch (e) {}
                  }
                }
              }
            }
          }
        } else {
          const res = await fetch(CONFIG.API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tab_url: STATE.accusedUrl,
              tab_title: STATE.accusedTitle,
              plea_text: pleaText
            }),
            signal: controller.signal
          });

          if (res.ok) {
            verdictData = await res.json();
            if (typeof verdictData === "string") {
              verdictData = JSON.parse(verdictData);
            }
          }
        }
        clearTimeout(timeoutId);

        if (verdictData) {
          console.log("⚡ [BACKEND] Received Judicial Ruling:", verdictData);
        }
      } catch (err) {
        console.warn("[BACKEND] Judicial endpoint offline or timed out, activating internal GPU jury fallback:", err);
      }
    }

    // 8. Graceful Mock Fallback (if backend offline or mock mode)
    if (!verdictData) {
      await new Promise(r => setTimeout(r, CONFIG.MOCK_LATENCY_MS));
      const lower = (pleaText || '').toLowerCase();
      const isPardoned = lower.includes('cat') || lower.includes('cheaper') || Math.random() < 0.35;
      const fallbackCaseId = `TAB-${Math.floor(1000 + Math.random() * 9000)}`;

      verdictData = {
        verdict: isPardoned ? "PARDONED" : "GUILTY",
        sentence: isPardoned
          ? `CASE DISMISSED! A plausible defense. The Court reluctantly grants tab euthanasia. Tab closure permitted in ${CONFIG.PARDON_CLOSE_DELAY_MS / 1000} seconds...`
          : `GUILTY AS CHARGED! The excuse "${pleaText}" is utterly rejected! You had 42 tabs open! This tab is condemned to eternal memory allocation!`,
        confidence: 0.92,
        case_id: fallbackCaseId,
        pdf_download_url: `http://127.0.0.1:8000/order/${fallbackCaseId}.pdf`
      };
    }

    // 9. Route to Verdict Phase
    const verdictStr = (verdictData.verdict || "GUILTY").toUpperCase();
    const isGuilty = verdictStr.includes("GUILTY");

    if (isGuilty) {
      this.transitionTo('VERDICT_GUILTY', { plea: pleaText, verdictData });
    } else {
      this.transitionTo('VERDICT_PARDONED', { plea: pleaText, verdictData });
    }
  },

  enterVerdictGuilty(pleaText, verdictData = {}) {
    cancelScreenDismissCountdown();
    if (DOM.deliberationBanner) {
      DOM.deliberationBanner.classList.remove('active');
    }

    // Ensure previous alerts and stamps are hidden while judge speaks
    if (DOM.resurrectAlert) DOM.resurrectAlert.classList.remove('active');
    if (DOM.pdfContainer) {
      DOM.pdfContainer.classList.remove('active');
      DOM.pdfContainer.style.display = 'none';
    }
    if (DOM.verdictStampContainer) DOM.verdictStampContainer.classList.remove('active');

    // Step 1: Judge speaks the full judicial ruling speech FIRST
    setJudgeSprite('stern_talking');
    const guiltSpeech = verdictData.sentence || `GUILTY AS CHARGED! The excuse "${pleaText}" is utterly rejected! You had 42 tabs open! This tab is condemned to eternal memory allocation!`;

    typewriter.type(guiltSpeech, {
      speed: CONFIG.TYPEWRITER_SPEED_MS,
      onStart: () => {
        setJudgeSprite('stern_talking');
      },
      onComplete: () => {
        // Step 2: The message has finished fully appearing!
        // Deliver the dramatic climax: Gavel cutscene, quake, and stamp!
        setJudgeSprite('surprised');

        setTimeout(() => {
          // Full-screen Gavel strike cutscene overlay
          if (DOM.gavelCutscene && DOM.gavelCutsceneImg) {
            DOM.gavelCutsceneImg.src = ASSETS.sprites.gavel + '?t=' + Date.now();
            DOM.gavelCutscene.classList.add('active');
          }

          // Loud Gavel strike audio
          sound.play('gavel');

          // Screen quake
          if (DOM.container) {
            DOM.container.classList.remove('screen-shake');
            void DOM.container.offsetWidth;
            DOM.container.classList.add('screen-shake');
          }
          if (DOM.gavelCutscene) {
            DOM.gavelCutscene.classList.remove('screen-shake');
            void DOM.gavelCutscene.offsetWidth;
            DOM.gavelCutscene.classList.add('screen-shake');
          }

          // Step 3: After gavel animation completes (~1150ms), return to courtroom UI
          setTimeout(() => {
            if (DOM.gavelCutscene) {
              DOM.gavelCutscene.classList.remove('active');
              DOM.gavelCutscene.classList.remove('screen-shake');
            }
            if (DOM.container) {
              DOM.container.classList.remove('screen-shake');
            }

            // Judge rests in stern mode on the bench
            setJudgeSprite('stern_idle');

            // 1. SLAM red GUILTY stamp directly over action buttons!
            if (DOM.verdictStampContainer && DOM.verdictStamp) {
              DOM.verdictStamp.className = 'verdict-stamp guilty stamp-slam';
              DOM.verdictStamp.textContent = 'GUILTY';
              DOM.verdictStampContainer.classList.add('active');
            }

            // 2. STAGGERED REVEAL: 500ms after stamp, smoothly slide in the Sanction Enforced alert
            setTimeout(() => {
              if (DOM.resurrectAlert) {
                DOM.resurrectAlert.classList.add('active');
              }
            }, 500);

            // 3. STAGGERED REVEAL: 1200ms after stamp, smoothly reveal Official PDF Warrant button
            setTimeout(() => {
              if (verdictData.pdf_download_url && DOM.pdfContainer && DOM.pdfDownloadBtn) {
                DOM.pdfDownloadBtn.href = verdictData.pdf_download_url;
                DOM.pdfContainer.classList.add('active');
                DOM.pdfContainer.style.display = 'flex';
              }
            }, 1200);

            // Step 4: Trigger Chrome Extension tab resurrection in background
            if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
              try {
                if (chrome.tabs && chrome.tabs.getCurrent) {
                  chrome.tabs.getCurrent((currentTab) => {
                    const tabId = currentTab ? currentTab.id : null;
                    const winId = currentTab ? currentTab.windowId : null;

                    chrome.runtime.sendMessage({
                      action: "REVIVE_TAB",
                      url: STATE.accusedUrl,
                      courtTabId: tabId,
                      courtWindowId: winId
                    }, (response) => {
                      if (chrome.runtime.lastError) {
                        console.warn("[Chrome] Tab revival message notice:", chrome.runtime.lastError.message);
                      } else {
                        console.log("📌 [Chrome] Tab Resurrected & Pinned:", response);
                      }
                    });
                  });
                } else {
                  chrome.runtime.sendMessage({
                    action: "REVIVE_TAB",
                    url: STATE.accusedUrl
                  });
                }
              } catch (e) {
                console.warn("[Chrome] Extension runtime unavailable:", e);
              }
            }

            // Step 5: Screen stays locked for 30 MINUTES punishment detention AFTER final verdict is fully given!
            setTimeout(() => {
              startScreenDismissCountdown(CONFIG.GUILTY_TIMEOUT_MS, 'GUILTY');
            }, 1200);
          }, 1150);
        }, 350);
      }
    });
  },

  enterVerdictPardoned(pleaText, verdictData = {}) {
    cancelScreenDismissCountdown();
    if (DOM.deliberationBanner) {
      DOM.deliberationBanner.classList.remove('active');
    }

    // Ensure previous alerts and stamps are hidden while judge speaks
    if (DOM.resurrectAlert) DOM.resurrectAlert.classList.remove('active');
    if (DOM.pdfContainer) {
      DOM.pdfContainer.classList.remove('active');
      DOM.pdfContainer.style.display = 'none';
    }
    if (DOM.verdictStampContainer) DOM.verdictStampContainer.classList.remove('active');

    // Step 1: Judge speaks dismissal speech FIRST
    setJudgeSprite('normal_talking');
    const pardonSpeech = verdictData.sentence || `CASE DISMISSED! A plausible defense. The Court reluctantly grants tab euthanasia. Tab closure permitted in ${CONFIG.PARDON_CLOSE_DELAY_MS / 1000} seconds...`;

    typewriter.type(pardonSpeech, {
      speed: CONFIG.TYPEWRITER_SPEED_MS,
      onStart: () => {
        setJudgeSprite('normal_talking');
      },
      onComplete: () => {
        // Step 2: Speech has finished fully appearing!
        // 1. Judge approving nod + 8-bit acquittal fanfare
        setJudgeSprite('nodding');
        sound.play('acquitted');

        // 2. SLAM emerald PARDONED stamp directly over action buttons!
        if (DOM.verdictStampContainer && DOM.verdictStamp) {
          DOM.verdictStamp.className = 'verdict-stamp pardoned stamp-slam';
          DOM.verdictStamp.textContent = 'PARDONED';
          DOM.verdictStampContainer.classList.add('active');
        }

        // 3. STAGGERED REVEAL: 800ms later, smoothly reveal the Official PDF Warrant button
        setTimeout(() => {
          if (verdictData.pdf_download_url && DOM.pdfContainer && DOM.pdfDownloadBtn) {
            DOM.pdfDownloadBtn.href = verdictData.pdf_download_url;
            DOM.pdfContainer.classList.add('active');
            DOM.pdfContainer.style.display = 'flex';
          }
        }, 800);

        // Step 4: Screen stays open for 15 seconds AFTER final verdict is fully given!
        setTimeout(() => {
          startScreenDismissCountdown(CONFIG.PARDON_CLOSE_DELAY_MS, 'PARDONED');
        }, 800);
      }
    });
  }
};

// --- 10. INITIALIZATION & EVENT BINDINGS ---
function initCourtroom() {
  initDOMReferences();

  // Parse query parameters
  const urlParams = new URLSearchParams(window.location.search);
  STATE.accusedTitle = urlParams.get('title') || "Wikipedia: List of Unfinished Projects";
  STATE.accusedUrl = urlParams.get('url') || "https://en.wikipedia.org/wiki/List_of_unsolved_problems";
  const parsedTabId = parseInt(urlParams.get('courtTabId'), 10);
  const parsedWinId = parseInt(urlParams.get('courtWinId'), 10);
  if (!isNaN(parsedTabId)) STATE.courtTabId = parsedTabId;
  if (!isNaN(parsedWinId)) STATE.courtWinId = parsedWinId;

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  STATE.caseId = `CASE #TAB-${randomNum}`;

  // Update HUD
  if (DOM.accusedTitle) DOM.accusedTitle.textContent = STATE.accusedTitle;
  if (DOM.accusedUrl) DOM.accusedUrl.textContent = STATE.accusedUrl;
  if (DOM.caseId) DOM.caseId.textContent = STATE.caseId;

  if (DOM.engineStatus) {
    DOM.engineStatus.textContent = CONFIG.USE_MOCK ? "MOCK GPU JURY" : "OLLAMA AI JURY";
    if (CONFIG.USE_MOCK) DOM.engineStatus.classList.add('mock-active');
    else DOM.engineStatus.classList.remove('mock-active');
  }

  // Preload Sprites
  preloadSprites();

  // Bind Quick Plea Chips
  DOM.presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const plea = chip.getAttribute('data-plea');
      if (DOM.pleaInput && plea) {
        DOM.pleaInput.value = plea;
        updateCharCounter();
        DOM.pleaInput.focus();
        playChipClick();
      }
    });
  });

  // Bind Character Counter Input Listener
  if (DOM.pleaInput) {
    DOM.pleaInput.addEventListener('input', updateCharCounter);
  }

  // Bind Voice Mic Button
  if (DOM.micBtn) {
    DOM.micBtn.addEventListener('click', () => {
      voice.toggle();
    });
  }

  // Bind Audio Toggle Button
  if (DOM.audioBtn) {
    DOM.audioBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      DOM.audioBtn.textContent = isMuted ? "🔇 SFX: OFF" : "🔊 SFX: ON";
      DOM.audioBtn.style.color = isMuted ? "#888" : "var(--gold-primary)";
    });
  }

  // Bind Dialogue Skip / Replay
  if (DOM.dialogueContainer) {
    DOM.dialogueContainer.addEventListener('click', () => {
      if (typewriter.isTyping) {
        typewriter.skip();
      } else if (STATE.currentPhase === 'AWAITING_PLEA') {
        CourtroomFSM.transitionTo('ARRAIGNMENT');
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement !== DOM.pleaInput) {
      if (typewriter.isTyping) {
        e.preventDefault();
        typewriter.skip();
      }
    }
  });

  // Bind Plea Submit Action
  const submitPlea = () => {
    if (STATE.currentPhase === 'DELIBERATING' || STATE.currentPhase.startsWith('VERDICT')) {
      return;
    }
    sound.playSubmitClick();
    if (voice && voice.isRecording) {
      voice.stop(true);
    }
    const text = (DOM.pleaInput && DOM.pleaInput.value.trim()) || "Your Honor, I swear I was going to read it!";
    STATE.submittedPlea = text;
    CourtroomFSM.transitionTo('DELIBERATING', { plea: text });
  };

  if (DOM.submitBtn) {
    DOM.submitBtn.addEventListener('click', submitPlea);
  }

  if (DOM.pleaInput) {
    DOM.pleaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitPlea();
      }
    });
  }

  // Universal First Interaction Listener (Unlocks Audio on Click or Key)
  const unlockAudioGesture = () => {
    sound.unlock();
    window.removeEventListener('pointerdown', unlockAudioGesture);
    window.removeEventListener('keydown', unlockAudioGesture);

    if (STATE.currentPhase === 'AWAITING_UNLOCK') {
      CourtroomFSM.transitionTo('ARRAIGNMENT');
    }
  };

  window.addEventListener('pointerdown', unlockAudioGesture, { passive: true });
  window.addEventListener('keydown', unlockAudioGesture, { passive: true });

  if (DOM.audioUnlockPrompt) {
    DOM.audioUnlockPrompt.addEventListener('click', unlockAudioGesture);
  }

  console.log("⚖️ [TAB COURT] Engine Online.", {
    case: STATE.caseId,
    title: STATE.accusedTitle,
    mock: CONFIG.USE_MOCK,
    api: CONFIG.API_URL
  });

  // Announce court open and enforce fullscreen immediately
  notifyCourtOpened();
  enforceCourtFullscreen();

  // Confirm tabId and windowId asynchronously if not yet set from URL
  if (window.chrome?.tabs?.getCurrent) {
    chrome.tabs.getCurrent((tab) => {
      if (tab) {
        if (!STATE.courtTabId) STATE.courtTabId = tab.id;
        if (!STATE.courtWinId) STATE.courtWinId = tab.windowId;
        notifyCourtOpened();
      }
    });
  } else if (window.chrome?.tabs?.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        if (!STATE.courtTabId) STATE.courtTabId = tabs[0].id;
        if (!STATE.courtWinId) STATE.courtWinId = tabs[0].windowId;
        notifyCourtOpened();
      }
    });
  }

  // Check autoplay status on start
  sound.checkAutoplay(
    () => {
      CourtroomFSM.transitionTo('ARRAIGNMENT');
    },
    () => {
      CourtroomFSM.transitionTo('AWAITING_UNLOCK');
    }
  );
}

// --- 11. ANTI-ESCAPE & FULLSCREEN ANNOYANCE CONTROLLER ---
function enforceCourtFullscreen() {
  // 1. Chrome Extension Windows API (Immediate window-level fullscreen, NO user gesture required!)
  if (window.chrome && chrome.windows && chrome.windows.getCurrent) {
    chrome.windows.getCurrent((win) => {
      if (win && win.id) {
        chrome.windows.update(win.id, { state: "fullscreen", focused: true }).catch(() => {});
      }
    });
  }

  // 2. DOM Fullscreen API (when user interacts)
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } catch (e) {}

  // 3. Message background script to guarantee fullscreen
  if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: "REQUEST_FULLSCREEN" }, () => {});
  }
}

function notifyCourtOpened() {
  const tabId = STATE.courtTabId;
  const winId = STATE.courtWinId;

  if (window.chrome?.storage?.local) {
    chrome.storage.local.set({
      isCourtActive: true,
      courtStatus: "IN_SESSION",
      activeCourtTabId: tabId,
      activeCourtWindowId: winId,
      activeCourtUrl: window.location.href
    });
  }

  if (window.chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      action: "COURT_OPENED",
      tabId: tabId,
      windowId: winId,
      url: window.location.href
    }, () => {});
  }

  if (winId && window.chrome?.windows?.update) {
    chrome.windows.update(winId, { state: "fullscreen", focused: true }).catch(() => {});
  }
}

// Named handler so it can be cleanly removed when trial completes
function handleBeforeUnload(e) {
  if (!STATE.trialComplete) {
    e.preventDefault();
    e.returnValue = "COURT IS IN SESSION! Attorney General Tab-ney Wright has not adjourned!";
    return e.returnValue;
  }
}

window.addEventListener('beforeunload', handleBeforeUnload);

// Relentlessly retain focus if user attempts to switch tabs, windows, or blur
function snapFocusBackToCourt() {
  if (!STATE.trialComplete) {
    window.focus();
    const tabId = STATE.courtTabId;
    const winId = STATE.courtWinId;

    if (tabId && window.chrome?.tabs?.update) {
      chrome.tabs.update(tabId, { active: true }).catch(() => {});
    }
    if (winId && window.chrome?.windows?.update) {
      chrome.windows.update(winId, { focused: true }).catch(() => {});
    }
    if (window.chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: "RETAIN_COURT_FOCUS", tabId: tabId, windowId: winId }, () => {});
    }
  }
}

window.addEventListener('blur', snapFocusBackToCourt);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !STATE.trialComplete) {
    snapFocusBackToCourt();
  }
});

// Periodic heartbeat: if tab is hidden and trial is not complete, snap back instantly
const courtGuardInterval = setInterval(() => {
  if (STATE.trialComplete) {
    clearInterval(courtGuardInterval);
    return;
  }
  if (document.hidden) {
    snapFocusBackToCourt();
  }
}, 400);

// Any user gesture (pointerdown, click, keydown) enforces fullscreen
window.addEventListener('pointerdown', enforceCourtFullscreen, { passive: true });
window.addEventListener('keydown', enforceCourtFullscreen, { passive: true });
window.addEventListener('click', enforceCourtFullscreen, { passive: true });

// Kick off initialization on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCourtroom);
} else {
  initCourtroom();
}
