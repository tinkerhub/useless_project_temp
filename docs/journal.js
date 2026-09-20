/**
 * TinkerHub Useless Projects 3.0 — Project Journal Scripts
 * Project: Hello World (The Most Absurdly Over-Engineered Hello World in History)
 * Team: Autonomous Overthinkers
 * Features: Web Audio synthesizer, live 20 Hz mini-simulation canvas,
 *           interactive Bonsai dialogue sandbox, timeline filter, sound effects.
 */

// ---------------------------------------------------------------------------
// 1. Web Audio API 8-Bit Chiptune Sound Synthesizer (Zero External Audio Files)
// ---------------------------------------------------------------------------
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initOnInteraction = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration = 0.1, type = 'square', gainVal = 0.15) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  }

  poke() {
    if (!this.enabled) return;
    this.ensureContext();
    const pitches = [523.25, 659.25, 783.99, 1046.50];
    const p = pitches[Math.floor(Math.random() * pitches.length)];
    this.playTone(p, 0.12, 'sine', 0.2);
  }

  blip() {
    this.playTone(880, 0.06, 'triangle', 0.15);
  }

  click() {
    this.playTone(320, 0.04, 'square', 0.1);
  }

  success() {
    if (!this.enabled) return;
    this.ensureContext();
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'triangle', 0.18);
      }, idx * 75);
    });
  }

  error() {
    if (!this.enabled) return;
    this.ensureContext();
    this.playTone(180, 0.15, 'sawtooth', 0.2);
    setTimeout(() => {
      this.playTone(130, 0.22, 'sawtooth', 0.25);
    }, 120);
  }

  celebrate() {
    if (!this.enabled) return;
    this.ensureContext();
    const melody = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    melody.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.18, 'square', 0.12);
      }, idx * 90);
    });
  }
}

const sfx = new SoundFX();

// ---------------------------------------------------------------------------
// 2. Sound Toggle & Toast
// ---------------------------------------------------------------------------
function initSoundToggle() {
  const toggleBtn = document.getElementById('sound-toggle-btn');
  const toast = document.getElementById('sound-toast');
  const toastMsg = document.getElementById('sound-toast-msg');

  if (!toggleBtn) return;

  function showToast(msg) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  toggleBtn.addEventListener('click', () => {
    sfx.ensureContext();
    sfx.enabled = !sfx.enabled;
    toggleBtn.textContent = sfx.enabled ? '🔊' : '🔇';
    toggleBtn.title = sfx.enabled ? 'Sound Effects Enabled (Click to mute)' : 'Sound Effects Muted (Click to enable)';
    showToast(sfx.enabled ? '🔊 Sound effects turned ON' : '🔇 Sound effects muted');
    if (sfx.enabled) sfx.poke();
  });
}

// ---------------------------------------------------------------------------
// 3. Interactive Pet Stickers & Comic Quotes
// ---------------------------------------------------------------------------
const WITTY_PET_QUOTES = [
  "Appam thinna mathi, kuzhiyennanda! 🥞",
  "Why print('Hello') when 50 citizens can walk? 🎯",
  "1.13 ms frame time! Pure C-speed in Python! ⚡",
  "Brian Kernighan is sweating right now. 📜",
  "Dr. Jonah Reed is still on his morning walk to Willow Hospital! 🏥",
  "Bonsai 27B: reasoning='off' or face the 60s freeze! 🧠",
  "Zero pip, zero npm, 100% standard library arrogance! 🐍",
  "Willow Avenue speed limit: 175 world units per second! 🚶",
  "Cleo slipped outside Corner Grocer again! 🍌",
  "12,288 × 9,216 coordinate town. Pack a virtual lunch! 🗺️"
];

function initPetStickers() {
  const stickers = document.querySelectorAll('.pet-sticker');
  stickers.forEach((sticker) => {
    sticker.addEventListener('click', (e) => {
      sfx.poke();

      // Show floating comic bubble near click
      const quote = WITTY_PET_QUOTES[Math.floor(Math.random() * WITTY_PET_QUOTES.length)];
      const bubble = document.createElement('div');
      bubble.className = 'font-hand animate-breathe';
      bubble.style.position = 'fixed';
      bubble.style.left = `${e.clientX - 60}px`;
      bubble.style.top = `${e.clientY - 60}px`;
      bubble.style.background = '#FFE600';
      bubble.style.border = '2px solid #0E0E0D';
      bubble.style.boxShadow = '3px 3px 0 #0E0E0D';
      bubble.style.borderRadius = '12px';
      bubble.style.padding = '8px 14px';
      bubble.style.fontSize = '1.2rem';
      bubble.style.fontWeight = '700';
      bubble.style.zIndex = '9999';
      bubble.style.pointerEvents = 'none';
      bubble.style.color = '#0E0E0D';
      bubble.style.transform = `rotate(${(Math.random() * 8 - 4).toFixed(1)}deg)`;
      bubble.textContent = quote;

      document.body.appendChild(bubble);

      setTimeout(() => {
        bubble.style.transition = 'all 0.5s ease-out';
        bubble.style.opacity = '0';
        bubble.style.transform += ' translateY(-20px)';
        setTimeout(() => bubble.remove(), 500);
      }, 1600);
    });
  });
}

// ---------------------------------------------------------------------------
// 4. Live 20 Hz Simulation Canvas Demo (Authoritative Simulation Benchmark)
// ---------------------------------------------------------------------------
function initSimulationCanvas() {
  const canvas = document.getElementById('simulation-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const frameBudgetLabel = document.getElementById('frame-budget-label');
  const frameBudgetFill = document.getElementById('frame-budget-fill');

  let width = (canvas.width = canvas.parentElement.clientWidth);
  let height = (canvas.height = canvas.parentElement.clientHeight);

  window.addEventListener('resize', () => {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight;
  });

  // Procedural 50 Citizens in 2D mini-town
  const NUM_CITIZENS = 50;
  const citizens = [];
  const places = [
    { name: 'Hospital', x: width * 0.2, y: height * 0.25, color: '#FF3366', size: 16 },
    { name: 'Police', x: width * 0.8, y: height * 0.25, color: '#3388FF', size: 16 },
    { name: 'Grocer', x: width * 0.25, y: height * 0.75, color: '#2ECC71', size: 16 },
    { name: 'Town Hall', x: width * 0.5, y: height * 0.5, color: '#FFE600', size: 22 },
    { name: 'Café', x: width * 0.75, y: height * 0.75, color: '#EA34DF', size: 16 }
  ];

  for (let i = 0; i < NUM_CITIZENS; i++) {
    citizens.push({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      target: places[Math.floor(Math.random() * places.length)],
      speed: 0.8 + Math.random() * 1.2,
      color: i === 0 ? '#FFE600' : (i < 3 ? '#EA34DF' : '#00F0FF'),
      size: i === 0 ? 6 : 4,
      isPlayer: i === 0
    });
  }

  let incident = null;

  canvas.addEventListener('click', (e) => {
    sfx.click();
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    incident = {
      x: clickX,
      y: clickY,
      time: Date.now(),
      label: "⚠️ Cleo Slipped!"
    };

    // Alert nearest 3 citizens
    citizens.slice(1, 4).forEach((c) => {
      c.target = { x: clickX, y: clickY, name: "Incident Site" };
    });

    sfx.blip();
  });

  let lastTime = performance.now();
  let stepElapsedSimulated = 1.13; // ms

  function renderSimulation(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    // Simulate 20 Hz step jitter (1.05 ms - 1.25 ms)
    stepElapsedSimulated = 1.08 + Math.sin(now * 0.005) * 0.08 + (incident ? 0.25 : 0);
    if (frameBudgetLabel) {
      frameBudgetLabel.textContent = `${stepElapsedSimulated.toFixed(2)} ms / 50.0 ms`;
    }
    if (frameBudgetFill) {
      const pct = (stepElapsedSimulated / 50) * 100;
      frameBudgetFill.style.width = `${Math.min(100, pct * 4)}%`; // Visual exaggeration scale for readability
    }

    // Clear Canvas
    ctx.fillStyle = '#0F1215';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = '#1E252D';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Places
    places.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, p.x, p.y + p.size + 10);
    });

    // Draw Incident if active
    if (incident) {
      const age = (Date.now() - incident.time) / 1000;
      if (age < 5) {
        ctx.fillStyle = '#FF3366';
        ctx.beginPath();
        ctx.arc(incident.x, incident.y, 10 + Math.sin(now * 0.01) * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFE600';
        ctx.font = 'bold 11px "Space Grotesk", sans-serif';
        ctx.fillText(incident.label, incident.x, incident.y - 16);
      } else {
        incident = null;
      }
    }

    // Update & Draw Citizens
    citizens.forEach((c) => {
      // Step towards target
      const dx = c.target.x - c.x;
      const dy = c.target.y - c.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        c.x += (dx / dist) * c.speed;
        c.y += (dy / dist) * c.speed;
      } else {
        // Reached destination, pick a new one
        c.target = places[Math.floor(Math.random() * places.length)];
      }

      // Draw path line faintly for first 5 citizens
      if (c.id < 5) {
        ctx.strokeStyle = c.color + '44';
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.target.x, c.target.y);
        ctx.stroke();
      }

      // Draw citizen dot
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      ctx.fill();

      if (c.isPlayer) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw Legend in corner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(8, 8, 160, 48);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(8, 8, 160, 48);
    ctx.fillStyle = '#2ECC71';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('● 20 Hz Living Loop', 16, 24);
    ctx.fillStyle = '#FFE600';
    ctx.fillText('● 50 Authored Citizens', 16, 38);
    ctx.fillStyle = '#00F0FF';
    ctx.fillText('● Click map to trigger incident', 16, 50);

    requestAnimationFrame(renderSimulation);
  }

  requestAnimationFrame(renderSimulation);
}

// ---------------------------------------------------------------------------
// 5. Interactive Bonsai-27B Dialogue Sandbox
// ---------------------------------------------------------------------------
const AI_RESPONSES = {
  "hello world": {
    dialogue: "Hello World! I was just recording historical archives at Town Hall. Did you really walk all the way across Willow Avenue just to hear that? Brian Kernighan would be proud.",
    emotion: "content",
    plan: "Review historical municipal records",
    speed: "19.08s (0 reasoning tokens)"
  },
  "why": {
    dialogue: "Because printing to a cold, uncaring terminal is unearned civic privilege. In Willow, every word has biological weight, schedule commitments, and hospital coverage.",
    emotion: "thoughtful",
    plan: "Walk to Juniper Café for tea",
    speed: "18.42s (JSON Schema validated)"
  },
  "doctor": {
    dialogue: "Dr. Jonah Reed is currently at Willow Hospital reviewing shifts. Because he physically walked to work today, trauma care is mathematically operational!",
    emotion: "reassured",
    plan: "Verify hospital attendance ledger",
    speed: "17.90s (Presence verified)"
  },
  "kernighan": {
    dialogue: "Brian Kernighan introduced printf in 1974 without consulting local municipal zoning laws or checking citizen energy levels. We have spent 10,000 lines rectifying this oversight.",
    emotion: "amused",
    plan: "File historical report at precinct",
    speed: "19.55s (Zero hallucination)"
  },
  "default": {
    dialogue: "Good day! It's a brisk morning in Old Town. Have you inspected the attendance ledger at Willow Hospital or noticed our 1.13 ms spatial clearance physics?",
    emotion: "friendly",
    plan: "Continue routine patrol",
    speed: "18.15s (Bonsai 27B)"
  }
};

function initDialogueSimulator() {
  const form = document.getElementById('chat-input-form');
  const input = document.getElementById('chat-input-field');
  const chatBox = document.getElementById('chat-box');
  const samplePills = document.querySelectorAll('.sample-pill');

  if (!form || !input || !chatBox) return;

  function appendMessage(speaker, text, tag, isAi = false, metadata = null) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isAi ? 'ai' : 'player'}`;

    const tagEl = document.createElement('span');
    tagEl.className = 'speaker-tag';
    tagEl.textContent = `${speaker} [${tag}]`;
    bubble.appendChild(tagEl);

    const textEl = document.createElement('p');
    textEl.textContent = text;
    bubble.appendChild(textEl);

    if (metadata) {
      const metaEl = document.createElement('small');
      metaEl.style.display = 'block';
      metaEl.style.marginTop = '6px';
      metaEl.style.fontSize = '0.75rem';
      metaEl.style.color = '#777';
      metaEl.style.fontFamily = 'var(--font-mono)';
      metaEl.textContent = `⚡ Mood: ${metadata.emotion} · Plan: "${metadata.plan}" · Latency: ${metadata.speed}`;
      bubble.appendChild(metaEl);
    }

    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function handleSend(userText) {
    const clean = userText.trim();
    if (!clean) return;

    sfx.blip();
    appendMessage('You', clean, 'Human Player', false);
    input.value = '';

    // Show "considering a reply..." thinking status
    const thinkingBubble = document.createElement('div');
    thinkingBubble.className = 'chat-bubble ai';
    thinkingBubble.id = 'thinking-bubble';
    thinkingBubble.innerHTML = `
      <span class="speaker-tag">Ada [Neighborhood Historian]</span>
      <p style="font-style:italic; color:#777;">Thinking via Bonsai-27B (reasoning='off', JSON schema check)...</p>
    `;
    chatBox.appendChild(thinkingBubble);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Simulate async neural response
    setTimeout(() => {
      const target = document.getElementById('thinking-bubble');
      if (target) target.remove();

      const lower = clean.toLowerCase();
      let matchKey = 'default';
      if (lower.includes('hello')) matchKey = 'hello world';
      else if (lower.includes('why') || lower.includes('stdout')) matchKey = 'why';
      else if (lower.includes('doctor') || lower.includes('hospital') || lower.includes('reed')) matchKey = 'doctor';
      else if (lower.includes('kernighan') || lower.includes('1974') || lower.includes('crime')) matchKey = 'kernighan';

      const resp = AI_RESPONSES[matchKey];
      sfx.poke();
      appendMessage('Ada', resp.dialogue, 'Bonsai-27B Resident', true, resp);
    }, 750);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSend(input.value);
  });

  samplePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      input.value = pill.getAttribute('data-query') || pill.textContent;
      handleSend(input.value);
    });
  });
}

// ---------------------------------------------------------------------------
// 6. Interactive Timeline Filters
// ---------------------------------------------------------------------------
function initTimelineFilters() {
  const chips = document.querySelectorAll('.filter-chip');
  const cards = document.querySelectorAll('.timeline-card-wrap');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      sfx.click();
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.getAttribute('data-filter') || 'all';

      cards.forEach((card) => {
        const category = card.getAttribute('data-category') || '';
        if (filter === 'all' || category.includes(filter)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// ---------------------------------------------------------------------------
// 7. General UI Sound Attachments
// ---------------------------------------------------------------------------
function initGlobalButtonSounds() {
  document.querySelectorAll('.brutal-btn, .filter-chip, .badge').forEach((el) => {
    el.addEventListener('mouseenter', () => sfx.blip());
  });
}

// ---------------------------------------------------------------------------
// Main Initialization
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initSoundToggle();
  initPetStickers();
  initSimulationCanvas();
  initDialogueSimulator();
  initTimelineFilters();
  initGlobalButtonSounds();
  console.log("🎯 Autonomous Overthinkers — Project Journal Initialized!");
});
