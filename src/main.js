/**
 * main.js — App entry point.
 *
 * Orchestrates the complete Milestone 1 flow:
 *   Camera → Scan → AI Detection → DNA Generation → Passport Reveal
 *
 * Each module (Camera, AIService, GameState, UIRenderer, AudioManager)
 * is independent and testable. This file wires them together.
 */

import { Camera } from './camera.js';
import { AIService } from './ai-service.js';
import { GameState } from './game-state.js';
import { UIRenderer } from './ui-renderer.js';
import { AudioManager } from './audio.js';
import { getFallbackDNA } from './fallback.js';
import { Immigration } from './immigration.js';
import { World } from './world.js';
import { Shop } from './shop.js';
import { VideoManager } from './video-manager.js';
import { GameIntro } from './intro.js';

class App {
  constructor() {
    this.camera = new Camera();
    this.ai = new AIService();
    this.gameState = new GameState();
    this.audio = new AudioManager();
    this.ui = null; // Initialized after audio loads
  }

  async init() {
    console.log('🎮 ENNE KOLLAND IRIKKAN PATTO? — Initializing...');

    // Load audio (non-blocking — missing files are skipped)
    await this.audio.loadSounds();

    // Initialize UI renderer (needs audio for sound triggers)
    this.ui = new UIRenderer(this.audio);
    // Video manager
    this.videoManager = new VideoManager(this.ai, this.ui);
    // Intro sequence
    this.intro = new GameIntro(this.ui, this.audio);
    // Run intro (await so we start after it completes or is skipped)
    try { await this.intro.run(); } catch (e) { /* ignore */ }

    // Try to start camera
    const cameraOk = await this.camera.start();

    if (cameraOk) {
      this.ui.enableScanButton();
      this._bindScanButton();
    } else {
      // Camera failed — switch to manual entry
      this.ui.showCameraFailed();
      setTimeout(() => {
        this.ui.showScreen('manual');
        this._bindManualEntry();
      }, 1500);
    }

    console.log('🎮 App ready. Camera:', cameraOk ? '✓' : '✗');
  }

  // ─── Scan Flow (Camera → AI → Birth) ───────────────────────────

  _bindScanButton() {
    const btn = document.getElementById('scan-btn');
    btn.addEventListener('click', () => this._onScan());
  }

  async _onScan() {
    const btn = document.getElementById('scan-btn');
    btn.disabled = true;

    // 1. Capture FIRST frame immediately for the preview image
    const previewFrame = this.camera.capture();
    if (!previewFrame) {
      console.error('[SCAN] Failed to capture preview frame');
      btn.disabled = false;
      return;
    }

    // 2. Show scanning animation with the preview image
    this.ui.showScanning(previewFrame);
    this.audio.play('scan');

    // 3. Capture remaining frames in background (2 more @ 500ms apart)
    //    Frame 1 was already captured as previewFrame
    this.ui.updateScanningText('CAPTURING FRAME 1 / 3…');
    const extraFrames = await this.camera.captureFrames(2, 600);
    const allFrames = [previewFrame, ...extraFrames];

    this.ui.updateScanningText(`CAPTURED ${allFrames.length} FRAMES — ANALYZING…`);
    await this._delay(300);

    // 4. Run multi-frame consensus AI call
    let result;
    try {
      result = await this._callConsensusWithTimeout(allFrames, 60000);
    } catch (err) {
      console.warn('[SCAN] Consensus AI failed, using fallback:', err.message);
      result = { dna: getFallbackDNA(''), confidence: 0, candidates: [], needsRescan: false };
    }

    const { dna, confidence, candidates, needsRescan } = result;

    // 5. Handle confidence levels
    if (needsRescan || confidence < 0.40) {
      // LOW CONFIDENCE — show scanner report
      this.ui.showScannerReport(candidates, confidence, () => {
        // Retry scan
        btn.disabled = false;
        this.ui.showScreen('scan');
      }, async (typedName) => {
        // User typed a name manually
        btn.disabled = true;
        this.ui.showScreen('scanning');
        this.ui.updateScanningText(`GENERATING FOR: ${typedName.toUpperCase()}…`);
        let manualDna;
        try {
          manualDna = await this._callManualBirthWithTimeout(typedName, 45000);
        } catch {
          manualDna = getFallbackDNA(typedName);
        }
        await this._completeScan(manualDna, previewFrame);
      });
      return;
    }

    // 6. HIGH/MEDIUM confidence — proceed normally
    const confPct = Math.round(confidence * 100);
    const confEmoji = confidence >= 0.75 ? '✅' : '⚠️';
    this.ui.updateScanningText(`${confEmoji} ${dna.name.toUpperCase()} IDENTIFIED (${confPct}% match)`);
    await this._delay(600);
    await this._completeScan(dna, previewFrame);
  }

  /** Shared completion logic after object is identified */
  async _completeScan(dna, imageData) {
    // Initialize game state
    this.gameState.initFromBirth(dna, imageData);
    if (this.audio && typeof this.audio.resetDeathFlag === 'function') this.audio.resetDeathFlag();

    // Start background life script generation
    this.ai.generateLifeScript(dna)
      .then(script => {
        console.log('[APP] Pre-generated life script ready');
        this.gameState.setLifeScript(script);
      })
      .catch(err => console.error('[APP] Pre-generated life script failed', err));

    // Stop camera (free resources)
    this.camera.stop();

    // Show birth/passport reveal
    await this.ui.showBirthReveal(dna, imageData);

    // Bind the "Begin Life" button
    this._bindBeginLife();
  }

  // ─── Manual Entry Flow ──────────────────────────────────────────

  _bindManualEntry() {
    const btn = document.getElementById('manual-submit');
    const input = document.getElementById('manual-input');

    const submit = async () => {
      const name = input.value.trim();
      if (!name) return;

      btn.disabled = true;

      // Show scanning animation (no image for manual entry)
      const img = document.getElementById('captured-image');
      img.style.display = 'none';
      this.ui.showScreen('scanning');
      document.getElementById('scanning-text').innerHTML =
        `GENERATING IDENTITY FOR: ${name.toUpperCase()}<span class="dots"></span>`;

      // Try AI birth from name
      let dna;
      try {
        dna = await this._callManualBirthWithTimeout(name, 45000);
      } catch (err) {
        console.warn('[MANUAL] AI birth failed, using fallback:', err.message);
        dna = getFallbackDNA(name);
      }

      // Initialize state (no image)
      this.gameState.initFromBirth(dna, null);
      if (this.audio && typeof this.audio.resetDeathFlag === 'function') this.audio.resetDeathFlag();

      // Start background life script generation
      this.ai.generateLifeScript(dna)
        .then(script => {
          console.log('[APP] Pre-generated life script ready');
          this.gameState.setLifeScript(script);
        })
        .catch(err => {
          console.error('[APP] Pre-generated life script failed', err);
        });

      // Show birth reveal
      this.ui.updateScanningText(`★ ${dna.name.toUpperCase()} IDENTIFIED ★`);
      await this._delay(600);
      await this.ui.showBirthReveal(dna, null);

      this._bindBeginLife();
    };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  }

  // ─── Begin Life (Milestone 2 hook) ──────────────────────────────

  _bindBeginLife() {
    const btn = document.getElementById('btn-begin-life');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      this.audio.play('click');
      btn.disabled = true;
      btn.textContent = 'PREPARING YOUR NEW LIFE...';

      // Run immigration mini-game first (live AI answers)
      try {
        const immigration = new Immigration(this.ai, this.ui, this.gameState, this.audio);
        const allowed = await immigration.run();
        if (!allowed) {
          // Rejected — show message and reset to scan
          alert('VISA REJECTED — You are asked to leave the airport.');
          this._resetGame();
          return;
        }
        // On approval, transition to the small world for exploration
        await this._enterWorld();
      } catch (err) {
        console.error('[IMMIGRATION] Error:', err);
        // On error, allow the life to continue (fail-open)
      }

      // Start the life loop (pre-generated script continues in background)
      await this._runLifeLoop();
    });
  }

  async _runLifeLoop() {
    try {
      // Show a loading screen while waiting for the life script
      if (!this.gameState.lifeScript) {
        this.ui.showScreen('scanning');
        const scanText = document.getElementById('scanning-text');
        const scanBar = document.getElementById('scanning-bar-fill');
        const objectName = this.gameState.objectDNA?.name || 'Object';
        
        const loadingMessages = [
          `${objectName}-nte destiny ezhuthunnu...`,
          `Life chapters generate cheyyunnu...`,
          `Dramatic twists add cheyyunnu...`,
          `Death scene prepare cheyyunnu... 💀`,
          `Almost ready... patience mwone!`,
        ];
        
        let progress = 0;
        let msgIdx = 0;
        
        while (!this.gameState.lifeScript) {
          progress = Math.min(95, progress + Math.random() * 12 + 3);
          if (scanBar) scanBar.style.width = `${progress}%`;
          if (scanText) {
            scanText.innerHTML = `${loadingMessages[msgIdx]}<br><span style="font-size:0.8em;color:#00ff88;">${Math.round(progress)}% complete</span>`;
          }
          msgIdx = (msgIdx + 1) % loadingMessages.length;
          await this._delay(800);
        }
        
        // Script is ready!
        if (scanBar) scanBar.style.width = '100%';
        if (scanText) scanText.innerHTML = `✅ ${objectName}-nte life READY!<br><span style="font-size:0.8em;color:#00ff88;">100% — LET'S GO!</span>`;
        await this._delay(600);
      }

      // Loop: pull pre-generated encounters for chapters 1-4
      while (!this.gameState.isFinalChapter) {
        const chapterData = this.gameState.lifeScript.chapters[this.gameState.chapter - 1];
        if (!chapterData) {
          console.error('[LIFE LOOP] Missing chapter data in pre-generated script');
          break;
        }

        const encounter = {
          scene: chapterData.scene,
          choiceA: { label: chapterData.choiceA.label, emoji: chapterData.choiceA.emoji },
          choiceB: { label: chapterData.choiceB.label, emoji: chapterData.choiceB.emoji }
        };

        // 2. Show encounter & get choice
        const choice = await this.ui.showEncounter(
          encounter,
          this.gameState.chapter,
          this.gameState.totalChapters,
          this.gameState.currentState,
          this.gameState.objectDNA,
          this.gameState.objectImage
        );

        // 3. Resolve choice locally
        const result = choice === 'A' ? chapterData.choiceA : chapterData.choiceB;

        // 4. Update state
        this.gameState.applyConsequence(result);

        // 5. Show consequence overlay & wait for continue
        await this.ui.showConsequence(result, this.gameState.currentState);

        // 6. Advance to next chapter
        this.gameState.advanceChapter();
      }

      // Natural loop end — trigger death using pre-generated death scene
      await this._handleDeath(this.gameState.lifeScript.death);

    } catch (err) {
      console.error('[LIFE LOOP ERROR]', err);
      alert('Error during life simulation: ' + err.message);
      this.ui.showScreen('birth'); // fallback to passport
    }
  }

  async _handleDeath(deathData) {
    this.gameState.recordDeath(deathData.deathCause);

    // Show death screen
    await this.ui.showDeath(
      deathData,
      this.gameState.objectDNA,
      this.gameState.objectImage
    );

    // Wait for user to click "View Life Summary"
    const viewBtn = document.getElementById('btn-view-life');
    if (viewBtn) {
      await new Promise(resolve => {
        viewBtn.addEventListener('click', () => {
          this.audio.play('click');
          // Play life-summary tune (lst.mp3) if available
          try { if (this.audio && typeof this.audio.play === 'function') this.audio.play('lst'); } catch(e){}
          resolve();
        }, { once: true });
      });
    }

    // Pass eulogy string to the final state context
    this.gameState.deathData = deathData;

    // Show summary screen
    await this.ui.showLifeSummary(this.gameState.toEulogyContext());

    // User clicked "Scan Another Object" (the showLifeSummary promise resolves)
    this._resetGame();
  }

  _resetGame() {
    this.gameState.reset();
    this.ui.resetUI();
    this.ui.showScreen('scan');
    // Restart camera
    this.camera.start().then(ok => {
      if (ok) {
        this.ui.enableScanButton();
      }
    });
  }

  // ─── World / shop integration (vertical slice) ─────────────────
  async _enterWorld() {
    // Initialize world and shop modules
    this.world = new World(this.ui, this.gameState, this.audio);
    this.shop = new Shop(this.ai, this.ui, this.gameState, this.audio, this.videoManager);

    // When entering shop trigger, stop world loop and run shop interaction
    this.world.start(async () => {
      // Pause world
      this.world.stop();
      await this.shop.interact();
      // After shop returns, allow re-entering shop by re-assigning callback
      this.world.onEnterShop = async () => {
        this.world.stop();
        await this.shop.interact();
      };
      // resume world
      this.world.running = true;
      this.world.lastTime = performance.now();
      this.world._loop(this.world.lastTime);
    });
  }

  // ─── AI Call Helpers ────────────────────────────────────────────

  /**
   * Run multi-frame consensus with timeout.
   * Returns the full {dna, confidence, candidates, needsRescan} result.
   */
  async _callConsensusWithTimeout(frames, timeoutMs) {
    return Promise.race([
      this.ai.detectAndBirth(frames),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), timeoutMs)
      ),
    ]);
  }

  async _callManualBirthWithTimeout(name, timeoutMs) {
    return Promise.race([
      this.ai.birthFromName(name),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), timeoutMs)
      ),
    ]);
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ─── Boot ─────────────────────────────────────────────────────────

const app = new App();
app.init().catch(err => {
  console.error('💀 Fatal init error:', err);
});
