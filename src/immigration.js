/**
 * immigration.js — Interactive Live Airport Immigration Mini-Game.
 *
 * Unlimited interactive chat with a rude, hilarious, suspicious Manglish officer.
 * Handles continuous user messaging, AI responses, dynamic comedic challenges,
 * and seamless passport stamping / continuation to the life simulator.
 */

export class Immigration {
  constructor(ai, ui, gameState, audio) {
    this.ai = ai;
    this.ui = ui;
    this.gameState = gameState;
    this.audio = audio;
    this._conversation = [];
    this.container = document.getElementById('screen-immigration');
    this.promptEl = document.getElementById('imm-officer-prompt');
    this.quickChoicesEl = document.getElementById('imm-quick-choices');
    this.inputEl = document.getElementById('imm-input');
    this.submitBtn = document.getElementById('imm-submit');
    this.faceEl = document.getElementById('imm-officer-face');
    this.speechEl = document.getElementById('imm-officer-speech');
    this.langSelect = document.getElementById('imm-lang-select');
    this.replyEl = document.getElementById('imm-reply');
    
    this.turnCount = 0;
    this.isApproved = false;
    this.isBusy = false;
    this._resolveRun = null;
    this._listenersBound = false;
  }

  async run() {
    this._showScreen();
    this._renderPassportPreview();

    // Reset conversation state
    this.turnCount = 0;
    this.isApproved = false;
    this.isBusy = false;
    this._conversation = [];

    if (this.replyEl) this.replyEl.innerHTML = '';
    if (this.quickChoicesEl) this.quickChoicesEl.innerHTML = '';
    if (this.inputEl) {
      this.inputEl.disabled = false;
      this.inputEl.value = '';
    }
    if (this.submitBtn) this.submitBtn.disabled = false;
    if (this.langSelect && !this.langSelect.value) this.langSelect.value = 'manglish';

    const dna = this.gameState.objectDNA || {};
    const name = dna.name || 'Unknown Object';
    const type = dna.objectType || 'Object';

    // Initial hilarious customized accusation based on object
    const initialQuestion = this._getInitialQuestion(name, type);
    this.promptEl.textContent = initialQuestion;
    this.speechEl.textContent = initialQuestion;
    this._setFace('stare');
    this._addChatBubble('officer', initialQuestion);
    this._conversation.push({ role: 'assistant', text: initialQuestion });

    // Populate initial funny quick choices
    this._renderQuickChoices(initialQuestion);

    // Bind event listeners once
    this._setupInputListeners();

    // Focus input
    setTimeout(() => {
      try { this.inputEl.focus(); } catch (e) {}
    }, 100);

    return new Promise((resolve) => {
      this._resolveRun = resolve;
    });
  }

  _getInitialQuestion(name, type) {
    const t = type.toLowerCase();
    if (/banana|fruit|apple|mango|vegetable|food/i.test(t)) {
      return `*slams table* "STOP RIGHT THERE! ${name} (${type})! You look suspiciously bright. PROVE YOU ARE NOT A 60W BULB spying for KSEB! Why you enter here?!"`;
    }
    if (/pen|pencil|marker|stationary/i.test(t)) {
      return `*squints through magnifying glass* "${name} (${type})! Why is your nib pointed like a missile?! Are you planning ink terrorism?! State your business!"`;
    }
    if (/bottle|cup|glass|container/i.test(t)) {
      return `*taps table* "Aha! ${name} (${type})! Are you smuggling contraband tap water?! Show me your ISI purity certificate immediately!"`;
    }
    if (/shoe|slipper|footwear/i.test(t)) {
      return `*holds nose* "${name} (${type})! Suspicious biological aura detected! Prove you are not a bioweapon deployed from Dubai!"`;
    }
    return `*slams table* "HOI! ${name} (${type})! Why are you entering Republic of Objects?! Prove you are NOT a human in disguise!"`;
  }

  _setupInputListeners() {
    if (this._listenersBound) return;
    this._listenersBound = true;

    // Submit button click handler
    this.submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this._handleUserSubmit();
    });

    // Enter key handler
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._handleUserSubmit();
      }
    });
  }

  async _handleUserSubmit() {
    if (this.isBusy) return;
    const text = this.inputEl.value.trim();
    if (!text) return;

    this.inputEl.value = '';
    await this._processMessage(text);
  }

  async _processMessage(userText) {
    if (this.isBusy) return;
    this.isBusy = true;
    this.turnCount++;

    // Lock UI
    this.inputEl.disabled = true;
    this.submitBtn.disabled = true;

    // Add user bubble
    this._addChatBubble('player', userText);
    this._conversation.push({ role: 'user', text: userText });

    // Show thinking bubble
    const thinkingBubble = this._addChatBubble('officer', '🤔 Officer is interrogating...');
    this._animateTalking(true);

    // If it's an explicit bribe
    const isBribe = /bribe|₹|rupee|cash|money|50|pay/i.test(userText);

    const lang = this.langSelect ? this.langSelect.value : 'manglish';
    const lastQuestion = this.promptEl.textContent;

    let aiResult;
    try {
      const payload = {
        dna: this.gameState.objectDNA,
        question: lastQuestion,
        answer: userText,
        lang,
        conversation: this._conversation.slice(-10),
      };

      aiResult = await Promise.race([
        this.ai.immigrationQuery(payload),
        new Promise((r) => setTimeout(() => r(null), 12000)),
      ]);
    } catch (err) {
      console.error('[IMMIGRATION ERROR]', err);
    }

    // Remove thinking indicator
    if (thinkingBubble && thinkingBubble.parentNode) {
      thinkingBubble.remove();
    }
    this._animateTalking(false);

    let officerReply = '';
    let decision = 'ask_more';

    if (aiResult && aiResult.reply) {
      officerReply = aiResult.reply;
      decision = aiResult.decision || 'ask_more';
    } else {
      // Hilarious local fallback if AI is slow
      const fallback = this._getLocalRoast(userText, isBribe);
      officerReply = fallback.reply;
      decision = fallback.decision;
    }

    // Handle bribe override for comedy
    if (isBribe) {
      officerReply = `*looks left and right* "Aha! ₹50 bribe?! ...I am an honest officer! *quietly pockets ₹50* ...Okay, tea charge accepted! APPROVED!"`;
      decision = 'approve';
    } else if (this.turnCount >= 4 && decision !== 'approve') {
      // Guarantee approval after 4 turns so player never gets stuck indefinitely
      officerReply += ' *stamps desk* "Enikku vere paniyundu! Approved! Kadannu po!"';
      decision = 'approve';
    }

    // Update officer dialogue
    this.speechEl.textContent = officerReply;
    this.promptEl.textContent = officerReply;
    this._addChatBubble('officer', officerReply);
    this._conversation.push({ role: 'assistant', text: officerReply });

    // Reaction face
    if (decision === 'approve') {
      this._setFace('happy');
      this.isApproved = true;
      this._showApprovalContinueButton();
      try { this.audio?.play('stamp'); } catch (e) {}
    } else if (decision === 'reject') {
      this._setFace('stare');
    } else {
      this._setFace('doubt');
    }

    // Update dynamic quick choices for next turn
    this._renderQuickChoices(officerReply);

    // Re-enable input for unlimited chatting!
    this.isBusy = false;
    this.inputEl.disabled = false;
    this.submitBtn.disabled = false;
    try { this.inputEl.focus(); } catch (e) {}
  }

  _getLocalRoast(text, isBribe) {
    const dna = this.gameState.objectDNA || {};
    const name = dna.name || 'Itthu';
    const type = dna.objectType || 'Object';

    if (isBribe) {
      return {
        reply: `*slams desk* "BRIBE?! ₹50 mathramo?! ...wait, ₹50 is acceptable. *pockets cash* APPROVED!"`,
        decision: 'approve',
      };
    }

    const roasts = [
      { reply: `"${text}" ennano?! *slams table* Ith border checkpost aanu mwone, comedy club alla! Prove your identity!`, decision: 'ask_more' },
      { reply: `Aiyo ${name}, your explanation has 0% logic and 100% drama! Sing your serial number in Carnatic raga or get out!`, decision: 'ask_more' },
      { reply: `*squints suspiciously* A ${type} that talks like this is either a genius or an undercover spy! Tell me your owner's horoscope!`, decision: 'ask_more' },
      { reply: `Officer: "Hmm... '${text}'. Very suspicious answer. Prove you cannot emit 1000 lumens right now!"`, decision: 'ask_more' },
      { reply: `*picks up phone* "Security, get ready..." *looks at ${name}* "...actually you are too funny. STAMPED! APPROVED!"`, decision: 'approve' },
      { reply: `*checks passport* "Everything matches. Except your face. But whatever, APPROVED! Kadannu po!"`, decision: 'approve' },
    ];

    return roasts[Math.floor(Math.random() * roasts.length)];
  }

  _showApprovalContinueButton() {
    // Keep quick choices container clean and show glowing continue button
    let existingBtn = document.getElementById('imm-continue-active-btn');
    if (!existingBtn) {
      const contWrapper = document.createElement('div');
      contWrapper.className = 'imm-continue-wrapper';
      contWrapper.style.cssText = 'width: 100%; margin: 10px 0; text-align: center;';

      const btn = document.createElement('button');
      btn.id = 'imm-continue-active-btn';
      btn.className = 'btn-begin-life reveal';
      btn.style.cssText = 'padding: 14px 28px; font-size: 1.1rem; font-weight: 800; background: linear-gradient(135deg, #00ff88, #00b894); color: #07070d; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 0 25px rgba(0,255,136,0.6); animation: pulse 1.5s infinite;';
      btn.textContent = '✅ PASSPORT APPROVED — ENTER WORLD (CONTINUE) ➔';

      btn.addEventListener('click', () => {
        if (this._resolveRun) {
          this._resolveRun(true);
        }
      });

      contWrapper.appendChild(btn);
      this.quickChoicesEl.prepend(contWrapper);
    }
  }

  _renderQuickChoices(lastReply) {
    // Preserve the continue button if already approved
    const existingCont = document.getElementById('imm-continue-active-btn');
    this.quickChoicesEl.innerHTML = '';
    if (existingCont) {
      const contWrapper = document.createElement('div');
      contWrapper.className = 'imm-continue-wrapper';
      contWrapper.style.cssText = 'width: 100%; margin: 10px 0; text-align: center;';
      contWrapper.appendChild(existingCont);
      this.quickChoicesEl.appendChild(contWrapper);
    }

    const dna = this.gameState.objectDNA || {};
    const type = (dna.objectType || '').toLowerCase();

    // Dynamic contextual funny answers
    let options = [
      'Njan harmless aanu bro!',
      'Ithil ₹50 edukko? (Bribe)',
      'Ask the banana witness!',
      'Njan bulb alla, switch off cheyyano?!',
      'Officer pwoli aanu, vidu please!',
    ];

    if (/bulb|lumens/i.test(lastReply)) {
      options = [
        'Njan bulb alla, zero watts aanu!',
        'KSEB-il njan allada!',
        'Switch on cheythu nokk, light varilla!',
        'Ithil ₹50 edukko? (Bribe)',
      ];
    } else if (/owner|horoscope|jathakam/i.test(lastReply)) {
      options = [
        'Owner Appu aanu, star Rohini!',
        'Jathakam shari illa, but passport real aanu!',
        'Owner Dubai-il aanu bro!',
        'Ithil ₹50 edukko? (Bribe)',
      ];
    } else if (/serial|carnatic|sing/i.test(lastReply)) {
      options = [
        '🎵 Sa Re Ga Ma Pa Da Ni Sa (Serial #4092)!',
        'Enikku paadaan ariyilla mwone!',
        'Barcode scan cheyy bro!',
        'Ithil ₹50 edukko? (Bribe)',
      ];
    }

    const btnContainer = document.createElement('div');
    btnContainer.className = 'imm-quick-btns-row';
    btnContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 6px;';

    options.forEach((optText) => {
      const btn = document.createElement('button');
      btn.className = 'btn-quick';
      btn.textContent = optText;
      btn.addEventListener('click', () => {
        this.inputEl.value = optText;
        this._handleUserSubmit();
      });
      btnContainer.appendChild(btn);
    });

    this.quickChoicesEl.appendChild(btnContainer);
  }

  _renderPassportPreview() {
    const preview = document.getElementById('imm-passport-preview');
    if (!preview) return;
    const dna = this.gameState.objectDNA || {};
    preview.innerHTML = `
      <div class="imm-pass-small">
        <div class="imm-pass-name">${dna.name || 'UNKNOWN'}</div>
        <div class="imm-pass-type">${dna.objectType || 'Object'} • ${dna.passportNumber || 'OBJ-00000'}</div>
      </div>
    `;
  }

  _setFace(kind) {
    if (!this.faceEl) return;
    if (kind === 'happy') this.faceEl.src = '/happy.png';
    else if (kind === 'doubt') this.faceEl.src = '/doubt.png';
    else this.faceEl.src = '/stare.png';
  }

  _addChatBubble(who, text) {
    const reply = document.getElementById('imm-reply');
    if (!reply) return null;
    const div = document.createElement('div');
    div.className = `imm-bubble ${who}`;
    div.textContent = text;
    reply.appendChild(div);
    reply.scrollTop = reply.scrollHeight;
    return div;
  }

  _animateTalking(on = true) {
    if (!this.container) return;
    const el = this.container.querySelector('.imm-officer-visual');
    if (!el) return;
    if (on) el.classList.add('talking');
    else el.classList.remove('talking');
  }

  _showScreen() {
    if (this.ui && typeof this.ui.showScreen === 'function') {
      this.ui.showScreen('immigration');
    } else {
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
      this.container.classList.add('active');
    }
  }
}
