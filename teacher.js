/* ================================================
   BUNKVERSE — Teacher AI Logic
   Simulated emotion detection + mood analysis
   ================================================ */

// ─── Emotion Profiles ─────────────────────────────
const EMOTIONS = [
  { id: 'happy', emoji: '🙂', name: 'Happy', angerLevel: 5 },
  { id: 'neutral', emoji: '😐', name: 'Neutral', angerLevel: 25 },
  { id: 'tired', emoji: '😴', name: 'Tired', angerLevel: 20 },
  { id: 'surprised', emoji: '😲', name: 'Surprised', angerLevel: 40 },
  { id: 'angry', emoji: '😠', name: 'Angry', angerLevel: 90 },
];

// ─── Mood Advice ──────────────────────────────────
const MOOD_ADVICE = {
  happy: {
    title: '✅ SAFE TO ENTER!',
    text: 'Teacher is in a great mood today. Golden opportunity to submit late assignments. Go right in!',
    ml: '"Ithu golden time aanu! Illa class miss cheytha excuse kodukk! 😄"',
    class: 'safe',
    category: 'teacher_happy',
  },
  neutral: {
    title: '😐 PROCEED WITH CAUTION',
    text: 'Mood is neutral. Don\'t make eye contact. Sit in the back. Don\'t ask questions. You\'ll be fine.',
    ml: '"Neutral mood. Eye contact avoid cheyyoo. Behind seat pidi. Safe aayi irikk. 😐"',
    class: 'neutral',
    category: 'teacher_neutral',
  },
  tired: {
    title: '😴 PERFECT TIME — TEACHER IS HALF ASLEEP',
    text: 'Teacher is exhausted. Attendance might not even be taken. Today is your lucky day!',
    ml: '"Teacher oru diwasam oru diwasam. Register edukkathe poy sleep cheyyum. Bunk cheyyam! 😂"',
    class: 'safe',
    category: 'teacher_happy',
  },
  surprised: {
    title: '😲 SOMETHING IS OFF — BE CAREFUL',
    text: 'Teacher looks surprised. Could be test results. Could be attendance. Could be you being on time for once.',
    ml: '"Atho... enthenkilum undayi. Careful aakku. Back seat pidi varava. 😬"',
    class: 'neutral',
    category: 'teacher_angry',
  },
  angry: {
    title: '🚨 DANGER! DO NOT ENTER!',
    text: 'TEACHER IS ANGRY. DO NOT MAKE EYE CONTACT. DO NOT SPEAK. DO NOT EXIST. Consider bunking.',
    ml: '"BUNK CHEYYOO! Teacher ithavaregundaayathil kandu ithre angry aayi! DANGER! 💀"',
    class: 'danger',
    category: 'teacher_angry',
  },
};

// ─── Fake AI Analysis Messages ────────────────────
const ANALYSIS_MESSAGES = [
  '🤖 Loading Neural Network v69.0...',
  '👁️ Scanning facial features...',
  '📊 Processing emotional micro-expressions...',
  '🧠 Reading teacher\'s soul...',
  '🔮 Cross-referencing with KTU anger database...',
  '⚡ Calculating danger level...',
  '📱 Consulting the mood oracle...',
  '🎯 Preparing your survival strategy...',
];

// ─── State ────────────────────────────────────────
let uploadedPhotoURL = null;
let detectedMood = null;

// ─── Handle Photo Upload ──────────────────────────
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedPhotoURL = e.target.result;

    const previewImg = document.getElementById('previewImg');
    previewImg.src = uploadedPhotoURL;

    document.getElementById('previewFileName').textContent = `📁 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

    const preview = document.getElementById('photoPreview');
    preview.classList.add('visible');

    // Reset result
    document.getElementById('emotionResult').classList.remove('visible');

    showToast('Photo uploaded! Press Analyze to detect mood. 🧠', 'success');
  };
  reader.readAsDataURL(file);
}

// ─── Drag & Drop ──────────────────────────────────
const uploadZone = document.getElementById('uploadZone');

if (uploadZone) {
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const input = document.getElementById('teacherPhotoInput');
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handlePhotoUpload({ target: { files: [file] } });
    } else {
      showToast('Image file mathram upload cheyyoo! 📷', 'error');
    }
  });
}

// ─── Simulate Emotion Analysis ────────────────────
function analyzeEmotion() {
  if (!uploadedPhotoURL) {
    showToast('First photo upload cheyyoo! 📷', 'error');
    return;
  }

  const analyzeBtn = document.getElementById('analyzeBtn');
  analyzeBtn.disabled = true;
  document.getElementById('emotionResult').classList.remove('visible');
  document.getElementById('analysisLoading').classList.add('active');

  let msgIndex = 0;
  const interval = setInterval(() => {
    if (msgIndex < ANALYSIS_MESSAGES.length) {
      document.getElementById('analysisMsg').textContent = ANALYSIS_MESSAGES[msgIndex++];
    } else {
      clearInterval(interval);

      // Generate random emotion scores
      const detected = generateEmotionScores();
      detectedMood = detected.dominant;

      document.getElementById('analysisLoading').classList.remove('active');
      analyzeBtn.disabled = false;

      displayEmotionResult(detected);
    }
  }, 400);
}

// ─── Generate fake scores ─────────────────────────
function generateEmotionScores() {
  // Slightly weight towards angry for drama 😂
  const weights = [15, 25, 20, 15, 25]; // happy, neutral, tired, surprised, angry
  const total = weights.reduce((a, b) => a + b, 0);
  let scores = weights.map(w => {
    // Add random variance
    return Math.max(0, w + (Math.random() * 20 - 10));
  });

  // Normalize to 100
  const scoreTotal = scores.reduce((a, b) => a + b, 0);
  scores = scores.map(s => (s / scoreTotal) * 100);

  // Find dominant
  const maxScore = Math.max(...scores);
  const dominantIndex = scores.indexOf(maxScore);
  const dominant = EMOTIONS[dominantIndex].id;

  return {
    scores: EMOTIONS.map((e, i) => ({ ...e, score: scores[i] })),
    dominant,
    dominantScore: maxScore,
  };
}

// ─── Display Result ───────────────────────────────
function displayEmotionResult(detected) {
  const { scores, dominant, dominantScore } = detected;
  const mood = MOOD_ADVICE[dominant];
  const dominantEmotion = EMOTIONS.find(e => e.id === dominant);

  // Emotion grid
  const grid = document.getElementById('emotionGrid');
  grid.innerHTML = scores.map(e => `
    <div class="emotion-item ${e.id === dominant ? 'detected' : ''}">
      <span class="emotion-emoji">${e.emoji}</span>
      <div class="emotion-name">${e.name}</div>
      <div class="emotion-pct">${e.score.toFixed(1)}%</div>
    </div>
  `).join('');

  // Main mood
  document.getElementById('moodEmojiLg').textContent = dominantEmotion.emoji;
  document.getElementById('moodNameLg').textContent = `${dominantEmotion.name.toUpperCase()} ${dominantEmotion.emoji}`;

  // Anger level
  const angerLevel = dominantEmotion.angerLevel;
  document.getElementById('angerPctDisplay').textContent = `${angerLevel}%`;
  const angerBar = document.getElementById('angerFillBar');
  angerBar.className = `anger-fill ${angerLevel > 60 ? 'high' : angerLevel > 30 ? 'medium' : 'low'}`;
  angerBar.style.width = '0%';
  setTimeout(() => { angerBar.style.width = angerLevel + '%'; }, 100);

  // Advice
  const adviceCard = document.getElementById('moodAdviceCard');
  adviceCard.className = `advice-card ${mood.class}`;
  document.getElementById('moodAdviceTitle').textContent = mood.title;
  document.getElementById('moodAdviceText').textContent = `${mood.text}\n\n${mood.ml}`;

  // Transform original
  const origImg = document.getElementById('transformOriginal');
  if (uploadedPhotoURL) {
    origImg.src = uploadedPhotoURL;
    origImg.style.display = 'block';
    document.getElementById('transformOriginalPlaceholder').style.display = 'none';
  }

  // Load gallery media
  loadTeacherMedia(mood.category);

  // Show
  document.getElementById('emotionResult').classList.add('visible');
  document.getElementById('emotionResult').scrollIntoView({ behavior: 'smooth', block: 'start' });

  showToast(`Detection complete! Teacher is: ${dominantEmotion.name} ${dominantEmotion.emoji}`, 'info');
}

// ─── Load teacher media ───────────────────────────
function loadTeacherMedia(category) {
  const media = typeof getCategoryMedia === 'function'
    ? getCategoryMedia(category)
    : Storage.get(`gallery_${category}`, {});

  const catEl = document.getElementById('teacherMemeCategory');
  if (catEl) catEl.textContent = `Category: ${category}`;

  const memeBox = document.getElementById('teacherMemeImage');
  if (memeBox && media.image) {
    memeBox.innerHTML = `<img src="${media.image}" alt="Teacher Meme" style="width:100%;border-radius:var(--radius);max-height:300px;object-fit:cover;">`;
  }

  const videoBox = document.getElementById('teacherMemeVideo');
  if (videoBox && media.video) {
    videoBox.innerHTML = `<video src="${media.video}" controls style="width:100%;border-radius:var(--radius);max-height:300px;"></video>`;
  }

  const dialogueBox = document.getElementById('teacherDialogue');
  if (dialogueBox && media.dialogue) {
    dialogueBox.innerHTML = `<em>"${media.dialogue}"</em>`;
  }
}

// ─── Clear / Reset ────────────────────────────────
function clearPhoto() {
  uploadedPhotoURL = null;
  document.getElementById('previewImg').src = '';
  document.getElementById('photoPreview').classList.remove('visible');
  document.getElementById('teacherPhotoInput').value = '';
  document.getElementById('emotionResult').classList.remove('visible');
}

function clearResult() {
  document.getElementById('emotionResult').classList.remove('visible');
  clearPhoto();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Media tab ────────────────────────────────────
function switchTeacherTab(tabEl, tabId) {
  document.querySelectorAll('.media-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.media-tab-content').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}
