/**
 * 💘📡 CRUSH RADAR — Monolithic Server
 * Runs with ZERO external dependencies using native Node.js (v18+).
 * Serves static frontend from ./frontend and all /api endpoints.
 * Ready for Render.com ("node server.js") or local development.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, 'frontend');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// -------------------------------------------------------------
// IN-MEMORY DATA STORE WITH JSON FILE PERSISTENCE
// -------------------------------------------------------------
let store = {
  users: {},        // id -> user
  locations: {},    // id -> { lat, lng, updated_at }
  trails: {},       // id -> [ { lat, lng, time } ]
  crushes: [],      // [ { id, crusher_id, target_id, created_at } ]
  matches: [],      // [ { id, user_a, user_b, matched_at } ]
  notifications: [] // [ { id, user_id, type, message, payload, seen, created_at } ]
};

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    store = JSON.parse(raw);
    console.log(`[Storage] Loaded existing data from ${DATA_FILE}`);
  }
} catch (err) {
  console.log('[Storage] Initialized clean store:', err.message);
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving store:', err.message);
  }
}

// -------------------------------------------------------------
// HAVERSINE DISTANCE (meters) & ROM-COM MICROCOPY
// -------------------------------------------------------------
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function getHumorCommentary(meters, isMutual) {
  if (meters === null) return "✨ Signal floating in the ether. Waiting for GPS satellites to align!";
  
  if (isMutual) {
    if (meters <= 5) return "🚨 EMERGENCY ROMANCE PROTOCOL: They are within 5 meters! Put your phone down, make eye contact, and say literally anything! 💘";
    if (meters <= 15) return "🚨 SIGHTLINE LOCKED: They're right across the room! Drop your best smile or trip casually over a chair. It's mutual!";
    if (meters <= 40) return "🚨 PROXIMITY CRITICAL: Same hall / room! The radar is screaming. Walk over right now, they already crushed back! 🏃‍♂️💨";
    if (meters <= 90) return "🎯 TACTICAL SPRINT DISTANCE: In the same building! Walk like you have very important business near them.";
    if (meters <= 250) return "💌 CAMPUS VICINITY: Less than a 2-minute stroll away. Head toward the pulsing radar blip!";
    if (meters <= 600) return "📡 RADAR HOMING: Roaming in the neighborhood. Watch their live trail close the gap!";
    return `💘 LONG-RANGE DESTINY: ${meters}m away. Distance is merely a statistic when feelings are mutual!`;
  }

  // One-sided locked crush
  if (meters <= 4) return "⚠️ CRITICAL HAZARD: You are sharing the exact same air molecule! DO NOT PANIC. Stare intensely at a wall or pretend you're checking flight tickets.";
  if (meters <= 12) return "👀 EYE-CONTACT DANGER ZONE: They are right there! Rehearse a completely normal human sentence 3 times in your head.";
  if (meters <= 35) return "☕ SAME ROOM RADIUS: You can probably hear their laugh. Casual nonchalance mode: ACTIVATED.";
  if (meters <= 80) return "🚪 SAME BUILDING: Close enough for a dramatic movie hallway pass. Fix your hair quickly.";
  if (meters <= 200) return "🚶 WALKING DISTANCE: Far enough that your elevated heart rate won't register on nearby seismographs.";
  if (meters <= 600) return "🌿 IN THE NEIGHBORHOOD: Probably getting snacks or fighting for their life in an 8 AM lecture.";
  return `🕊️ SAFE TERRITORY (${meters}m): Zero chance of accidental eye contact. Your dignity remains completely intact.`;
}

// -------------------------------------------------------------
// HTTP UTILITIES
// -------------------------------------------------------------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-user-id'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function getAuthUser(req, searchParams) {
  const userId = req.headers['x-user-id'] || searchParams.get('userId');
  if (!userId) return null;
  return store.users[userId] || null;
}

// -------------------------------------------------------------
// SERVER REQUEST ROUTER
// -------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  // Global CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-user-id'
    });
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = reqUrl.pathname;
  const searchParams = reqUrl.searchParams;

  // -----------------------------------------------------------
  // API ROUTES
  // -----------------------------------------------------------
  if (pathname.startsWith('/api/')) {

    // Health check
    if (pathname === '/api/health') {
      return sendJson(res, 200, { status: 'healthy', app: 'CrushRadar', usersCount: Object.keys(store.users).length });
    }

    // AUTH: Sign Up with consent
    if (pathname === '/api/auth/signup' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { username, name, department, batch, year, avatar_emoji, consentGiven } = body;

      if (!consentGiven) {
        return sendJson(res, 400, {
          error: "Consent required! You must agree to be a live blip on everyone's map to use Crush Radar. That's the whole app! 💅"
        });
      }

      const cleanUsername = (username || '').trim().replace(/^@/, '').toLowerCase();
      if (!cleanUsername) {
        return sendJson(res, 400, { error: "Username cannot be empty!" });
      }

      // Check existing username
      const existingId = Object.keys(store.users).find(
        id => store.users[id].username.toLowerCase() === cleanUsername
      );

      let user;
      if (existingId) {
        user = store.users[existingId];
        if (name) user.name = name;
        if (department) user.department = department;
        if (batch || year) user.batch = batch || year;
        if (avatar_emoji) user.avatar_emoji = avatar_emoji;
      } else {
        const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        user = {
          id,
          username: cleanUsername,
          name: name || cleanUsername,
          department: department || 'Campus',
          batch: batch || year || '2026',
          year: year || batch || '1',
          avatar_emoji: avatar_emoji || '🕵️',
          ghost_mode: false,
          consent_given: true,
          created_at: new Date().toISOString()
        };
        store.users[id] = user;
        store.trails[id] = [];
      }

      saveStore();
      return sendJson(res, 200, { user, token: user.id });
    }

    // AUTH: Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const cleanUsername = (body.username || '').trim().replace(/^@/, '').toLowerCase();

      const userId = Object.keys(store.users).find(
        id => store.users[id].username.toLowerCase() === cleanUsername
      );

      if (!userId) {
        return sendJson(res, 404, { error: "User not found! Sign up to create your radar blip." });
      }

      return sendJson(res, 200, { user: store.users[userId], token: userId });
    }

    // AUTH: Me
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const me = getAuthUser(req, searchParams);
      if (!me) return sendJson(res, 401, { error: "Unauthorized" });
      return sendJson(res, 200, { user: me });
    }

    // LOCATION: Sync
    if (pathname === '/api/location/sync' && req.method === 'POST') {
      const me = getAuthUser(req, searchParams);
      if (!me) return sendJson(res, 401, { error: "Unauthorized" });

      const body = await parseJsonBody(req);
      const { lat, lng } = body;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return sendJson(res, 400, { error: "lat and lng must be numbers" });
      }

      const now = Date.now();
      store.locations[me.id] = { lat, lng, updated_at: now };

      // Update trail
      if (!store.trails[me.id]) store.trails[me.id] = [];
      const trail = store.trails[me.id];

      const lastPt = trail[trail.length - 1];
      let add = true;
      if (lastPt) {
        const diff = calculateDistanceMeters(lastPt.lat, lastPt.lng, lat, lng);
        if (diff !== null && diff < 1.5 && (now - lastPt.time) < 15000) {
          add = false;
        }
      }

      if (add) {
        trail.push({ lat, lng, time: now });
        if (trail.length > 40) trail.shift();
      }

      saveStore();
      return sendJson(res, 200, { success: true, updated_at: now });
    }

    // MAP: Live Radar Blips
    if (pathname === '/api/map' && req.method === 'GET') {
      const me = getAuthUser(req, searchParams);
      const myId = me ? me.id : null;
      const blips = [];

      for (const id in store.users) {
        const u = store.users[id];
        const loc = store.locations[id];

        // Ghost mode hides user from everyone else
        if (u.ghost_mode && id !== myId) continue;
        if (!loc) continue;

        let isLockedByMe = false;
        let isMutual = false;

        if (myId) {
          isLockedByMe = store.crushes.some(c => c.crusher_id === myId && c.target_id === id);
          isMutual = store.matches.some(m =>
            (m.user_a === myId && m.user_b === id) || (m.user_a === id && m.user_b === myId)
          );
        }

        blips.push({
          id: u.id,
          username: u.username,
          name: u.name,
          department: u.department,
          batch: u.batch || u.year || '2026',
          year: u.year,
          avatar_emoji: u.avatar_emoji,
          lat: loc.lat,
          lng: loc.lng,
          updated_at: loc.updated_at,
          isMe: id === myId,
          ghost_mode: u.ghost_mode,
          isLockedByMe,
          isMutual
        });
      }

      return sendJson(res, 200, { blips });
    }

    // USERS: Search
    if (pathname === '/api/users/search' && req.method === 'GET') {
      const q = (searchParams.get('q') || '').trim().toLowerCase().replace(/^@/, '');
      if (!q) return sendJson(res, 200, { results: [] });

      const me = getAuthUser(req, searchParams);
      const myId = me ? me.id : null;

      const results = Object.values(store.users)
        .filter(u => u.id !== myId)
        .filter(u => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
        .slice(0, 10)
        .map(u => {
          const loc = store.locations[u.id];
          const isLocked = myId ? store.crushes.some(c => c.crusher_id === myId && c.target_id === u.id) : false;
          const isMutual = myId ? store.matches.some(m =>
            (m.user_a === myId && m.user_b === u.id) || (m.user_a === u.id && m.user_b === myId)
          ) : false;

          return {
            id: u.id,
            username: u.username,
            name: u.name,
            department: u.department,
            batch: u.batch || u.year || '2026',
            year: u.year,
            avatar_emoji: u.avatar_emoji,
            hasLocation: !!loc,
            isLocked,
            isMutual
          };
        });

      return sendJson(res, 200, { results });
    }

    // CRUSH: Lock target
    if (pathname === '/api/crush/lock' && req.method === 'POST') {
      const me = getAuthUser(req, searchParams);
      if (!me) return sendJson(res, 401, { error: "Unauthorized" });

      const body = await parseJsonBody(req);
      const { targetId } = body;

      if (!targetId || targetId === me.id) {
        return sendJson(res, 400, { error: "You cannot lock yourself as a crush!" });
      }

      const target = store.users[targetId];
      if (!target) return sendJson(res, 404, { error: "Target user not found" });

      const already = store.crushes.some(c => c.crusher_id === me.id && c.target_id === targetId);
      if (!already) {
        store.crushes.push({
          id: 'crush_' + Date.now(),
          crusher_id: me.id,
          target_id: targetId,
          created_at: new Date().toISOString()
        });

        // Anonymous notification for the target!
        store.notifications.push({
          id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          user_id: targetId,
          type: 'crush_received',
          message: "👀 Someone in the room just locked eyes on you and set a secret crush! We will never say who. 🤫",
          seen: false,
          created_at: new Date().toISOString()
        });
      }

      // Check for mutual match
      const targetHasCrushedMe = store.crushes.some(c => c.crusher_id === targetId && c.target_id === me.id);
      let isMutual = false;

      if (targetHasCrushedMe) {
        isMutual = true;
        const matchExists = store.matches.some(m =>
          (m.user_a === me.id && m.user_b === targetId) || (m.user_a === targetId && m.user_b === me.id)
        );

        if (!matchExists) {
          store.matches.push({
            id: 'match_' + Date.now(),
            user_a: me.id,
            user_b: targetId,
            matched_at: new Date().toISOString()
          });

          // Deploy celebratory notifications to both!
          store.notifications.push({
            id: 'notif_m1_' + Date.now(),
            user_id: me.id,
            type: 'mutual_match',
            message: `🚨 IT'S MUTUAL! ${target.name} (@${target.username}) has a crush on you too! DEPLOY THE CONFETTI! 🚨`,
            payload: {
              partnerId: target.id,
              username: target.username,
              name: target.name,
              avatar_emoji: target.avatar_emoji
            },
            seen: false,
            created_at: new Date().toISOString()
          });

          store.notifications.push({
            id: 'notif_m2_' + Date.now(),
            user_id: targetId,
            type: 'mutual_match',
            message: `🚨 IT'S MUTUAL! ${me.name} (@${me.username}) has a crush on you too! DEPLOY THE CONFETTI! 🚨`,
            payload: {
              partnerId: me.id,
              username: me.username,
              name: me.name,
              avatar_emoji: me.avatar_emoji
            },
            seen: false,
            created_at: new Date().toISOString()
          });
        }
      }

      saveStore();
      return sendJson(res, 200, {
        status: isMutual ? 'matched' : 'locked',
        isMutual,
        message: isMutual
          ? "🚨 IT'S MUTUAL! DEPLOY THE CONFETTI! 🚨"
          : "🔒 Locked in. They'll never know. Unless... 👀"
      });
    }

    // CRUSH: Unlock target
    if (pathname === '/api/crush/unlock' && req.method === 'POST') {
      const me = getAuthUser(req, searchParams);
      if (!me) return sendJson(res, 401, { error: "Unauthorized" });

      const body = await parseJsonBody(req);
      const { targetId } = body;

      store.crushes = store.crushes.filter(c => !(c.crusher_id === me.id && c.target_id === targetId));
      store.matches = store.matches.filter(m =>
        !((m.user_a === me.id && m.user_b === targetId) || (m.user_a === targetId && m.user_b === me.id))
      );

      saveStore();
      return sendJson(res, 200, { status: 'unlocked', message: "Crush unlocked." });
    }

    // CRUSH: My locked crushes list
    if (pathname === '/api/crushes/mine' && req.method === 'GET') {
      const me = getAuthUser(req, searchParams);
      if (!me) return sendJson(res, 401, { error: "Unauthorized" });

      const list = store.crushes
        .filter(c => c.crusher_id === me.id)
        .map(c => {
          const u = store.users[c.target_id];
          if (!u) return null;
          const loc = store.locations[u.id];
          const isMutual = store.matches.some(m =>
            (m.user_a === me.id && m.user_b === u.id) || (m.user_a === u.id && m.user_b === me.id)
          );

          let distance = null;
          if (loc && store.locations[me.id]) {
            distance = calculateDistanceMeters(
              store.locations[me.id].lat,
              store.locations[me.id].lng,
              loc.lat,
              loc.lng
            );
          }

          return {
            id: u.id,
            username: u.username,
            name: u.name,
            department: u.department,
            batch: u.batch || u.year || '2026',
            year: u.year,
            avatar_emoji: u.avatar_emoji,
            isMutual,
            lat: loc ? loc.lat : null,
            lng: loc ? loc.lng : null,
            distance,
            ghost_mode: u.ghost_mode
          };
        })
        .filter(Boolean);

      return sendJson(res, 200, { crushes: list });
    }

    // CRUSH: Live trail coordinates for drawing path
    if (pathname.startsWith('/api/crush/trail/') && req.method === 'GET') {
      const targetId = pathname.replace('/api/crush/trail/', '');
      const user = store.users[targetId];
      if (!user) return sendJson(res, 404, { error: "Target not found" });

      if (user.ghost_mode) {
        return sendJson(res, 200, { trail: [], isGhost: true });
      }

      const raw = store.trails[targetId] || [];
      const trail = raw.map(pt => [pt.lat, pt.lng]);
      return sendJson(res, 200, { trail, isGhost: false });
    }

    // ADMIRERS: Counter
    if (pathname === '/api/admirers/count' && req.method === 'GET') {
      const me = getAuthUser(req, searchParams);
      if (!me) return sendJson(res, 401, { error: "Unauthorized" });

      const count = store.crushes.filter(c => c.target_id === me.id).length;
      let microcopy = "👀 0 admirers. Giving 'plot twist incoming' energy.";
      if (count === 1) {
        microcopy = "👀 1 person is crushing on you. We will never say who. We're not that kind of app.";
      } else if (count > 1) {
        microcopy = `👀 ${count} people are crushing on you. We will never say who. We're not that kind of app.`;
      }

      return sendJson(res, 200, { count, microcopy });
    }

    // SCAN: Haversine distance probe
    if (pathname.startsWith('/api/scan/') && req.method === 'GET') {
      const me = getAuthUser(req, searchParams);
      if (!me) return sendJson(res, 401, { error: "Unauthorized" });

      const targetId = pathname.replace('/api/scan/', '');
      const target = store.users[targetId];
      if (!target) return sendJson(res, 404, { error: "Target not found" });

      const myLoc = store.locations[me.id];
      const targetLoc = store.locations[targetId];

      if (!myLoc || !targetLoc) {
        return sendJson(res, 200, {
          distanceMeters: null,
          humorLine: "Signal lost in the ether. Either you or your crush haven't shared GPS yet!",
          isMutual: false,
          target: { name: target.name, username: target.username, avatar: target.avatar_emoji }
        });
      }

      const meters = calculateDistanceMeters(myLoc.lat, myLoc.lng, targetLoc.lat, targetLoc.lng);
      const isMutual = store.matches.some(m =>
        (m.user_a === me.id && m.user_b === targetId) || (m.user_a === targetId && m.user_b === me.id)
      );

      return sendJson(res, 200, {
        distanceMeters: meters,
        humorLine: getHumorCommentary(meters, isMutual),
        isMutual,
        target: {
          id: target.id,
          name: target.name,
          username: target.username,
          avatar: target.avatar_emoji,
          lat: targetLoc.lat,
          lng: targetLoc.lng
        }
      });
    }

    // GHOST MODE: Toggle
    if (pathname === '/api/ghost/toggle' && req.method === 'POST') {
      const me = getAuthUser(req, searchParams);
      if (!me) return sendJson(res, 401, { error: "Unauthorized" });

      me.ghost_mode = !me.ghost_mode;
      saveStore();

      return sendJson(res, 200, {
        ghost_mode: me.ghost_mode,
        message: me.ghost_mode
          ? "👻 Ghost Mode ON: You are invisible. Coward. (Respect.)"
          : "👀 Ghost Mode OFF: You are back on the radar for everyone to see!"
      });
    }

    // NOTIFICATIONS: Poll & Mark Seen
    if (pathname === '/api/notifications' && req.method === 'GET') {
      const me = getAuthUser(req, searchParams);
      if (!me) return sendJson(res, 401, { error: "Unauthorized" });

      const unread = store.notifications.filter(n => n.user_id === me.id && !n.seen);
      return sendJson(res, 200, { notifications: unread });
    }

    if (pathname === '/api/notifications/seen' && req.method === 'POST') {
      const me = getAuthUser(req, searchParams);
      if (!me) return sendJson(res, 401, { error: "Unauthorized" });

      const body = await parseJsonBody(req);
      const { id } = body;
      store.notifications.forEach(n => {
        if (n.user_id === me.id && (id === 'all' || n.id === id)) {
          n.seen = true;
        }
      });

      saveStore();
      return sendJson(res, 200, { success: true });
    }

    return sendJson(res, 404, { error: "API endpoint not found" });
  }

  // -----------------------------------------------------------
  // STATIC FILE SERVING
  // -----------------------------------------------------------
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  let filePath = path.join(FRONTEND_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(FRONTEND_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('500 Internal Server Error');
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`💘📡 CRUSH RADAR live on http://localhost:${PORT}`);
});
