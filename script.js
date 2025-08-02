// 1️⃣ Load face-api models
async function loadModels() {
  const MODEL_URL = '/models';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  console.log("✅ Models loaded");
}
loadModels(); // call it right away

// 2️⃣ Image upload + preview
const imageUpload = document.getElementById('imageUpload');
const previewImg = document.getElementById('preview');

imageUpload.addEventListener('change', async () => {
  const file = imageUpload.files[0];
  const image = await faceapi.bufferToImage(file);
  previewImg.src = image.src;
  detectFace(previewImg);
});

// 3️⃣ Detect face and get landmarks
async function detectFace(image) {
  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  if (!detection) {
    alert("No face found 😢");
    return;
  }

  const landmarks = detection.landmarks;
  const matchedVeggie = getMatchingVeggie(landmarks);
  showResult(matchedVeggie);
}

// 4️⃣ Match veggie based on face shape (dummy logic)
function getMatchingVeggie(landmarks) {
  const jaw = landmarks.getJawOutline();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  const mouth = landmarks.getMouth();
  const leftBrow = landmarks.getLeftEyeBrow();
  const rightBrow = landmarks.getRightEyeBrow();

  const faceWidth = jaw[16].x - jaw[0].x;
  const faceHeight = jaw[8].y - leftBrow[0].y;
  const eyeGap = rightEye[0].x - leftEye[3].x;
  const noseLength = nose[6].y - nose[0].y;
  const mouthWidth = mouth[6].x - mouth[0].x;
  const eyebrowTilt = leftBrow[4].y - leftBrow[0].y;
  const jawAsymmetry = Math.abs(jaw[1].y - jaw[15].y);

  // Simple logic for grocery-matching:
  if (faceWidth < 100 && eyeGap > 40) return "🥕 You are a Carrot!";
  if (faceWidth < 120 && noseLength < 30) return "🍅 You are a Tomato!";
  if (faceWidth > 140 && faceHeight < 180) return "🥔 You are a Potato!";
  if (faceHeight > 200 && eyeGap < 30) return "🥒 You are a Cucumber!";
  if (faceHeight < 160 && mouthWidth > 60) return "🍌 You are a Banana!";
  if (eyeGap > 50 && faceWidth < 130) return "🧅 You are an Onion!";
  if (noseLength < 25 && mouthWidth < 50) return "🥬 You are a Beetroot!";
  if (jawAsymmetry > 15 && faceHeight > 200) return "🍍 You are a Pineapple!";
  if (faceWidth < 100 && faceHeight < 150) return "🫐 You are a Blueberry!";
  if (eyebrowTilt > 10 && jawAsymmetry > 10) return "🍆 You are an Eggplant!";

  // Fallback option
  return "🍇 You are a Grape — mysterious and undefined!";
}


// 5️⃣ Show result
function showResult(veggie) {
  document.getElementById('result').innerText = `You're a ${veggie}!`;
}
