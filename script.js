// ===============================
// MEDIAPIPE IMPORTS
// ===============================

import {
    PoseLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";


// ===============================
// CONFIGURATION & STATE
// ===============================

const API_URL = window.location.origin.startsWith("http") ? window.location.origin : "http://127.0.0.1:8000";

let currentView = "landing";
let isRecording = false;
let mediaStream = null;
let activeVideoElement = null;


// ===============================
// SEQUENCE DETECTOR CLASS
// ===============================

class SequenceDetector {

    constructor(requiredFrames = 8, cooldown = 700) {
        this.candidateGesture = null;
        this.candidateCount = 0;
        this.currentGesture = null;
        this.sequence = [];
        this.requiredFrames = requiredFrames;
        this.cooldown = cooldown;
        this.lastChangeTime = 0;
    }

    update(gesture) {
        // Ignore neutral
        if (gesture === "NEUTRAL") {
            return this.sequence;
        }

        const currentTime = Date.now();

        // Prevent rapid duplicate gestures
        if (currentTime - this.lastChangeTime < this.cooldown) {
            return this.sequence;
        }

        // Same gesture detected again
        if (gesture === this.candidateGesture) {
            this.candidateCount++;
        } else {
            this.candidateGesture = gesture;
            this.candidateCount = 1;
        }

        // Gesture held long enough
        if (this.candidateCount >= this.requiredFrames) {
            if (gesture !== this.currentGesture) {
                this.currentGesture = gesture;
                this.sequence.push(gesture);
                this.lastChangeTime = currentTime;
                this.candidateCount = 0;
            }
        }

        return this.sequence;
    }

    reset() {
        this.candidateGesture = null;
        this.candidateCount = 0;
        this.currentGesture = null;
        this.sequence = [];
        this.lastChangeTime = 0;
    }
}

const sequenceDetector = new SequenceDetector();


// ===============================
// GESTURE DETECTION FUNCTIONS
// ===============================

function detectSquat(landmarks) {
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];

    const leftDifference = leftKnee.y - leftHip.y;
    const rightDifference = rightKnee.y - rightHip.y;
    const threshold = 0.25;

    return (leftDifference < threshold) && (rightDifference < threshold);
}

function detectHandsTogether(landmarks) {
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const dx = leftWrist.x - rightWrist.x;
    const dy = leftWrist.y - rightWrist.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const threshold = 0.25;

    return distance < threshold;
}

function detectArmsOut(landmarks) {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const tolerance = 0.10;

    const leftArmOut = Math.abs(leftWrist.y - leftShoulder.y) < tolerance;
    const rightArmOut = Math.abs(rightWrist.y - rightShoulder.y) < tolerance;

    return leftArmOut && rightArmOut;
}

function detectGesture(landmarks) {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const margin = 0.08;
    const leftHandUp = leftWrist.y < leftShoulder.y - margin;
    const rightHandUp = rightWrist.y < rightShoulder.y - margin;

    if (detectSquat(landmarks)) {
        return "SQUAT";
    } else if (detectHandsTogether(landmarks)) {
        return "HANDS_TOGETHER";
    } else if (detectArmsOut(landmarks)) {
        return "ARMS_OUT";
    } else if (leftHandUp && rightHandUp) {
        return "BOTH_HANDS_UP";
    } else if (rightHandUp && !leftHandUp) {
        return "RIGHT_HAND_UP";
    } else if (leftHandUp && !rightHandUp) {
        return "LEFT_HAND_UP";
    } else {
        return "NEUTRAL";
    }
}


// ===============================
// CAMERA & WEBCAM MANAGEMENT
// ===============================

async function startCamera(videoElement) {
    try {
        if (!mediaStream) {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: false
            });
        }

        videoElement.srcObject = mediaStream;
        await videoElement.play();
        activeVideoElement = videoElement;
        console.log("Webcam connected!");
    } catch (error) {
        console.error("Camera error:", error);
    }
}


// ===============================
// MEDIAPIPE POSE LANDMARKER
// ===============================

let poseLandmarker = null;
let lastVideoTime = -1;

async function setupPoseLandmarker() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        poseLandmarker = await PoseLandmarker.createFromOptions(
            vision,
            {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"
                },
                runningMode: "VIDEO",
                numPoses: 1
            }
        );

        console.log("Pose Landmarker initialized!");
        detectPoseLoop();
    } catch (error) {
        console.error("MediaPipe error:", error);
    }
}


// ===============================
// POSE DETECTION ANIMATION LOOP
// ===============================

function detectPoseLoop() {
    if (poseLandmarker && activeVideoElement && activeVideoElement.readyState >= 2) {
        if (activeVideoElement.currentTime !== lastVideoTime) {
            lastVideoTime = activeVideoElement.currentTime;

            const result = poseLandmarker.detectForVideo(
                activeVideoElement,
                performance.now()
            );

            if (result.landmarks && result.landmarks.length > 0) {
                const landmarks = result.landmarks[0];
                const gesture = detectGesture(landmarks);

                updateUIForGesture(gesture);
            } else {
                updateUIForNoPerson();
            }
        }
    }

    requestAnimationFrame(detectPoseLoop);
}

function updateUIForGesture(gesture) {
    const gestureLabel = `Gesture: ${gesture}`;

    if (currentView === "signup") {
        document.getElementById("signup-current-gesture").textContent = gestureLabel;

        if (isRecording) {
            const sequence = sequenceDetector.update(gesture);
            renderSequenceBadges("signup-sequence-list", sequence);
        }
    } else if (currentView === "login") {
        document.getElementById("login-current-gesture").textContent = gestureLabel;

        if (isRecording) {
            const sequence = sequenceDetector.update(gesture);
            renderSequenceBadges("login-sequence-list", sequence);
        }
    }
}

function updateUIForNoPerson() {
    if (currentView === "signup") {
        document.getElementById("signup-current-gesture").textContent = "Gesture: Searching...";
    } else if (currentView === "login") {
        document.getElementById("login-current-gesture").textContent = "Gesture: Searching...";
    }
}

function renderSequenceBadges(elementId, sequence) {
    const container = document.getElementById(elementId);
    if (!sequence || sequence.length === 0) {
        container.innerHTML = "Sequence: —";
        return;
    }

    let html = 'Sequence: ';
    sequence.forEach((item, index) => {
        html += `<span class="sequence-badge">${item.replace(/_/g, " ")}</span>`;
        if (index < sequence.length - 1) {
            html += `<span class="arrow-sep">→</span>`;
        }
    });

    container.innerHTML = html;
}


// ===============================
// VIEW ROUTER
// ===============================

function switchView(targetView) {
    currentView = targetView;
    isRecording = false;
    sequenceDetector.reset();

    // Hide all view containers
    document.querySelectorAll(".view-container").forEach(el => {
        el.classList.remove("active");
    });

    // Show target view container
    const viewEl = document.getElementById(`${targetView}-view`);
    if (viewEl) {
        viewEl.classList.add("active");
    }

    // Attach webcam to target view video element if applicable
    if (targetView === "signup") {
        renderSequenceBadges("signup-sequence-list", []);
        updateStatus("signup-status", "Press START to record poses", "info");
        startCamera(document.getElementById("signup-video"));
    } else if (targetView === "login") {
        renderSequenceBadges("login-sequence-list", []);
        updateStatus("login-status", "Press START RECORDING to verify", "info");
        startCamera(document.getElementById("login-video"));
    }
}

function updateStatus(elementId, text, type = "info") {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = text;
    el.className = `status-banner ${type}`;
}


// ===============================
// SIGN UP CONTROLS & API
// ===============================

function handleSignUpStart() {
    isRecording = true;
    sequenceDetector.reset();
    renderSequenceBadges("signup-sequence-list", []);
    updateStatus("signup-status", "Recording! Perform your pose sequence...", "info");
}

function handleSignUpReset() {
    isRecording = true;
    sequenceDetector.reset();
    renderSequenceBadges("signup-sequence-list", []);
    updateStatus("signup-status", "Sequence reset. Ready to record again.", "info");
}

async function handleSignUpConfirm() {
    const emailInput = document.getElementById("signup-email");
    const email = emailInput.value.trim();
    const sequence = sequenceDetector.sequence;

    if (!email) {
        updateStatus("signup-status", "Please enter a valid email address.", "error");
        return;
    }

    if (sequence.length === 0) {
        updateStatus("signup-status", "Sequence cannot be empty. Press START and perform poses.", "error");
        return;
    }

    updateStatus("signup-status", "Saving your PassPose...", "info");

    try {
        const response = await fetch(`${API_URL}/password/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, sequence: sequence })
        });

        const data = await response.json();

        if (data.success) {
            updateStatus("signup-status", "PASSPOSE CREATED! 🎉 Redirecting to home...", "success");
            isRecording = false;
            sequenceDetector.reset();

            setTimeout(() => {
                switchView("landing");
            }, 1800);
        } else {
            updateStatus("signup-status", data.message || "Failed to create password.", "error");
        }
    } catch (error) {
        console.error(error);
        updateStatus("signup-status", "Could not connect to PassPose backend server.", "error");
    }
}


// ===============================
// LOGIN CONTROLS & API
// ===============================

function handleLoginStart() {
    isRecording = true;
    sequenceDetector.reset();
    renderSequenceBadges("login-sequence-list", []);
    updateStatus("login-status", "Recording! Perform your secret pose sequence...", "info");
}

function handleLoginReset() {
    isRecording = true;
    sequenceDetector.reset();
    renderSequenceBadges("login-sequence-list", []);
    updateStatus("login-status", "Sequence reset. Try performing your poses again.", "info");
}

async function handleLoginProceed() {
    const emailInput = document.getElementById("login-email");
    const email = emailInput.value.trim();
    const sequence = sequenceDetector.sequence;

    if (!email) {
        updateStatus("login-status", "Please enter your email.", "error");
        return;
    }

    if (sequence.length === 0) {
        updateStatus("login-status", "Sequence cannot be empty. Press START RECORDING first.", "error");
        return;
    }

    updateStatus("login-status", "Verifying your secret pose dance...", "info");

    try {
        const response = await fetch(`${API_URL}/password/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, sequence: sequence })
        });

        const data = await response.json();

        if (data.authenticated) {
            updateStatus("login-status", "ACCESS GRANTED! Redirecting...", "success");
            isRecording = false;

            document.getElementById("demo-welcome-msg").textContent = `Welcome back, ${email}!`;

            setTimeout(() => {
                switchView("demo");
            }, 1200);
        } else {
            updateStatus("login-status", "ACCESS DENIED! Sequence or email did not match.", "error");
            isRecording = false;
        }
    } catch (error) {
        console.error(error);
        updateStatus("login-status", "Could not connect to PassPose backend server.", "error");
    }
}


// ===============================
// EVENT LISTENERS BINDING
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    // Landing View Buttons
    document.getElementById("landing-login-btn").addEventListener("click", () => switchView("login"));
    document.getElementById("landing-signup-btn").addEventListener("click", () => switchView("signup"));
    document.getElementById("go-btn").addEventListener("click", () => switchView("signup"));

    // Sign Up Buttons
    document.getElementById("signup-start-btn").addEventListener("click", handleSignUpStart);
    document.getElementById("signup-confirm-btn").addEventListener("click", handleSignUpConfirm);
    document.getElementById("signup-reset-btn").addEventListener("click", handleSignUpReset);

    // Login Buttons
    document.getElementById("login-start-btn").addEventListener("click", handleLoginStart);
    document.getElementById("login-proceed-btn").addEventListener("click", handleLoginProceed);
    document.getElementById("login-reset-btn").addEventListener("click", handleLoginReset);

    // Demo View Logout Button
    document.getElementById("demo-logout-btn").addEventListener("click", () => switchView("landing"));

    // Initialize MediaPipe
    setupPoseLandmarker();
});