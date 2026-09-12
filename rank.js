/* ================================================
   BUNKVERSE — Bunking Rank Logic
   XP system, ranks, achievements, special titles
   ================================================ */

// ─── Rank Tiers ───────────────────────────────────
const RANK_TIERS = {
  angel: {
    emoji: '😇',
    title: 'ATTENDANCE ANGEL',
    desc: 'You go to every class. Even optional ones. Even the 8 AM ones. Are you okay? Do you need help?',
    ml: '"Eda, nee normal aano? Oru class miss cheyyathe eppo pokum? 🤔"',
    class: 'angel',
    color: 'var(--green)',
    xpMultiplier: 0.1,
  },
  casual: {
    emoji: '😎',
    title: 'CASUAL BUNKER',
    desc: 'You bunk occasionally, but you\'re still technically within the rules. Living dangerously but responsibly.',
    ml: '"Occasional bunk okay aanu. Still presentable. Parents proud aayirikum. 😌"',
    class: 'casual',
    color: 'var(--cyan)',
    xpMultiplier: 0.5,
  },
  professional: {
    emoji: '🥷',
    title: 'PROFESSIONAL BUNKER',
    desc: 'You\'ve mastered the art of staying exactly at 75%. The calculation precision is actually impressive.',
    ml: '"75%!! Nee scientist aanu! Exact borderline maintain cheyyunnu! Respect! 🥷"',
    class: 'professional',
    color: 'var(--purple-light)',
    xpMultiplier: 0.8,
  },
  fugitive: {
    emoji: '💀',
    title: 'ATTENDANCE FUGITIVE',
    desc: 'You\'re running from the college attendance register. The HOD knows your name. Not for good reasons.',
    ml: '"Principal office visit ready cheyyuu. Parenst call varum bro. 💀"',
    class: 'fugitive',
    color: 'var(--gold)',
    xpMultiplier: 1.0,
  },
  legendary: {
    emoji: '☠️',
    title: 'LEGENDARY BUNKER',
    desc: 'A myth. A legend. A cautionary tale told by professors to freshers. How are you even here?',
    ml: '"Ninne parriche class nadattiyal maathram ee dept. survive cheyyumayirunnu. ☠️"',
    class: 'legendary',
    color: 'var(--red)',
    xpMultiplier: 1.5,
  }
};

// ─── Special Titles ───────────────────────────────
const SPECIAL_TITLES = [
  {
    id: 'maaveli',
    icon: '👑',
    name: 'MAAVELI',
    desc: 'The king who shows up once a year',
    req: 'Bunk % > 40%',
    unlockCondition: (data) => data.bunkPct > 40,
  },
  {
    id: 'last_bench',
    icon: '🥷',
    name: 'LAST BENCH LEGEND',
    desc: 'When you do attend, it\'s the last bench',
    req: 'Attendance < 85%',
    unlockCondition: (data) => data.attendancePct < 85,
  },
  {
    id: 'monday_escape',
    icon: '🏃',
    name: 'MONDAY ESCAPE ARTIST',
    desc: 'The one who never appears on Mondays',
    req: 'Bunk % > 20%',
    unlockCondition: (data) => data.bunkPct > 20,
  },
  {
    id: 'attendance_fugitive',
    icon: '💀',
    name: 'ATTENDANCE FUGITIVE',
    desc: 'Running from the HOD since semester 1',
    req: 'Attendance < 75%',
    unlockCondition: (data) => data.attendancePct < 75,
  },
  {
    id: 'survivor',
    icon: '🛡️',
    name: '75% SURVIVOR',
    desc: 'Survived the semester at exactly 75%',
    req: 'Attendance between 75–77%',
    unlockCondition: (data) => data.attendancePct >= 75 && data.attendancePct <= 77,
  },
  {
    id: 'ghost',
    icon: '👻',
    name: 'CLASS GHOST',
    desc: 'Present in the register, absent in reality',
    req: 'Bunk % > 30%',
    unlockCondition: (data) => data.bunkPct > 30,
  },
  {
    id: 'calculator',
    icon: '🧮',
    name: 'ATTENDANCE MATHEMATICIAN',
    desc: 'Knows exactly how many bunks remain',
    req: 'Any calculation attempt',
    unlockCondition: (data) => true,
  },
  {
    id: 'legendary_title',
    icon: '☠️',
    name: 'HALL OF LEGENDS',
    desc: 'Below 60% and still surviving somehow',
    req: 'Attendance < 60%',
    unlockCondition: (data) => data.attendancePct < 60,
  },
];

// ─── Achievements ─────────────────────────────────
const ACHIEVEMENTS = [
  { icon: '🏆', name: '75% Survivor', desc: 'Survived at minimum attendance', condition: (d) => d.attendancePct >= 75 },
  { icon: '😎', name: 'First Bunk', desc: 'Bunked at least one class', condition: (d) => d.missed >= 1 },
  { icon: '🥷', name: 'Professional Bunker', desc: 'Bunked 10+ classes', condition: (d) => d.missed >= 10 },
  { icon: '💀', name: 'Danger Zone', desc: 'Attendance dropped below 75%', condition: (d) => d.attendancePct < 75 },
  { icon: '☠️', name: 'Legendary', desc: 'Below 60% attendance', condition: (d) => d.attendancePct < 60 },
  { icon: '🏃', name: 'Monday Escape', desc: 'Over 20% bunk rate', condition: (d) => d.bunkPct > 20 },
  { icon: '🎓', name: 'Responsible Student', desc: 'Above 90% attendance', condition: (d) => d.attendancePct >= 90 },
  { icon: '🔮', name: 'BUNKVERSE User', desc: 'Used BUNKVERSE to calculate', condition: () => true },
];

// ─── Main Calculation ─────────────────────────────
function calculateRank() {
  const conducted = parseInt(document.getElementById('rankConducted').value) || 100;
  const attended = parseInt(document.getElementById('rankAttended').value) || 76;
  const name = document.getElementById('rankName').value.trim() || 'Anonymous Bunker';
  const dept = document.getElementById('rankDept').value;

  const missed = Math.max(0, conducted - attended);
  const attendancePct = (attended / conducted) * 100;
  const bunkPct = (missed / conducted) * 100;

  // XP calculation
  const baseXP = missed * 15;
  let tier;
  if (attendancePct >= 90) tier = RANK_TIERS.angel;
  else if (attendancePct >= 80) tier = RANK_TIERS.casual;
  else if (attendancePct >= 75) tier = RANK_TIERS.professional;
  else if (attendancePct >= 60) tier = RANK_TIERS.fugitive;
  else tier = RANK_TIERS.legendary;

  const xp = Math.round(baseXP * tier.xpMultiplier + attendancePct * 2);
  const bunkLevel = Math.min(100, Math.round(bunkPct * 2.5));

  const data = { conducted, attended, missed, attendancePct, bunkPct, xp, bunkLevel, name, dept, tier };

  // Loading
  document.getElementById('rankResult').classList.remove('visible');
  document.getElementById('rankCalculating').style.display = 'block';

  const msgs = [
    '📊 Analyzing your attendance history...',
    '🥷 Measuring bunking expertise...',
    '🏆 Calculating Bunker XP...',
    '👑 Determining your legendary title...',
    '🎖️ Unlocking achievements...',
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i < msgs.length) {
      document.getElementById('rankCalcMsg').textContent = msgs[i++];
    } else {
      clearInterval(interval);
      document.getElementById('rankCalculating').style.display = 'none';
      displayRank(data);
    }
  }, 500);
}

// ─── Display Rank ─────────────────────────────────
function displayRank(data) {
  const { conducted, attended, missed, attendancePct, bunkPct, xp, bunkLevel, name, dept, tier } = data;

  // Profile
  const badge = document.getElementById('profileTitleBadge');
  badge.textContent = `${tier.emoji} ${tier.title}`;
  badge.style.background = `rgba(124,58,237,0.15)`;
  badge.style.border = `1px solid rgba(124,58,237,0.35)`;
  badge.style.color = tier.color;

  document.getElementById('profileName').textContent = name || 'Anonymous Bunker';
  document.getElementById('profileSub').textContent = `${dept} Department • ${attendancePct.toFixed(1)}% Attendance • ${xp} XP`;

  // XP
  document.getElementById('profileXP').textContent = '0';
  animateCounter(document.getElementById('profileXP'), 0, xp, 1200, '');

  document.getElementById('profileBunkLevel').textContent = '0%';
  animateCounter(document.getElementById('profileBunkLevel'), 0, bunkLevel, 1000, '%');

  setTimeout(() => {
    document.getElementById('xpBarFill').style.width = bunkLevel + '%';
  }, 100);

  // Stats
  document.getElementById('rankStatConducted').textContent = conducted;
  document.getElementById('rankStatAttended').textContent = attended;
  document.getElementById('rankStatMissed').textContent = missed;
  animateCounter(document.getElementById('rankStatAttendancePct'), 0, Math.round(attendancePct), 1000, '%');
  animateCounter(document.getElementById('rankStatBunkPct'), 0, Math.round(bunkPct), 1000, '%');
  document.getElementById('rankStatXP').textContent = xp;

  // Rank tier card
  const tierCard = document.getElementById('rankTierCard');
  tierCard.className = `rank-tier ${tier.class} mt-24`;
  document.getElementById('rankTierEmoji').textContent = tier.emoji;
  document.getElementById('rankTierTitle').textContent = tier.title;
  document.getElementById('rankTierDesc').textContent = tier.desc;
  document.getElementById('rankTierML').textContent = tier.ml;

  // Achievements
  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.condition(data));
  document.getElementById('achievementBadges').innerHTML = unlockedAchievements.map(a =>
    `<div class="achievement-badge">${a.icon} ${a.name}</div>`
  ).join('');

  // Special titles
  document.getElementById('specialTitlesGrid').innerHTML = SPECIAL_TITLES.map(t => {
    const unlocked = t.unlockCondition(data);
    return `<div class="special-title-card ${unlocked ? 'unlocked' : ''}">
      <div class="title-icon">${t.icon}</div>
      <div class="title-text">
        <div class="title-name">${t.name}</div>
        <div class="title-req">${t.req}</div>
      </div>
      <div class="lock">${unlocked ? '✅' : '🔒'}</div>
    </div>`;
  }).join('');

  // Gallery media
  loadRankMedia(attendancePct);

  // Show
  document.getElementById('rankResult').classList.add('visible');
  document.getElementById('rankResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Load gallery media ───────────────────────────
function loadRankMedia(attendancePct) {
  let category;
  if (attendancePct >= 90) category = 'above90';
  else if (attendancePct >= 80) category = '80to89';
  else if (attendancePct >= 75) category = '75to79';
  else category = 'below75';

  const catEl = document.getElementById('rankMemeCategory');
  if (catEl) catEl.textContent = `Category: ${category}`;

  const media = typeof getCategoryMedia === 'function'
    ? getCategoryMedia(category)
    : Storage.get(`gallery_${category}`, {});

  const memeBox = document.getElementById('rankMemeImage');
  if (memeBox && media.image) {
    memeBox.innerHTML = `<img src="${media.image}" alt="Rank Meme" style="width:100%;border-radius:var(--radius);max-height:300px;object-fit:cover;">`;
  }

  const videoBox = document.getElementById('rankMemeVideo');
  if (videoBox && media.video) {
    videoBox.innerHTML = `<video src="${media.video}" controls style="width:100%;border-radius:var(--radius);max-height:300px;"></video>`;
  }

  const dialogueBox = document.getElementById('rankDialogue');
  if (dialogueBox && media.dialogue) {
    dialogueBox.innerHTML = `<em>"${media.dialogue}"</em>`;
  }

  // Set default profile avatar from user photos if not custom
  const img = document.getElementById('profileAvatarImg');
  const placeholder = document.querySelector('.profile-avatar-placeholder');
  if (img && (!img.src || img.style.display === 'none')) {
    img.src = 'krishnaa/sureshgopi pfp.jpg';
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  }
}

// ─── Profile image upload ─────────────────────────
function loadProfileImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById('profileAvatarImg');
    img.src = e.target.result;
    img.style.display = 'block';
    document.querySelector('.profile-avatar-placeholder') && (document.querySelector('.profile-avatar-placeholder').style.display = 'none');
  };
  reader.readAsDataURL(file);
}

// ─── Media tab ────────────────────────────────────
function switchRankTab(tabEl, tabId) {
  document.querySelectorAll('.media-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.media-tab-content').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

function resetRank() {
  document.getElementById('rankResult').classList.remove('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
