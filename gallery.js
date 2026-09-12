/* ================================================
   BUNKVERSE — Meme Gallery Management Logic
   LocalStorage-based media assignment system
   Integrated with User Files & Recommended Presets
   ================================================ */

// ─── Category Definitions ─────────────────────────
const GALLERY_CATEGORIES = [
  {
    id: 'above90',
    icon: '😇',
    name: '90%+ Attendance',
    desc: 'Shown when user\'s attendance is above 90%',
    color: 'var(--green)',
  },
  {
    id: '80to89',
    icon: '😎',
    name: '80–89% Attendance',
    desc: 'Shown for 80–89% attendance range',
    color: 'var(--cyan)',
  },
  {
    id: '75to79',
    icon: '😬',
    name: '75–79% Attendance',
    desc: 'Shown for borderline 75–79% attendance',
    color: 'var(--gold)',
  },
  {
    id: 'below75',
    icon: '💀',
    name: 'Below 75% Attendance',
    desc: 'Shown when attendance drops below 75%',
    color: 'var(--red)',
  },
  {
    id: 'teacher_angry',
    icon: '😠',
    name: 'Teacher Angry',
    desc: 'Shown when teacher mood is Angry or Surprised',
    color: 'var(--red)',
  },
  {
    id: 'teacher_happy',
    icon: '🙂',
    name: 'Teacher Happy/Tired',
    desc: 'Shown when teacher is Happy or Tired',
    color: 'var(--green)',
  },
  {
    id: 'excuse',
    icon: '🤥',
    name: 'Excuse Generated',
    desc: 'Shown in the excuse suggestion page',
    color: 'var(--purple-light)',
  },
  {
    id: 'excuse_rejected',
    icon: '🚫',
    name: 'Excuse Rejected',
    desc: 'For low believability excuses',
    color: 'var(--red)',
  },
  {
    id: 'rank_up',
    icon: '🆙',
    name: 'Rank Up',
    desc: 'When user achieves a new rank',
    color: 'var(--gold)',
  },
  {
    id: 'legendary',
    icon: '☠️',
    name: 'Legendary Bunker',
    desc: 'For the most elite bunkers (below 60%)',
    color: 'var(--red)',
  },
];

// ─── State ────────────────────────────────────────
let currentCategory = null;
let pendingImage = null;
let pendingVideo = null;
let pendingDialogue = null;
let currentLibraryFilter = 'all';

// ─── Init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderOverview();
  renderMediaLibrary('all');

  // Select first category by default for easier management
  if (GALLERY_CATEGORIES.length > 0) {
    selectCategory(GALLERY_CATEGORIES[0].id);
  }
});

// ─── Render overview grid ─────────────────────────
function renderOverview() {
  const grid = document.getElementById('galleryOverview');
  if (!grid) return;

  grid.innerHTML = GALLERY_CATEGORIES.map(cat => {
    const saved = Storage.get(`gallery_${cat.id}`, {});
    const media = typeof getCategoryMedia === 'function' ? getCategoryMedia(cat.id) : saved;
    const hasImg = Boolean(saved.image || media.image);
    const hasVid = Boolean(saved.video || media.video);
    const hasDia = Boolean(saved.dialogue || media.dialogue);

    return `
      <div class="gallery-overview-item ${currentCategory === cat.id ? 'active-cat' : ''}"
           id="overviewItem_${cat.id}"
           onclick="selectCategory('${cat.id}')">
        <span class="overview-icon">${cat.icon}</span>
        <div class="overview-name">${cat.name}</div>
        <div class="overview-status">
          <span class="assigned-dot ${hasImg ? 'has-image' : ''}" title="${hasImg ? (saved.image ? 'Custom Image' : 'Preset Image from Files') : 'No Image'}"></span>
          <span class="assigned-dot ${hasVid ? 'has-video' : ''}" title="${hasVid ? (saved.video ? 'Custom Video' : 'Preset Video from Files') : 'No Video'}"></span>
          <span class="assigned-dot ${hasDia ? 'has-dialogue' : ''}" title="${hasDia ? 'Dialogue Assigned' : 'No Dialogue'}"></span>
        </div>
      </div>`;
  }).join('');
}

// ─── Select category ──────────────────────────────
function selectCategory(catId) {
  // If unsaved changes, warn
  if (currentCategory && currentCategory !== catId && (pendingImage !== null || pendingVideo !== null || pendingDialogue !== null)) {
    if (!confirm('You have unsaved changes. Switch category anyway?')) return;
  }

  currentCategory = catId;
  pendingImage = null;
  pendingVideo = null;
  pendingDialogue = null;

  const cat = GALLERY_CATEGORIES.find(c => c.id === catId);
  const saved = Storage.get(`gallery_${catId}`, {});

  // Update overview highlight
  document.querySelectorAll('.gallery-overview-item').forEach(el => el.classList.remove('active-cat'));
  const overviewItem = document.getElementById(`overviewItem_${catId}`);
  if (overviewItem) overviewItem.classList.add('active-cat');

  // Panel header
  const panelTitle = document.getElementById('panelTitle');
  if (panelTitle) panelTitle.textContent = `📁 ${cat.name}`;
  const panelDesc = document.getElementById('panelDesc');
  if (panelDesc) panelDesc.textContent = cat.desc;

  const noCat = document.getElementById('noCategoryMsg');
  if (noCat) noCat.style.display = 'none';
  const assignArea = document.getElementById('assignmentArea');
  if (assignArea) assignArea.style.display = 'block';

  // Category info bar
  const catInfoIcon = document.getElementById('catInfoIcon');
  if (catInfoIcon) catInfoIcon.textContent = cat.icon;
  const catInfoName = document.getElementById('catInfoName');
  if (catInfoName) catInfoName.textContent = cat.name;
  const catInfoDesc = document.getElementById('catInfoDesc');
  if (catInfoDesc) catInfoDesc.textContent = cat.desc;

  // Load existing / fallback
  loadSavedMedia(saved);
  updateDots(saved);

  const saveStatus = document.getElementById('saveStatus');
  if (saveStatus) saveStatus.textContent = '';
}

// ─── Load saved media into preview ───────────────
function loadSavedMedia(saved) {
  const media = typeof getCategoryMedia === 'function'
    ? getCategoryMedia(currentCategory)
    : saved;

  const activeImage = saved.image || media.image;
  const isCustomImage = Boolean(saved.image);

  const activeVideo = saved.video || media.video;
  const isCustomVideo = Boolean(saved.video);

  const activeDialogue = (saved.dialogue !== undefined && saved.dialogue !== null)
    ? saved.dialogue
    : (media.dialogue || '');

  // Image Preview
  const imgPreview = document.getElementById('imagePreview');
  const imgActions = document.getElementById('imageActions');
  if (activeImage) {
    imgPreview.innerHTML = `
      <div style="position:relative;">
        <img src="${activeImage}" alt="Meme Preview" style="width:100%;max-height:160px;object-fit:cover;border-radius:var(--radius-sm);background:#000;">
        <span class="source-tag">${isCustomImage ? '🎨 Custom' : '📂 From Files'}</span>
      </div>`;
    if (imgActions) imgActions.style.display = 'flex';
  } else {
    imgPreview.innerHTML = '';
    if (imgActions) imgActions.style.display = 'none';
  }

  // Video Preview
  const vidPreview = document.getElementById('videoPreview');
  const vidActions = document.getElementById('videoActions');
  if (activeVideo) {
    vidPreview.innerHTML = `
      <div style="position:relative;">
        <video src="${activeVideo}" controls style="width:100%;max-height:160px;border-radius:var(--radius-sm);background:#000;"></video>
        <span class="source-tag">${isCustomVideo ? '🎬 Custom' : '📂 From Files'}</span>
      </div>`;
    if (vidActions) vidActions.style.display = 'block';
  } else {
    vidPreview.innerHTML = '';
    if (vidActions) vidActions.style.display = 'none';
  }

  // Dialogue
  const dialogueInput = document.getElementById('catDialogueInput');
  if (dialogueInput) dialogueInput.value = activeDialogue;
}

// ─── Update dot indicators ────────────────────────
function updateDots(saved) {
  const media = typeof getCategoryMedia === 'function' && currentCategory
    ? getCategoryMedia(currentCategory)
    : saved;

  const hasImg = Boolean(saved.image || media.image);
  const hasVid = Boolean(saved.video || media.video);
  const hasDia = Boolean(saved.dialogue || media.dialogue);

  const imgDot = document.getElementById('imageDot');
  if (imgDot) imgDot.className = `assigned-dot ${hasImg ? 'has-image' : ''}`;

  const vidDot = document.getElementById('videoDot');
  if (vidDot) vidDot.className = `assigned-dot ${hasVid ? 'has-video' : ''}`;

  const diaDot = document.getElementById('dialogueDot');
  if (diaDot) diaDot.className = `assigned-dot ${hasDia ? 'has-dialogue' : ''}`;
}

// ─── Handle image upload ──────────────────────────
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image too large! Keep under 5MB for best performance. 📦', 'error');
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    pendingImage = e.target.result;
    const imgPreview = document.getElementById('imagePreview');
    imgPreview.innerHTML = `
      <div style="position:relative;">
        <img src="${pendingImage}" alt="Uploaded Preview" style="width:100%;max-height:160px;object-fit:cover;border-radius:var(--radius-sm);">
        <span class="source-tag">New Upload</span>
      </div>`;
    document.getElementById('imageActions').style.display = 'flex';
    document.getElementById('imageDot').className = 'assigned-dot has-image';
    document.getElementById('saveStatus').textContent = '⚠️ Unsaved changes';
  };
  reader.readAsDataURL(file);
}

// ─── Handle video upload ──────────────────────────
function handleVideoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 15 * 1024 * 1024) {
    showToast('Video too large! Keep under 15MB. 🎬', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    pendingVideo = e.target.result;
    const vidPreview = document.getElementById('videoPreview');
    vidPreview.innerHTML = `
      <div style="position:relative;">
        <video src="${pendingVideo}" controls style="width:100%;max-height:160px;border-radius:var(--radius-sm);background:#000;"></video>
        <span class="source-tag">New Upload</span>
      </div>`;
    document.getElementById('videoActions').style.display = 'block';
    document.getElementById('videoDot').className = 'assigned-dot has-video';
    document.getElementById('saveStatus').textContent = '⚠️ Unsaved changes';
  };
  reader.readAsDataURL(file);
}

// ─── Handle dialogue input ────────────────────────
function handleDialogueInput() {
  pendingDialogue = document.getElementById('catDialogueInput').value;
  document.getElementById('dialogueDot').className = `assigned-dot ${pendingDialogue ? 'has-dialogue' : ''}`;
  document.getElementById('saveStatus').textContent = '⚠️ Unsaved changes';
}

// ─── Save current category ────────────────────────
function saveCurrentCategory() {
  if (!currentCategory) { showToast('Select a category first! 📋', 'error'); return; }

  const saved = Storage.get(`gallery_${currentCategory}`, {});

  if (pendingImage !== null) saved.image = pendingImage;
  if (pendingVideo !== null) saved.video = pendingVideo;

  const dialogueVal = document.getElementById('catDialogueInput').value.trim();
  if (dialogueVal || pendingDialogue !== null) saved.dialogue = dialogueVal || null;

  Storage.set(`gallery_${currentCategory}`, saved);

  pendingImage = null;
  pendingVideo = null;
  pendingDialogue = null;

  renderOverview();
  updateDots(saved);

  document.getElementById('saveStatus').textContent = '✅ Saved!';
  setTimeout(() => {
    const statusEl = document.getElementById('saveStatus');
    if (statusEl) statusEl.textContent = '';
  }, 2000);

  const catObj = GALLERY_CATEGORIES.find(c => c.id === currentCategory);
  showToast(`Media saved for "${catObj?.name}"! 💾`, 'success');
}

// ─── Clear functions ──────────────────────────────
function clearImage() {
  pendingImage = null;
  if (currentCategory) {
    const saved = Storage.get(`gallery_${currentCategory}`, {});
    delete saved.image;
    Storage.set(`gallery_${currentCategory}`, saved);
    loadSavedMedia(saved);
    updateDots(saved);
  }
  renderOverview();
  showToast('Custom image removed. Restored file preset.', 'info');
}

function clearVideo() {
  pendingVideo = null;
  if (currentCategory) {
    const saved = Storage.get(`gallery_${currentCategory}`, {});
    delete saved.video;
    Storage.set(`gallery_${currentCategory}`, saved);
    loadSavedMedia(saved);
    updateDots(saved);
  }
  renderOverview();
  showToast('Custom video removed. Restored file preset.', 'info');
}

function clearCategoryMedia() {
  if (!currentCategory) return;
  const catObj = GALLERY_CATEGORIES.find(c => c.id === currentCategory);
  if (!confirm(`Reset media customizations for "${catObj?.name}"?`)) return;

  Storage.set(`gallery_${currentCategory}`, {});
  pendingImage = null;
  pendingVideo = null;
  pendingDialogue = null;

  loadSavedMedia({});
  updateDots({});
  renderOverview();

  showToast(`Customizations cleared for "${catObj?.name}".`, 'info');
}

function clearAllMedia() {
  if (!confirm('Clear ALL custom media overrides across all categories?')) return;
  GALLERY_CATEGORIES.forEach(cat => {
    localStorage.removeItem('bunkverse_gallery_' + cat.id);
  });
  renderOverview();
  if (currentCategory) {
    selectCategory(currentCategory);
  }
  showToast('All custom overrides cleared. Clean presets active! 🔄', 'info');
}

// ─── Restore Recommended Presets from Files ───────
function resetToDefaultPresets() {
  if (!confirm('Apply all recommended presets from your files to all 10 categories?')) return;
  if (typeof DEFAULT_GALLERY_MEDIA === 'undefined') {
    showToast('Default presets not found in script.js!', 'error');
    return;
  }

  GALLERY_CATEGORIES.forEach(cat => {
    const def = DEFAULT_GALLERY_MEDIA[cat.id];
    if (def) {
      Storage.set(`gallery_${cat.id}`, {
        image: def.image,
        video: def.video,
        dialogue: def.dialogue
      });
    }
  });

  renderOverview();
  if (currentCategory) {
    selectCategory(currentCategory);
  }
  showToast('All 10 categories loaded with your files & memes! 🌟', 'success');
}

// ─── Render Media Library Grid ────────────────────
function renderMediaLibrary(filter = 'all') {
  currentLibraryFilter = filter;
  const container = document.getElementById('userMediaLibraryGrid');
  if (!container || typeof USER_MEDIA_LIBRARY === 'undefined') return;

  const items = USER_MEDIA_LIBRARY.filter(item => {
    if (filter === 'image') return item.type === 'image';
    if (filter === 'video') return item.type === 'video';
    return true;
  });

  const countBadge = document.getElementById('libraryCountBadge');
  if (countBadge) countBadge.textContent = `${items.length} items`;

  container.innerHTML = items.map((item) => {
    const isVid = item.type === 'video';
    const escapedFile = item.file.replace(/'/g, "\\'");
    const escapedName = item.name.replace(/'/g, "\\'");

    const mediaThumb = isVid
      ? `<video src="${item.file}" style="width:100%;height:140px;object-fit:cover;pointer-events:none;background:#000;"></video>`
      : `<img src="${item.file}" alt="${item.name}" loading="lazy" style="width:100%;height:140px;object-fit:cover;background:rgba(0,0,0,0.2);">`;

    return `
      <div class="library-card">
        <div class="library-media-wrap" onclick="previewMediaItem('${escapedFile}', '${item.type}', '${escapedName}')" title="Click to view fullscreen">
          ${mediaThumb}
          <div class="library-type-badge">${isVid ? '🎬 VIDEO' : '🖼️ MEME'}</div>
        </div>
        <div class="library-card-info">
          <div>
            <div class="library-card-title" title="${item.name}">${item.name}</div>
            <div class="library-card-tag">${item.tag}</div>
          </div>
          <div class="library-card-actions">
            <button class="btn btn-primary btn-xs" onclick="quickAssign('${escapedFile}', '${item.type}', '${escapedName}')">
              👉 Assign to ${currentCategory ? (GALLERY_CATEGORIES.find(c=>c.id===currentCategory)?.name || 'Category') : 'Category'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterLibrary(type, btn) {
  document.querySelectorAll('#libraryFilterButtons button').forEach(b => b.classList.remove('active-filter'));
  if (btn) {
    btn.classList.add('active-filter');
  } else {
    const defaultBtn = document.getElementById(`filterBtn_${type}`);
    if (defaultBtn) defaultBtn.classList.add('active-filter');
  }
  renderMediaLibrary(type);
}

// ─── 1-Click Assignment from Library ───────────────
function quickAssign(filePath, mediaType, mediaName) {
  if (!currentCategory) {
    selectCategory(GALLERY_CATEGORIES[0].id);
  }

  const catObj = GALLERY_CATEGORIES.find(c => c.id === currentCategory);
  const saved = Storage.get(`gallery_${currentCategory}`, {});

  if (mediaType === 'video') {
    saved.video = filePath;
    pendingVideo = null;
    showToast(`🎬 "${mediaName}" assigned as video for ${catObj?.name}!`, 'success');
  } else {
    saved.image = filePath;
    pendingImage = null;
    showToast(`🖼️ "${mediaName}" assigned as meme for ${catObj?.name}!`, 'success');
  }

  Storage.set(`gallery_${currentCategory}`, saved);
  loadSavedMedia(saved);
  updateDots(saved);
  renderOverview();

  // Scroll smoothly to the assignment preview
  const assignEl = document.getElementById('assignmentArea');
  if (assignEl) {
    assignEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ─── Lightbox Modal Preview ─────────────────────────
function previewMediaItem(file, type, name) {
  let modal = document.getElementById('mediaPreviewModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'mediaPreviewModal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 24px; animation: fadeIn 0.2s ease;
    `;
    modal.onclick = (e) => {
      if (e.target === modal || e.target.id === 'modalCloseBtn') modal.remove();
    };
    document.body.appendChild(modal);
  }

  const content = type === 'video'
    ? `<video src="${file}" controls autoplay style="max-width:90vw;max-height:75vh;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.8);"></video>`
    : `<img src="${file}" alt="${name}" style="max-width:90vw;max-height:75vh;border-radius:12px;object-fit:contain;box-shadow:0 12px 40px rgba(0,0,0,0.8);"> `;

  modal.innerHTML = `
    <div style="position:relative;max-width:90vw;text-align:center;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;color:#fff;">
        <span style="font-weight:700;font-size:1rem;">${name}</span>
        <button id="modalCloseBtn" style="background:rgba(255,255,255,0.2);border:none;color:#fff;border-radius:50%;width:32px;height:32px;font-size:1.2rem;cursor:pointer;line-height:1;">✕</button>
      </div>
      ${content}
      <div style="margin-top:12px;">
        <button class="btn btn-primary btn-sm" onclick="quickAssign('${file}', '${type}', '${name}'); document.getElementById('mediaPreviewModal')?.remove();">
          👉 Assign to Current Category
        </button>
      </div>
    </div>
  `;
}
