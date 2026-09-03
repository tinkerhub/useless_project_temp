/**
 * 💘📡 CRUSH RADAR — Frontend Core Script
 * Real Geolocation, Real Leaflet Map, Real Live Tracking Trails, Real Mutual Reveal.
 * Zero fake simulation routines.
 */

// -------------------------------------------------------------
// APP STATE
// -------------------------------------------------------------
let currentUser = null;
let myLocation = null;
let map = null;
let myMarker = null;
let otherMarkers = {};
let activeCrush = null;       // { id, username, name, avatar_emoji, lat, lng }
let activeTrailPolyline = null;
let isGhostMode = false;
let watchId = null;
let pollTimer = null;
let selectedAvatar = '🕵️';
let isLoginMode = false;

// -------------------------------------------------------------
// INITIALIZATION ON PAGE LOAD
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // Check if session exists in localStorage
  const savedUser = localStorage.getItem('crush_radar_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      isGhostMode = !!currentUser.ghost_mode;
      initAppSession();
      return;
    } catch (e) {
      localStorage.removeItem('crush_radar_user');
    }
  }

  // Otherwise stay on auth screen
  showScreen('authScreen');
});

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

function selectEmoji(emoji) {
  selectedAvatar = emoji;
  document.querySelectorAll('.emoji-btn').forEach(b => {
    b.classList.toggle('selected', b.innerText === emoji);
  });
  const preview = document.getElementById('previewEmoji');
  if (preview) preview.innerText = emoji;
}

function toggleAuthMode(e) {
  if (e) e.preventDefault();
  isLoginMode = !isLoginMode;
  const nameGroup = document.getElementById('nameInput').closest('.form-group');
  const emojiGroup = document.getElementById('emojiPicker').closest('.form-group');
  const consentBox = document.querySelector('.consent-box');
  const submitBtn = document.getElementById('submitBtn');
  const toggleLink = document.getElementById('authModeToggle');

  if (isLoginMode) {
    nameGroup.style.display = 'none';
    emojiGroup.style.display = 'none';
    consentBox.style.display = 'none';
    submitBtn.innerText = 'LOG IN TO RADAR →';
    toggleLink.innerText = 'Need to sign up? Click here';
  } else {
    nameGroup.style.display = 'block';
    emojiGroup.style.display = 'block';
    consentBox.style.display = 'block';
    submitBtn.innerText = 'ALLOW LOCATION & ENTER MAP →';
    toggleLink.innerText = 'Log in here';
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & REAL LOCATION PERMISSION
// -------------------------------------------------------------
async function handleSignup(e) {
  e.preventDefault();
  const errorEl = document.getElementById('authError');
  errorEl.classList.add('hidden');
  errorEl.innerText = '';

  const username = document.getElementById('usernameInput').value.trim();
  const name = document.getElementById('nameInput').value.trim();
  const consentGiven = document.getElementById('consentCheckbox').checked;

  if (!username) {
    showAuthError("Please enter a username!");
    return;
  }

  if (!isLoginMode && !consentGiven) {
    showAuthError("You must agree to appear on the live radar map to play!");
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerText = 'REQUESTING GPS LOCATION... 📡';

  // Request REAL Browser Geolocation Permission
  if (!navigator.geolocation) {
    showAuthError("Your browser does not support Geolocation. Please use a modern browser.");
    submitBtn.disabled = false;
    submitBtn.innerText = 'ENTER RADAR →';
    return;
  }

  const formValues = { username, name, isLoginMode, selectedAvatar };

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      await proceedWithLocation(formValues, {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    },
    (geoError) => {
      submitBtn.disabled = false;
      submitBtn.innerText = isLoginMode ? 'LOG IN →' : 'ALLOW LOCATION & ENTER MAP →';
      let msg = "Location permission denied or unavailable! Please click 'Allow' in your browser address bar.";
      if (geoError.code === geoError.TIMEOUT) {
        msg = "GPS request timed out.";
      }
      showAuthError(msg, true, formValues);
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

async function proceedWithLocation(formValues, coords) {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerText = 'CONNECTING TO RADAR... 📡';

  myLocation = coords;

  try {
    let res;
    if (formValues.isLoginMode) {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formValues.username })
      });
    } else {
      res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formValues.username,
          name: formValues.name || formValues.username,
          avatar_emoji: formValues.selectedAvatar,
          consentGiven: true
        })
      });
    }

    const data = await res.json();
    if (!res.ok) {
      showAuthError(data.error || "Authentication failed.");
      submitBtn.disabled = false;
      submitBtn.innerText = formValues.isLoginMode ? 'LOG IN →' : 'ENTER MAP →';
      return;
    }

    currentUser = data.user;
    localStorage.setItem('crush_radar_user', JSON.stringify(currentUser));

    // Sync initial GPS location to server
    await syncMyLocation(myLocation.lat, myLocation.lng);

    initAppSession();
  } catch (err) {
    showAuthError("Network connection error: " + err.message);
    submitBtn.disabled = false;
    submitBtn.innerText = 'TRY AGAIN →';
  }
}

function showAuthError(msg, allowFallback = false, formValues = null) {
  const errorEl = document.getElementById('authError');
  errorEl.innerHTML = `<span>${msg}</span>`;
  if (allowFallback && formValues) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerText = '📍 Use Demo Coordinates to Test Map';
    btn.style = 'margin-top:8px; display:block; width:100%; padding:8px 12px; border-radius:12px; border:1px dashed #ff3385; background:#fff; color:#ff3385; font-weight:700; cursor:pointer; font-size:12px;';
    btn.onclick = () => proceedWithLocation(formValues, { lat: 9.9312, lng: 76.2673 });
    errorEl.appendChild(btn);
  }
  errorEl.classList.remove('hidden');
}

function handleLogout() {
  localStorage.removeItem('crush_radar_user');
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  if (pollTimer) clearInterval(pollTimer);
  location.reload();
}

// -------------------------------------------------------------
// APP DASHBOARD & LEAFLET MAP
// -------------------------------------------------------------
function initAppSession() {
  showScreen('mapScreen');

  // Update header profile
  document.getElementById('userAvatar').innerText = currentUser.avatar_emoji || '🕵️';
  document.getElementById('userDisplayName').innerText = '@' + currentUser.username;
  updateGhostButtonUI();

  // Initialize Leaflet Map
  initLeafletMap();

  // Watch user location continuously
  startLocationWatch();

  // Restore any previously locked crushes
  loadMyLockedCrush();

  // Start background sync & pollers
  startBackgroundPollers();
}

function initLeafletMap() {
  if (map) return;

  const defaultCoords = myLocation ? [myLocation.lat, myLocation.lng] : [20.5937, 78.9629];
  const defaultZoom = myLocation ? 16 : 5;

  map = L.map('radarMap', {
    zoomControl: false,
    attributionControl: false
  }).setView(defaultCoords, defaultZoom);

  // Standard 100% Free OpenStreetMap tiles (Zero API Key required)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Zoom control on top right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Render "YOU" marker if location ready
  if (myLocation) {
    updateMyMarker(myLocation.lat, myLocation.lng);
  }

  // Immediately fetch all active map blips
  fetchMapBlips();
}

// -------------------------------------------------------------
// REAL GEOLOCATION TRACKING
// -------------------------------------------------------------
function startLocationWatch() {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      myLocation = { lat, lng };

      updateMyMarker(lat, lng);
      syncMyLocation(lat, lng);

      // If tracking a crush, refresh live distance HUD
      if (activeCrush) {
        updateTrackingHUD();
      }
    },
    (err) => {
      console.warn("Geolocation watch warning:", err.message);
    },
    { enableHighAccuracy: true, maximumAge: 4000 }
  );
}

async function syncMyLocation(lat, lng) {
  if (!currentUser) return;
  try {
    await fetch('/api/location/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ lat, lng })
    });
  } catch (e) {
    console.error("Location sync failed:", e);
  }
}

// -------------------------------------------------------------
// LEAFLET MARKERS: SELF, OTHER USERS, LOCKED CRUSH
// -------------------------------------------------------------
function updateMyMarker(lat, lng) {
  if (!map) return;

  const iconHtml = `
    <div class="radar-user-marker is-me">
      <div class="marker-bubble">${currentUser.avatar_emoji || '🕵️'}</div>
      <div class="marker-label">YOU (@${currentUser.username})</div>
    </div>
  `;

  const customIcon = L.divIcon({
    className: 'custom-leaflet-marker',
    html: iconHtml,
    iconSize: [44, 60],
    iconAnchor: [22, 50]
  });

  if (!myMarker) {
    myMarker = L.marker([lat, lng], { icon: customIcon, zIndexOffset: 1000 }).addTo(map);
  } else {
    myMarker.setLatLng([lat, lng]);
    myMarker.setIcon(customIcon);
  }
}

function renderOtherMarker(user) {
  if (!map || user.id === currentUser.id) return;

  const isLocked = activeCrush && activeCrush.id === user.id;
  const isMutual = user.isMutual;

  let markerClass = 'radar-user-marker';
  if (isMutual) markerClass += ' is-mutual';
  else if (isLocked) markerClass += ' is-locked';

  const iconHtml = `
    <div class="${markerClass}">
      <div class="marker-bubble">${user.avatar_emoji || '👤'}</div>
      <div class="marker-label">@${user.username}</div>
    </div>
  `;

  const customIcon = L.divIcon({
    className: 'custom-leaflet-marker',
    html: iconHtml,
    iconSize: [44, 60],
    iconAnchor: [22, 50]
  });

  if (!otherMarkers[user.id]) {
    const marker = L.marker([user.lat, user.lng], { icon: customIcon }).addTo(map);
    marker.on('click', () => showUserPopup(user));
    otherMarkers[user.id] = marker;
  } else {
    otherMarkers[user.id].setLatLng([user.lat, user.lng]);
    otherMarkers[user.id].setIcon(customIcon);
  }
}

function showUserPopup(user) {
  const isLocked = activeCrush && activeCrush.id === user.id;

  const popupContent = `
    <div class="popup-blip-card">
      <div class="popup-blip-avatar">${user.avatar_emoji || '👤'}</div>
      <h4>${user.name}</h4>
      <p>@${user.username} • ${user.department || 'Campus'}</p>
      ${
        isLocked
          ? `<button class="popup-lock-btn" style="background:#888;" onclick="unlockCrush('${user.id}')">✕ UNLOCK CRUSH</button>`
          : `<button class="popup-lock-btn" onclick="lockCrush('${user.id}')">🔒 LOCK CRUSH</button>`
      }
    </div>
  `;

  L.popup({ offset: [0, -35] })
    .setLatLng([user.lat, user.lng])
    .setContent(popupContent)
    .openOn(map);
}

// -------------------------------------------------------------
// MAP BLIPS SYNC
// -------------------------------------------------------------
async function fetchMapBlips() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/map', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();
    if (!data.blips) return;

    const currentIds = new Set();

    data.blips.forEach(user => {
      if (user.id === currentUser.id) return;
      currentIds.add(user.id);
      renderOtherMarker(user);

      // If this is our active crush, update their live coords
      if (activeCrush && activeCrush.id === user.id) {
        activeCrush.lat = user.lat;
        activeCrush.lng = user.lng;
      }
    });

    // Remove markers that are no longer active / went ghost
    Object.keys(otherMarkers).forEach(id => {
      if (!currentIds.has(id)) {
        map.removeLayer(otherMarkers[id]);
        delete otherMarkers[id];
      }
    });

    // If active crush is set, refresh trail & distance
    if (activeCrush) {
      updateCrushTrail(activeCrush.id);
      updateTrackingHUD();
    }
  } catch (err) {
    console.error("Error fetching map blips:", err);
  }
}

// -------------------------------------------------------------
// LIVE TRAIL (BREADCRUMB PATH ON MAP)
// -------------------------------------------------------------
async function updateCrushTrail(targetId) {
  if (!map || !targetId) return;

  try {
    const res = await fetch(`/api/crush/trail/${targetId}`);
    const data = await res.json();
    if (!data.trail || data.trail.length < 2) {
      if (activeTrailPolyline) {
        map.removeLayer(activeTrailPolyline);
        activeTrailPolyline = null;
      }
      return;
    }

    const latLngs = data.trail;

    if (!activeTrailPolyline) {
      activeTrailPolyline = L.polyline(latLngs, {
        color: '#ff3385',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(map);
    } else {
      activeTrailPolyline.setLatLngs(latLngs);
    }
  } catch (e) {
    console.error("Error fetching live trail:", e);
  }
}

// -------------------------------------------------------------
// CRUSH LOCKING & TRACKING ACTION
// -------------------------------------------------------------
async function lockCrush(targetId) {
  if (!currentUser) return;

  try {
    const res = await fetch('/api/crush/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ targetId })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Could not lock crush.");
      return;
    }

    map.closePopup();

    // Check if target is mutual
    if (data.isMutual) {
      triggerConfetti();
      showToast("🚨 IT'S MUTUAL! DEPLOY THE CONFETTI! 🚨");
    } else {
      showToast("🔒 Crush locked in! Now tracking their live blip and distance.");
    }

    // Fetch updated crush details & activate tracking HUD
    await loadMyLockedCrush();

    // Re-render markers
    fetchMapBlips();
  } catch (err) {
    showToast("Error locking crush: " + err.message);
  }
}

async function unlockActiveCrush() {
  if (!activeCrush) return;
  await unlockCrush(activeCrush.id);
}

async function unlockCrush(targetId) {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/crush/unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ targetId })
    });
    const data = await res.json();
    showToast(data.message || "Crush unlocked.");

    activeCrush = null;

    if (activeTrailPolyline) {
      map.removeLayer(activeTrailPolyline);
      activeTrailPolyline = null;
    }

    renderTrackingHUD();
    fetchMapBlips();
  } catch (err) {
    showToast("Error: " + err.message);
  }
}

async function loadMyLockedCrush() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/crushes/mine', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();

    if (data.crushes && data.crushes.length > 0) {
      activeCrush = data.crushes[0]; // Primary tracked crush
      renderTrackingHUD();
      updateCrushTrail(activeCrush.id);

      // Smoothly pan map to show both me and crush if possible
      if (map && activeCrush.lat && activeCrush.lng) {
        map.flyTo([activeCrush.lat, activeCrush.lng], 17, { duration: 1.2 });
      }
    } else {
      activeCrush = null;
      if (activeTrailPolyline) {
        map.removeLayer(activeTrailPolyline);
        activeTrailPolyline = null;
      }
      renderTrackingHUD();
    }
  } catch (err) {
    console.error("Error loading locked crush:", err);
  }
}

// -------------------------------------------------------------
// TRACKING HUD (DISTANCE & STATUS)
// -------------------------------------------------------------
function renderTrackingHUD() {
  const idle = document.getElementById('hudIdle');
  const tracking = document.getElementById('hudTracking');

  if (!activeCrush) {
    idle.classList.remove('hidden');
    tracking.classList.add('hidden');
    return;
  }

  idle.classList.add('hidden');
  tracking.classList.remove('hidden');

  document.getElementById('trackCrushAvatar').innerText = activeCrush.avatar_emoji || '💖';
  document.getElementById('trackCrushName').innerText = activeCrush.name;
  document.getElementById('trackCrushUsername').innerText = '@' + activeCrush.username;

  const statusTag = document.getElementById('trackCrushStatus');
  if (activeCrush.isMutual) {
    statusTag.innerText = '💥 MUTUAL MATCH';
    statusTag.style.background = '#ffb703';
    statusTag.style.color = '#3b2540';
  } else {
    statusTag.innerText = '🔒 CRUSH LOCKED';
    statusTag.style.background = 'rgba(255, 111, 181, 0.15)';
    statusTag.style.color = 'var(--primary-pink-hover)';
  }

  updateTrackingHUD();
}

async function updateTrackingHUD() {
  if (!activeCrush || !currentUser) return;

  try {
    const res = await fetch(`/api/scan/${activeCrush.id}`, {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();

    const distVal = document.getElementById('trackDistanceVal');
    const humorLine = document.getElementById('trackHumorLine');

    if (data.distanceMeters !== null && data.distanceMeters !== undefined) {
      distVal.innerText = data.distanceMeters;
      humorLine.innerText = data.humorLine;
    } else {
      distVal.innerText = '--';
      humorLine.innerText = data.humorLine || 'Waiting for live GPS coordinates...';
    }
  } catch (err) {
    console.error("Error updating scan HUD:", err);
  }
}

function focusOnCrush() {
  if (map && activeCrush && activeCrush.lat && activeCrush.lng) {
    map.flyTo([activeCrush.lat, activeCrush.lng], 18, { duration: 1 });
  } else {
    showToast("Waiting for your crush's live coordinates...");
  }
}

// -------------------------------------------------------------
// LIVE SEARCH OVERLAY
// -------------------------------------------------------------
let searchDebounce = null;
function handleSearchInput(e) {
  const query = e.target.value.trim();
  const dropdown = document.getElementById('searchResultsDropdown');
  const clearBtn = document.getElementById('clearSearchBtn');

  clearBtn.classList.toggle('hidden', !query);

  if (searchDebounce) clearTimeout(searchDebounce);

  if (!query) {
    dropdown.innerHTML = '';
    dropdown.classList.add('hidden');
    return;
  }

  searchDebounce = setTimeout(async () => {
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        dropdown.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 13px;">No one found. Maybe tell them to sign up! 💅</div>';
        dropdown.classList.remove('hidden');
        return;
      }

      dropdown.innerHTML = data.results.map(u => `
        <div class="search-item" onclick="selectSearchUser('${u.id}')">
          <div class="search-item-info">
            <span class="search-item-avatar">${u.avatar_emoji || '👤'}</span>
            <div class="search-item-details">
              <strong>${u.name}</strong>
              <span>@${u.username} • ${u.department || 'General'}</span>
            </div>
          </div>
          <button class="search-lock-btn" onclick="event.stopPropagation(); lockCrush('${u.id}')">
            ${u.isLocked ? 'LOCKED 🔒' : 'LOCK CRUSH 💘'}
          </button>
        </div>
      `).join('');

      dropdown.classList.remove('hidden');
    } catch (err) {
      console.error("Search error:", err);
    }
  }, 250);
}

function selectSearchUser(userId) {
  clearSearch();
  const marker = otherMarkers[userId];
  if (marker && map) {
    map.flyTo(marker.getLatLng(), 17, { duration: 1 });
    marker.fire('click');
  }
}

function clearSearch() {
  document.getElementById('userSearchInput').value = '';
  document.getElementById('clearSearchBtn').classList.add('hidden');
  const dropdown = document.getElementById('searchResultsDropdown');
  dropdown.innerHTML = '';
  dropdown.classList.add('hidden');
}

// -------------------------------------------------------------
// ADMIRER BADGE & NOTIFICATIONS POLLING
// -------------------------------------------------------------
async function updateAdmirerCount() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/admirers/count', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();
    const badgeCount = document.getElementById('admirerCount');
    if (badgeCount) badgeCount.innerText = data.count || 0;
  } catch (err) {
    console.error("Admirer count error:", err);
  }
}

async function showAdmirerModal() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/admirers/count', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();

    document.getElementById('admirerModalCount').innerText = data.count || 0;
    document.getElementById('admirerModalQuote').innerText = data.microcopy || "Waiting for the universe...";
    document.getElementById('admirerModal').classList.remove('hidden');
  } catch (err) {
    console.error("Admirer modal error:", err);
  }
}

function closeAdmirerModal() {
  document.getElementById('admirerModal').classList.add('hidden');
}

async function pollNotifications() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/notifications', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();
    if (!data.notifications || data.notifications.length === 0) return;

    for (const notif of data.notifications) {
      if (notif.type === 'mutual_match') {
        triggerConfetti();
        showMutualMatchModal(notif);
      } else if (notif.type === 'crush_received') {
        showToast(notif.message);
        updateAdmirerCount();
      }

      // Mark seen
      await fetch('/api/notifications/seen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ id: notif.id })
      });
    }
  } catch (err) {
    console.error("Notification poll error:", err);
  }
}

// -------------------------------------------------------------
// MUTUAL MATCH CELEBRATION MODAL
// -------------------------------------------------------------
function showMutualMatchModal(notif) {
  const modal = document.getElementById('mutualModal');
  const partner = notif.payload || {};

  document.getElementById('matchMyAvatar').innerText = currentUser.avatar_emoji || '🕵️';
  document.getElementById('matchMyName').innerText = currentUser.name;
  document.getElementById('matchTargetAvatar').innerText = partner.avatar_emoji || '💖';
  document.getElementById('matchTargetName').innerText = partner.name || partner.username;

  modal.classList.remove('hidden');

  // Trigger continuous fireworks
  triggerConfetti();
}

function dismissMutualModal() {
  document.getElementById('mutualModal').classList.add('hidden');
  loadMyLockedCrush();
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 300);
  }
}

// -------------------------------------------------------------
// GHOST MODE TOGGLE
// -------------------------------------------------------------
async function toggleGhostMode() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/ghost/toggle', {
      method: 'POST',
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();
    isGhostMode = data.ghost_mode;
    currentUser.ghost_mode = isGhostMode;
    localStorage.setItem('crush_radar_user', JSON.stringify(currentUser));

    updateGhostButtonUI();
    showToast(data.message);
    fetchMapBlips();
  } catch (err) {
    showToast("Error toggling ghost mode: " + err.message);
  }
}

function updateGhostButtonUI() {
  const btn = document.getElementById('ghostBtn');
  const label = document.getElementById('ghostLabel');
  if (isGhostMode) {
    btn.classList.add('active');
    label.innerText = 'Ghost: ON';
  } else {
    btn.classList.remove('active');
    label.innerText = 'Ghost Mode';
  }
}

// -------------------------------------------------------------
// TOAST NOTIFICATIONS
// -------------------------------------------------------------
let toastTimeout = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  const messageEl = document.getElementById('toastMessage');
  messageEl.innerText = msg;
  toast.classList.remove('hidden');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    dismissToast();
  }, 4500);
}

function dismissToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('hidden');
}

// -------------------------------------------------------------
// BACKGROUND POLLERS
// -------------------------------------------------------------
function startBackgroundPollers() {
  if (pollTimer) clearInterval(pollTimer);

  // Poll map blips & notifications every 3.5 seconds
  pollTimer = setInterval(() => {
    fetchMapBlips();
    pollNotifications();
  }, 3500);

  // Refresh admirers count every 8 seconds
  setInterval(() => {
    updateAdmirerCount();
  }, 8000);

  updateAdmirerCount();
}