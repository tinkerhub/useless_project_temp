// Poo-zzle — two-hand flower painting + a photo sliding puzzle you frame, capture
// and solve entirely in the air. Hand tracking: MediaPipe Tasks Vision (HandLandmarker),
// runs fully on-device — nothing is uploaded anywhere.

import {
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const $ = (id) => document.getElementById(id);

const landing = $("pzLanding");
const startBtn = $("pzStartBtn");
const errorBox = $("pzError");
const titleTypeEl = $("pzTitleType");
const rulesTypeEl = $("pzRulesType");

const stage = $("pzStage");
const frame = $("pzFrame");
const video = $("pzVideo");
const flowerCanvas = $("pzFlowerCanvas");
const modelBadge = $("pzModelBadge");
const modeBanner = $("pzModeBanner");

const flowerBtn = $("pzFlowerBtn");
const puzzleBtn = $("pzPuzzleBtn");

const guideEl = $("pzGuide");
const liveSquareEl = $("pzLiveSquare");
const shutterBtn = $("pzShutterBtn");

const puzzleEl = $("pzPuzzle");
const retakeBtn = $("pzRetakeBtn");
const exitBtn = $("pzExitBtn");
const winEl = $("pzWin");
const winRetryBtn = $("pzWinRetry");
const winNewBtn = $("pzWinNew");

const cursorEl = $("pzCursor");
const cursorEl2 = $("pzCursor2");
const toastEl = $("pzToast");

const flowerCtx = flowerCanvas.getContext("2d");
const DPR = Math.min(window.devicePixelRatio || 1, 2.5);

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------
let handLandmarker = null;
let handLandmarkerReady = false;

let mode = "idle"; // "idle" | "flowers" | "capture" | "puzzle"

// hands: up to 2 entries, each { x, y, pinching } in mirrored [0,1] screen space
let hands = [];
let pinchWasDown = [false, false];

let toastTimer = null;
function toast(msg, ms = 2400) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
}

function setModeBanner(text) {
  if (!text) {
    modeBanner.classList.remove("show");
    return;
  }
  modeBanner.textContent = text;
  modeBanner.classList.add("show");
}

// ---------------------------------------------------------------------------
// Landing screen typewriter (shared across every game's title card —
// see game-landing.js): title types out first, then the rules.
// ---------------------------------------------------------------------------
window.glTypewriter(
  titleTypeEl,
  "Poo-zzle",
  rulesTypeEl,
  "Wave your hands to paint flowers, or frame a square with both hands, pinch to capture it, then swipe the shuffled tiles back together."
);

// ---------------------------------------------------------------------------
// Camera + model bootstrap
// ---------------------------------------------------------------------------
startBtn.addEventListener("click", startExperience);

async function startExperience() {
  startBtn.disabled = true;
  startBtn.textContent = "STARTING…";
  errorBox.classList.remove("show");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    video.srcObject = stream;
    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });
    await video.play();

    sizeStageToVideo();
    window.addEventListener("resize", sizeStageToVideo);

    landing.style.display = "none";
    stage.classList.add("active");

    requestAnimationFrame(renderLoop);
    initHandLandmarker(); // fire and forget; UI reflects readiness via modelBadge
  } catch (err) {
    console.error(err);
    startBtn.disabled = false;
    startBtn.textContent = "START CAMERA";
    errorBox.textContent =
      err && err.name === "NotAllowedError"
        ? "Camera access was blocked. Allow camera permission for this site and try again."
        : "Couldn't start the camera on this device/browser. Try a recent Chrome or Safari.";
    errorBox.classList.add("show");
  }
}

function sizeStageToVideo() {
  const vw = video.videoWidth || 4;
  const vh = video.videoHeight || 3;
  frame.style.aspectRatio = `${vw} / ${vh}`;
  // Render the flower canvas at a higher backing resolution than the video
  // for crisp, high-clarity strokes even when the frame is displayed large.
  flowerCanvas.width = vw * DPR;
  flowerCanvas.height = vh * DPR;
}

async function initHandLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    const options = {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: 2,
    };
    try {
      handLandmarker = await HandLandmarker.createFromOptions(vision, options);
    } catch (gpuErr) {
      console.warn("GPU delegate unavailable, falling back to CPU", gpuErr);
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
      });
    }
    handLandmarkerReady = true;
    modelBadge.style.display = "none";
    toast("Hand tracking ready — show one or both hands to the camera ✋🤚");
  } catch (err) {
    console.error("HandLandmarker failed to load", err);
    modelBadge.textContent = "HAND TRACKING UNAVAILABLE";
  }
}

// ---------------------------------------------------------------------------
// Main render loop: hand detection + flower particles + puzzle interaction
// ---------------------------------------------------------------------------
function renderLoop(nowMs) {
  if (handLandmarkerReady && video.readyState >= 2) {
    const result = handLandmarker.detectForVideo(video, nowMs);
    updateHandsFromResult(result);
  } else {
    hands = [];
  }

  updateCursors();
  stepFlowers();

  if (mode === "capture") {
    stepCaptureFraming();
  } else if (mode === "puzzle") {
    stepPuzzleGestures();
  }

  requestAnimationFrame(renderLoop);
}

function updateHandsFromResult(result) {
  if (!result.landmarks || result.landmarks.length === 0) {
    hands = [];
    return;
  }
  hands = result.landmarks.slice(0, 2).map((lm) => {
    const tip = lm[8]; // index fingertip
    const thumb = lm[4]; // thumb tip
    const x = 1 - tip.x; // mirror so on-screen motion matches the mirrored video
    const y = tip.y;
    const pinchDist = Math.hypot(tip.x - thumb.x, tip.y - thumb.y);
    return { x, y, pinching: pinchDist < 0.06 };
  });
}

function updateCursors() {
  const rect = frame.getBoundingClientRect();
  [cursorEl, cursorEl2].forEach((el, i) => {
    const h = hands[i];
    if (!h) {
      el.style.display = "none";
      return;
    }
    el.style.display = "block";
    el.style.left = h.x * rect.width + "px";
    el.style.top = h.y * rect.height + "px";
    el.classList.toggle("pinched", h.pinching);
  });
}

// ---------------------------------------------------------------------------
// Flowers mode — every visible hand paints its own trail of flowers
// ---------------------------------------------------------------------------
let flowersOn = false;
const lastSpawnByHand = [
  { x: null, y: null, t: 0 },
  { x: null, y: null, t: 0 },
];

// A pretty little garden's worth of petal colours + matching centres.
const FLOWER_KINDS = [
  { petal: "#FF6FA5", tip: "#FFD3E3", center: "#FFC64B" },
  { petal: "#FFE566", tip: "#FFFFFF", center: "#B3B347" },
  { petal: "#FFC94B", tip: "#FFF3CF", center: "#D6D58B" },
  { petal: "#6EC6FF", tip: "#E5F6FF", center: "#FFD166" },
  { petal: "#B48CFF", tip: "#EFE4FF", center: "#FFC64B" },
  { petal: "#7BE0A4", tip: "#E7FFF1", center: "#B3B347" },
  { petal: "#FF8C5A", tip: "#FFE2CF", center: "#FFFFFF" },
  { petal: "#FFFFFF", tip: "#FFE566", center: "#B3B347" },
];

const particles = [];

flowerBtn.addEventListener("click", () => {
  flowersOn = !flowersOn;
  flowerBtn.classList.toggle("on", flowersOn);
  if (flowersOn) {
    closePuzzleUI();
    mode = "flowers";
    setModeBanner("🌸 FLOWER MODE — move your hand(s) to paint");
    toast("Move your hand(s) around to paint flowers 🌸");
  } else if (mode === "flowers") {
    mode = "idle";
    setModeBanner("");
  }
});

function stepFlowers() {
  if (mode === "flowers") {
    hands.forEach((h, i) => {
      const last = lastSpawnByHand[i];
      const now = performance.now();
      const dx = last.x == null ? 999 : h.x - last.x;
      const dy = last.y == null ? 999 : h.y - last.y;
      const moved = Math.hypot(dx, dy) > 0.015;
      const cooled = now - last.t > 45;
      if (moved || cooled) {
        spawnFlower(h.x, h.y);
        lastSpawnByHand[i] = { x: h.x, y: h.y, t: now };
      }
    });
  }

  flowerCtx.clearRect(0, 0, flowerCanvas.width, flowerCanvas.height);
  const now = performance.now();
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const age = now - p.born;
    if (age > p.life) {
      particles.splice(i, 1);
      continue;
    }
    drawFlower(p, age / p.life);
  }
}

function spawnFlower(nx, ny) {
  const kind = FLOWER_KINDS[Math.floor(Math.random() * FLOWER_KINDS.length)];
  particles.push({
    x: nx * flowerCanvas.width,
    y: ny * flowerCanvas.height,
    born: performance.now(),
    life: 3400 + Math.random() * 1800, // linger for a few seconds before fading
    size: (18 + Math.random() * 22) * DPR,
    petals: Math.random() < 0.5 ? 5 : 6,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.8,
    drift: -(10 + Math.random() * 18) * DPR,
    sway: Math.random() * Math.PI * 2,
    kind,
  });
  if (particles.length > 260) particles.shift();
}

// Smooth ease-out-back for a satisfying little "pop" as each flower blooms.
function easeOutBack(t) {
  const c1 = 1.70158,
    c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

const BLOOM_END = 0.1; // quick pop-in
const HOLD_END = 0.72; // stays fully visible for a while before fading

function drawFlower(p, t) {
  const bloomT = Math.min(t / BLOOM_END, 1);
  const scale = 0.15 + easeOutBack(bloomT) * 0.85;
  const alpha = t < HOLD_END ? 1 : Math.max(0, 1 - (t - HOLD_END) / (1 - HOLD_END));
  const life = performance.now() - p.born;

  const x = p.x + Math.sin(p.sway + life * 0.0025) * 4 * DPR;
  const y = p.y + (p.drift * t) / 1; // gentle rise/settle over its lifetime

  const ctx = flowerCtx;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(p.rot + p.spin * t * Math.PI);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 6 * DPR;

  const r = p.size;
  const petals = p.petals;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate(((Math.PI * 2) / petals) * i);
    const grad = ctx.createLinearGradient(0, 0, 0, -r);
    grad.addColorStop(0, p.kind.petal);
    grad.addColorStop(1, p.kind.tip);
    ctx.fillStyle = grad;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 1.4 * DPR;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.65, -r * 0.62, 0, -r);
    ctx.quadraticCurveTo(-r * 0.65, -r * 0.62, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.shadowBlur = 0;
  const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.34);
  centerGrad.addColorStop(0, "#FFF7D6");
  centerGrad.addColorStop(1, p.kind.center);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = centerGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 1.4 * DPR;
  ctx.stroke();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Puzzle mode — frame a square with both hands, pinch to capture,
// then swipe (or pinch-and-point) to slide tiles into the shuffled photo.
// ---------------------------------------------------------------------------
const GRID = 3;
let capturedCanvas = null;
let tileSize = 0;

let boardOfSlice = new Array(GRID * GRID - 1).fill(0); // slice -> board index
let blankIndex = GRID * GRID - 1;
let tileEls = [];
let blankHintEl = null;

puzzleBtn.addEventListener("click", () => {
  if (mode === "capture") {
    cancelCapture();
    return;
  }
  if (mode === "puzzle") {
    closePuzzleUI();
    return;
  }
  flowersOn = false;
  flowerBtn.classList.remove("on");
  enterCaptureMode();
});

function enterCaptureMode() {
  mode = "capture";
  puzzleBtn.classList.add("on");
  positionGuide();
  guideEl.classList.add("show");
  shutterBtn.classList.add("show");
  setModeBanner("🧩 FRAME A SQUARE with both hands, then pinch");
  toast("Hold up both hands to frame a square, then pinch to capture 🤏");
}

function cancelCapture() {
  mode = "idle";
  puzzleBtn.classList.remove("on");
  guideEl.classList.remove("show");
  liveSquareEl.classList.remove("show", "ready");
  shutterBtn.classList.remove("show");
  setModeBanner("");
}

function positionGuide() {
  const rect = frame.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height) * 0.7;
  guideEl.style.width = size + "px";
  guideEl.style.height = size + "px";
  guideEl.style.left = (rect.width - size) / 2 + "px";
  guideEl.style.top = (rect.height - size) / 2 + "px";
}
window.addEventListener("resize", () => {
  if (mode === "capture") positionGuide();
});

// While in capture mode, if both hands are visible, draw a live square guide
// between them and let a pinch on either hand snap the photo.
let capturePinchWasDown = [false, false];
const MIN_SQUARE_FRACTION = 0.18; // ignore tiny/noisy two-hand squares

function stepCaptureFraming() {
  if (hands.length < 2) {
    liveSquareEl.classList.remove("show", "ready");
    guideEl.classList.add("show");
    shutterBtn.classList.add("show");
    capturePinchWasDown = hands.map((h) => h.pinching);
    return;
  }

  const rect = frame.getBoundingClientRect();
  const [h1, h2] = hands;
  // Work in real CSS pixels so the framed box is a true square even when the
  // camera frame itself isn't (fractions of width vs. height aren't the same
  // unit unless the frame happens to be square).
  const p1 = { x: h1.x * rect.width, y: h1.y * rect.height };
  const p2 = { x: h2.x * rect.width, y: h2.y * rect.height };
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const sidePx = Math.max(Math.abs(dx), Math.abs(dy));
  const leftPx = dx >= 0 ? p1.x : p1.x - sidePx;
  const topPx = dy >= 0 ? p1.y : p1.y - sidePx;

  const bigEnough = sidePx > MIN_SQUARE_FRACTION * Math.min(rect.width, rect.height);

  guideEl.classList.remove("show");
  shutterBtn.classList.remove("show");
  liveSquareEl.classList.add("show");
  liveSquareEl.classList.toggle("ready", bigEnough);
  liveSquareEl.style.left = leftPx + "px";
  liveSquareEl.style.top = topPx + "px";
  liveSquareEl.style.width = sidePx + "px";
  liveSquareEl.style.height = sidePx + "px";

  if (bigEnough) {
    hands.forEach((h, i) => {
      if (h.pinching && !capturePinchWasDown[i]) {
        captureFromScreenSquare(leftPx, topPx, sidePx);
      }
    });
  }
  capturePinchWasDown = hands.map((h) => h.pinching);
}

shutterBtn.addEventListener("click", () => {
  const rect = frame.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height) * 0.7;
  captureFromScreenSquare((rect.width - size) / 2, (rect.height - size) / 2, size);
});

// left/top/side are in CSS pixels of the mirrored on-screen frame.
function captureFromScreenSquare(leftPx, topPx, sidePx) {
  const rect = frame.getBoundingClientRect();
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  // The frame's aspect-ratio is locked to the video's, so CSS px -> native px
  // uses one uniform scale factor for both axes (no distortion).
  const scale = vw / rect.width;

  // Undo the horizontal mirror to find the matching raw-video region.
  const rawLeftPx = rect.width - leftPx - sidePx;
  let sx = rawLeftPx * scale;
  let sy = topPx * scale;
  let size = sidePx * scale;
  sx = Math.max(0, Math.min(vw - size, sx));
  sy = Math.max(0, Math.min(vh - size, sy));

  const out = 384;
  capturedCanvas = document.createElement("canvas");
  capturedCanvas.width = out;
  capturedCanvas.height = out;
  const ctx = capturedCanvas.getContext("2d");
  // Mirror the capture so it matches what the user saw in the preview.
  ctx.translate(out, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, size, size, 0, 0, out, out);

  tileSize = out / GRID;
  guideEl.classList.remove("show");
  liveSquareEl.classList.remove("show", "ready");
  shutterBtn.classList.remove("show");
  buildPuzzle();
}

function buildPuzzle() {
  const rect = frame.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height) * 0.7;
  puzzleEl.style.width = size + "px";
  puzzleEl.style.height = size + "px";
  puzzleEl.style.left = (rect.width - size) / 2 + "px";
  puzzleEl.style.top = (rect.height - size) / 2 + "px";

  puzzleEl.querySelectorAll(".pz-tile").forEach((el) => el.remove());
  tileEls = [];

  const total = GRID * GRID;
  boardOfSlice = shuffledBoard(total);
  const usedPositions = new Set(boardOfSlice);
  blankIndex = 0;
  for (let pos = 0; pos < total; pos++) {
    if (!usedPositions.has(pos)) {
      blankIndex = pos;
      break;
    }
  }

  for (let slice = 0; slice < total - 1; slice++) {
    const tile = document.createElement("div");
    tile.className = "pz-tile";
    const canvas = document.createElement("canvas");
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext("2d");
    const sr = Math.floor(slice / GRID);
    const sc = slice % GRID;
    ctx.drawImage(
      capturedCanvas,
      sc * tileSize,
      sr * tileSize,
      tileSize,
      tileSize,
      0,
      0,
      tileSize,
      tileSize
    );
    tile.appendChild(canvas);
    tile.dataset.slice = String(slice);
    tile.addEventListener("click", () => attemptSlide(slice, "click"));
    puzzleEl.appendChild(tile);
    tileEls[slice] = tile;
  }

  if (!blankHintEl) {
    blankHintEl = document.createElement("div");
    blankHintEl.className = "pz-blank-hint";
    puzzleEl.appendChild(blankHintEl);
  } else {
    puzzleEl.appendChild(blankHintEl);
  }

  placeAllTiles();
  placeBlankHint();
  winEl.classList.remove("show");
  puzzleEl.classList.add("show");
  mode = "puzzle";
  setModeBanner("🤏 PINCH a tile or ✋ SWIPE toward the gap");
  toast("Pinch a tile next to the gap, or swipe your hand toward it 👋");
}

// Produces a solvable shuffled arrangement.
function shuffledBoard(total) {
  const board = new Array(total); // board[position] = slice, or null for blank
  for (let i = 0; i < total - 1; i++) board[i] = i;
  board[total - 1] = null;
  let blank = total - 1;

  let lastBlank = -1;
  const cols = GRID;
  for (let step = 0; step < 200; step++) {
    const r = Math.floor(blank / cols);
    const c = blank % cols;
    const options = [];
    if (r > 0) options.push(blank - cols);
    if (r < GRID - 1) options.push(blank + cols);
    if (c > 0) options.push(blank - 1);
    if (c < cols - 1) options.push(blank + 1);
    const valid = options.filter((o) => o !== lastBlank);
    const next = valid[Math.floor(Math.random() * valid.length)];
    board[blank] = board[next];
    board[next] = null;
    lastBlank = blank;
    blank = next;
  }

  const sliceToPos = new Array(total - 1);
  for (let pos = 0; pos < total; pos++) {
    if (board[pos] !== null) sliceToPos[board[pos]] = pos;
  }
  return sliceToPos;
}

function placeAllTiles() {
  for (let slice = 0; slice < tileEls.length; slice++) {
    placeTile(slice, boardOfSlice[slice]);
  }
}

function placeTile(slice, pos) {
  const row = Math.floor(pos / GRID);
  const col = pos % GRID;
  tileEls[slice].style.transform = `translate(${col * 100}%, ${row * 100}%)`;
  tileEls[slice].dataset.pos = String(pos);
}

function placeBlankHint() {
  if (!blankHintEl) return;
  const row = Math.floor(blankIndex / GRID);
  const col = blankIndex % GRID;
  blankHintEl.style.transform = `translate(${col * 100}%, ${row * 100}%)`;
}

function isAdjacent(posA, posB) {
  const ra = Math.floor(posA / GRID),
    ca = posA % GRID;
  const rb = Math.floor(posB / GRID),
    cb = posB % GRID;
  return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
}

function attemptSlide(slice, via) {
  const pos = boardOfSlice[slice];
  if (!isAdjacent(pos, blankIndex)) return false;
  boardOfSlice[slice] = blankIndex;
  blankIndex = pos;
  placeTile(slice, boardOfSlice[slice]);
  placeBlankHint();
  const el = tileEls[slice];
  el.classList.remove("flash");
  void el.offsetWidth; // restart animation
  el.classList.add("flash");
  checkWin();
  return true;
}

function checkWin() {
  for (let slice = 0; slice < boardOfSlice.length; slice++) {
    if (boardOfSlice[slice] !== slice) return;
  }
  winEl.classList.add("show");
  setModeBanner("");
  for (let i = 0; i < 14; i++) {
    setTimeout(() => spawnFlower(Math.random(), Math.random()), i * 80);
  }
}

// --- Gesture handling inside puzzle mode: pinch-to-slide + swipe-to-slide ---
const SWIPE_HISTORY_MS = 220;
const SWIPE_DISTANCE = 0.16; // fraction of puzzle box width/height
const SWIPE_COOLDOWN_MS = 320;
const handHistory = [[], []]; // per-hand [{x,y,t}]
let lastSwipeAt = [0, 0];

function stepPuzzleGestures() {
  tileEls.forEach((el) => el.classList.remove("hoverable"));

  const puzzleRect = puzzleEl.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const now = performance.now();

  for (let i = 0; i < 2; i++) {
    const h = hands[i];
    if (!h) {
      pinchWasDown[i] = false;
      handHistory[i].length = 0;
      continue;
    }

    const px = h.x * frameRect.width - (puzzleRect.left - frameRect.left);
    const py = h.y * frameRect.height - (puzzleRect.top - frameRect.top);
    const inside = px >= 0 && py >= 0 && px <= puzzleRect.width && py <= puzzleRect.height;

    // --- pinch-to-slide (precise, tap-like) ---
    if (inside) {
      const col = Math.min(GRID - 1, Math.floor((px / puzzleRect.width) * GRID));
      const row = Math.min(GRID - 1, Math.floor((py / puzzleRect.height) * GRID));
      const hoveredPos = row * GRID + col;
      const hoveredSlice = boardOfSlice.findIndex((p) => p === hoveredPos);
      if (hoveredSlice !== -1 && isAdjacent(hoveredPos, blankIndex)) {
        tileEls[hoveredSlice].classList.add("hoverable");
        if (h.pinching && !pinchWasDown[i]) {
          attemptSlide(hoveredSlice, "pinch");
        }
      }
    }
    pinchWasDown[i] = h.pinching;

    // --- swipe-to-slide (natural, works even without a precise pinch) ---
    const hist = handHistory[i];
    hist.push({ x: px / puzzleRect.width, y: py / puzzleRect.height, t: now });
    while (hist.length && now - hist[0].t > SWIPE_HISTORY_MS) hist.shift();

    if (inside && now - lastSwipeAt[i] > SWIPE_COOLDOWN_MS && hist.length > 2) {
      const first = hist[0];
      const last = hist[hist.length - 1];
      const ddx = last.x - first.x;
      const ddy = last.y - first.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist > SWIPE_DISTANCE) {
        const dir =
          Math.abs(ddx) > Math.abs(ddy)
            ? ddx > 0
              ? "right"
              : "left"
            : ddy > 0
            ? "down"
            : "up";
        if (trySwipeSlide(dir)) {
          lastSwipeAt[i] = now;
          hist.length = 0;
        }
      }
    }
  }
}

// Finds the tile adjacent to the blank whose direction-to-blank matches the
// swiped direction, and slides it in — the way a real sliding puzzle feels.
function trySwipeSlide(dir) {
  const br = Math.floor(blankIndex / GRID);
  const bc = blankIndex % GRID;
  const deltas = {
    right: [0, -1], // swipe right => tile to the LEFT of the gap slides right
    left: [0, 1],
    down: [-1, 0], // swipe down => tile ABOVE the gap slides down
    up: [1, 0],
  };
  const [dr, dc] = deltas[dir];
  const r = br + dr;
  const c = bc + dc;
  if (r < 0 || r >= GRID || c < 0 || c >= GRID) return false;
  const candidatePos = r * GRID + c;
  const slice = boardOfSlice.findIndex((p) => p === candidatePos);
  if (slice === -1) return false;
  return attemptSlide(slice, "swipe");
}

retakeBtn.addEventListener("click", () => {
  guideEl.classList.add("show");
  shutterBtn.classList.add("show");
  puzzleEl.classList.remove("show");
  winEl.classList.remove("show");
  mode = "capture";
  setModeBanner("🧩 FRAME A SQUARE with both hands, then pinch");
  positionGuide();
});

exitBtn.addEventListener("click", closePuzzleUI);
winNewBtn.addEventListener("click", () => retakeBtn.click());
winRetryBtn.addEventListener("click", () => {
  winEl.classList.remove("show");
  buildPuzzle();
});

function closePuzzleUI() {
  puzzleEl.classList.remove("show");
  guideEl.classList.remove("show");
  liveSquareEl.classList.remove("show", "ready");
  shutterBtn.classList.remove("show");
  puzzleBtn.classList.remove("on");
  if (mode === "puzzle" || mode === "capture") {
    mode = "idle";
    setModeBanner("");
  }
}
