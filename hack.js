// Fake "you've been hacked" takeover — pure theatre, nothing here touches
// any real system. Ends with an ENTER button into the games.

(function () {
  const $ = (id) => document.getElementById(id);

  const cta = $("hackCtaBtn");
  const overlay = $("hackOverlay");
  const canvas = $("hackCanvas");
  const logEl = $("hackLog");
  const endScreen = $("hackEndScreen");
  const enterBtn = $("hackEnterBtn");
  const cancelBtn = $("hackCancelBtn");

  if (!cta || !overlay) return;

  const ctx = canvas.getContext("2d");
  const GLYPHS =
    "アイウエオカキクケコサシスセソ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*/=%#&_(){}<>[]";
  const FONT_SIZE = 16;
  let columns = [];
  let matrixTimer = null;

  function sizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor(canvas.width / FONT_SIZE);
    columns = new Array(count).fill(0).map(() => Math.random() * -50);
  }

  function drawMatrixFrame() {
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = FONT_SIZE + "px monospace";
    for (let i = 0; i < columns.length; i++) {
      const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const x = i * FONT_SIZE;
      const y = columns[i] * FONT_SIZE;
      ctx.fillStyle = Math.random() < 0.03 ? "#c9ffcf" : "#39FF14";
      ctx.fillText(glyph, x, y);
      if (y > canvas.height && Math.random() > 0.975) {
        columns[i] = 0;
      } else {
        columns[i]++;
      }
    }
  }

  const DELETE_TOTAL = 100937;

  // The whole first phase renders perfectly clean and readable (no glitch) —
  // the jitter only happens on the ACCESS GRANTED end screen, untouched below.
  const SCRIPT = [
    "$ ssh root@chummado-mainframe --force",
    "connecting... ok",
    "INITIATING BREACH SEQUENCE...",
    "BYPASSING FIREWALL  [##########] 100%",
    "SPOOFING IP ADDRESS...  done",
    "REROUTING THROUGH 7 PROXIES...  done",
    "INJECTING boredom_payload.exe",
    "DECRYPTING MAINFRAME KEYS  0x4E1A...C3F2",
    "CRACKING ADMIN PASSWORD  ********",
    "ACCESS GRANTED TO CAMERA ROLL",
    "ACCESS GRANTED TO INSTAGRAM",
    "ACCESS GRANTED TO GOOGLE DRIVE",
    "CONFISCATING EMAIL...  done",
    "CONFISCATING CONTACTS...  done",
    "CONFISCATING BROWSER PASSWORDS...  done",
    "DOWNLOADING chill_pill.zip  100%",
    "__DELETE_COUNTER__",
    "WIPING BROWSER HISTORY...  done",
    "DISABLING WEBCAM LIGHT...  done",
    "SYSTEM COMPROMISED.",
  ];

  let typeAbort = false;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function scrollLogToBottom() {
    logEl.scrollTop = logEl.scrollHeight;
  }

  async function typeLine(text) {
    const lineEl = document.createElement("div");
    logEl.appendChild(lineEl);
    for (let i = 0; i < text.length; i++) {
      if (typeAbort) return;
      lineEl.textContent = text.slice(0, i + 1);
      scrollLogToBottom();
      await wait(10 + Math.random() * 18);
    }
  }

  // A little Hollywood-hacker touch: a live counter that races up to the
  // total, then locks — reads as realistic, not glitchy.
  async function typeDeleteCounter(total) {
    const lineEl = document.createElement("div");
    logEl.appendChild(lineEl);
    const start = performance.now();
    const duration = 1500;
    while (true) {
      if (typeAbort) return;
      const t = Math.min(1, (performance.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.max(1, Math.floor(eased * total));
      lineEl.textContent = `DELETING FILES...  ${current.toLocaleString()} / ${total.toLocaleString()}`;
      scrollLogToBottom();
      if (t >= 1) break;
      await wait(16);
    }
    lineEl.textContent = `FILE ${total.toLocaleString()} OF ${total.toLocaleString()} DELETED`;
    scrollLogToBottom();
  }

  async function runScript() {
    logEl.innerHTML = "";
    for (const line of SCRIPT) {
      if (typeAbort) return;
      if (line === "__DELETE_COUNTER__") {
        await typeDeleteCounter(DELETE_TOTAL);
      } else {
        await typeLine(line);
      }
      await wait(160 + Math.random() * 220);
    }
    if (typeAbort) return;
    await wait(500);
    endScreen.classList.add("show");
  }

  function openHack() {
    typeAbort = false;
    overlay.classList.add("show");
    endScreen.classList.remove("show");
    sizeCanvas();
    clearInterval(matrixTimer);
    matrixTimer = setInterval(drawMatrixFrame, 40);

    overlay.classList.add("shake");
    setTimeout(() => overlay.classList.remove("shake"), 1100);

    document.body.style.overflow = "hidden";
    runScript();
  }

  function closeHack() {
    typeAbort = true;
    overlay.classList.remove("show");
    endScreen.classList.remove("show");
    clearInterval(matrixTimer);
    document.body.style.overflow = "";
  }

  window.addEventListener("resize", () => {
    if (overlay.classList.contains("show")) sizeCanvas();
  });

  cta.addEventListener("click", openHack);
  cancelBtn.addEventListener("click", closeHack);
  enterBtn.addEventListener("click", () => {
    window.location.href = "project-fivestars.html";
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("show")) closeHack();
  });
})();
