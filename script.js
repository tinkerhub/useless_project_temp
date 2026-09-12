async function detectEmotion() {

    const imageUpload = document.getElementById("imageUpload");
    const result = document.getElementById("result");

    if (imageUpload.files.length === 0) {
        result.innerHTML = "⚠️ Please upload a photo first!";
        return;
    }

    result.innerHTML = "🤖 Analyzing... Please wait";

    const image = await faceapi.bufferToImage(imageUpload.files[0]);

    await faceapi.nets.tinyFaceDetector.loadFromUri(
        "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
    );

    await faceapi.nets.faceLandmark68Net.loadFromUri(
        "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
    );

    await faceapi.nets.faceExpressionNet.loadFromUri(
        "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
    );

    const detection = await faceapi
        .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

    if (!detection) {
        result.innerHTML = "❌ No face detected. Please upload a clear face photo.";
        return;
    }

    const expressions = detection.expressions;

    const emotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
    );

    const confidence = Math.round(expressions[emotion] * 100);

    let emoji = "😐";

    if (emotion === "happy") emoji = "😄";
    if (emotion === "sad") emoji = "😢";
    if (emotion === "angry") emoji = "😡";
    if (emotion === "surprised") emoji = "😲";
    if (emotion === "fearful") emoji = "😨";
    if (emotion === "disgusted") emoji = "🤢";

const happy = Math.round(expressions.happy * 100);
const sad = Math.round(expressions.sad * 100);
const angry = Math.round(expressions.angry * 100);
const surprised = Math.round(expressions.surprised * 100);
const fearful = Math.round(expressions.fearful * 100);
const disgusted = Math.round(expressions.disgusted * 100);
const neutral = Math.round(expressions.neutral * 100);

const messages = {
    happy: "Bro is having a great day! 🔥",
    sad: "It's okay bro, tomorrow will be better ❤️",
    angry: "Take a chill pill bro 😤",
    surprised: "Whoa! Something unexpected happened! 😲",
    fearful: "Don't worry bro, everything is okay! 😌",
    disgusted: "Bro really didn't like that! 🤢",
    neutral: "Calm and peaceful vibes 😌"
};

const message = messages[emotion] || "Interesting mood! 👀";

result.innerHTML = `
    <div class="mood-card">

        <div class="scanner-title">
            🤖 AI MOOD SCANNER
        </div>

        <div class="big-emoji">
            ${emoji}
        </div>

        <h1>${emotion.toUpperCase()}</h1>

        <p class="confidence">
            Confidence: <strong>${confidence}%</strong>
        </p>

        <div class="ai-message">
            ${message}
        </div>

        <div class="mood-bars">

            <div class="mood-row">
                <span>😄 Happy</span>
                <div class="bar">
                    <div style="width:${happy}%"></div>
                </div>
                <b>${happy}%</b>
            </div>

            <div class="mood-row">
                <span>😢 Sad</span>
                <div class="bar">
                    <div style="width:${sad}%"></div>
                </div>
                <b>${sad}%</b>
            </div>

            <div class="mood-row">
                <span>😡 Angry</span>
                <div class="bar">
                    <div style="width:${angry}%"></div>
                </div>
                <b>${angry}%</b>
            </div>

            <div class="mood-row">
                <span>😲 Surprise</span>
                <div class="bar">
                    <div style="width:${surprised}%"></div>
                </div>
                <b>${surprised}%</b>
            </div>

            <div class="mood-row">
                <span>😐 Neutral</span>
                <div class="bar">
                    <div style="width:${neutral}%"></div>
                </div>
                <b>${neutral}%</b>
            </div>

        </div>

        <button onclick="location.reload()" class="scan-again">
            🔄 SCAN AGAIN
        </button>

    </div>
`;
}