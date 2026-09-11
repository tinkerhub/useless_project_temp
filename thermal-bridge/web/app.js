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
const fanRpmEl = document.getElementById("fan-rpm");
const fanRpmBar = document.getElementById("fan-rpm-bar");

const floorSlider = document.getElementById("floor-slider");
const floorValue = document.getElementById("floor-value");
const heatToggle = document.getElementById("heat-toggle");
const threadSlider = document.getElementById("thread-slider");
const threadValue = document.getElementById("thread-value");
const emergencyStopBtn = document.getElementById("emergency-stop");

// ---- state ----
let socket = null;
let isConnected = false;
let reconnectTimer = null;

// Assumed scale caps for the visual gauges (purely for the bar fill %).
const TEMP_GAUGE_MAX_C = 100;
const FAN_GAUGE_MAX_RPM = 6000;

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

    cpuTempEl.textContent = "--";
    fanRpmEl.textContent = "--";
    cpuTempBar.style.width = "0%";
    fanRpmBar.style.width = "0%";
  }
}

function renderTelemetry(msg) {
  if (typeof msg.cpuTemp === "number") {
    cpuTempEl.textContent = msg.cpuTemp.toFixed(1);
    const pct = clamp((msg.cpuTemp / TEMP_GAUGE_MAX_C) * 100, 0, 100);
    cpuTempBar.style.width = `${pct}%`;
  }

  if (typeof msg.fanSpeed === "number") {
    fanRpmEl.textContent = msg.fanSpeed.toLocaleString();
    const pct = clamp((msg.fanSpeed / FAN_GAUGE_MAX_RPM) * 100, 0, 100);
    fanRpmBar.style.width = `${pct}%`;
  }

  // Reflect agent-reported state back into the controls, in case another
  // tab (or the agent's own failsafe) changed something underneath us.
  if (typeof msg.currentFloor === "number" && document.activeElement !== floorSlider) {
    floorSlider.value = String(msg.currentFloor);
    floorValue.textContent = `${msg.currentFloor}%`;
  }
  if (typeof msg.isHeating === "boolean" && document.activeElement !== heatToggle) {
    heatToggle.checked = msg.isHeating;
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

  clearTimeout(floorDebounce);
  floorDebounce = setTimeout(() => {
    send({ type: "set_floor", percentage: pct });
  }, 120);
});

threadSlider.addEventListener("input", () => {
  threadValue.textContent = threadSlider.value;
  if (heatToggle.checked) {
    // live-adjust thread count while heating is active
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

emergencyStopBtn.addEventListener("click", () => {
  heatToggle.checked = false;
  floorSlider.value = "0";
  floorValue.textContent = "0%";
  send({ type: "emergency_stop" });
});

// Release the agent's overrides the moment this tab goes away, so the
// failsafe watchdog on the agent side kicks in immediately rather than
// waiting for a TCP timeout.
window.addEventListener("beforeunload", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close(1000, "tab closed");
  }
});

// ---- kick off ----
setConnectedUi(false);
connect();
