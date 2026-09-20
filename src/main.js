/**
 * Spillup — Complete App
 * ✅ Login page
 * ✅ Funny tea overflow popup
 * ✅ 🎆 Firecracker / confetti animation on rank-up
 * ✅ 🔥 Gossip streak counter with animation
 * ✅ 🏆 Gossip leaderboard (Hall of Shame)
 * ✅ Dual split view real-time P2P messaging
 */

import './styles/tokens.css';
import './styles/main.css';
import './styles/components.css';

import { CLIENT_ACCOUNTS, GROUPS, getEntity, generateAvatar } from './modules/contacts.js';
import {
  getThreadKey, loadThreads, saveThreads,
  createMessage, addMessageToThread, getThreadMessages,
  markThreadAsRead, updateThreadRisk, getLastThreadPreview,
  groupMessagesByDate, formatTimestamp, seedMultiClientDemo
} from './modules/chat.js';
import { analyzeGossip } from './modules/gossipEngine.js';
import { showToast } from './modules/notifications.js';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const SESSION_KEY = 'gg_active_user';

const GOSSIP_TITLES = [
  { min: 500, title: '👑 Grapevine Royalty',     rank: 0 },
  { min: 300, title: '📡 Chief Radio Station',    rank: 1 },
  { min: 200, title: '🫖 Spicy Tea Sommelier',    rank: 2 },
  { min: 130, title: '🌶️ Hot Pepper Informant',   rank: 3 },
  { min:  75, title: '📣 Local Town Crier',        rank: 4 },
  { min:  40, title: '👂 Casual Eavesdropper',     rank: 5 },
  { min:  10, title: '🧂 Minor Salt Shaker',       rank: 6 },
  { min:   0, title: '😇 Innocent Bystander',      rank: 7 },
];

const FUNNY_HEADLINES = [
  "You've spilled so much tea the carpet is permanently stained ☕",
  "Breaking: Local person single-handedly keeps rumor economy alive 📈",
  "The office water cooler just filed a restraining order against you 💧",
  "Scientists confirm: your mouth moves faster than fact-checking 🚀",
  "Your chat history has been forwarded to the Gossip Museum 🏛️",
];

const FUNNY_QUOTES = [
  "The FBI agent monitoring this chat just choked on their coffee ☕",
  "Your grandma called — she says even SHE heard this one already 👵",
  "This message has been archived and made into a documentary 🎬",
  "Plot twist: the person you're gossiping about is in the next room 😬",
  "You have exceeded your daily gossip quota by 400% 📊",
];

const FUNNY_BADGES = [
  "🏅 Awarded: Chief Tea Spiller",
  "👑 Awarded: Grapevine Royalty",
  "📡 Awarded: Human Radio Station",
  "🫖 Awarded: Spicy Tea Sommelier",
  "🌶️ Awarded: Nuclear Drama Agent",
];

const RANK_UP_MESSAGES = [
  "You've been PROMOTED to a higher gossip tier! 🎉",
  "Your tea game just leveled up! 🍵✨",
  "The rumor mill is spinning faster because of you! 🎊",
  "Congratulations — you're officially a gossip legend! 🏆",
  "You just climbed the Hall of Shame ladder! 🪜🔥",
];

// ─────────────────────────────────────────────────────────────
// Global State
// ─────────────────────────────────────────────────────────────
let threads = {};
let modalThreadKey = null;
let activeLoginClientId = null;

// Per-client tea points & streaks
const teaPoints = {};
const gossipStreak = {};
const prevRankIndex = {}; // track previous rank to detect rank-up

CLIENT_ACCOUNTS.forEach(c => {
  teaPoints[c.id] = 0;
  gossipStreak[c.id] = 0;
  prevRankIndex[c.id] = 7; // starts at Innocent Bystander
});

// Cooldowns
const funnyPopupCooldown = {};
const rankUpCooldown = {};

// Track current leader for takeover detection
let currentLeaderId = null;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getRand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getRankIndex(pts) {
  const t = GOSSIP_TITLES.find(t => pts >= t.min);
  return t ? t.rank : 7;
}

// ─────────────────────────────────────────────────────────────
// 👑 LEADER CROWN WIDGET — Live topbar tracker
// ─────────────────────────────────────────────────────────────
function updateLeaderCrown() {
  const sorted = CLIENT_ACCOUNTS
    .map(c => ({ ...c, pts: teaPoints[c.id] || 0 }))
    .sort((a, b) => b.pts - a.pts);

  const leader = sorted[0];
  if (!leader || leader.pts === 0) return; // nobody has points yet

  const widget    = document.getElementById('leader-crown-widget');
  const avatarEl  = document.getElementById('leader-crown-avatar');
  const nameEl    = document.getElementById('leader-crown-name');
  const ptsEl     = document.getElementById('leader-crown-pts');

  if (!widget) return;

  const { initials, color } = generateAvatar(leader);
  avatarEl.textContent  = initials;
  avatarEl.style.background = color;
  nameEl.textContent    = leader.name;
  ptsEl.textContent     = `${leader.pts} pts`;
  widget.style.display  = 'flex';

  // Detect leadership change
  if (currentLeaderId !== leader.id) {
    const prevLeader = currentLeaderId;
    currentLeaderId = leader.id;
    if (prevLeader !== null) {
      // Someone just took the crown — announce it!
      showNewLeaderBanner(leader);
    } else {
      currentLeaderId = leader.id; // first leader, no announcement
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 👑 NEW LEADER TAKEOVER BANNER
// ─────────────────────────────────────────────────────────────
function showNewLeaderBanner(leader) {
  const banner    = document.getElementById('new-leader-banner');
  const nameEl    = document.getElementById('new-leader-name');
  const titleEl   = document.getElementById('new-leader-title');
  if (!banner) return;

  const titleInfo = GOSSIP_TITLES.find(t => (teaPoints[leader.id] || 0) >= t.min)
                 || GOSSIP_TITLES[GOSSIP_TITLES.length - 1];

  nameEl.textContent  = leader.name;
  titleEl.textContent = titleInfo.title;

  // Reset animation by removing then re-adding class
  banner.classList.remove('slide-in');
  void banner.offsetWidth;
  banner.classList.add('slide-in');

  // Also launch a short burst of firecrackers
  launchFirecrackers(60);
}

function renderAvatarEl(entity, sizeClass = 'avatar--md') {
  const { initials, color } = generateAvatar(entity);
  const div = document.createElement('div');
  div.className = `avatar ${sizeClass}`;
  div.style.background = color;
  div.textContent = initials;
  if (entity?.status === 'online' && !entity.isGroup) {
    const dot = document.createElement('span');
    dot.className = 'status-dot status-dot--online';
    div.appendChild(dot);
  }
  return div;
}

function stringToColor(str) {
  const colors = ['#e91e63','#2196f3','#9c27b0','#ff5722','#00bcd4','#ff9800','#4caf50','#795548'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

// ─────────────────────────────────────────────────────────────
// 🎆 FIRECRACKER / CONFETTI SYSTEM
// ─────────────────────────────────────────────────────────────
function launchFirecrackers(count = 120) {
  const canvas = document.getElementById('fireworks-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const particles = [];
  const colors = ['#f9c74f','#f94144','#00a884','#9c27b0','#fff','#ff5722','#00bcd4','#e91e63'];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      color: getRand(colors),
      alpha: 1,
      size: 4 + Math.random() * 6,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
    });
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18; // gravity
      p.vx *= 0.99;
      p.alpha -= 0.012;
      p.rotation += p.rotSpeed;
      if (p.alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    frame++;
    if (frame < 200) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }
  draw();
}

// ─────────────────────────────────────────────────────────────
// 🏆 RANK-UP CONGRATS POPUP
// ─────────────────────────────────────────────────────────────
function showRankUpPopup(clientId, newRankIndex) {
  if (rankUpCooldown[clientId]) return;
  rankUpCooldown[clientId] = true;
  setTimeout(() => { rankUpCooldown[clientId] = false; }, 20000);

  const newTitle = GOSSIP_TITLES.find(t => t.rank === newRankIndex);
  const backdrop = document.getElementById('rankup-backdrop');
  document.getElementById('rankup-title').textContent = newTitle?.title || '🏆 Rank Up!';
  document.getElementById('rankup-message').textContent = getRand(RANK_UP_MESSAGES);
  document.getElementById('rankup-client').textContent = getEntity(clientId)?.name || clientId;
  backdrop.classList.add('open');

  // 🎆 Launch firecrackers!
  launchFirecrackers(140);
  showToast(`🎆 ${getEntity(clientId)?.name} ranked up to ${newTitle?.title}!`, 'success', 5000);
}

document.getElementById('rankup-close-btn')?.addEventListener('click', () => {
  document.getElementById('rankup-backdrop').classList.remove('open');
});
document.getElementById('rankup-backdrop')?.addEventListener('click', e => {
  if (e.target === document.getElementById('rankup-backdrop'))
    document.getElementById('rankup-backdrop').classList.remove('open');
});

// ─────────────────────────────────────────────────────────────
// 🔥 GOSSIP STREAK DISPLAY
// ─────────────────────────────────────────────────────────────
function updateStreakDisplay(clientId, newStreak, instanceId) {
  const streakEl = document.querySelector(`.c${instanceId}-streak`);
  if (!streakEl) return;

  streakEl.textContent = `🔥 ${newStreak} Gossip Streak`;
  streakEl.style.display = newStreak >= 2 ? 'flex' : 'none';

  if (newStreak >= 2) {
    streakEl.classList.remove('streak--pulse');
    void streakEl.offsetWidth; // reflow to restart animation
    streakEl.classList.add('streak--pulse');

    // Extra shake for big streaks
    if (newStreak >= 5) {
      streakEl.classList.add('streak--fire');
    } else {
      streakEl.classList.remove('streak--fire');
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 🫖 FUNNY TEA OVERFLOW POPUP
// ─────────────────────────────────────────────────────────────
function showFunnyPopup(clientId, score) {
  if (funnyPopupCooldown[clientId]) return;
  funnyPopupCooldown[clientId] = true;
  setTimeout(() => { funnyPopupCooldown[clientId] = false; }, 15000);

  const client = getEntity(clientId);
  document.getElementById('funny-headline').textContent = getRand(FUNNY_HEADLINES);
  document.getElementById('funny-quote').textContent = getRand(FUNNY_QUOTES);
  document.getElementById('funny-badge').textContent = getRand(FUNNY_BADGES);
  document.getElementById('funny-tea-backdrop').classList.add('open');
  showToast(`🫖 ${client?.name || 'Someone'} overflowed the tea pot! Score: ${score}%`, 'warning', 5000);
}

document.getElementById('funny-tea-close-btn')?.addEventListener('click', () => {
  document.getElementById('funny-tea-backdrop').classList.remove('open');
});
document.getElementById('funny-tea-backdrop')?.addEventListener('click', e => {
  if (e.target === document.getElementById('funny-tea-backdrop'))
    document.getElementById('funny-tea-backdrop').classList.remove('open');
});

// ─────────────────────────────────────────────────────────────
// 🏅 LEADERBOARD MODAL
// ─────────────────────────────────────────────────────────────
function openLeaderboard() {
  const scores = {};
  CLIENT_ACCOUNTS.forEach(c => { scores[c.id] = teaPoints[c.id] || 0; });
  Object.values(threads).forEach(thread => {
    thread.messages?.forEach(msg => {
      if (msg.analysis?.isGossip && msg.senderId && scores[msg.senderId] !== undefined) {
        scores[msg.senderId] += msg.analysis.gossipScore;
      }
    });
  });

  const sorted = CLIENT_ACCOUNTS
    .map(c => ({ ...c, pts: Math.round(scores[c.id] || 0), streak: gossipStreak[c.id] || 0 }))
    .sort((a, b) => b.pts - a.pts);

  const rankEmojis = ['👑','🥈','🥉','4️⃣','5️⃣'];
  const body = document.getElementById('leaderboard-modal-body');
  body.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'leaderboard-header';
  header.innerHTML = `Rankings based on total gossip tea points across all threads.<br/><span style="color:var(--clr-accent)">Send spicy messages to climb the ranks! 🌶️</span>`;
  body.appendChild(header);

  const list = document.createElement('div');
  list.className = 'leaderboard-list';

  sorted.forEach((client, idx) => {
    const titleInfo = GOSSIP_TITLES.find(t => client.pts >= t.min) || GOSSIP_TITLES[GOSSIP_TITLES.length - 1];
    const { initials, color } = generateAvatar(client);
    const isThrone = idx === 0 && client.pts > 0;

    const item = document.createElement('div');
    item.className = `leaderboard-item${isThrone ? ' leaderboard-item--throne' : ''}`;
    item.style.setProperty('--i', idx);

    // Build throne crown row with floating mini crown above avatar for #1
    const throneExtra = isThrone
      ? `<div style="position:relative;flex-shrink:0;">
           <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:1rem;animation:throne-crown 2s ease-in-out infinite alternate;filter:drop-shadow(0 0 6px rgba(255,215,0,.8))">👑</div>
           <div class="leaderboard-item__avatar" style="width:44px;height:44px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;color:#fff;margin-top:8px">${initials}</div>
         </div>`
      : `<div class="leaderboard-item__avatar" style="width:38px;height:38px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem;color:#fff;flex-shrink:0;">${initials}</div>`;

    item.innerHTML = `
      <div class="leaderboard-item__rank">${rankEmojis[idx] || (idx + 1)}</div>
      ${throneExtra}
      <div class="leaderboard-item__info">
        <div class="leaderboard-item__name">${client.name}${client.streak >= 2 ? ` <span style="font-size:.7rem;color:#f9c74f">🔥${client.streak}</span>` : ''}${isThrone ? ' <span style="font-size:.65rem;color:#ffd700;letter-spacing:.1em;">KING</span>' : ''}</div>
        <div class="leaderboard-item__title">${titleInfo.title}</div>
      </div>
      <div class="leaderboard-item__score">
        <div class="leaderboard-item__points">${client.pts}</div>
        <div class="leaderboard-item__pts-label">Tea Pts</div>
      </div>
    `;
    list.appendChild(item);
  });

  body.appendChild(list);
  document.getElementById('leaderboard-backdrop').classList.add('open');
}

document.getElementById('leaderboard-btn')?.addEventListener('click', openLeaderboard);
document.getElementById('close-leaderboard-modal')?.addEventListener('click', () => document.getElementById('leaderboard-backdrop').classList.remove('open'));
document.getElementById('close-leaderboard-modal-btn')?.addEventListener('click', () => document.getElementById('leaderboard-backdrop').classList.remove('open'));
document.getElementById('leaderboard-backdrop')?.addEventListener('click', e => {
  if (e.target === document.getElementById('leaderboard-backdrop'))
    document.getElementById('leaderboard-backdrop').classList.remove('open');
});

// ─────────────────────────────────────────────────────────────
// 🔍 AUDIT REPORT MODAL
// ─────────────────────────────────────────────────────────────
function openAuditModal(threadKey) {
  if (!threadKey) return;
  modalThreadKey = threadKey;
  const body = document.getElementById('gossip-modal-body');
  const backdrop = document.getElementById('gossip-modal-backdrop');
  const riskScore = threads[threadKey]?.riskScore || 0;
  const messages = getThreadMessages(threads, threadKey);
  const gossipMsgs = messages.filter(m => m.analysis?.isGossip);

  body.innerHTML = '';

  const ringDiv = document.createElement('div');
  ringDiv.className = 'gossip-score-ring';
  const riskClass = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'med' : riskScore >= 10 ? 'low' : 'none';
  const riskEmoji = riskScore >= 70 ? '🚨' : riskScore >= 40 ? '⚠️' : riskScore >= 10 ? '🟡' : '✅';
  ringDiv.innerHTML = `
    <div class="score-circle score-circle--${riskClass}">
      <div class="score-circle__value">${riskScore}%</div>
      <div class="score-circle__label">Risk</div>
    </div>
    <strong style="color:var(--clr-text-primary);font-size:1rem;margin-top:6px;">${riskEmoji} Forensic Analysis</strong>
    <span style="color:var(--clr-text-secondary);font-size:var(--text-xs);">${gossipMsgs.length} flagged · ${messages.length} total</span>
  `;
  body.appendChild(ringDiv);

  if (gossipMsgs.length > 0) {
    const latest = gossipMsgs[gossipMsgs.length - 1].analysis;
    const verdictsDiv = document.createElement('div');
    verdictsDiv.className = 'gossip-report__verdicts';
    verdictsDiv.innerHTML = `
      <div class="verdict-card"><div class="verdict-card__label">Spiciness</div><div class="verdict-card__value">${latest.spicinessLabel || '—'}</div></div>
      <div class="verdict-card"><div class="verdict-card__label">Virality</div><div class="verdict-card__value">${latest.viralityScore || 0}%</div></div>
      <div class="verdict-card"><div class="verdict-card__label">Defamation</div><div class="verdict-card__value">${latest.riskLevel || 'None'}</div></div>
      <div class="verdict-card"><div class="verdict-card__label">Targets</div><div class="verdict-card__value">${latest.targets?.join(', ') || 'None'}</div></div>
    `;
    body.appendChild(verdictsDiv);
    if (latest.markers?.length > 0) {
      const mDiv = document.createElement('div');
      mDiv.className = 'gossip-report__markers';
      latest.markers.slice(0, 8).forEach(m => {
        const pill = document.createElement('div');
        pill.className = 'marker-pill';
        pill.innerHTML = `<span class="marker-pill__label">${m.label}</span><span class="marker-pill__snippet">"${m.snippet}"</span>`;
        mDiv.appendChild(pill);
      });
      body.appendChild(mDiv);
    }
    const vDiv = document.createElement('div');
    vDiv.style.cssText = 'padding:var(--sp-3);background:var(--clr-bg-app);border-radius:var(--r-md);border:1px solid var(--clr-border);font-size:var(--text-xs);margin-top:var(--sp-3);';
    vDiv.innerHTML = `<div style="font-weight:600;color:var(--clr-text-primary);margin-bottom:4px;">📋 Forensic Verdict</div><div style="color:var(--clr-text-secondary);line-height:1.6;">${latest.verdict || '—'}</div>`;
    body.appendChild(vDiv);
  } else {
    body.innerHTML += `<div style="text-align:center;padding:var(--sp-6);color:var(--clr-text-secondary);">
      <div style="font-size:2.5rem;margin-bottom:var(--sp-3);">✅</div>
      <div style="font-size:var(--text-md);font-weight:600;color:var(--clr-text-primary);">Clean Thread</div>
      <div style="font-size:var(--text-sm);">No gossip detected.</div>
    </div>`;
  }
  backdrop.classList.add('open');
}

document.getElementById('close-gossip-modal')?.addEventListener('click', () => document.getElementById('gossip-modal-backdrop').classList.remove('open'));
document.getElementById('close-gossip-modal-btn')?.addEventListener('click', () => document.getElementById('gossip-modal-backdrop').classList.remove('open'));
document.getElementById('gossip-modal-backdrop')?.addEventListener('click', e => {
  if (e.target === document.getElementById('gossip-modal-backdrop')) document.getElementById('gossip-modal-backdrop').classList.remove('open');
});
document.getElementById('gossip-modal-copy')?.addEventListener('click', () => {
  const riskScore = threads[modalThreadKey]?.riskScore || 0;
  navigator.clipboard.writeText(`Spillup Report — Risk: ${riskScore}%\nGenerated: ${new Date().toLocaleString()}`)
    .then(() => showToast('Report copied!', 'success', 3000));
});

// ─────────────────────────────────────────────────────────────
// 📱 MESSENGER INSTANCE CLASS
// ─────────────────────────────────────────────────────────────
class MessengerInstance {
  constructor(id, defaultClientId, defaultTargetId) {
    this.id = id;
    this.clientId = defaultClientId;
    this.targetId = defaultTargetId;

    this.selectEl       = document.querySelector(`.c${id}-select`);
    this.searchEl       = document.querySelector(`.c${id}-search`);
    this.contactListEl  = document.querySelector(`.c${id}-contact-list`);
    this.emptyEl        = document.querySelector(`.c${id}-empty`);
    this.chatPanelEl    = document.querySelector(`.c${id}-chat-panel`);
    this.avatarWrapEl   = document.querySelector(`.c${id}-avatar-container`);
    this.targetNameEl   = document.querySelector(`.c${id}-target-name`);
    this.targetSubEl    = document.querySelector(`.c${id}-target-sub`);
    this.messagesAreaEl = document.querySelector(`.c${id}-messages-area`);
    this.inputEl        = document.querySelector(`.c${id}-input`);
    this.sendBtnEl      = document.querySelector(`.c${id}-send-btn`);
    this.bannerEl       = document.querySelector(`.c${id}-gossip-banner`);
    this.bannerScoreEl  = document.querySelector(`.c${id}-banner-score`);
    this.bannerReportEl = document.querySelector(`.c${id}-banner-report`);
    this.reportBtnEl    = document.querySelector(`.c${id}-report-btn`);
    this.emojiBtnEl     = document.querySelector(`.c${id}-emoji-btn`);
    this.emojiPickerEl  = document.querySelector(`.c${id}-emoji-picker`);
  }

  init() {
    this.populateSelect();
    this.bindEvents();
    this.renderContacts();
    if (this.targetId) this.openChat(this.targetId);
  }

  populateSelect() {
    this.selectEl.innerHTML = '';
    CLIENT_ACCOUNTS.forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.textContent = `${acc.name} (${acc.initials})`;
      if (acc.id === this.clientId) opt.selected = true;
      this.selectEl.appendChild(opt);
    });
  }

  bindEvents() {
    this.selectEl.addEventListener('change', e => {
      this.clientId = e.target.value;
      showToast(`Window ${this.id}: Logged in as ${getEntity(this.clientId)?.name}`, 'info', 2000);
      if (this.targetId === this.clientId) {
        this.targetId = null;
        this.chatPanelEl.style.display = 'none';
        this.emptyEl.style.display = 'flex';
      } else if (this.targetId) {
        this.openChat(this.targetId);
      }
      this.renderContacts();
    });

    this.searchEl.addEventListener('input', () => this.renderContacts());
    this.sendBtnEl.addEventListener('click', () => this.sendMessage());
    this.inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 100) + 'px';
    });

    this.reportBtnEl?.addEventListener('click', () => openAuditModal(this.getThreadKey()));
    this.bannerReportEl?.addEventListener('click', () => openAuditModal(this.getThreadKey()));

    this.emojiBtnEl?.addEventListener('click', () => {
      const hidden = this.emojiPickerEl.style.display === 'none' || !this.emojiPickerEl.style.display;
      this.emojiPickerEl.style.display = hidden ? 'flex' : 'none';
    });
    this.emojiPickerEl?.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.inputEl.value += btn.getAttribute('data-emoji');
        this.emojiPickerEl.style.display = 'none';
        this.inputEl.focus();
      });
    });
    document.addEventListener('click', e => {
      if (this.emojiPickerEl && !this.emojiPickerEl.contains(e.target) && e.target !== this.emojiBtnEl) {
        this.emojiPickerEl.style.display = 'none';
      }
    });
  }

  getThreadKey() {
    if (!this.targetId) return null;
    const target = getEntity(this.targetId);
    return getThreadKey(this.clientId, this.targetId, target?.isGroup);
  }

  renderContacts() {
    this.contactListEl.innerHTML = '';
    const query = this.searchEl.value.toLowerCase();
    const available = [
      ...CLIENT_ACCOUNTS.filter(c => c.id !== this.clientId),
      ...GROUPS
    ];

    available.filter(e => e.name.toLowerCase().includes(query)).forEach(entity => {
      const tKey = getThreadKey(this.clientId, entity.id, entity.isGroup);
      const thread = threads[tKey];
      const lastMsg = getLastThreadPreview(threads, tKey);
      const unread = thread?.unread?.[this.clientId] || 0;
      const riskScore = thread?.riskScore || 0;

      const item = document.createElement('div');
      item.className = `contact-item${entity.id === this.targetId ? ' active' : ''}`;
      item.appendChild(renderAvatarEl(entity, 'avatar--md'));

      const body = document.createElement('div');
      body.className = 'contact-item__body';

      const row1 = document.createElement('div');
      row1.className = 'contact-item__row';
      const nameEl = document.createElement('div');
      nameEl.className = 'contact-item__name';
      nameEl.textContent = entity.name;
      const timeEl = document.createElement('div');
      timeEl.className = `contact-item__time${unread > 0 ? ' contact-item__time--unread' : ''}`;
      timeEl.textContent = lastMsg ? formatTimestamp(lastMsg.timestamp) : '';
      row1.appendChild(nameEl); row1.appendChild(timeEl);

      const row2 = document.createElement('div');
      row2.className = 'contact-item__row';
      const previewEl = document.createElement('div');
      previewEl.className = `contact-item__preview${riskScore >= 40 ? ' contact-item__preview--gossip' : ''}`;
      if (lastMsg) {
        const prefix = lastMsg.senderId === this.clientId ? 'You: ' : (entity.isGroup ? `${lastMsg.senderName}: ` : '');
        previewEl.textContent = prefix + lastMsg.text;
      } else { previewEl.textContent = 'No messages yet'; previewEl.style.fontStyle = 'italic'; }

      const badges = document.createElement('div');
      badges.style.cssText = 'display:flex;align-items:center;gap:4px;flex-shrink:0;';
      if (riskScore > 0) {
        const dot = document.createElement('span');
        dot.className = `risk-dot risk-dot--${riskScore >= 70 ? 'high' : riskScore >= 40 ? 'med' : 'low'}`;
        dot.title = `Risk: ${riskScore}%`;
        badges.appendChild(dot);
      }
      if (unread > 0) {
        const badge = document.createElement('span');
        badge.className = 'unread-badge';
        badge.textContent = unread > 99 ? '99+' : unread;
        badges.appendChild(badge);
      }
      row2.appendChild(previewEl); row2.appendChild(badges);
      body.appendChild(row1); body.appendChild(row2);
      item.appendChild(body);
      item.addEventListener('click', () => this.openChat(entity.id));
      this.contactListEl.appendChild(item);
    });
  }

  openChat(targetId) {
    this.targetId = targetId;
    const target = getEntity(targetId);
    if (!target) return;

    const tKey = this.getThreadKey();
    threads = markThreadAsRead(threads, tKey, this.clientId);
    saveThreads(threads);

    this.emptyEl.style.display = 'none';
    this.chatPanelEl.style.display = 'flex';
    this.avatarWrapEl.innerHTML = '';
    this.avatarWrapEl.appendChild(renderAvatarEl(target, 'avatar--sm'));
    this.targetNameEl.textContent = target.name;
    this.targetSubEl.textContent = target.isGroup ? `${target.members.length} members` : (target.status || 'online');

    this.renderMessages();
    this.updateBanner();
    this.renderContacts();
  }

  renderMessages() {
    const tKey = this.getThreadKey();
    if (!tKey) return;
    const messages = getThreadMessages(threads, tKey);
    const grouped = groupMessagesByDate(messages);
    const target = getEntity(this.targetId);

    this.messagesAreaEl.innerHTML = '';
    Object.entries(grouped).forEach(([dateLabel, msgs]) => {
      const divider = document.createElement('div');
      divider.className = 'date-divider';
      divider.innerHTML = `<span class="date-divider__label">${dateLabel}</span>`;
      this.messagesAreaEl.appendChild(divider);
      msgs.forEach(msg => this.messagesAreaEl.appendChild(this.buildBubble(msg, target)));
    });
    this.scrollToBottom();
  }

  buildBubble(msg, target) {
    const isSent = msg.senderId === this.clientId;
    const wrap = document.createElement('div');
    wrap.className = `bubble-wrap bubble-wrap--${isSent ? 'sent' : 'received'}${target?.isGroup ? ' bubble-wrap--group' : ''}`;

    if (!isSent && msg.senderName) {
      const nameEl = document.createElement('div');
      nameEl.className = 'bubble__sender-name';
      nameEl.textContent = msg.senderName;
      nameEl.style.color = stringToColor(msg.senderName);
      wrap.appendChild(nameEl);
    }

    const bubble = document.createElement('div');
    const a = msg.analysis;
    const gossipClass = a?.isGossip
      ? (a.gossipScore >= 70 ? ' bubble--gossip-high' : a.gossipScore >= 40 ? ' bubble--gossip-med' : ' bubble--gossip-low')
      : '';
    bubble.className = `bubble bubble--${isSent ? 'sent' : 'received'}${gossipClass}`;
    bubble.textContent = msg.isDeleted ? '🚫 Message deleted' : msg.text;
    if (a?.isGossip) bubble.title = `Tea Score: ${a.gossipScore}% — ${a.spicinessLabel}`;

    const footer = document.createElement('div');
    footer.className = 'bubble__footer';
    const timeEl = document.createElement('span');
    timeEl.className = 'bubble__time';
    timeEl.textContent = formatTimestamp(msg.timestamp);
    footer.appendChild(timeEl);

    if (isSent) {
      const statusEl = document.createElement('span');
      statusEl.className = 'bubble__status bubble__status--read';
      statusEl.textContent = '✓✓';
      footer.appendChild(statusEl);
    }

    bubble.appendChild(footer);
    wrap.appendChild(bubble);
    return wrap;
  }

  updateBanner() {
    const tKey = this.getThreadKey();
    const riskScore = threads[tKey]?.riskScore || 0;
    if (riskScore >= 30) {
      this.bannerEl.style.display = 'flex';
      this.bannerScoreEl.textContent = `${riskScore}% Risk`;
    } else {
      this.bannerEl.style.display = 'none';
    }
  }

  sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text || !this.targetId) return;

    const target = getEntity(this.targetId);
    const client = getEntity(this.clientId);
    const tKey = this.getThreadKey();
    const recipients = target.isGroup ? target.members : [this.clientId, this.targetId];
    const analysis = analyzeGossip(text);

    const msg = createMessage({
      senderId: this.clientId,
      senderName: client.name,
      recipientId: this.targetId,
      text,
      status: 'read',
      analysis: analysis || null
    });

    threads = addMessageToThread(threads, tKey, msg, recipients);

    if (analysis?.isGossip) {
      threads = updateThreadRisk(threads, tKey, analysis.gossipScore);

      // Accumulate tea points based on gossip quality
      let qualityMultiplier = 1;
      if (analysis.spiciness === 'nuclear') qualityMultiplier = 5;
      else if (analysis.spiciness === 'spicy') qualityMultiplier = 3;
      else if (analysis.spiciness === 'moderate') qualityMultiplier = 1.5;

      const earnedPts = Math.round(analysis.gossipScore * qualityMultiplier);
      const prevPts = teaPoints[this.clientId] || 0;
      teaPoints[this.clientId] = prevPts + earnedPts;

      // 🔥 Update streak
      gossipStreak[this.clientId] = (gossipStreak[this.clientId] || 0) + 1;
      updateStreakDisplay(this.clientId, gossipStreak[this.clientId], this.id);

      // Check rank-up
      const oldRank = prevRankIndex[this.clientId];
      const newRank = getRankIndex(teaPoints[this.clientId]);
      if (newRank < oldRank) { // lower index = higher rank
        prevRankIndex[this.clientId] = newRank;
        showRankUpPopup(this.clientId, newRank);
      }

      // Funny popup on high gossip score
      if (analysis.gossipScore >= 65) {
        showFunnyPopup(this.clientId, analysis.gossipScore);
      }
    } else {
      // Reset streak on non-gossip message
      gossipStreak[this.clientId] = 0;
      updateStreakDisplay(this.clientId, 0, this.id);
    }

    saveThreads(threads);
    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';

    // 👑 Refresh leader crown widget & detect leadership change
    updateLeaderCrown();

    window.dispatchEvent(new CustomEvent('gossip-thread-updated', { detail: { threadKey: tKey } }));
  }

  scrollToBottom() {
    requestAnimationFrame(() => { this.messagesAreaEl.scrollTop = this.messagesAreaEl.scrollHeight; });
  }
}

// ─────────────────────────────────────────────────────────────
// 🔄 CROSS-INSTANCE REAL-TIME SYNC
// ─────────────────────────────────────────────────────────────
let inst1 = null;
let inst2 = null;

window.addEventListener('gossip-thread-updated', e => {
  const { threadKey } = e.detail;
  [inst1, inst2].forEach(inst => {
    if (!inst) return;
    if (inst.getThreadKey() === threadKey) {
      inst.renderMessages();
      inst.updateBanner();
    }
    inst.renderContacts();
  });
});

// ─────────────────────────────────────────────────────────────
// ⚙️ MODE CONTROLS & WINDOW SWAP
// ─────────────────────────────────────────────────────────────
function initControls() {
  const workspace = document.getElementById('app-workspace');
  const singleBtn = document.getElementById('mode-single-btn');
  const dualBtn   = document.getElementById('mode-dual-btn');
  const inst2El   = document.getElementById('instance-2');

  singleBtn.addEventListener('click', () => {
    singleBtn.classList.add('active');
    dualBtn.classList.remove('active');
    workspace.className = 'workspace workspace--single';
    inst2El.style.display = 'none';
  });

  dualBtn.addEventListener('click', () => {
    dualBtn.classList.add('active');
    singleBtn.classList.remove('active');
    workspace.className = 'workspace workspace--dual';
    inst2El.style.display = 'flex';
    if (inst1?.targetId) inst1.openChat(inst1.targetId);
    if (inst2?.targetId) inst2.openChat(inst2.targetId);
  });

  document.getElementById('swap-windows-btn')?.addEventListener('click', () => {
    const [c1, t1] = [inst1.clientId, inst1.targetId];
    const [c2, t2] = [inst2.clientId, inst2.targetId];

    inst1.selectEl.value = c2; inst1.clientId = c2;
    inst1.populateSelect(); inst1.renderContacts();
    t2 ? inst1.openChat(t2) : (inst1.targetId = null, inst1.chatPanelEl.style.display = 'none', inst1.emptyEl.style.display = 'flex');

    inst2.selectEl.value = c1; inst2.clientId = c1;
    inst2.populateSelect(); inst2.renderContacts();
    t1 ? inst2.openChat(t1) : (inst2.targetId = null, inst2.chatPanelEl.style.display = 'none', inst2.emptyEl.style.display = 'flex');

    showToast('⇆ Windows swapped!', 'info', 2000);
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const c1 = btn.getAttribute('data-c1');
      const c2 = btn.getAttribute('data-c2');
      dualBtn.click();

      inst1.selectEl.value = c1; inst1.clientId = c1;
      inst1.populateSelect(); inst1.renderContacts(); inst1.openChat(c2);

      const p2 = c2.startsWith('group_') ? 'bob' : c2;
      inst2.selectEl.value = p2; inst2.clientId = p2;
      inst2.populateSelect(); inst2.renderContacts(); inst2.openChat(c1);

      showToast(`✅ Paired: ${getEntity(c1)?.name} ↔ ${getEntity(c2)?.name || c2}`, 'success', 2500);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// 🔐 LOGIN SCREEN CONTROLLER
// ─────────────────────────────────────────────────────────────
function mountLoginScreen(onLogin) {
  const screen     = document.getElementById('login-screen');
  const appRoot    = document.getElementById('app-root');
  const avatarsEl  = document.getElementById('login-avatars');
  const selEl      = document.getElementById('login-selected');
  const selAvEl    = document.getElementById('login-sel-avatar');
  const selNameEl  = document.getElementById('login-sel-name');
  const selAboutEl = document.getElementById('login-sel-about');
  const fieldEl    = document.getElementById('login-field');
  const passEl     = document.getElementById('login-password');
  const eyeBtn     = document.getElementById('login-eye-btn');
  const loginBtn   = document.getElementById('login-btn');
  const loginText  = loginBtn.querySelector('.login-btn__text');
  const errEl      = document.getElementById('login-error');
  const changeBtn  = document.getElementById('login-change-btn');
  const guestBtn   = document.getElementById('login-guest-btn');

  let selectedId = null;

  // Build avatar cards
  CLIENT_ACCOUNTS.forEach(client => {
    const { initials, color } = generateAvatar(client);
    const card = document.createElement('button');
    card.className = 'login-avatar-card';
    card.setAttribute('data-id', client.id);
    card.type = 'button';
    card.innerHTML = `
      <div class="login-avatar-card__avatar" style="background:${color};">${initials}</div>
      <div class="login-avatar-card__name">${client.name}</div>
    `;
    card.addEventListener('click', () => selectIdentity(client));
    avatarsEl.appendChild(card);
  });

  function selectIdentity(client) {
    selectedId = client.id;
    const { initials, color } = generateAvatar(client);
    avatarsEl.querySelectorAll('.login-avatar-card').forEach(c => c.classList.remove('selected'));
    avatarsEl.querySelector(`[data-id="${client.id}"]`)?.classList.add('selected');
    selAvEl.style.background = color;
    selAvEl.textContent = initials;
    selAvEl.style.cssText = `background:${color};width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem;color:#fff;flex-shrink:0;`;
    selNameEl.textContent = client.name;
    selAboutEl.textContent = client.about || `📱 ${client.initials} · Spillup member`;
    selEl.style.display = 'flex';
    fieldEl.style.display = 'flex';
    passEl.value = '';
    errEl.style.display = 'none';
    loginBtn.disabled = false;
    loginText.textContent = `Sign in as ${client.name}`;
    passEl.focus();
  }

  changeBtn.addEventListener('click', () => {
    selectedId = null;
    selEl.style.display = 'none';
    fieldEl.style.display = 'none';
    errEl.style.display = 'none';
    passEl.value = '';
    loginBtn.disabled = true;
    loginText.textContent = 'Select an account to continue';
    avatarsEl.querySelectorAll('.login-avatar-card').forEach(c => c.classList.remove('selected'));
  });

  eyeBtn.addEventListener('click', () => {
    const isText = passEl.type === 'text';
    passEl.type = isText ? 'password' : 'text';
    eyeBtn.textContent = isText ? '👁️' : '🙈';
  });

  function attemptLogin(id) {
    if (!id) return;
    if (!passEl.value.trim()) {
      errEl.textContent = '⚠️ Enter any password to continue (demo mode 😄)';
      errEl.style.display = 'block';
      passEl.focus();
      return;
    }
    loginBtn.disabled = true;
    loginText.textContent = 'Signing in…';
    loginBtn.querySelector('.login-btn__icon').textContent = '⏳';
    errEl.style.display = 'none';

    setTimeout(() => {
      localStorage.setItem(SESSION_KEY, id);
      screen.classList.add('fade-out');
      screen.addEventListener('animationend', () => {
        screen.style.display = 'none';
        appRoot.style.display = 'flex';
        appRoot.style.flexDirection = 'column';
        appRoot.style.height = '100vh';
        onLogin(id);
      }, { once: true });
    }, 700);
  }

  loginBtn.addEventListener('click', () => attemptLogin(selectedId));
  passEl.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(selectedId); });

  guestBtn.addEventListener('click', () => {
    localStorage.setItem(SESSION_KEY, 'alice');
    screen.classList.add('fade-out');
    screen.addEventListener('animationend', () => {
      screen.style.display = 'none';
      appRoot.style.display = 'flex';
      appRoot.style.flexDirection = 'column';
      appRoot.style.height = '100vh';
      onLogin('alice');
    }, { once: true });
  });
}

// ─────────────────────────────────────────────────────────────
// 🚀 INITIALISE APPLICATION
// ─────────────────────────────────────────────────────────────
function startApp(activeClientId) {
  activeLoginClientId = activeClientId;

  threads = loadThreads();
  threads = seedMultiClientDemo(threads);
  saveThreads(threads);

  // Seed existing tea points from stored messages
  Object.values(threads).forEach(thread => {
    thread.messages?.forEach(msg => {
      if (msg.analysis?.isGossip && msg.senderId && teaPoints[msg.senderId] !== undefined) {
        teaPoints[msg.senderId] = (teaPoints[msg.senderId] || 0) + msg.analysis.gossipScore;
      }
    });
  });

  // Compute starting ranks
  CLIENT_ACCOUNTS.forEach(c => {
    prevRankIndex[c.id] = getRankIndex(teaPoints[c.id] || 0);
  });

  initControls();

  inst1 = new MessengerInstance(1, activeClientId, null);
  inst1.init();

  // Instance 2 defaults to a different account
  const secondClient = CLIENT_ACCOUNTS.find(c => c.id !== activeClientId)?.id || 'bob';
  inst2 = new MessengerInstance(2, secondClient, activeClientId);
  inst2.init();

  // Auto open both into a chat
  inst1.openChat(secondClient);
  document.getElementById('instance-2').style.display = 'flex';

  // 👑 Initialize leader crown from seeded data
  updateLeaderCrown();

  showToast(`👋 Welcome, ${getEntity(activeClientId)?.name}! Spillup is armed 🛡️🫖`, 'success', 4000);
}

function init() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (saved && CLIENT_ACCOUNTS.find(c => c.id === saved)) {
    // Already logged in — skip login screen
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-root').style.display = 'flex';
    document.getElementById('app-root').style.flexDirection = 'column';
    document.getElementById('app-root').style.height = '100vh';
    startApp(saved);
  } else {
    mountLoginScreen(clientId => startApp(clientId));
  }
}

init();
