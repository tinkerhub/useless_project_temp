/* ================================================
   BUNKVERSE — Shared Script
   Navigation, Utilities, Toast Notifications
   ================================================ */

// ─── Navbar Active State ──────────────────────────
(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html') || (path === 'index.html' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

// ─── Navbar Scroll Effect ─────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
});

// ─── Hamburger Menu ───────────────────────────────
function toggleMobileMenu() {
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  }
}

// ─── Toast Notifications ──────────────────────────
function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type] || '💬'} ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── LocalStorage Helper ──────────────────────────
const Storage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem('bunkverse_' + key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('bunkverse_' + key, JSON.stringify(value)); } catch {}
  }
};

// ─── Default Media Presets from User Files ─────────
const DEFAULT_GALLERY_MEDIA = {
  above90: {
    image: 'krishnaa/sureshgopi pfp.jpg',
    video: 'krishnaa/pulimurugan_mohanlal.mp4',
    dialogue: 'താങ്കൾ പൊളിയാണ് ബ്രോ! 90% attendance... അമ്മയുടെ സ്വന്തം കുട്ടി! 🌟'
  },
  '80to89': {
    image: 'krishnaa/download (2).jpg',
    video: 'krishnaa/thalapathy_vijay_meme.mp4',
    dialogue: 'Vazhthukal Nanba! Safe zone is yours. Smooth sailing ahead! 😎'
  },
  '75to79': {
    image: 'krishnaa/master_.jpg',
    video: 'krishnaa/soubin_kumbalangi_nights.mp4',
    dialogue: 'ഇനി ഒരു ക്ലാസ്സ് പോയാൽ തീർന്നു... അരികിൽ നിൽക്കുന്ന ഭയം! 😬'
  },
  below75: {
    image: 'krishnaa/download.jpg',
    video: 'krishnaa/jujutsu_kaisen_higuruma.mp4',
    dialogue: 'എന്തിനാടാ എന്നെ ഇങ്ങനെ ദ്രോഹിക്കുന്നത്?! HOD റൂമിലോട്ട് വാടാ! 💀'
  },
  teacher_angry: {
    image: 'krishnaa/dotted_face.jpg',
    video: 'krishnaa/jujutsu_kaisen_higuruma.mp4',
    dialogue: 'നിന്റെ പേരന്റ്സിനെ നാളെ കൂട്ടിയിട്ട് വന്നാൽ മതി! 😠'
  },
  teacher_happy: {
    image: 'krishnaa/sureshgopi pfp.jpg',
    video: 'krishnaa/pulimurugan_mohanlal.mp4',
    dialogue: 'വെരി ഗുഡ് മോനേ, ഇതുപോലെ മുന്നോട്ട് പോവുക! 🙂'
  },
  excuse: {
    image: 'krishnaa/BAHAHAHAHAHA.jpg',
    video: 'krishnaa/soubin_kumbalangi_nights.mp4',
    dialogue: 'ഇത് സാർ വിശ്വസിച്ചാൽ നീ രക്ഷപ്പെട്ടു, ഇല്ലെങ്കിൽ സസ്പെൻഷൻ! 🤥'
  },
  excuse_rejected: {
    image: 'krishnaa/sai abhyankkar templates.jpg',
    video: 'krishnaa/jujutsu_kaisen_higuruma.mp4',
    dialogue: 'തമ്പി തപ്പു! ഈ ഉടായിപ്പ് ഇവിടെ ചിലവാവില്ല മോനേ! 🚫'
  },
  rank_up: {
    image: 'krishnaa/Whoa Superstar Rajinikanth templates.jpg',
    video: 'krishnaa/pulimurugan_mohanlal.mp4',
    dialogue: 'Whoaaa! പുതിയ റാങ്ക് അൺലോക്ക് ആയിരിക്കുന്നു! ലെവൽ അപ്പ്! 🆙'
  },
  legendary: {
    image: 'krishnaa/got.jpg',
    video: 'krishnaa/jon-snow-game-of-thrones.960x540.mp4',
    dialogue: 'Winter is here, and so is your Year Back! ലെജൻഡറി ബങ്കർ! ☠️'
  }
};

// ─── User Media Library Catalog (from files & memes) ─────────
const USER_MEDIA_LIBRARY = [
  // ── Videos from memes folder ──
  { name: 'Mohanlal Pulimurugan (Mass Entry)', file: 'krishnaa/pulimurugan_mohanlal.mp4', type: 'video', tag: 'Malayalam Meme / Mass Entry' },
  { name: 'Soubin Kumbalangi Nights Reaction', file: 'krishnaa/soubin_kumbalangi_nights.mp4', type: 'video', tag: 'Malayalam Meme / Saji Emotion' },
  { name: 'Thalapathy Vijay Reel Meme', file: 'krishnaa/thalapathy_vijay_meme.mp4', type: 'video', tag: 'Tamil Meme / Vijay Vibe' },
  { name: 'JJK Higuruma Trial Rampage', file: 'krishnaa/jujutsu_kaisen_higuruma.mp4', type: 'video', tag: 'Anime Meme / Death Penalty' },
  { name: 'Jon Snow Cavalry Stand (Clip)', file: 'krishnaa/jon-snow-game-of-thrones.960x540.mp4', type: 'video', tag: 'Facing The Attendance' },
  { name: 'Warrior Battlefield Rush (Clip)', file: 'krishnaa/warrior-adventure-in-battlefield.960x540.mp4', type: 'video', tag: 'Running To Class' },

  // ── Reaction Memes & Templates ──
  { name: 'Suresh Gopi Thumbs Up', file: 'krishnaa/sureshgopi pfp.jpg', type: 'image', tag: '90%+ Safe / Superb' },
  { name: 'Santhanam "Vaalthukal Nanba"', file: 'krishnaa/download (2).jpg', type: 'image', tag: '80-89% Safe Zone' },
  { name: 'Vaalthukal Nanba (Alt)', file: 'krishnaa/valthukal_nanba_pleading.jpg', type: 'image', tag: '80-89% Safe Zone' },
  { name: 'Rajinikanth Namaskaram (Rain)', file: 'krishnaa/folded_hands.jpg', type: 'image', tag: 'Reaction / Respect' },
  { name: 'Rajinikanth Bye Bye', file: 'krishnaa/download (1).jpg', type: 'image', tag: 'Farewell / Bunk' },
  { name: 'Mammootty Fury / Cry', file: 'krishnaa/download.jpg', type: 'image', tag: 'Below 75% Panic' },
  { name: 'Thalapathy Vijay Strict Stare', file: 'krishnaa/dotted_face.jpg', type: 'image', tag: 'Teacher Angry' },
  { name: 'Modi Laughing Behind Hands', file: 'krishnaa/BAHAHAHAHAHA.jpg', type: 'image', tag: 'Excuse Generated' },
  { name: 'Sai Abhyankkar "Thambi Thappu"', file: 'krishnaa/sai abhyankkar templates.jpg', type: 'image', tag: 'Excuse Rejected' },
  { name: 'Rajinikanth Jaw-Drop Shock', file: 'krishnaa/Whoa Superstar Rajinikanth templates.jpg', type: 'image', tag: 'Rank Up Shock' },
  { name: 'Sathyan "Kaavilamme Shakthi Tharu"', file: 'krishnaa/Movie is older than me, no idea which 1 is this.jpg', type: 'image', tag: 'Exam Prayer Meme' },
  { name: 'Master Disbelief Stare', file: 'krishnaa/master_.jpg', type: 'image', tag: '75-79% Borderline' },
  { name: 'Instagram Derp Face', file: 'krishnaa/Instagram.jpg', type: 'image', tag: 'Funny Meme' },
  { name: 'Game of Thrones Ice Dragon', file: 'krishnaa/got.jpg', type: 'image', tag: 'Legendary Bunker' },
  { name: 'Spider-Man HD Wallpaper', file: 'krishnaa/spiderman.jpg', type: 'image', tag: 'Hero Wallpaper' },
  { name: 'Red Dead Redemption 2', file: 'krishnaa/wp3770576-red-dead-redemption-2-4k-wallpapers.jpg', type: 'image', tag: 'Outlaw Wallpaper' },
  { name: 'Deep Space Nebula', file: 'krishnaa/291263.jpg', type: 'image', tag: 'Cosmic Wallpaper' },
  { name: 'Cosmic Sunset Landscape', file: 'krishnaa/download_cat.webp', type: 'image', tag: 'Scenic Wallpaper' },
  { name: 'Uncle & Niece Portrait', file: 'krishnaa/mamanum molum.jpeg', type: 'image', tag: 'Personal Photo' },
  { name: 'Childhood Memory', file: 'krishnaa/nichu geema.jpeg', type: 'image', tag: 'Personal Photo' },
  { name: 'Family Portrait', file: 'krishnaa/kudu.jpeg', type: 'image', tag: 'Personal Photo' },
];

// Helper: retrieve media with fallback to default preset
function getCategoryMedia(categoryId) {
  const custom = (window.Storage && typeof window.Storage.get === 'function')
    ? Storage.get(`gallery_${categoryId}`, {})
    : {};
  const def = DEFAULT_GALLERY_MEDIA[categoryId] || {};
  return {
    image: custom.image || def.image || null,
    video: custom.video || def.video || null,
    dialogue: custom.dialogue || def.dialogue || null,
    isCustomImage: Boolean(custom.image),
    isCustomVideo: Boolean(custom.video),
    isCustomDialogue: Boolean(custom.dialogue),
  };
}

// ─── Animated Counter ─────────────────────────────
function animateCounter(element, from, to, duration = 1000, suffix = '') {
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(from + (to - from) * eased) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ─── Fake AI Loading Animation ────────────────────
function fakeAILoad(messages, containerEl, finalCallback, stepDelay = 700) {
  let i = 0;
  containerEl.innerHTML = `<div class="loading-dots"><span></span><span></span><span></span></div>`;

  const interval = setInterval(() => {
    if (i < messages.length) {
      containerEl.innerHTML = `<span style="color:var(--purple-light);font-size:0.9rem;font-weight:600;">${messages[i]}</span>`;
      i++;
    } else {
      clearInterval(interval);
      finalCallback();
    }
  }, stepDelay);
}

// ─── Generate Particles ───────────────────────────
function generateParticles(containerId, emojis, count = 10) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const particles = ['💀', '🥷', '📚', '🎓', '😴', '🤥', '🏃', '📱'];
  const used = emojis || particles;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = used[Math.floor(Math.random() * used.length)];
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 4}s`;
    p.style.animationDuration = `${3 + Math.random() * 3}s`;
    container.appendChild(p);
  }
}

// ─── Navbar HTML Builder ──────────────────────────
function buildNavbar() {
  const pages = [
    { href: 'index.html', label: 'Home' },
    { href: 'bunk.html', label: 'Bunk Aakano?' },
    { href: 'excuse.html', label: 'Excuse Suggestion' },
    { href: 'rank.html', label: 'Bunking Rank' },
    { href: 'teacher.html', label: 'Teacher AI' },
    { href: 'gallery.html', label: 'Meme Gallery' },
  ];

  const path = window.location.pathname.split('/').pop() || 'index.html';

  const linksHTML = pages.map(p =>
    `<a href="${p.href}" class="${path === p.href ? 'active' : ''}">${p.label}</a>`
  ).join('');

  return `
  <nav class="navbar" id="mainNav">
    <a href="index.html" class="nav-logo">
      <span class="logo-icon">🥷</span> BUNKVERSE
    </a>
    <div class="nav-links">${linksHTML}</div>
    <div class="nav-hamburger" onclick="toggleMobileMenu()" id="hamburger">
      <span></span><span></span><span></span>
    </div>
  </nav>
  <div class="nav-mobile-menu" id="mobileMenu">
    ${pages.map(p => `<a href="${p.href}" class="${path === p.href ? 'active' : ''}">${p.label}</a>`).join('')}
  </div>`;
}

// ─── Footer HTML Builder ──────────────────────────
function buildFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <p><strong>🥷 BUNKVERSE</strong> — Made with 💀 by a professional bunker</p>
      <p style="margin-top:6px;font-size:0.78rem;">"ഹാജർ നൽകാൻ ഞാൻ ഇവിടെ ഇല്ല. ഞാൻ ഒരു legend ആണ്." 🏆</p>
    </div>
  </footer>`;
}

// Auto-inject navbar & footer if placeholders exist
document.addEventListener('DOMContentLoaded', () => {
  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) navPlaceholder.outerHTML = buildNavbar();

  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) footerPlaceholder.outerHTML = buildFooter();
});
