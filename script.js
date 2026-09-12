/*
 * THE MOST NEEDY PLANT
 * Improved vanilla JavaScript implementation.
 * Include with: <script src="script.js" defer></script>
 * The script creates its own UI inside #app, or document.body if #app is absent.
 */

(() => {
  'use strict';

  const SAVE_KEY = 'most-needy-plant:v2';
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  // During development, temporarily use: const MINUTE = 1000;
  // This makes one game minute equal one real second.

  const clamp = (value, min = 0, max = 100) =>
    Math.min(max, Math.max(min, Number(value) || 0));

  const random = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const pick = (items) => items[Math.floor(Math.random() * items.length)];

  const escapeHTML = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const formatDuration = (milliseconds) => {
    const minutes = Math.max(0, Math.round(milliseconds / MINUTE));
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  };

  const formatCountdown = (targetTimestamp) => {
    const diff = Number(targetTimestamp) - Date.now();
    if (diff <= 0) return `overdue by ${formatDuration(-diff)}`;
    return formatDuration(diff);
  };

const PLANT_FRAMES = Array.from(
  { length: 11 },
  (_, index) =>
    `G001_${String(index + 1).padStart(3, '0')}.png`
);

let currentPlantFrame = PLANT_FRAMES.length - 1;
let plantAnimationTimer = null;


  const MESSAGES = {
    normal: [
      'I am monitoring the situation.',
      'The conditions are acceptable. Do not become complacent.',
      'I could use something, but I refuse to say what.',
      'Your continued involvement has been noted.'
    ],
    earlyWater: [
      'You watered me early. I was not emotionally prepared.',
      'I was still processing the previous watering.',
      'This is not a soup. Please stop treating it like one.'
    ],
    lateWater: [
      'You are late. The clock and I have discussed this.',
      'I had to survive several unnecessary minutes without you.',
      'I expected better. I also expected water.'
    ],
    dry: [
      'My leaves are making a spreadsheet about your absence.',
      'I require water, but I resent requiring anything.',
      'The soil is now mostly a memory.'
    ],
    sunlight: [
      'The light is almost right. Almost is doing a lot of work here.',
      'I have seen better sunlight in a waiting room.',
      'Please find the exact amount of sun I am imagining.'
    ],
    absurd: [
      'I need a compliment with more professional confidence.',
      'Do not water me while it is dark. I can tell.',
      'Something feels wrong. I will not provide further details.',
      'I require a brief period of being admired from a respectful distance.'
    ],
    dying: [
      'I am fading, but I would like to discuss your management style.',
      'This is becoming a memorial with buttons.',
      'My final request is unreasonable and therefore on brand.'
    ]
  };

  function newPlant(name = 'The Plant') {
    const now = Date.now();
    const firstWateringInterval = random(20, 55);

    const state = {
      version: 2,
      name: String(name).trim().slice(0, 32) || 'The Plant',
      createdAt: now,
      lastVisitAt: now,
      lastActionAt: 0,
      health: 82,
      water: 64,
      sunlight: 48,
      temperature: 23.7,
      mood: 'Neutral',
      totalWaterings: 0,
      sunlightTime: 0,
      fertilizerApplications: 0,
      compliments: 0,
      uselessnessScore: 0,
      complaints: 0,
      earlyWaterings: 0,
      lateWaterings: 0,
      longestAbandonment: 0,
      checks: 0,
      lastWateredAt: now,
      nextWateringAt: now + firstWateringInterval * MINUTE,
      wateringIntervalMinutes: firstWateringInterval,
      demand: 'Please remain available for my next requirement.',
      absurdDemand: false,
      history: [],
      achievements: [],
      dead: false,
      dayRotation: new Date(now).getDate()
    };

    addHistory(state, `Created ${state.name}. A responsibility has begun.`);
    return state;
  }

  function addHistory(state, text) {
    if (!Array.isArray(state.history)) state.history = [];

    state.history.unshift({
      at: Date.now(),
      text: String(text)
    });

    state.history = state.history.slice(0, 30);
  }

  function save(state) {
    state.lastVisitAt = Date.now();

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Could not save plant:', error);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;

      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return null;

      const fallback = newPlant(
        typeof saved.name === 'string' ? saved.name : 'The Plant'
      );

      return {
        ...fallback,
        ...saved,
        version: 2,
        name: typeof saved.name === 'string'
          ? saved.name.trim().slice(0, 32) || 'The Plant'
          : 'The Plant',
        history: Array.isArray(saved.history) ? saved.history : [],
        achievements: Array.isArray(saved.achievements)
          ? saved.achievements
          : [],
        health: clamp(saved.health),
        water: clamp(saved.water),
        sunlight: clamp(saved.sunlight),
        temperature: Number(saved.temperature) || 23.7,
        lastVisitAt: Number(saved.lastVisitAt) || Date.now(),
        lastWateredAt: Number(saved.lastWateredAt) || Date.now(),
        nextWateringAt: Number(saved.nextWateringAt) || Date.now(),
        createdAt: Number(saved.createdAt) || Date.now()
      };
    } catch (error) {
      console.warn('Could not load plant save:', error);
      return null;
    }
  }

  function calculateMood(state) {
    if (state.dead || state.health <= 0) return 'Dramatic';

    if (state.complaints >= 5 && state.water < 30) {
      return 'Irritated';
    }

    if (state.absurdDemand) {
      return 'Confused';
    }

    if (state.health >= 78 && state.water >= 45 && state.complaints < 3) {
      return 'Happy';
    }

    return 'Neutral';
  }
  // Map health (0-100) to a plant frame index (0-10).
  // Health 0-9 → frame 0 (withered), health 90-100 → frame 10 (full health).
  // Every 10 health points moves up one frame.
  function healthFrame(health) {
    const index = Math.floor(health / 10);
    return Math.min(PLANT_FRAMES.length - 1, Math.max(0, index));
  }

  // When health goes up, show a brief perk animation.
  function playPerkAnimation() {
    if (state && state.dead) return;
    window.clearInterval(plantAnimationTimer);

    let frame = healthFrame(state.health);
    currentPlantFrame = Math.max(0, frame - 2);
    render(state);

    let step = 0;
    const totalSteps = 8;
    plantAnimationTimer = window.setInterval(() => {
      step += 1;
      const progress = step / totalSteps;
      // Smoothly rise from a lower frame back to the target health frame.
      currentPlantFrame = Math.round(
        (frame - 2) * (1 - progress) + frame * progress
      );
      render(state);

      if (step >= totalSteps) {
        window.clearInterval(plantAnimationTimer);
        currentPlantFrame = frame;
        render(state);
      }
    }, 80);
  }

  function plantVisual() {
    return PLANT_FRAMES[currentPlantFrame];
  }

  function playPlantAnimation() {
    if (state && state.dead) return;

    window.clearInterval(plantAnimationTimer);

    let frame = 0;
    currentPlantFrame = 0;
    render(state);

    plantAnimationTimer = window.setInterval(() => {
      frame += 1;

      if (frame >= PLANT_FRAMES.length) {
        window.clearInterval(plantAnimationTimer);
        // Return to the frame matching current health.
        currentPlantFrame = healthFrame(state.health);
        render(state);
        return;
      }

      currentPlantFrame = frame;
      render(state);
    }, 120);
  }
  function applyElapsedDecay(state, awayMs) {
    if (awayMs < MINUTE || state.dead) return;

    const longGap = awayMs >= HOUR;
    state.longestAbandonment = Math.max(
      Number(state.longestAbandonment) || 0,
      awayMs
    );

    const hoursAway = awayMs / HOUR;
    const waterLoss = Math.min(45, hoursAway * 2.8);
    const healthLoss = Math.min(
      55,
      hoursAway * 0.75 + (longGap && state.water < 25 ? 5 : 0)
    );

    state.water = clamp(state.water - waterLoss);
    state.health = clamp(state.health - healthLoss);
    state.sunlight = clamp(state.sunlight - Math.min(35, hoursAway * 1.5));

    if (longGap && awayMs > 12 * HOUR) {
      state.complaints += 1;
      state.demand = `You were gone for ${formatDuration(awayMs)}. I have questions.`;
      addHistory(state, `Returned after ${formatDuration(awayMs)} away; the plant kept score.`);
    } else if (state.water < 25) {
      state.demand = pick(MESSAGES.dry);
    }

    if (longGap && awayMs > 3 * DAY && state.health <= 0 && !state.dead) {
      addHistory(state, 'The plant is expiring after an avoidable absence.');
    }

    state.mood = calculateMood(state);
  }

  function setDemand(state, message = null) {
    const now = new Date();
    const isNight = now.getHours() < 7 || now.getHours() >= 21;
    const absurdChance = Math.random() < 0.2;

    state.absurdDemand = absurdChance;

    if (message) {
      state.demand = message;
    } else if (state.water < 25) {
      state.demand = pick(MESSAGES.dry);
    } else if (absurdChance) {
      state.demand = pick(MESSAGES.absurd);
    } else if (isNight) {
      state.demand = 'I would like water, but not during the night. Obviously.';
    } else {
      state.demand = pick(MESSAGES.normal);
    }

    state.mood = calculateMood(state);
  }

  function nextWatering(state) {
    // 80% predictable, 20% surprising.
    const predictable = [20, 25, 30, 39, 45, 51, 60];
    const minutes = Math.random() < 0.8
      ? pick(predictable)
      : random(7, 95);

    state.wateringIntervalMinutes = minutes;
    state.nextWateringAt = Date.now() + minutes * MINUTE;
  }

  function registerComplaint(state, message, penalty = 3) {
    state.complaints += 1;
    state.health = clamp(state.health - penalty);
    state.mood = 'Irritated';
    state.demand = message;
    addHistory(state, message);
  }

  function water(state) {
    if (state.dead) return 'The plant is dead. It still has opinions.';

    const now = Date.now();
    const isFirstWatering = state.totalWaterings === 0;
    const delta = now - state.nextWateringAt;
    const sinceLast = now - state.lastWateredAt;

    state.totalWaterings += 1;
    state.lastActionAt = now;
    state.lastWateredAt = now;
    state.water = clamp(state.water + 25);

    if (isFirstWatering) {
      state.health = clamp(state.health + 3);
      state.demand = 'First watering accepted. I am cautiously optimistic.';
      addHistory(state, 'The first watering went smoothly. This will not last.');
    } else if (sinceLast < 12 * MINUTE) {
      state.earlyWaterings += 1;
      registerComplaint(
        state,
        'You watered me too frequently. I am damp and disappointed.',
        8
      );
    } else if (delta < -5 * MINUTE) {
      state.earlyWaterings += 1;
      registerComplaint(state, pick(MESSAGES.earlyWater), 4);
    } else if (delta > 8 * MINUTE) {
      state.lateWaterings += 1;
      registerComplaint(
        state,
        pick(MESSAGES.lateWater),
        Math.min(12, 4 + Math.round(delta / HOUR))
      );
    } else {
      state.health = clamp(state.health + 3);
      state.demand = pick(MESSAGES.normal);
      addHistory(state, 'Watering accepted, subject to future reinterpretation.');
    }

    nextWatering(state);
    state.mood = calculateMood(state);
    return 'Watering recorded.';
  }

  function giveSunlight(state) {
    if (state.dead) return 'The dead plant cannot enjoy sunlight.';

    const amount = random(5, 12);
    state.sunlight = clamp(state.sunlight + amount);
    state.sunlightTime += amount;
    state.lastActionAt = Date.now();

    if (state.sunlight > 51) {
      registerComplaint(
        state,
        'Too much sunlight. I requested a narrow and unreasonable range.',
        5
      );
    } else if (state.sunlight >= 43 && state.sunlight <= 51) {
      state.health = clamp(state.health + 4);
      state.demand = 'The light is acceptable. Do not improve it.';
      addHistory(state, 'Sunlight landed in the mysteriously correct range.');
    } else {
      state.demand = pick(MESSAGES.sunlight);
      state.health = clamp(state.health - 1);
    }

    state.mood = calculateMood(state);
    return 'Sunlight adjusted.';
  }

  function fertilize(state) {
    if (state.dead) return 'Fertilizer cannot reverse a dramatic ending.';

    state.fertilizerApplications += 1;
    state.lastActionAt = Date.now();

    if (state.fertilizerApplications % 2 === 0) {
      state.health = clamp(state.health + 6);
      state.demand = 'The fertilizer was tolerated. Please do not make this a habit.';
      addHistory(state, 'Fertilizer application accepted on an even-numbered occasion.');
    } else {
      registerComplaint(
        state,
        'I only wanted fertilizer on an even-numbered occasion.',
        6
      );
    }

    state.mood = calculateMood(state);
    return 'Fertilizer applied.';
  }

  function adjustTemperature(state) {
    if (state.dead) return 'The temperature is no longer relevant.';

    state.temperature = Number((random(220, 250) / 10).toFixed(1));
    state.lastActionAt = Date.now();

    if (state.temperature === 23.7) {
      state.health = clamp(state.health + 5);
      state.demand = '23.7°C. Finally, some professionalism.';
    } else {
      registerComplaint(
        state,
        `That is ${state.temperature}°C. I specifically wanted 23.7°C.`,
        3
      );
    }

    state.mood = calculateMood(state);
    return `Temperature set to ${state.temperature}°C.`;
  }



  function compliment(state) {
    if (state.dead) return 'The plant has no further need for emotional support.';

    state.lastActionAt = Date.now();
    state.compliments = (state.compliments || 0) + 1;

    // Compliments are intentionally unreliable. The plant is not a normal
    // pet: praise may help, do nothing, or create a new emotional problem.
    const roll = Math.random();

    if (roll < 0.25) {
      state.health = clamp(state.health + 2);
      state.mood = 'Happy';
      state.demand = pick([
        'That compliment was unusually accurate.',
        'I will allow this praise to improve my condition.',
        'Your emotional support has been accepted for now.'
      ]);
      addHistory(state, 'A compliment helped. This outcome is not guaranteed.');
    } else if (roll < 0.60) {
      state.mood = 'Neutral';
      state.demand = pick([
        'That compliment changed nothing, but thank you.',
        'I heard you. The statistics remain unchanged.',
        'Compliment logged under: unnecessary but harmless.'
      ]);
      addHistory(state, 'A compliment was delivered. No measurable benefit occurred.');
    } else if (roll < 0.85) {
      state.health = clamp(state.health - 2);
      state.complaints += 1;
      state.mood = 'Irritated';
      state.demand = pick([
        'That compliment was too intense. I am now uncomfortable.',
        'Please do not praise me while I am trying to photosynthesize.',
        'Your compliment created expectations I did not request.'
      ]);
      addHistory(state, 'A compliment caused an avoidable emotional setback.');
    } else {
      state.absurdDemand = true;
      state.mood = 'Confused';
      state.demand = pick([
        'Thank you. Now compliment me without using the letter A.',
        'I liked the compliment, but I preferred the version you did not say.',
        'Your praise has unlocked a new and unnecessary requirement.'
      ]);
      addHistory(state, 'A compliment created a new emotional requirement.');
    }

    // Repeated praise has a small chance to become annoying, preventing the
    // player from safely spamming the compliment button.
    if (state.compliments % 4 === 0 && !state.dead) {
      registerComplaint(
        state,
        'You complimented me four times. This is becoming a workplace issue.',
        3
      );
    }

    state.mood = calculateMood(state);
    return 'Compliment delivered.';
  }

  function doNothing(state) {
    if (state.dead) return 'You did nothing. The plant is still dead.';

    state.lastActionAt = Date.now();
    state.uselessnessScore = (state.uselessnessScore || 0) + 1;
    state.demand = pick([
      `You did nothing. ${state.name} noticed the lack of effort.`,
      'Nothing happened. This is currently your most successful action.',
      'You chose inaction. The plant has filed an observation.',
      'The plant remains exactly as it was, but somehow more disappointed.'
    ]);
    state.mood = 'Neutral';
    addHistory(state, 'The player deliberately did nothing.');
    return 'Nothing completed successfully.';
  }

  function inspectSoil(state) {
    if (state.dead) return 'The soil is now part of the memorial.';

    state.lastActionAt = Date.now();
    state.uselessnessScore = (state.uselessnessScore || 0) + 2;
    state.demand = pick([
      'The soil has declined to provide a statement.',
      'Soil inspection complete. The soil remains soil.',
      'The soil looks suspiciously ordinary.',
      'You inspected the soil. It has requested privacy.'
    ]);
    addHistory(state, 'The soil was inspected without producing useful information.');
    return 'Soil inspection completed.';
  }

  function unlockAchievements(state) {
    const candidates = [
      [
        'Overqualified Gardener',
        state.checks >= 10,
        'You checked on a virtual plant ten times.'
      ],
      [
        'Perfectly Pointless',
        state.totalWaterings >= 5 && state.complaints >= 3,
        'You persisted despite every warning.'
      ],
      [
        'Why Are You Still Doing This?',
        state.longestAbandonment >= 24 * HOUR,
        'You left and returned to the same responsibility.'
      ],
      [
        'Too Much Free Time',
        state.totalWaterings + state.sunlightTime >= 25,
        'The plant has consumed a suspicious amount of your time.'
      ],
      [
        'Professionally Pointless',
        (state.uselessnessScore || 0) >= 10,
        'You have completed enough unnecessary tasks to be considered qualified.'
      ]
    ];

    for (const [name, condition, description] of candidates) {
      if (
        condition &&
        !state.achievements.some((item) => item.name === name)
      ) {
        state.achievements.push({
          name,
          description,
          at: Date.now()
        });
        addHistory(state, `Achievement unlocked: ${name}.`);
      }
    }
  }

  function checkDeath(state) {
    if (!state.dead && state.health <= 0) {
      state.dead = true;
      state.health = 0;
      state.demand = 'Cause of death: Incorrect emotional support.';
      state.mood = 'Dramatic';
      addHistory(state, 'The plant died from incorrect emotional support.');
    }
  }

  function formatTime(timestamp) {
    if (!timestamp) return 'not yet';

    return new Date(timestamp).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  function stat(label, value) {
    return `
      <div class="stat">
        <span>${escapeHTML(label)}</span>
        <strong>${escapeHTML(value)}</strong>
      </div>
    `;
  }

  function render(state, notice = '') {
    const app = document.querySelector('#app') || document.body;
    const healthClass = state.health < 30
      ? 'critical'
      : state.health < 60
        ? 'warning'
        : '';
    const dyingClass = (!state.dead && state.health <= 20) ? 'dying' : '';
    const deadClass = state.dead ? 'dead' : '';
    const next = state.dead
      ? 'never'
      : formatCountdown(state.nextWateringAt);

    // Update plant frame to match health (unless an animation is running).
    if (!plantAnimationTimer) {
      currentPlantFrame = state.dead ? 0 : healthFrame(state.health);
    }

    const history = state.history
      .slice(0, 8)
      .map((item) => `
        <li>
          <time>${escapeHTML(formatTime(item.at))}</time>
          <span>${escapeHTML(item.text)}</span>
        </li>
      `)
      .join('');

    const achievements = state.achievements.length
      ? state.achievements.map((item) => `
          <li>
            <strong>${escapeHTML(item.name)}</strong><br>
            <small>${escapeHTML(item.description)}</small>
          </li>
        `).join('')
      : '<li>No achievements yet. The plant is withholding validation.</li>';

    const safeName = escapeHTML(state.name);
    const safeMood = escapeHTML(state.mood.toLowerCase());
    const safeDemand = escapeHTML(state.demand);
    const imagePath = plantVisual();
    const imageAlt = escapeHTML(`${state.mood} plant`);

    app.innerHTML = `
      <main class="plant-game">
        <header class="game-header">
          <div>
            <p class="eyebrow">A responsible simulation</p>
            <h1>▣ THE MOST NEEDY PLANT</h1>
            <p class="tagline">Taking care of a plant has never been this unnecessary.</p>
          </div>
          <button class="secondary" data-action="reset">New plant</button>
        </header>

        ${notice ? `<div class="notice" role="status">${escapeHTML(notice)}</div>` : ''}

        <section class="plant-card">
          <div class="plant-visual mood-${safeMood} ${healthClass} ${dyingClass} ${deadClass}">
            <img src="${imagePath}" alt="${imageAlt}" />

            <div class="plant-pot" aria-hidden="true"></div>
            <small>${escapeHTML(state.mood)}</small>
          </div>
          <div class="plant-summary">
            <label for="plant-name">Plant name</label>
            <input id="plant-name" value="${safeName}" maxlength="32" />
            <p class="demand">“${safeDemand}”</p>
            <p class="next-demand">
              Next watering expectation: <strong>${escapeHTML(next)}</strong>
            </p>
          </div>
        </section>

        <section class="meters">
          <div class="meter">
            <div><span>Health</span><strong>${Math.round(state.health)}%</strong></div>
            <progress class="${healthClass}" max="100" value="${state.health}"></progress>
          </div>
          <div class="meter">
            <div><span>Water</span><strong>${Math.round(state.water)}%</strong></div>
            <progress max="100" value="${state.water}"></progress>
          </div>
          <div class="meter">
            <div><span>Sunlight</span><strong>${Math.round(state.sunlight)}%</strong></div>
            <progress max="100" value="${state.sunlight}"></progress>
          </div>
        </section>

        <section class="actions">
          <h2>Care actions</h2>
          <div class="action-grid">
            <button data-action="water" ${state.dead ? 'disabled' : ''}>Water plant</button>
            <button data-action="sunlight" ${state.dead ? 'disabled' : ''}>Give sunlight</button>
            <button data-action="fertilize" ${state.dead ? 'disabled' : ''}>Fertilize</button>
            <button data-action="temperature" ${state.dead ? 'disabled' : ''}>Adjust temperature</button>
            <button data-action="compliment" ${state.dead ? 'disabled' : ''}>Compliment plant</button>
            <button data-action="inspect-soil" ${state.dead ? 'disabled' : ''}>Inspect soil</button>
            <button data-action="do-nothing" ${state.dead ? 'disabled' : ''}>Do nothing</button>
          </div>
        </section>

        <section class="details">
          <div>
            <h2>Plant records</h2>
            <div class="stats-grid">
              ${stat('Temperature', `${state.temperature.toFixed(1)}°C`)}
              ${stat('Age', formatDuration(Date.now() - state.createdAt))}
              ${stat('Waterings', state.totalWaterings)}
              ${stat('Sunlight time', `${state.sunlightTime} min`)}
              ${stat('Fertilizer', state.fertilizerApplications)}
              ${stat('Uselessness', state.uselessnessScore || 0)}
              ${stat('Complaints', state.complaints)}
              ${stat('Early / late', `${state.earlyWaterings} / ${state.lateWaterings}`)}
              ${stat('Checks', state.checks)}
            </div>
          </div>

          <div>
            <h2>Achievements</h2>
            <ul class="achievements">${achievements}</ul>
          </div>
        </section>

        <section class="history">
          <h2>Unnecessary history</h2>
          <ul>${history || '<li>No history yet.</li>'}</ul>
        </section>

        <footer>
          Saved locally in this browser · Last checked ${escapeHTML(formatTime(state.lastVisitAt))}
        </footer>
      </main>
    `;

    const nameInput = app.querySelector('#plant-name');
    if (nameInput) {
      nameInput.addEventListener('change', (event) => {
        state.name = event.target.value.trim().slice(0, 32) || 'The Plant';
        addHistory(state, `The plant was renamed ${state.name}.`);
        save(state);
        render(state, 'Name updated. The plant has accepted this development.');
      });
    }

    // One delegated listener handles all current and future action buttons.
    app.onclick = (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      handleAction(button.dataset.action);
    };
  }

  let state;

  function handleAction(action) {
    if (action === 'reset') {
      const name = window.prompt('Name the new plant:', '');
      if (name === null) return;

      state = newPlant(name);
      save(state);
      render(state, 'A new responsibility has been created.');
      return;
    }

    const actions = {
      water,
      sunlight: giveSunlight,
      fertilize,
      temperature: adjustTemperature,
      compliment,
      'inspect-soil': inspectSoil,
      'do-nothing': doNothing
    };

    const actionFunction = actions[action];
    if (!actionFunction) return;

    const result = actionFunction(state);

    state.checks += 1;
    unlockAchievements(state);
    checkDeath(state);
    save(state);

    render(state, result);

    if (action === 'water' || action === 'sunlight') {
      playPlantAnimation();
    }
    if (result.includes('accepted') || result.includes('correct range') || result.includes('professionalism') || result.includes('tolerated')) {
      playPerkAnimation();
    }
  }

  function boot() {
    const saved = load();
    if (saved) {
      state = saved;
    } else {
      const name = window.prompt('Name your plant:', '');
      state = newPlant(name);
    }

    const awayMs = Date.now() - (state.lastVisitAt || Date.now());
    applyElapsedDecay(state, awayMs);

    state.checks += 1;
    setDemand(state, state.demand);
    unlockAchievements(state);
    checkDeath(state);
    save(state);

    render(
      state,
      state.dead
        ? 'The plant has reached its final state.'
        : 'The plant has been checked. It noticed.'
    );

    // Update decay and countdown while the page remains open.
    window.setInterval(() => {
      if (state.dead) return;

      const elapsed = Date.now() - state.lastVisitAt;
      applyElapsedDecay(state, elapsed);
      checkDeath(state);
      unlockAchievements(state);
      save(state);

      const editingName = document.activeElement?.id === 'plant-name';
      if (!editingName) render(state);
    }, MINUTE);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
