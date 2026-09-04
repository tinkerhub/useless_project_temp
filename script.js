// ============================================
// SORTING SOCK — ITERATION 0.1
// ============================================

// -----------------------------
// ELEMENTS
// -----------------------------

let syntheticData = [];

fetch("data/synthetic-data.json")
  .then(response => response.json())
  .then(data => {
    syntheticData = data;
    console.log("SYNTHETIC DATA LOADED:", syntheticData.length);
  })
  .catch(error => {
    console.error("FAILED TO LOAD SYNTHETIC DATA:", error);
  });

console.log("SCRIPT LOADED");

let faceCascade;
let smileCascade;

function waitForOpenCV() {
  if (typeof cv !== "undefined" && cv.Mat) {
    console.log("OPENCV LOADED");

    faceCascade = new cv.CascadeClassifier();
    smileCascade = new cv.CascadeClassifier();

fetch("haarcascade_frontalface_default.xml")
  .then(response => response.arrayBuffer())
  .then(buffer => {
    const data = new Uint8Array(buffer);

    cv.FS_createDataFile(
      "/",
      "haarcascade_frontalface_default.xml",
      data,
      true,
      false,
      false
    );

    faceCascade.load("haarcascade_frontalface_default.xml");

    console.log("FACE MODEL LOADED");
    fetch("haarcascade_smile.xml")
  .then(response => response.arrayBuffer())
  .then(buffer => {
    const data = new Uint8Array(buffer);

    cv.FS_createDataFile(
      "/",
      "haarcascade_smile.xml",
      data,
      true,
      false,
      false
    );

    smileCascade.load("haarcascade_smile.xml");

    console.log("SMILE MODEL LOADED");
  })
  .catch(error => {
    console.error("SMILE MODEL FAILED TO LOAD:", error);
  });
  })
  .catch(error => {
    console.error("FACE MODEL FAILED TO LOAD:", error);
  });
    return;
  }

  console.log("Waiting for OpenCV...");
  setTimeout(waitForOpenCV, 100);
}

waitForOpenCV();

let faceDetected = false;
let faceData = null;
let smileFrames = 0;

function detectFace() {
  if (!faceCascade || !smileCascade || !camera.videoWidth) {
    requestAnimationFrame(detectFace);
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;

  const ctx = canvas.getContext("2d");

  function scan() {
    if (!camera.videoWidth) {
      setTimeout(scan, 100);
      return;
    }

    ctx.drawImage(
      camera,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const src = cv.imread(canvas);
    const gray = new cv.Mat();

    cv.cvtColor(
      src,
      gray,
      cv.COLOR_RGBA2GRAY
    );

    const faces = new cv.RectVector();
    const minSize = new cv.Size(50, 50);

    faceCascade.detectMultiScale(
      gray,
      faces,
      1.1,
      3,
      0,
      minSize
    );

    if (faces.size() > 0) {
      if (!faceDetected) {
        faceDetected = true;

        console.log("👁️ FACE DETECTED");
        speechBubble.textContent = "I SEE YOU.";
      }

      // Get the first detected face
      const face = faces.get(0);
      faceData = {
  width: face.width,
  height: face.height,
  ratio: face.width / face.height,
  area: face.width * face.height
};

      // Look at the lower half of the face
      const mouthRegion = gray.roi(
        new cv.Rect(
          face.x,
          face.y + Math.floor(face.height * 0.55),
          face.width,
          Math.floor(face.height * 0.45)
        )
      );

      const smiles = new cv.RectVector();
      const smileMinSize = new cv.Size(30, 20);

      smileCascade.detectMultiScale(
        mouthRegion,
        smiles,
        1.1,
        35,
        0,
        smileMinSize
      );

      if (smiles.size() > 0) {
  smileFrames++;
} else {
  smileFrames = 0;
}

if (smileFrames >= 5) {
  console.log("😄 SMILE CONFIRMED");

  setEmotion("happy");
  speechBubble.textContent = "OH. YOU'RE HAPPY.";

  smileFrames = 0;
}

      mouthRegion.delete();
      smiles.delete();
    }

    if (faces.size() === 0 && faceDetected) {
      faceDetected = false;

      console.log("NO FACE");
      speechBubble.textContent = "WHERE DID YOU GO?";
    }

    src.delete();
    gray.delete();
    faces.delete();

    requestAnimationFrame(scan);
  }

  scan();
}

const sock = document.getElementById("sock");

const speechBubble = document.getElementById("speechBubble");
const speechText = document.getElementById("speechText");

const startCameraButton = document.getElementById("startCamera");
const analyzeButton = document.getElementById("analyzeButton");

const cameraSection = document.getElementById("cameraSection");
const camera = document.getElementById("camera");
const cameraStatus = document.getElementById("cameraStatus");

const countdown = document.getElementById("countdown");
const results = document.getElementById("results");

const shareButton = document.getElementById("shareButton");
const resetButton = document.getElementById("resetButton");

const footerStatus = document.getElementById("footerStatus");

const leftEye = document.getElementById("left-eye");
const rightEye = document.getElementById("right-eye");
const sockMouth = document.getElementById("sock-mouth");

const confettiContainer = document.getElementById("confetti");

// -----------------------------
// STATE
// -----------------------------

let currentEmotion = "neutral";
let cameraStream = null;
let analysisRunning = false;

let currentResult = {
  footSize: 9.5,
  fetishPercentage: 73,
  compatibleSize: 8.5
};

// -----------------------------
// DIALOGUE
// -----------------------------

const dialogue = {

  neutral: [
    "HELLO HUMAN.",
    "PLEASE PRESENT FACE.",
    "I AM READY TO SORT.",
    "ANALYZING HUMAN STRUCTURE...",
    "INTERESTING.",
    "THE SOCK IS THINKING.",
    "CALCULATING SOCK ENERGY..."
  ],

  happy: [
    "OH. YOU'RE HAPPY.",
    "SUSPICIOUSLY WHOLESOME.",
    "THE SOCK LIKES THIS.",
    "EXCELLENT FACIAL GEOMETRY.",
    "JOY DETECTED.",
    "THIS IS GOING WELL."
  ],

  sad: [
    "WHY ARE WE SAD.",
    "THE SOCK IS ALSO SAD NOW.",
    "PLEASE RETURN JOY TO THE SOCK.",
    "EMOTIONAL DAMAGE DETECTED.",
    "THIS IS A LITTLE CONCERNING.",
    "THE SOCK UNDERSTANDS."
  ],

  angry: [
    "PLEASE CALM DOWN.",
    "THE SOCK IS FRIGHTENED.",
    "ANGER DETECTED.",
    "DO NOT ANGER THE SOCK.",
    "THIS WILL AFFECT YOUR SCORE.",
    "THE SOCK HAS QUESTIONS."
  ]

};

// -----------------------------
// TYPEWRITER
// -----------------------------

function typeText(text, speed = 35) {

  return new Promise((resolve) => {

    speechText.textContent = "";

    let index = 0;

    const interval = setInterval(() => {

      speechText.textContent += text[index];

      index++;

      if (index >= text.length) {

        clearInterval(interval);

        resolve();

      }

    }, speed);

  });

}

// -----------------------------
// RANDOM DIALOGUE
// -----------------------------

function randomDialogue() {

  const pool = dialogue[currentEmotion];

  const randomIndex = Math.floor(Math.random() * pool.length);

  return pool[randomIndex];

}

// -----------------------------
// SOCK EMOTION
// -----------------------------

function setEmotion(emotion) {

  currentEmotion = emotion;

  sock.classList.remove(
    "happy",
    "sad",
    "angry"
  );

  if (emotion !== "neutral") {
    sock.classList.add(emotion);
  }

  switch (emotion) {

    case "happy":

      leftEye.textContent = "^";
      rightEye.textContent = "^";
      sockMouth.textContent = "◡";

      break;

    case "sad":

      leftEye.textContent = "•";
      rightEye.textContent = "•";
      sockMouth.textContent = "︵";

      break;

    case "angry":

      leftEye.textContent = ">";
      rightEye.textContent = "<";
      sockMouth.textContent = "︿";

      break;

    default:

      leftEye.textContent = "•";
      rightEye.textContent = "•";
      sockMouth.textContent = "ᴗ";

  }

}

// -----------------------------
// INITIAL MESSAGE
// -----------------------------

async function intro() {

  await typeText("HELLO HUMAN.");

  await new Promise(resolve => setTimeout(resolve, 600));

  await typeText("I AM THE SORTING SOCK.");

  await new Promise(resolve => setTimeout(resolve, 600));

  await typeText("SHOW ME YOUR FACE.");

}

intro();


// ============================================
// CAMERA
// ============================================

startCameraButton.addEventListener("click", async () => {

  try {

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    camera.srcObject = cameraStream;

    detectFace();

    cameraSection.classList.remove("hidden");

    startCameraButton.classList.add("hidden");

    analyzeButton.classList.remove("hidden");

    cameraStatus.textContent = "FACE SCANNER ONLINE";

    footerStatus.textContent = "CAMERA ACTIVE";

    await typeText("FACE ACQUIRED.");

  } catch (error) {

    console.error(error);

    await typeText(
      "I CANNOT SEE YOU. PLEASE CHECK CAMERA PERMISSIONS."
    );

    cameraStatus.textContent = "CAMERA ACCESS DENIED";

  }

});


// ============================================
// DEV EMOTION CONTROLS
// ============================================

document
  .querySelectorAll("[data-emotion]")
  .forEach(button => {

    button.addEventListener("click", () => {

      const emotion = button.dataset.emotion;

      setEmotion(emotion);

      typeText(randomDialogue());

    });

  });


// ============================================
// ANALYSIS
// ============================================

analyzeButton.addEventListener("click", async () => {

  console.log("ANALYZE BUTTON CLICKED");

  if (analysisRunning) {
    console.log("Analysis already running");
    return;
  }

  analysisRunning = true;
  analyzeButton.disabled = true;

  results.classList.add("hidden");
  sock.classList.remove("dance");

  footerStatus.textContent = "ANALYZING";

  const analysisBar = document.getElementById("analysisBar");
  const progress = document.getElementById("analysisProgress");

  // Make sure the analysis elements actually exist
  if (!analysisBar || !progress) {

    console.error("Analysis bar elements are missing!");

    analysisRunning = false;
    analyzeButton.disabled = false;

    return;
  }

  // SHOW ANALYSIS BAR
  analysisBar.classList.remove("hidden");

  progress.style.width = "0%";

  // Show first message
  typeText("CALCULATING TOE ENERGY...");

  // --------------------------------
  // EXACTLY 3 SECOND ANALYSIS
  // --------------------------------

  const duration = 3000;
  const startTime = performance.now();

  await new Promise(resolve => {

    function updateProgress(currentTime) {

      const elapsed = currentTime - startTime;

      const percentage = Math.min(
        elapsed / duration,
        1
      );

      progress.style.width =
        `${percentage * 100}%`;


      if (percentage < 1) {

        requestAnimationFrame(updateProgress);

      } else {

        resolve();

      }
    }

    requestAnimationFrame(updateProgress);

  });

  // --------------------------------
  // ANALYSIS FINISHED
  // --------------------------------

  progress.style.width = "100%";

  await typeText("ANALYSIS COMPLETE.");

  await new Promise(resolve =>
    setTimeout(resolve, 300)
  );

  analysisBar.classList.add("hidden");

  // --------------------------------
  // COUNTDOWN
  // --------------------------------

  await runCountdown();

  // --------------------------------
  // RESULTS
  // --------------------------------

  generateResults();

  launchConfetti();

  showResults();

  analysisRunning = false;
  analyzeButton.disabled = false;

});

// ============================================
// COUNTDOWN
// ============================================

async function runCountdown() {

  countdown.classList.remove("hidden");

  const numbers = ["3", "2", "1"];

  for (const number of numbers) {

    countdown.textContent = number;

    // Restart the animation
    countdown.classList.remove("show");

    void countdown.offsetWidth;

    countdown.classList.add("show");

    // Each number stays for exactly 1 second
    await new Promise(resolve =>
      setTimeout(resolve, 1000)
    );

  }

  countdown.classList.add("hidden");

}


// ============================================
// RANDOM RESULTS
// ============================================

function generateResults() {
  if (!faceData || syntheticData.length === 0) {
    console.log("No face data or synthetic data available.");
    return;
  }

  const input = {
    faceRatio: faceData.ratio,
    faceWidthRatio: faceData.width / camera.videoWidth,
    faceHeightRatio: faceData.height / camera.videoHeight,
    smileScore: smileFrames > 0 ? 1 : 0
  };

  // Find the 10 synthetic records most similar to this face
  const matches = syntheticData
    .map(record => {
      const distance =
        Math.pow(record.faceRatio - input.faceRatio, 2) +
        Math.pow(record.faceWidthRatio - input.faceWidthRatio, 2) +
        Math.pow(record.faceHeightRatio - input.faceHeightRatio, 2) +
        Math.pow(record.smileScore - input.smileScore, 2);

      return {
        record,
        distance
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  // Average the results of the closest matches
  const average = key =>
    matches.reduce((sum, match) => sum + match.record[key], 0) / matches.length;

  currentResult = {
    footSize: Math.round(average("footSize") * 2) / 2,
    fetishPercentage: Math.round(average("fetishPercentage")),
    compatibleSize: Math.round(average("compatibleSize") * 2) / 2
  };

  console.log("MATCHED SYNTHETIC RECORDS:", matches);
  console.log("GENERATED RESULT:", currentResult);
}

// ============================================
// SHOW RESULTS
// ============================================

function showResults() {

  document.getElementById("footSize").textContent =
    currentResult.footSize;

  document.getElementById("fetishPercentage").textContent =
    currentResult.fetishPercentage + "%";

  document.getElementById("compatibleSize").textContent =
    currentResult.compatibleSize;

  results.classList.remove("hidden");

  sock.classList.add("dance");

  footerStatus.textContent = "SORT COMPLETE";

  typeText("THE SOCK HAS SPOKEN.");

}


// ============================================
// CONFETTI
// ============================================

function launchConfetti() {

  const pieces = 300;

  const confettiColors = [
    "#FFE700",
    "#FF3B81",
    "#00E5FF",
    "#FF6B35",
    "#FF4F64",
    "#A855F7",
    "#7CFF00",
    "#FFF1C1"
  ];

  for (let i = 0; i < pieces; i++) {

    const piece = document.createElement("div");

    piece.classList.add("confetti");

    // Start from the TOP of the screen
    piece.style.left =
      Math.random() * 100 + "vw";

    piece.style.top =
      -20 - Math.random() * 100 + "px";

    // Bright random colour
    piece.style.background =
      confettiColors[
        Math.floor(
          Math.random() * confettiColors.length
        )
      ];

    // Random horizontal drift
    piece.style.setProperty(
      "--x",
      (Math.random() * 300 - 150) + "px"
    );

    // Random size
    const size =
      6 + Math.random() * 10;

    piece.style.width =
      `${size}px`;

    piece.style.height =
      `${size}px`;

    // Stagger slightly
    piece.style.animationDelay =
      Math.random() * 0.8 + "s";

    // Random fall duration
    piece.style.animationDuration =
      1.8 + Math.random() * 1.8 + "s";

    confettiContainer.appendChild(piece);

    setTimeout(() => {
      piece.remove();
    }, 4500);

  }

}


// ============================================
// CANVAS SHARE CARD
// ============================================

shareButton.addEventListener("click", () => {

  const canvas = document.createElement("canvas");

  canvas.width = 800;
  canvas.height = 1000;

  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#24103D";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border
  ctx.strokeStyle = "#FFB26B";
  ctx.lineWidth = 20;

  ctx.strokeRect(
    20,
    20,
    canvas.width - 40,
    canvas.height - 40
  );

  // Text
  ctx.fillStyle = "#FFE700";

  ctx.textAlign = "center";

  ctx.font = "bold 34px monospace";

  ctx.fillText(
    "SORTING SOCK™",
    400,
    100
  );

  ctx.fillStyle = "#FFF1C1";

  ctx.font = "bold 26px monospace";

  ctx.fillText(
    "HUMAN REPORT",
    400,
    160
  );

  // Sock emoji
  ctx.font = "100px serif";

  ctx.fillText(
    "🧦",
    400,
    300
  );

  // Results
  ctx.fillStyle = "#FFB26B";

  ctx.font = "bold 24px monospace";

  ctx.fillText(
    "EST. FOOT SIZE",
    400,
    420
  );

  ctx.fillStyle = "#FFE700";

  ctx.font = "bold 64px monospace";

  ctx.fillText(
    currentResult.footSize,
    400,
    485
  );

  ctx.fillStyle = "#FFB26B";

  ctx.font = "bold 24px monospace";

  ctx.fillText(
    "FOOT FETISH INDEX™",
    400,
    580
  );

  ctx.fillStyle = "#FFE700";

  ctx.font = "bold 64px monospace";

  ctx.fillText(
    currentResult.fetishPercentage + "%",
    400,
    645
  );

  ctx.fillStyle = "#FFB26B";

  ctx.font = "bold 24px monospace";

  ctx.fillText(
    "BEST MATCH",
    400,
    740
  );

  ctx.fillStyle = "#FFE700";

  ctx.font = "bold 64px monospace";

  ctx.fillText(
    currentResult.compatibleSize,
    400,
    805
  );

  ctx.fillStyle = "#FFF1C1";

  ctx.font = "bold 22px monospace";

  ctx.fillText(
    "THE SOCK HAS SPOKEN.",
    400,
    900
  );

  // Download/share
  canvas.toBlob(blob => {

    if (!blob) return;

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "sorting-sock-result.png";

    link.click();

    URL.revokeObjectURL(url);

  });

});


// ============================================
// RESET
// ============================================

resetButton.addEventListener("click", () => {

  results.classList.add("hidden");

  sock.classList.remove("dance");

  footerStatus.textContent = "READY";

  setEmotion("neutral");

  typeText("READY FOR ANOTHER HUMAN.");

});