// Chumma List — a to-do list that then generates the most unproductive
// possible schedule for you. The actual Groq call lives server-side in
// /api/schedule.js (a Vercel serverless function) — the key is set as an
// environment variable in the Vercel project, never in this file or the repo.

const $ = (id) => document.getElementById(id);

const inputEl = $("clInput");
const addBtn = $("clAddBtn");
const listEl = $("clList");
const emptyEl = $("clEmpty");
const scheduleBtn = $("clScheduleBtn");
const scheduleOut = $("clScheduleOut");
const scheduleTitle = $("clScheduleTitle");
const scheduleLines = $("clScheduleLines");

const STORAGE_KEY = "chummalist.items";

let items = loadItems();

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable — list just won't persist, not fatal */
  }
}

function renderList() {
  listEl.innerHTML = "";
  emptyEl.style.display = items.length ? "none" : "block";

  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "cl-item" + (item.done ? " checked" : "");

    const box = document.createElement("button");
    box.className = "cl-checkbox" + (item.done ? " checked" : "");
    box.setAttribute("aria-label", "toggle done");
    box.addEventListener("click", () => {
      items[i].done = !items[i].done;
      saveItems();
      renderList();
    });

    const text = document.createElement("span");
    text.className = "cl-item-text";
    text.textContent = item.text;

    const remove = document.createElement("button");
    remove.className = "cl-remove-btn";
    remove.textContent = "✕";
    remove.setAttribute("aria-label", "delete");
    remove.addEventListener("click", () => {
      items.splice(i, 1);
      saveItems();
      renderList();
    });

    li.appendChild(box);
    li.appendChild(text);
    li.appendChild(remove);
    listEl.appendChild(li);
  });
}

function addItem() {
  const text = inputEl.value.trim();
  if (!text) return;
  items.push({ text, done: false });
  saveItems();
  inputEl.value = "";
  renderList();
}

addBtn.addEventListener("click", addItem);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addItem();
});

renderList();

// ---------------------------------------------------------------------------
// GET SCHEDULE
// ---------------------------------------------------------------------------

// Matches lines like "9:00 AM - activity" or "14:30 - activity", tolerating
// a leading bullet/backtick and either a hyphen or an en dash as separator.
const SCHEDULE_LINE_RE =
  /^[\s"'`*\-•]*\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)?\s*[–-]\s*.+$/;

async function fetchGroqSchedule() {
  const res = await fetch("/api/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: items.map((it) => it.text) }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Schedule request failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  const text = data.text || "";

  const lines = text
    .split("\n")
    .map((l) => l.trim().replace(/^```.*$/, ""))
    .filter(Boolean);

  // Prefer lines that actually look like "TIME - ACTIVITY"; if the model
  // ignored formatting entirely, fall back to whatever text came back
  // rather than showing nothing.
  const scheduleLines = lines.filter((l) => SCHEDULE_LINE_RE.test(l));
  return scheduleLines.length ? scheduleLines : lines;
}

// Works even with no API key set, so the feature isn't dead out of the box.
const FALLBACK_POOL = [
  "5:00 AM – Wake up dramatically, achieve nothing, go back to sleep by 5:15.",
  "7:30 AM – Open your to-do list, feel a wave of ambition, close the laptop.",
  "9:00 AM – Reheat yesterday's coffee. Do not drink it. Just hold it.",
  "10:15 AM – Schedule a meeting with yourself to discuss why you're behind.",
  "11:00 AM – Stare at task #1 for 45 minutes. Rename the file instead.",
  "12:30 PM – Lunch. Extend lunch until it becomes dinner planning.",
  "2:00 PM – Nap, to recover from the nap you took at 9 AM.",
  "3:30 PM – Google how other people stay productive. Bookmark it. Never open again.",
  "5:00 PM – Declare today a 'research day.' Research nothing.",
  "7:00 PM – Write tomorrow's to-do list. Copy today's, unchanged.",
  "8:30 PM – Feel motivated for exactly 4 minutes. Go watch one more episode.",
  "11:45 PM – Promise yourself tomorrow will be different. It will not.",
];

function fallbackSchedule() {
  const shuffled = [...FALLBACK_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 7);
}

function renderSchedule(lines) {
  scheduleLines.innerHTML = "";
  lines.forEach((line) => {
    const div = document.createElement("div");
    div.className = "cl-schedule-line";
    const dashMatch = line.match(/\s[–-]\s/);
    if (dashMatch) {
      const dashIndex = dashMatch.index;
      const time = line.slice(0, dashIndex).trim();
      const rest = line.slice(dashIndex + dashMatch[0].length).trim();
      div.innerHTML = `<b>${escapeHtml(time)}</b> — ${escapeHtml(rest)}`;
    } else {
      div.textContent = line;
    }
    scheduleLines.appendChild(div);
  });
  scheduleOut.classList.add("show");
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

scheduleBtn.addEventListener("click", async () => {
  scheduleBtn.disabled = true;
  const originalLabel = scheduleBtn.textContent;
  scheduleBtn.textContent = "CONSULTING THE COUNCIL OF LAZINESS...";

  try {
    const lines = await fetchGroqSchedule();
    scheduleTitle.textContent = "Your Extremely Unproductive Schedule";
    renderSchedule(lines);
  } catch (err) {
    console.error(err);
    scheduleTitle.textContent = "Your Extremely Unproductive Schedule (offline edition)";
    renderSchedule(fallbackSchedule());
  } finally {
    scheduleBtn.disabled = false;
    scheduleBtn.textContent = originalLabel;
  }
});
