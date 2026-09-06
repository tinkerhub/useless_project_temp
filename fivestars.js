// 5 Star Game — the only way to win is to do absolutely nothing.

const $ = (id) => document.getElementById(id);

const idlePanel = $("fsIdle");
const playingPanel = $("fsPlaying");
const resultPanel = $("fsResult");

const startBtn = $("fsStartBtn");
const againBtn = $("fsAgainBtn");

const getReadyEl = $("fsGetReady");
const hudEl = $("fsHud");
const timerEl = $("fsTimer");
const starEls = Array.from(document.querySelectorAll("#fsStars svg"));
const pushBtn = $("fsPushBtn");

const resultTitleEl = $("fsResultTitle");
const resultTextEl = $("fsResultText");
const resultTimeEl = $("fsResultTime");

window.glTypewriter(
  $("fsTitleType"),
  "5 Star Game",
  $("fsRulesType"),
  "Press start, then do absolutely nothing. No clicking, no moving your mouse, no scrolling. Survive long enough and you win all 5 stars. Twitch once and it's over."
);

const GRACE_MS = 1200; // "get ready" buffer so the Start click itself can't fail you
const WIN_MS = 30000; // survive this long, doing nothing, to win
const STAR_MS = WIN_MS / 5;

const PUSH_MIN_VMIN = 11; // starting size of the taunt button
const PUSH_MAX_VMIN = 80; // size it reaches right as the timer hits WIN_MS

const REASONS = {
  mousemove: "You moved your mouse.",
  mousedown: "You clicked.",
  click: "You clicked.",
  wheel: "You scrolled.",
  keydown: "You pressed a key.",
  touchstart: "You touched the screen.",
  touchmove: "You touched the screen.",
};
const WATCHED_EVENTS = Object.keys(REASONS);

let state = "idle"; // idle | grace | armed | ended
let armStart = 0;
let rafId = null;
let graceTimer = null;
let starsLit = 0;

startBtn.addEventListener("click", startGame);
againBtn.addEventListener("click", startGame);

function showPanel(panel) {
  [idlePanel, playingPanel, resultPanel].forEach((p) => p.classList.remove("show"));
  panel.classList.add("show");
}

function setPushButtonSize(vmin) {
  pushBtn.style.width = vmin + "vmin";
  pushBtn.style.height = vmin + "vmin";
  pushBtn.style.fontSize = Math.max(0.9, vmin * 0.11) + "vmin";
}

function startGame() {
  state = "grace";
  starsLit = 0;
  starEls.forEach((s) => s.classList.remove("lit"));
  timerEl.textContent = "0.0s";
  getReadyEl.style.display = "block";
  hudEl.classList.remove("show");
  pushBtn.classList.remove("show");
  setPushButtonSize(PUSH_MIN_VMIN);
  showPanel(playingPanel);

  clearTimeout(graceTimer);
  graceTimer = setTimeout(armGame, GRACE_MS);
}

function armGame() {
  if (state !== "grace") return;
  state = "armed";
  armStart = performance.now();
  getReadyEl.style.display = "none";
  hudEl.classList.add("show");
  pushBtn.classList.add("show");

  WATCHED_EVENTS.forEach((type) => {
    window.addEventListener(type, onInteraction, { capture: true, passive: true });
  });

  rafId = requestAnimationFrame(tick);
}

function tick() {
  if (state !== "armed") return;
  const elapsed = performance.now() - armStart;
  const progress = Math.min(1, elapsed / WIN_MS);

  timerEl.textContent = (elapsed / 1000).toFixed(1) + "s";
  setPushButtonSize(PUSH_MIN_VMIN + (PUSH_MAX_VMIN - PUSH_MIN_VMIN) * progress);

  const shouldBeLit = Math.min(5, Math.floor(elapsed / STAR_MS));
  while (starsLit < shouldBeLit) {
    starEls[starsLit].classList.add("lit");
    starsLit++;
  }

  if (elapsed >= WIN_MS) {
    endGame(true, null, elapsed);
    return;
  }

  rafId = requestAnimationFrame(tick);
}

function onInteraction(e) {
  if (state !== "armed") return;
  const reason = REASONS[e.type] || "You did something.";
  endGame(false, reason, performance.now() - armStart);
}

function endGame(won, reason, elapsedMs) {
  state = "ended";
  cancelAnimationFrame(rafId);
  clearTimeout(graceTimer);
  WATCHED_EVENTS.forEach((type) => {
    window.removeEventListener(type, onInteraction, { capture: true });
  });
  hudEl.classList.remove("show");
  pushBtn.classList.remove("show");

  const seconds = (elapsedMs / 1000).toFixed(1);
  resultPanel.classList.remove("win", "lose");

  if (won) {
    resultPanel.classList.add("win");
    resultTitleEl.textContent = "★★★★★ YOU WON";
    resultTextEl.textContent = "You did absolutely nothing, flawlessly. A true master of stillness.";
    resultTimeEl.textContent = `Survived ${seconds}s`;
    starEls.forEach((s) => s.classList.add("lit"));
  } else {
    resultPanel.classList.add("lose");
    resultTitleEl.textContent = "YOU LOSE";
    resultTextEl.textContent = reason;
    resultTimeEl.textContent = `Lasted ${seconds}s of ${(WIN_MS / 1000).toFixed(0)}s`;
  }

  showPanel(resultPanel);
}
