// Cheetah Crawl — road-view edition. The road scrolls under two fixed
// racers to sell forward motion. The turtle's pace is scripted to always
// win; the cheetah moves — just absurdly, hilariously slowly.

const $ = (id) => document.getElementById(id);

const idlePanel = $("ccIdle");
const racePanel = $("ccRace");
const resultPanel = $("ccResult");

const startBtn = $("ccStartBtn");
const countdownEl = $("ccCountdown");
const arenaEl = $("crArena");
const runBtn = $("ccRunBtn");
const hintEl = $("ccHint");
const cheetahEl = $("ccCheetah");
const turtleEl = $("ccTurtle");
const againBtn = $("ccAgainBtn");
const resultTextEl = $("ccResultText");
const resultStatEl = $("ccResultStat");

const roadCheetah = $("crRoadCheetah").querySelector(".cr-road-surface");
const roadTurtle = $("crRoadTurtle").querySelector(".cr-road-surface");
const finishCheetah = $("crFinishCheetah");
const finishTurtle = $("crFinishTurtle");
const dustHost = $("crDust");

window.glTypewriter(
  $("ccTitleType"),
  "Cheetah Crawl",
  $("ccRulesType"),
  "You are a cheetah, the fastest land animal on Earth. You are racing a turtle. Tap as fast as you humanly can — it will not matter."
);

// --- tuning ---------------------------------------------------------------
const RACE_DURATION_MS = 8000; // the turtle always finishes right on schedule
const TURTLE_RATE = 100 / RACE_DURATION_MS; // %/ms, constant the whole race
const CHEETAH_BASE_RATE = TURTLE_RATE * 0.12; // sooo slow, but never fully stopped
const CHEETAH_MAX = 85; // hard cap — physically cannot reach the flag
const TAP_BOOST = 0.032; // %/ms added per tap, decays away fast
const BOOST_DECAY = 0.00009; // %/ms lost per ms
const SCROLL_PX_PER_PERCENT = 9; // how much lane background scrolls per % progress

let cheetahProgress = 0;
let turtleProgress = 0;
let cheetahBoost = 0;
let cheetahScroll = 0;
let turtleScroll = 0;
let raceActive = false;
let rafId = null;
let lastTs = 0;

function showPanel(panel) {
  [idlePanel, racePanel, resultPanel].forEach((p) => p.classList.remove("show"));
  panel.classList.add("show");
}

function placeFinish(el, progress) {
  // .cr-finish lives inside the tilted .cr-road plane, so its `top` is in
  // that plane's own (pre-rotation) coordinate space: 0 = the far horizon
  // edge, full road height = right at the racer's feet.
  const road = el.closest(".cr-road");
  const roadH = road.clientHeight;
  const startTop = 0;
  const endTop = roadH - 50;
  const top = startTop + (progress / 100) * (endTop - startTop);
  el.style.top = top + "px";
}

function scrollRoad(el, offsetPx) {
  el.style.backgroundPosition = `0 0, center ${offsetPx}px`;
}

startBtn.addEventListener("click", beginCountdown);
againBtn.addEventListener("click", beginCountdown);

function beginCountdown() {
  showPanel(racePanel);
  arenaEl.style.display = "none";
  runBtn.style.display = "none";
  hintEl.style.display = "none";
  countdownEl.style.display = "block";

  cheetahProgress = 0;
  turtleProgress = 0;
  cheetahBoost = 0;
  cheetahScroll = 0;
  turtleScroll = 0;
  placeFinish(finishCheetah, 0);
  placeFinish(finishTurtle, 0);
  scrollRoad(roadCheetah, 0);
  scrollRoad(roadTurtle, 0);

  let count = 3;
  countdownEl.textContent = count;
  const tick = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
    } else {
      clearInterval(tick);
      countdownEl.textContent = "GO!";
      setTimeout(startRace, 450);
    }
  }, 700);
}

function startRace() {
  countdownEl.style.display = "none";
  arenaEl.style.display = "flex";
  runBtn.style.display = "block";
  hintEl.style.display = "block";
  raceActive = true;
  lastTs = performance.now();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(tick);
}

function tick(ts) {
  if (!raceActive) return;
  const dt = Math.min(50, ts - lastTs); // clamp to avoid huge jumps on tab-throttle
  lastTs = ts;

  const cheetahRate = CHEETAH_BASE_RATE + cheetahBoost;
  cheetahProgress = Math.min(CHEETAH_MAX, cheetahProgress + cheetahRate * dt);
  turtleProgress = Math.min(100, turtleProgress + TURTLE_RATE * dt);
  cheetahBoost = Math.max(0, cheetahBoost - BOOST_DECAY * dt);

  cheetahScroll += cheetahRate * dt * SCROLL_PX_PER_PERCENT;
  turtleScroll += TURTLE_RATE * dt * SCROLL_PX_PER_PERCENT;

  placeFinish(finishCheetah, cheetahProgress);
  placeFinish(finishTurtle, turtleProgress);
  scrollRoad(roadCheetah, cheetahScroll);
  scrollRoad(roadTurtle, turtleScroll);

  if (turtleProgress >= 100) {
    endRace();
    return;
  }

  rafId = requestAnimationFrame(tick);
}

function spawnDust() {
  for (let i = 0; i < 3; i++) {
    const puff = document.createElement("span");
    puff.className = "cr-dust-puff";
    const size = 6 + Math.random() * 6;
    puff.style.width = size + "px";
    puff.style.height = size + "px";
    puff.style.left = (Math.random() * 10 - 5) + "px";
    puff.style.setProperty("--dx", (Math.random() * 40 - 50) + "px");
    dustHost.appendChild(puff);
    setTimeout(() => puff.remove(), 520);
  }
}

function tapRun() {
  if (!raceActive) return;
  cheetahBoost = Math.min(TAP_BOOST * 3, cheetahBoost + TAP_BOOST);

  cheetahEl.classList.remove("cr-boost");
  void cheetahEl.offsetWidth;
  cheetahEl.classList.add("cr-boost");
  spawnDust();
}

runBtn.addEventListener("click", tapRun);
runBtn.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    tapRun();
  },
  { passive: false }
);

document.addEventListener("keydown", (e) => {
  if (!raceActive) return;
  if (e.code === "Space" || e.key === "ArrowRight") {
    e.preventDefault();
    tapRun();
  }
});

function endRace() {
  if (!raceActive) return;
  raceActive = false;
  cancelAnimationFrame(rafId);

  const shown = Math.round(cheetahProgress);
  resultStatEl.textContent = `The turtle finished. You made it ${shown}% of the way there.`;

  const lines = [
    "The turtle crosses the line. You, a cheetah, are still catching your breath.",
    "Scientists are baffled. You are not — you saw this coming.",
    "In your defense, you were never actually going to win this.",
    "The turtle didn't even look back. It didn't need to.",
  ];
  resultTextEl.textContent = lines[Math.floor(Math.random() * lines.length)];

  showPanel(resultPanel);
}
