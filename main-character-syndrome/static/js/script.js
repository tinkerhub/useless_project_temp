window.onSpotifyWebPlaybackSDKReady = () => {
  console.log("[SPOTIFY] SDK loaded but local BGM mode is enabled. Spotify playback is disabled in this build.");
};

const appState = {
  audioManager: new AudioManager(),
  pose: null,
  camera: null,
  currentMode: "offline",
  currentUniverse: "Indian Cinema",
  lastPose: [],
  lastDetection: null,
  started: false,
  spotifyConnected: false,
  currentTrack: null,
  lastSceneProcessAt: 0,
  sceneProcessingDelayMs: 4000,
};

window.appState = appState;

document.addEventListener("DOMContentLoaded", () => {
  initializeUi();
  appState.audioManager.setMode("spotify");
  checkSpotifyStatus();

  const warmupAudio = () => {
    appState.audioManager.initializeAudio();
    appState.audioManager.testAudio();
    window.removeEventListener("pointerdown", warmupAudio);
    window.removeEventListener("keydown", warmupAudio);
  };

  window.addEventListener("pointerdown", warmupAudio, { once: true });
  window.addEventListener("keydown", warmupAudio, { once: true });

  setSystemStatus("System: Ready");
  setAudioStatus("Audio: Idle");
  setCameraStatus("Camera: Offline");
  setDebugValues();
});

function initializeUi() {
  const startBtn = document.getElementById("startExperienceBtn");
  const testBtn = document.getElementById("testAudioBtn");
  const muteBtn = document.getElementById("toggleMuteBtn");
  const debugToggle = document.getElementById("debugToggle");
  const universeSelector = document.getElementById("universeSelector");
  const musicMode = document.getElementById("musicMode");
  const volumeSlider = document.getElementById("volumeSlider");
  const connectSpotifyBtn = document.getElementById("connectSpotifyBtn");
  const activatePlaylistBtn = document.getElementById("activatePlaylistBtn");
  const playTrackBtn = document.getElementById("playTrackBtn");
  const pauseTrackBtn = document.getElementById("pauseTrackBtn");
  const skipTrackBtn = document.getElementById("skipTrackBtn");
  const prevTrackBtn = document.getElementById("prevTrackBtn");

  startBtn.addEventListener("click", startExperience);
  testBtn.addEventListener("click", () => {
    appState.audioManager.initializeAudio();
    appState.audioManager.testAudio();
    setAudioStatus("Audio: Test tone active");
  });
  muteBtn.addEventListener("click", () => {
    const muted = appState.audioManager.toggleMute();
    setAudioStatus(muted ? "Audio: Muted" : "Audio: Unmuted");
  });
  debugToggle.addEventListener("click", () => {
    const debugPanel = document.getElementById("debugContent");
    debugPanel.classList.toggle("hidden");
  });

  connectSpotifyBtn.addEventListener("click", () => {
    window.location.href = "/login";
  });

  activatePlaylistBtn.addEventListener("click", () => {
    const playlistUrl = document.getElementById("spotifyLink")?.value || "";
    if (!playlistUrl) {
      console.log("[SPOTIFY] No playlist URL supplied.");
      return;
    }
    console.log("[SPOTIFY] Playlist activation requested:", playlistUrl);
  });

  playTrackBtn.addEventListener("click", async () => {
    if (appState.audioManager.currentProvider === "spotify" && appState.audioManager.spotifyProvider.currentUri) {
      await appState.audioManager.spotifyProvider.resume();
    } else {
      appState.audioManager.resume();
    }
  });

  pauseTrackBtn.addEventListener("click", async () => {
    await appState.audioManager.pause();
  });

  skipTrackBtn.addEventListener("click", async () => {
    await appState.audioManager.spotifyProvider.skip();
  });

  prevTrackBtn.addEventListener("click", () => {
    console.log("[SPOTIFY] Previous track not implemented in the current player session.");
  });

  universeSelector.addEventListener("change", (event) => {
    appState.currentUniverse = event.target.value;
    setSystemStatus(`System: ${appState.currentUniverse} active`);
  });

  musicMode.addEventListener("change", (event) => {
    appState.currentMode = event.target.value;
    appState.audioManager.setMode(event.target.value);
    setSystemStatus(`System: ${event.target.value === "ai" ? "AI Cinematic" : event.target.value === "spotify" ? "Spotify Personal" : "Offline"} mode`);
  });

  volumeSlider.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    appState.audioManager.setVolume(value);
  });

  document.querySelectorAll("[data-demo]").forEach((button) => {
    button.addEventListener("click", () => triggerDemo(button.dataset.demo));
  });
}

async function startExperience() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });

    const video = document.getElementById("webcam");
    video.srcObject = stream;
    setCameraStatus("Camera: Connected");
    setDebugValues();

    appState.audioManager.initializeAudio();
    appState.audioManager.playCategory("mass_entry", { priority: "high", universe: appState.currentUniverse, mode: appState.currentMode });
    setAudioStatus("Audio: AI soundtrack warmup");

    await initializePoseTracking();
    appState.started = true;
    setSystemStatus("System: Live analysis running");
    setDebugValues();

    setInterval(sendLiveDetection, 1400);
  } catch (error) {
    console.error("[AUDIO ERROR] Failed to start experience.", error);
    setSystemStatus("System: Camera permission required");
    setCameraStatus("Camera: Error");
  }
}

async function initializePoseTracking() {
  const video = document.getElementById("webcam");
  const canvas = document.getElementById("poseCanvas");
  const ctx = canvas.getContext("2d");

  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  pose.onResults((results) => {
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "#69f0ff",
        lineWidth: 2,
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: "#ff7edb",
        lineWidth: 1,
        radius: 3,
      });
      appState.lastPose = results.poseLandmarks.map((point, index) => ({
        index,
        x: point.x,
        y: point.y,
        z: point.z,
      }));
      setDebugValues();
    }
  });

  appState.pose = pose;
  appState.camera = new Camera(video, {
    onFrame: async () => {
      if (video.readyState >= 2) {
        await pose.send({ image: video });
      }
    },
    width: 640,
    height: 480,
  });

  appState.camera.start();
  setSystemStatus("System: MediaPipe running");
}

async function sendLiveDetection() {
  if (!appState.started) return;
  const payload = {
    landmarks: appState.lastPose,
    activity: appState.lastDetection?.activity?.name || "walking",
    confidence: appState.lastDetection?.activity?.confidence || 0.8,
    universe: appState.currentUniverse,
    movement: 0.72,
  };

  try {
    const response = await fetch("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    appState.lastDetection = data;
    updateUIFromAPI(data);
    setDebugValues();
  } catch (error) {
    console.error("[AUDIO ERROR] Backend detect call failed.", error);
    setSystemStatus("System: Backend disconnected");
  }
}

async function triggerDemo(scenario) {
  const forceTrackUri = DEMO_SPOTIFY_TRACKS[scenario] || null;
  const response = await fetch("/api/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario, universe: appState.currentUniverse }),
  });

  const data = await response.json();
  appState.lastDetection = data;
  updateUIFromAPI(data);
  setDebugValues();

  if (data.music?.category) {
    const category = data.music.category;
    const priority = data.music.priority || "medium";
    appState.audioManager.playCategory(category, {
      mode: "spotify",
      universe: appState.currentUniverse,
      priority,
      demoMode: true,
      demoQuery: getDemoSearchQuery(category, appState.currentUniverse),
    });
  }
}

function updateUIFromAPI(data) {
  if (!data) return;

  const now = Date.now();
  if (now - appState.lastSceneProcessAt < appState.sceneProcessingDelayMs) {
    return;
  }
  appState.lastSceneProcessAt = now;

  const sceneName = data.situation?.name || "AWAITING SIGNAL";
  const activityName = data.activity?.name || "standing_still";
  const activityConfidence = Math.round((data.activity?.confidence || 0) * 100);
  const dramaValue = Math.min(100, Math.max(0, data.situation?.intensity || 0));
  const category = data.music?.category || "mass_entry";
  const priority = data.music?.priority || "medium";
  const reason = data.situation?.reason || data.narration || "AI selected this because the scene got dramatically weird.";
  const sourceText = "Source: Local Procedural BGM";

  document.getElementById("sceneName").textContent = sceneName.toUpperCase();
  document.getElementById("commentaryText").textContent = data.narration || "The plot is getting dramatically unnecessary.";
  document.getElementById("activityText").textContent = convertActivity(activityName);
  document.getElementById("activityConfidence").textContent = `Confidence: ${activityConfidence}%`;
  document.getElementById("dramaValue").textContent = `${dramaValue}%`;
  document.getElementById("soundtrackText").textContent = `🎵 ${category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}`;
  document.getElementById("soundtrackMeta").textContent = `Category: ${category} | ${sourceText}`;
  document.getElementById("debugScene").textContent = sceneName;
  document.getElementById("debugCategory").textContent = category;
  document.getElementById("debugProvider").textContent = "procedural";
  document.getElementById("debugAudioStatus").textContent = "Playing";

  const gauge = document.querySelector(".radial-gauge");
  gauge.style.background = `conic-gradient(var(--cyan) 0deg ${dramaValue * 3.6}deg, rgba(255, 255, 255, 0.08) ${dramaValue * 3.6}deg 360deg)`;

  const debugBackend = document.getElementById("debugBackend");
  debugBackend.textContent = "Connected";
  document.getElementById("systemStatus").textContent = "System: Live";
  setAudioStatus(`Audio: ${category}`);

  appState.audioManager.playCategory(category, {
    mode: "offline",
    universe: appState.currentUniverse,
    priority,
    reason,
  });
}

function updateHud(result) {
  updateUIFromAPI(result);
}

function setSystemStatus(value) {
  document.getElementById("systemStatus").textContent = value;
}

function setCameraStatus(value) {
  document.getElementById("cameraStatus").textContent = value;
}

function setAudioStatus(value) {
  document.getElementById("audioStatusBadge").textContent = value;
}

function setDebugValues() {
  const cameraState = document.getElementById("webcam").srcObject ? "Connected" : "Offline";
  document.getElementById("debugCamera").textContent = cameraState;
  document.getElementById("debugMediapipe").textContent = appState.pose ? "Running" : "Standby";
  document.getElementById("debugBackend").textContent = "Connected";
  document.getElementById("debugScene").textContent = appState.lastDetection?.situation?.name || "Awaiting signal";
  document.getElementById("debugCategory").textContent = appState.lastDetection?.music?.category || "None";
  document.getElementById("debugProvider").textContent = appState.audioManager.getAudioStatus().provider || "Procedural";
  document.getElementById("debugAudioStatus").textContent = appState.audioManager.getAudioStatus().playing ? "Playing" : "Idle";
}

async function checkSpotifyStatus() {
  const spotifyStatus = document.getElementById("spotifyStatus");
  spotifyStatus.textContent = "🟢 LOCAL BGM ACTIVE";
  spotifyStatus.title = "Spotify playback is disabled. Local cinematic BGM is active.";
  document.getElementById("soundtrackMeta").textContent = "Local procedural soundtrack active";
  setAudioStatus("Audio: Local BGM active");
}

function convertActivity(activityName) {
  const map = {
    walking: "🚶 Walking",
    running: "🏃 Running",
    standing_still: "🧍 Standing Still",
    looking_around: "👀 Looking Around",
    drinking_water: "🥤 Drinking Water",
    hair_flip: "💇 Hair Flip",
    sitting: "🪑 Sitting",
  };
  return map[activityName] || `🎭 ${activityName}`;
}
