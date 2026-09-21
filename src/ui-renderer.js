/**
 * ui-renderer.js — Passport overlay rendering on pass.png
 *
 * Uses the user-designed pass.png as the fixed background template.
 * Dynamically overlays the scanned object's photo and AI-generated
 * identity fields at precise positions on the passport.
 */

// ═══════════════════════════════════════════════════════════════════
// PASSPORT FIELD LAYOUT — percentage positions on pass.png
// Adjust these values to fine-tune text alignment on the passport.
// All values are percentages of the passport image dimensions.
// ═══════════════════════════════════════════════════════════════════

const PASSPORT_LAYOUT = {
  // ─── Left page: Photo area ─────────────────────────────────────
  photo: {
    left: 6.64, top: 29.00, width: 18.16, height: 35.74,
  },

  // ─── Left page: Identity fields (inside the blank input boxes) ──
  name: {
    left: 26.76, top: 29.49, width: 15.49, height: 4.00,
    maxChars: 22, lines: 1,
  },
  objectType: {
    left: 28.19, top: 37.60, width: 15.00, height: 4.00,
    maxChars: 18, lines: 1,
  },
  origin: {
    left: 27.73, top: 45.02, width: 18.00, height: 5.50,
    maxChars: 45, lines: 2,
  },
  dateOfBirth: {
    left: 26.11, top: 51.27, width: 17.90, height: 4.10,
    maxChars: 25, lines: 1,
  },
  nationality: {
    left: 30, top: 66.5, width: 17, height: 4,
    maxChars: 18, lines: 1,
    hidden: true // Already written on pass.png
  },
  passportNumber: {
    left: 26.89, top: 64.94, width: 17.12, height: 4.10,
    maxChars: 12, lines: 1,
  },

  // ─── Right page: Personality fields (taller boxes, multi-line) ──
  personality: {
    left: 60.61, top: 24.61, width: 16.15, height: 6.05,
    maxChars: 55, lines: 2,
  },
  lifeGoal: {
    left: 80.27, top: 25.10, width: 16.73, height: 5.76,
    maxChars: 60, lines: 2,
  },
  mood: {
    left: 60.42, top: 33.79, width: 14.39, height: 4.10,
    maxChars: 28, lines: 1,
  },
  strength: {
    left: 80.27, top: 33.30, width: 16.73, height: 5.96,
    maxChars: 45, lines: 2,
  },
  fear: {
    left: 60.29, top: 42.87, width: 16.15, height: 4.30,
    maxChars: 35, lines: 1,
  },
  weakness: {
    left: 80.27, top: 42.19, width: 16.60, height: 6.25,
    maxChars: 45, lines: 2,
  },
  inability: {
    left: 60.42, top: 51.27, width: 15.36, height: 5.27,
    maxChars: 45, lines: 2,
  },
  backstory: {
    left: 80.40, top: 51.07, width: 16.15, height: 7.13,
    maxChars: 55, lines: 2,
  },
};

// Field reveal order for animation
const REVEAL_ORDER_LEFT = ['name', 'objectType', 'origin', 'dateOfBirth', 'nationality', 'passportNumber'];
const REVEAL_ORDER_RIGHT = ['personality', 'lifeGoal', 'mood', 'strength', 'fear', 'weakness', 'inability', 'backstory'];

export class UIRenderer {
  constructor(audioManager) {
    this.audio = audioManager;
    this.screens = {
      scan: document.getElementById('screen-scan'),
      scanning: document.getElementById('screen-scanning'),
      birth: document.getElementById('screen-birth'),
      manual: document.getElementById('screen-manual'),
      immigration: document.getElementById('screen-immigration'),
      encounter: document.getElementById('screen-encounter'),
      death: document.getElementById('screen-death'),
      summary: document.getElementById('screen-summary'),
    };
  }

  resetUI() {
    // Hide all screens, show scan screen
    Object.values(this.screens).forEach(s => s && s.classList.remove('active'));
    const birthContent = document.getElementById('birth-content');
    if (birthContent) birthContent.innerHTML = '';
    const encounterContent = document.getElementById('encounter-content');
    if (encounterContent) encounterContent.innerHTML = '';
    // Re-enable scan button
    const btn = document.getElementById('scan-btn');
    if (btn) btn.disabled = false;
    const hint = document.getElementById('camera-hint');
    if (hint) hint.textContent = 'Hold an object in front of the camera and press SCAN';
  }

  // ─── Screen Management ──────────────────────────────────────────

  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    const target = this.screens[name];
    if (target) target.classList.add('active');
  }

  // ─── Scan Screen ────────────────────────────────────────────────

  enableScanButton() {
    const btn = document.getElementById('scan-btn');
    const hint = document.getElementById('camera-hint');
    btn.disabled = false;
    hint.textContent = 'Hold an object in front of the camera and press SCAN';
  }

  showCameraFailed() {
    const hint = document.getElementById('camera-hint');
    hint.textContent = 'Camera unavailable — switching to manual entry...';
    hint.style.color = '#e74c3c';
  }

  // ─── Scanning Animation ─────────────────────────────────────────

  showScanning(imageDataUrl) {
    const img = document.getElementById('captured-image');
    img.src = imageDataUrl;
    img.style.display = 'block';

    const text = document.getElementById('scanning-text');
    text.innerHTML = 'ANALYZING ENTITY<span class="dots"></span>';

    const bar = document.getElementById('scanning-bar-fill');
    bar.style.width = '0%';

    this.showScreen('scanning');
    this._animateScanProgress();
  }

  _animateScanProgress() {
    const bar = document.getElementById('scanning-bar-fill');
    const text = document.getElementById('scanning-text');

    const stages = [
      { pct: '15%', label: 'SCANNING OBJECT' },
      { pct: '30%', label: 'IDENTIFYING ENTITY' },
      { pct: '50%', label: 'GENERATING IDENTITY' },
      { pct: '70%', label: 'WRITING BACKSTORY' },
      { pct: '85%', label: 'ISSUING PASSPORT' },
      { pct: '92%', label: 'STAMPING DOCUMENTS' },
    ];

    stages.forEach((stage, i) => {
      setTimeout(() => {
        bar.style.width = stage.pct;
        text.innerHTML = `${stage.label}<span class="dots"></span>`;
      }, i * 1500);
    });
  }

  updateScanningText(newText) {
    const text = document.getElementById('scanning-text');
    text.innerHTML = newText;
    const bar = document.getElementById('scanning-bar-fill');
    bar.style.width = '100%';
  }

  /**
   * Show a Scanner Report card when AI confidence is too low.
   * @param {string[]} candidates - Top object candidates from consensus
   * @param {number} confidence - 0–1 score
   * @param {Function} onRescan - callback when user hits "Scan Again"
   * @param {Function} onType - callback(typedName) when user submits a name
   */
  showScannerReport(candidates, confidence, onRescan, onType) {
    const confPct = Math.round(confidence * 100);

    // Remove any existing report
    document.getElementById('scanner-report-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'scanner-report-overlay';
    overlay.className = 'scanner-report-overlay';

    const candidatesHtml = candidates.length
      ? candidates.map((c, i) => `
          <div class="sr-candidate ${i === 0 ? 'sr-top' : ''}">
            <span class="sr-rank">#${i + 1}</span>
            <span class="sr-name">${c.toUpperCase()}</span>
            ${i === 0 ? '<span class="sr-badge">MOST LIKELY</span>' : ''}
          </div>`).join('')
      : '<div class="sr-candidate">No candidates detected</div>';

    overlay.innerHTML = `
      <div class="scanner-report-card">
        <div class="sr-header">
          <span class="sr-icon">🔍</span>
          <h2 class="sr-title">SCANNER REPORT</h2>
          <div class="sr-subtitle">AI could not identify the object clearly</div>
        </div>

        <div class="sr-confidence-section">
          <div class="sr-conf-label">CONFIDENCE</div>
          <div class="sr-conf-bar-bg">
            <div class="sr-conf-bar-fill ${confPct >= 40 ? 'medium' : 'low'}"
                 style="width: ${Math.max(confPct, 4)}%"></div>
          </div>
          <div class="sr-conf-pct">${confPct}%</div>
        </div>

        <div class="sr-candidates-section">
          <div class="sr-cand-label">TOP CANDIDATES</div>
          ${candidatesHtml}
        </div>

        <div class="sr-hint">
          💡 Hold the object CLOSER and re-scan, OR type its name below
        </div>

        <div class="sr-type-section">
          <input id="sr-type-input" class="sr-type-input" type="text"
                 placeholder="Type object name..." autocomplete="off" />
        </div>

        <div class="sr-actions">
          <button id="sr-rescan-btn" class="sr-btn sr-btn-primary">
            📷 SCAN AGAIN
          </button>
          <button id="sr-type-btn" class="sr-btn sr-btn-secondary">
            ✏️ USE NAME
          </button>
        </div>
      </div>
    `;

    // Mount over the scanning screen
    const scanningScreen = document.getElementById('screen-scanning');
    scanningScreen.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('visible'));

    // Wire up buttons
    document.getElementById('sr-rescan-btn').addEventListener('click', () => {
      overlay.remove();
      onRescan();
    });

    document.getElementById('sr-type-btn').addEventListener('click', () => {
      const name = document.getElementById('sr-type-input').value.trim();
      if (!name) {
        document.getElementById('sr-type-input').classList.add('shake');
        setTimeout(() => document.getElementById('sr-type-input')?.classList.remove('shake'), 500);
        return;
      }
      overlay.remove();
      onType(name);
    });

    document.getElementById('sr-type-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('sr-type-btn').click();
    });
  }



  /**
   * Show the passport with pass.png background and overlaid data.
   * @param {Object} dna - AI-generated passport identity
   * @param {string|null} objectImage - Base64 data URI of captured object
   */
  async showBirthReveal(dna, objectImage) {
    const container = document.getElementById('birth-content');

    // Build the passport overlay HTML
    container.innerHTML = this._buildPassportHTML(dna, objectImage);

    // Switch to birth screen
    this.showScreen('birth');
    this.audio.play('signature1', 0.8);

    // Animation sequence
    await this._delay(200);

    // 1. Passport background slides in
    const passport = container.querySelector('.passport-container');
    if (passport) passport.classList.add('visible');

    await this._delay(600);

    // 2. Photo appears
    const photo = container.querySelector('.pp-photo');
    if (photo) {
      photo.classList.add('reveal');
      this.audio.play('scan');
    }

    await this._delay(500);

    // 3. Photo verified stamp
    const photoStamp = container.querySelector('.pp-photo-stamp');
    if (photoStamp) {
      photoStamp.classList.add('slam');
      this.audio.play('stamp', 0.6);
    }

    await this._delay(400);

    // 4. Left page fields (one by one)
    for (const fieldName of REVEAL_ORDER_LEFT) {
      const el = container.querySelector(`.pp-field-${fieldName}`);
      if (el) {
        el.classList.add('reveal');
        await this._delay(120);
      }
    }

    await this._delay(300);

    // 5. Right page fields (one by one)
    for (const fieldName of REVEAL_ORDER_RIGHT) {
      const el = container.querySelector(`.pp-field-${fieldName}`);
      if (el) {
        el.classList.add('reveal');
        await this._delay(120);
      }
    }

    await this._delay(400);

    // 6. Final stamp: LIFE REGISTERED
    const finalStamp = container.querySelector('.pp-final-stamp');
    if (finalStamp) {
      finalStamp.classList.add('slam');
      this.audio.play('stamp', 0.9);
      // Shake
      document.getElementById('app').classList.add('shake');
      setTimeout(() => document.getElementById('app').classList.remove('shake'), 400);
    }

    await this._delay(500);
    this.audio.play('signature2', 0.6);

    // 7. Begin life button
    const btn = container.querySelector('.btn-begin-life');
    if (btn) btn.classList.add('reveal');
  }

  // ─── Build Passport HTML ────────────────────────────────────────

  _buildPassportHTML(dna, objectImage) {
    // Build all field overlays
    const fieldOverlays = this._buildFieldOverlays(dna);

    return `
      <div class="passport-container">
        <!-- MASTER BACKGROUND — pass.png, never replaced -->
        <img src="/pass.png" class="passport-bg" alt="Republic of Objects Passport" />

        <!-- Object photo overlay -->
        <div class="pp-photo" style="
          left: ${PASSPORT_LAYOUT.photo.left}%;
          top: ${PASSPORT_LAYOUT.photo.top}%;
          width: ${PASSPORT_LAYOUT.photo.width}%;
          height: ${PASSPORT_LAYOUT.photo.height}%;
        ">
          ${objectImage
            ? `<img src="${objectImage}" alt="Scanned Object" />`
            : `<div class="pp-photo-placeholder">📷</div>`
          }
        </div>

        <!-- Photo verified micro-stamp -->
        <div class="pp-photo-stamp" style="
          left: ${PASSPORT_LAYOUT.photo.left + 1}%;
          top: ${PASSPORT_LAYOUT.photo.top + PASSPORT_LAYOUT.photo.height - 5}%;
        ">✓ VERIFIED</div>

        <!-- Dynamic text fields -->
        ${fieldOverlays}

        <!-- Final stamp overlay -->
        <div class="pp-final-stamp">
          OBJECT LIFE<br/>REGISTERED<br/>✓
        </div>
      </div>

      <!-- Begin Life button (outside passport) -->
      <button class="btn-begin-life" id="btn-begin-life">
        BEGIN YOUR LIFE ▸
      </button>
    `;
  }

  /**
   * Build positioned text overlays for all passport fields.
   */
  _buildFieldOverlays(dna) {
    const fields = [
      // Left page
      { key: 'name', value: dna.name },
      { key: 'objectType', value: dna.objectType },
      { key: 'origin', value: dna.origin },
      { key: 'dateOfBirth', value: dna.dateOfBirth },
      { key: 'nationality', value: dna.nationality },
      { key: 'passportNumber', value: dna.passportNumber },
      // Right page
      { key: 'personality', value: dna.personality },
      { key: 'lifeGoal', value: dna.lifeGoal },
      { key: 'mood', value: dna.mood },
      { key: 'strength', value: dna.strength },
      { key: 'fear', value: dna.fear },
      { key: 'weakness', value: dna.weakness },
      { key: 'inability', value: dna.inability },
      { key: 'backstory', value: dna.backstory },
    ];

    return fields.map(({ key, value }) => {
      const layout = PASSPORT_LAYOUT[key];
      if (!layout || layout.hidden) return '';

      // Truncate to maxChars
      let text = String(value || '');
      if (text.length > layout.maxChars) {
        text = text.substring(0, layout.maxChars - 2) + '…';
      }

      // Choose CSS class based on line count
      const multiClass = layout.lines > 1 ? 'pp-multiline' : '';

      return `<div class="pp-field pp-field-${key} ${multiClass}" style="
        left: ${layout.left}%;
        top: ${layout.top}%;
        width: ${layout.width}%;
        height: ${layout.height}%;
      ">${this._esc(text)}</div>`;
    }).join('\n');
  }

  // ═══════════════════════════════════════════════════════════════════
  // MILESTONE 2: ENCOUNTER SYSTEM
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Show an encounter card with scene narration and two choices.
   * @param {Object} encounter - { scene, choiceA: {label, emoji}, choiceB: {label, emoji} }
   * @param {number} chapter - Current chapter number
   * @param {Object} state - Current game state { condition, money, mood, location }
   * @param {Object} dna - Object DNA (for name/photo display)
   * @param {string} objectImage - base64 image
   * @returns {Promise<string>} "A" or "B" depending on player choice
   */
  showEncounter(encounter, chapter, totalChapters, state, dna, objectImage) {
    return new Promise((resolve) => {
      const container = document.getElementById('encounter-content');

      container.innerHTML = `
        <div class="encounter-card">
          <!-- Chapter indicator -->
          <div class="enc-header">
            <div class="enc-chapter">CHAPTER ${chapter} / ${totalChapters}</div>
            <div class="enc-object-badge">
              ${objectImage
                ? `<img src="${objectImage}" class="enc-object-thumb" alt="${this._esc(dna.name)}" />`
                : `<span class="enc-object-emoji">📦</span>`
              }
              <span class="enc-object-name">${this._esc(dna.name)}</span>
            </div>
          </div>

          <!-- Stats bar -->
          <div class="enc-stats">
            <span class="enc-stat">💰 ₹${state.money}</span>
            <span class="enc-stat">❤️ ${this._esc(state.condition)}</span>
            <span class="enc-stat">😶 ${this._esc(state.mood)}</span>
            <span class="enc-stat">📍 ${this._esc(state.location)}</span>
          </div>

          <!-- Scene narration -->
          <div class="enc-scene">
            <p>${this._esc(encounter.scene)}</p>
          </div>

          <!-- Two choices -->
          <div class="enc-choices">
            <button class="enc-choice enc-choice-a" id="enc-choice-a">
              <span class="enc-choice-emoji">${encounter.choiceA.emoji}</span>
              <span class="enc-choice-label">${this._esc(encounter.choiceA.label)}</span>
            </button>
            <button class="enc-choice enc-choice-b" id="enc-choice-b">
              <span class="enc-choice-emoji">${encounter.choiceB.emoji}</span>
              <span class="enc-choice-label">${this._esc(encounter.choiceB.label)}</span>
            </button>
          </div>
        </div>
      `;

      this.showScreen('encounter');

      // Animate card entrance
      requestAnimationFrame(() => {
        const card = container.querySelector('.encounter-card');
        if (card) card.classList.add('visible');
      });

      // Bind choices
      const btnA = document.getElementById('enc-choice-a');
      const btnB = document.getElementById('enc-choice-b');

      const handleChoice = (choice) => {
        btnA.disabled = true;
        btnB.disabled = true;
        const chosen = choice === 'A' ? btnA : btnB;
        const other = choice === 'A' ? btnB : btnA;
        chosen.classList.add('chosen');
        other.classList.add('not-chosen');
        this.audio.play('click');
        resolve(choice);
      };

      btnA.addEventListener('click', () => handleChoice('A'));
      btnB.addEventListener('click', () => handleChoice('B'));
    });
  }

  /**
   * Show the consequence of a choice with stat changes.
   * @param {Object} result - { consequence, stateChanges, memory }
   * @param {Object} state - Updated game state
   * @returns {Promise<void>} Resolves when player clicks "Continue"
   */
  showConsequence(result, state) {
    return new Promise((resolve) => {
      const container = document.getElementById('encounter-content');

      // Build stat change indicators
      const changes = [];
      if (result.stateChanges) {
        for (const [key, val] of Object.entries(result.stateChanges)) {
          if (val === null || val === undefined) continue;
          if (key === 'money') {
            const sign = val >= 0 ? '+' : '';
            changes.push(`<span class="stat-change ${val >= 0 ? 'positive' : 'negative'}">💰 ${sign}₹${val}</span>`);
          } else {
            changes.push(`<span class="stat-change neutral">${this._esc(key)}: ${this._esc(val)}</span>`);
          }
        }
      }

      // Insert consequence overlay
      const overlay = document.createElement('div');
      overlay.className = 'consequence-overlay';
      overlay.innerHTML = `
        <div class="consequence-card">
          <p class="consequence-text">${this._esc(result.consequence)}</p>
          ${changes.length > 0 ? `<div class="consequence-stats">${changes.join('')}</div>` : ''}
          <div class="consequence-memory">📝 ${this._esc(result.memory)}</div>
          <button class="btn-continue" id="btn-continue">CONTINUE ▸</button>
        </div>
      `;

      container.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('visible'));

      document.getElementById('btn-continue').addEventListener('click', () => {
        this.audio.play('click');
        resolve();
      });
    });
  }

  /**
   * Show the death scene.
   * @param {Object} deathData - { scene, deathCause, epitaph, eulogy }
   * @param {Object} dna - Object DNA
   * @param {string} objectImage - base64 image
   */
  async showDeath(deathData, dna, objectImage) {
    const container = document.getElementById('death-content');

    container.innerHTML = `
      <div class="death-screen">
        <div class="death-cross">✝</div>
        <h1 class="death-title">💀 REST IN PEACE 💀</h1>

        <div class="death-photo-wrapper">
          ${objectImage
            ? `<img src="${objectImage}" class="death-photo" alt="${this._esc(dna.name)}" />`
            : `<div class="death-photo-placeholder">📦</div>`
          }
          <div class="death-rip-overlay">RIP</div>
        </div>

        <h2 class="death-name">${this._esc(dna.name)}</h2>
        <p class="death-type">${this._esc(dna.objectType)}</p>

        <div class="death-scene-text">
          <p>${this._esc(deathData.scene)}</p>
        </div>

        <div class="death-cause">
          <span class="death-cause-label">CAUSE OF DEATH:</span>
          <span class="death-cause-text">${this._esc(deathData.deathCause)}</span>
        </div>

        <div class="death-epitaph">
          "${this._esc(deathData.epitaph)}"
        </div>

        <button class="btn-view-life" id="btn-view-life">VIEW LIFE SUMMARY ▸</button>
      </div>
    `;

    this.showScreen('death');
    // Use AudioManager's dedicated death playback (idempotent)
    if (this.audio && typeof this.audio.playDeathSound === 'function') {
      this.audio.playDeathSound();
    } else {
      this.audio.play('death');
    }

    // Animate entrance
    await this._delay(100);
    container.querySelector('.death-screen')?.classList.add('visible');
  }

  /**
   * Show the complete life summary / eulogy.
   * @param {Object} eulogyContext - from gameState.toEulogyContext()
   */
  showLifeSummary(eulogyContext) {
    return new Promise((resolve) => {
      const container = document.getElementById('summary-content');
      const { objectDNA, objectImage, allMemories, allRelationships, finalState, deathCause, deathData } = eulogyContext;

      // Build timeline
      const timelineHTML = allMemories.map((mem, i) => `
        <div class="timeline-event">
          <span class="timeline-dot">${i === allMemories.length - 1 ? '💀' : '●'}</span>
          <span class="timeline-text">${this._esc(mem)}</span>
        </div>
      `).join('');

      // Build relationships
      const relsHTML = allRelationships.map(r => `
        <span class="summary-rel">${this._esc(r.name)} <small>(${this._esc(r.status)})</small></span>
      `).join('');

      container.innerHTML = `
        <div class="summary-screen">
          <h1 class="summary-title">📖 LIFE OF ${this._esc(objectDNA.name).toUpperCase()}</h1>

          <div class="summary-header">
            ${objectImage
              ? `<img src="${objectImage}" class="summary-photo" alt="${this._esc(objectDNA.name)}" />`
              : `<div class="summary-photo-placeholder">📦</div>`
            }
            <div class="summary-identity">
              <h2>${this._esc(objectDNA.name)}</h2>
              <p>${this._esc(objectDNA.objectType)} • ${this._esc(objectDNA.origin)}</p>
              <p class="summary-personality">"${this._esc(objectDNA.personality)}"</p>
            </div>
          </div>

          <div class="summary-section">
            <h3>📜 Life Timeline</h3>
            <div class="timeline">${timelineHTML || '<p>No memories recorded.</p>'}</div>
          </div>

          ${allRelationships.length > 0 ? `
            <div class="summary-section">
              <h3>👥 Relationships</h3>
              <div class="summary-rels">${relsHTML}</div>
            </div>
          ` : ''}

          <div class="summary-section">
            <h3>📊 Final Stats</h3>
            <div class="summary-stats">
              <span>💰 ₹${finalState.money}</span>
              <span>❤️ ${this._esc(finalState.condition)}</span>
              <span>😶 ${this._esc(finalState.mood)}</span>
              <span>📍 ${this._esc(finalState.location)}</span>
              ${finalState.owner ? `<span>👤 ${this._esc(finalState.owner)}</span>` : ''}
              ${finalState.occupation ? `<span>💼 ${this._esc(finalState.occupation)}</span>` : ''}
            </div>
          </div>

          <div class="summary-section death-summary">
            <h3>💀 Cause of Death</h3>
            <p class="summary-death-cause">${this._esc(deathCause)}</p>
            ${deathData?.eulogy ? `<p class="summary-eulogy">"${this._esc(deathData.eulogy)}"</p>` : ''}
            ${deathData?.epitaph ? `<p class="summary-epitaph">— ${this._esc(deathData.epitaph)}</p>` : ''}
          </div>

          <button class="btn-scan-again" id="btn-scan-again">🔄 SCAN ANOTHER OBJECT</button>
        </div>
      `;

      this.showScreen('summary');

      // Animate
      requestAnimationFrame(() => {
        container.querySelector('.summary-screen')?.classList.add('visible');
      });

      document.getElementById('btn-scan-again').addEventListener('click', () => {
        resolve();
      });
    });
  }

  // ─── Utilities ──────────────────────────────────────────────────

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }
}
