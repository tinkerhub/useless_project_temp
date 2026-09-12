// =====================================================================
// Thermal Bridge — WebSocket client
// Connects to the local agent at ws://127.0.0.1:9876, polls/reconnects
// while disconnected, and unlocks the control UI once connected.
// =====================================================================

const BRIDGE_URL = "ws://127.0.0.1:9876/";
const RECONNECT_INTERVAL_MS = 2000;

const DEVICE_NOTES = {
  dell: "Dell EC fan control is well supported via LibreHardwareMonitor on most Inspiron/XPS models. Some newer XPS units restrict SMM writes — if the floor doesn't take effect, an EC unlock utility may be required.",
  lenovo: "ThinkPads generally expose good fan control. Some models briefly \"dip\" fan speed for a few seconds after an override changes — this is normal EC behavior, not a bridge bug.",
  asus: "ASUS ROG/TUF laptops with Armoury Crate installed may fight for control of the fan curve. Close Armoury Crate's fan service before using this dashboard.",
  other: "Generic/unlisted hardware: sensor and fan detection depend entirely on what your motherboard's Super I/O chip exposes. If no fan channels are detected, this device may not be supported.",
};

// ---- DOM refs ----
const statusBadge = document.getElementById("status-badge");
const statusText = document.getElementById("status-text");
const onboardingCard = document.getElementById("onboarding-card");
const connectedTray = document.getElementById("connected-tray");
const reopenOnboardingBtn = document.getElementById("reopen-onboarding");
const deviceSelect = document.getElementById("device-select");
const deviceNote = document.getElementById("device-note");

const controlsPanel = document.getElementById("controls-panel");
const cpuTempEl = document.getElementById("cpu-temp");
const cpuTempBar = document.getElementById("cpu-temp-bar");
const tempBadge = document.getElementById("temp-badge");

const fanRpmEl = document.getElementById("fan-rpm");
const fanRpmBar = document.getElementById("fan-rpm-bar");
const fanSourceBadge = document.getElementById("fan-source-badge");

const cpuLoadEl = document.getElementById("cpu-load");
const cpuLoadBar = document.getElementById("cpu-load-bar");
const cpuPowerEl = document.getElementById("cpu-power");
const cpuClockEl = document.getElementById("cpu-clock");
const ramLoadEl = document.getElementById("ram-load");
const ramLoadBar = document.getElementById("ram-load-bar");

const floorSlider = document.getElementById("floor-slider");
const floorValue = document.getElementById("floor-value");
const heatToggle = document.getElementById("heat-toggle");
const threadSlider = document.getElementById("thread-slider");
const threadValue = document.getElementById("thread-value");
const presetBtns = document.querySelectorAll(".btn-preset");
const emergencyStopBtn = document.getElementById("emergency-stop");

// ---- state ----
let socket = null;
let isConnected = false;
let reconnectTimer = null;

// Assumed scale caps for the visual gauges (purely for the bar fill %).
const TEMP_GAUGE_MAX_C = 100;
const FAN_GAUGE_MAX_RPM = 6000;

function updateSliderTrail(slider) {
  const range = Number(slider.max) - Number(slider.min);
  const progress = range > 0
    ? ((Number(slider.value) - Number(slider.min)) / range) * 100
    : 0;
  slider.style.setProperty("--slider-progress", `${clamp(progress, 0, 100)}%`);
}

updateSliderTrail(floorSlider);
updateSliderTrail(threadSlider);

// =====================================================================
// Device onboarding notes
// =====================================================================
function updateDeviceNote() {
  deviceNote.textContent = DEVICE_NOTES[deviceSelect.value] ?? "";
}
deviceSelect.addEventListener("change", updateDeviceNote);
updateDeviceNote();

reopenOnboardingBtn.addEventListener("click", () => {
  connectedTray.classList.add("hidden");
  onboardingCard.classList.remove("hidden");
});

// =====================================================================
// Connection lifecycle
// =====================================================================
function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    socket = new WebSocket(BRIDGE_URL);
  } catch {
    scheduleReconnect();
    return;
  }

  socket.addEventListener("open", onOpen);
  socket.addEventListener("message", onMessage);
  socket.addEventListener("close", onClose);
  socket.addEventListener("error", () => {
    // "close" fires right after "error" for a failed connection; no extra handling needed here.
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_INTERVAL_MS);
}

function onOpen() {
  isConnected = true;
  setConnectedUi(true);
}

function onClose() {
  isConnected = false;
  setConnectedUi(false);
  scheduleReconnect();
}

function onMessage(event) {
  let msg;
  try {
    msg = JSON.parse(event.data);
  } catch {
    return;
  }

  if (msg.type === "telemetry") {
    renderTelemetry(msg);
  }
}

// =====================================================================
// UI state transitions
// =====================================================================
function setConnectedUi(connected) {
  if (connected) {
    statusBadge.classList.remove("status-offline");
    statusBadge.classList.add("status-connected");
    statusText.textContent = "Bridge Connected (127.0.0.1:9876)";

    onboardingCard.classList.add("hidden");
    connectedTray.classList.remove("hidden");

    controlsPanel.classList.remove("locked");
    floorSlider.disabled = false;
    heatToggle.disabled = false;
    threadSlider.disabled = false;
    emergencyStopBtn.disabled = false;
    presetBtns.forEach(btn => btn.disabled = false);
  } else {
    statusBadge.classList.remove("status-connected");
    statusBadge.classList.add("status-offline");
    statusText.textContent = "Offline / Bridge Disconnected";

    connectedTray.classList.add("hidden");
    onboardingCard.classList.remove("hidden");

    controlsPanel.classList.add("locked");
    floorSlider.disabled = true;
    heatToggle.disabled = true;
    heatToggle.checked = false;
    threadSlider.disabled = true;
    emergencyStopBtn.disabled = true;
    presetBtns.forEach(btn => btn.disabled = true);

    cpuTempEl.textContent = "--";
    fanRpmEl.textContent = "--";
    cpuLoadEl.textContent = "--";
    cpuPowerEl.textContent = "--";
    cpuClockEl.textContent = "--";
    ramLoadEl.textContent = "--";

    cpuTempBar.style.width = "0%";
    fanRpmBar.style.width = "0%";
    cpuLoadBar.style.width = "0%";
    ramLoadBar.style.width = "0%";
  }
}

function renderTelemetry(msg) {
  lastTelemetry = msg;
  if (isEmergencyHovered) {
    return; // hold visual preview while emergency button is hovered
  }

  // 1. CPU Temp
  if (typeof msg.cpuTemp === "number") {
    cpuTempEl.textContent = msg.cpuTemp.toFixed(1);
    const pct = clamp((msg.cpuTemp / TEMP_GAUGE_MAX_C) * 100, 0, 100);
    cpuTempBar.style.width = `${pct}%`;

    if (msg.cpuTemp >= 85) {
      tempBadge.textContent = "CRITICAL";
      tempBadge.className = "badge badge-fire";
    } else if (msg.cpuTemp >= 75) {
      tempBadge.textContent = "WARNING";
      tempBadge.className = "badge badge-warn";
    } else {
      tempBadge.textContent = "NOMINAL";
      tempBadge.className = "badge badge-normal";
    }
  }

  // 2. Fan RPM
  if (typeof msg.fanSpeed === "number") {
    fanRpmEl.textContent = msg.fanSpeed.toLocaleString();
    const pct = clamp((msg.fanSpeed / FAN_GAUGE_MAX_RPM) * 100, 0, 100);
    fanRpmBar.style.width = `${pct}%`;

    if (msg.isEstimatedRpm) {
      fanSourceBadge.textContent = "EST";
      fanSourceBadge.className = "badge badge-est";
    } else {
      fanSourceBadge.textContent = "LIVE";
      fanSourceBadge.className = "badge badge-live";
    }
  }

  // 3. System Vitals (Load, Power, Clock, RAM)
  if (typeof msg.cpuLoad === "number") {
    cpuLoadEl.textContent = msg.cpuLoad.toFixed(0);
    cpuLoadBar.style.width = `${clamp(msg.cpuLoad, 0, 100)}%`;
  }
  if (typeof msg.cpuPower === "number") {
    cpuPowerEl.textContent = msg.cpuPower.toFixed(1);
  }
  if (typeof msg.cpuClock === "number") {
    cpuClockEl.textContent = msg.cpuClock.toFixed(2);
  }
  if (typeof msg.ramLoad === "number") {
    ramLoadEl.textContent = msg.ramLoad.toFixed(0);
    ramLoadBar.style.width = `${clamp(msg.ramLoad, 0, 100)}%`;
  }

  // Reflect server state if controls are idle
  if (typeof msg.currentFloor === "number" && document.activeElement !== floorSlider) {
    floorSlider.value = String(msg.currentFloor);
    floorValue.textContent = `${msg.currentFloor}%`;
    updateSliderTrail(floorSlider);
  }
  if (typeof msg.isHeating === "boolean" && document.activeElement !== heatToggle) {
    heatToggle.checked = msg.isHeating;
  }
  if (typeof msg.activeThreads === "number" && msg.activeThreads > 0 && document.activeElement !== threadSlider) {
    threadSlider.value = String(msg.activeThreads);
    threadValue.textContent = String(msg.activeThreads);
    updateSliderTrail(threadSlider);
  }
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// =====================================================================
// Sending control payloads
// =====================================================================
function send(payload) {
  if (!isConnected || !socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

let floorDebounce = null;
floorSlider.addEventListener("input", () => {
  const pct = Number(floorSlider.value);
  floorValue.textContent = `${pct}%`;
  updateSliderTrail(floorSlider);

  clearTimeout(floorDebounce);
  floorDebounce = setTimeout(() => {
    send({ type: "set_floor", percentage: pct });
  }, 120);
});

threadSlider.addEventListener("input", () => {
  threadValue.textContent = threadSlider.value;
  updateSliderTrail(threadSlider);
  if (heatToggle.checked) {
    send({ type: "toggle_heat", active: true, threads: Number(threadSlider.value) });
  }
});

heatToggle.addEventListener("change", () => {
  send({
    type: "toggle_heat",
    active: heatToggle.checked,
    threads: Number(threadSlider.value),
  });
});

// Quick stress presets
presetBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const threads = Number(btn.getAttribute("data-threads"));
    threadSlider.value = String(threads);
    threadValue.textContent = String(threads);
    updateSliderTrail(threadSlider);
    heatToggle.checked = true;
    send({ type: "toggle_heat", active: true, threads: threads });
  });
});

// Heating Bar Resets to Zero on Hover & Instant Shutdown on Click
let isEmergencyHovered = false;
let lastTelemetry = null;

emergencyStopBtn.addEventListener("mouseenter", () => {
  isEmergencyHovered = true;
  cpuLoadBar.style.width = "0%";
  cpuLoadEl.textContent = "0";
  floorValue.textContent = "0%";
  floorSlider.value = "0";
  updateSliderTrail(floorSlider);
});

emergencyStopBtn.addEventListener("mouseleave", () => {
  isEmergencyHovered = false;
  if (lastTelemetry) {
    renderTelemetry(lastTelemetry);
  }
});

emergencyStopBtn.addEventListener("click", () => {
  isEmergencyHovered = false;
  if (document.activeElement) {
    document.activeElement.blur();
  }
  heatToggle.checked = false;
  floorSlider.value = "0";
  floorValue.textContent = "0%";
  threadSlider.value = "1";
  threadValue.textContent = "1";
  updateSliderTrail(floorSlider);
  updateSliderTrail(threadSlider);
  cpuLoadBar.style.width = "0%";
  cpuLoadEl.textContent = "0";
  send({ type: "emergency_stop" });
});

// Release the agent's overrides the moment this tab goes away
window.addEventListener("beforeunload", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close(1000, "tab closed");
  }
});

// ---- kick off ----
setConnectedUi(false);
connect();
