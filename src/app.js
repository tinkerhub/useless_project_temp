import { FileProcessor } from './FileProcessor.js';
import { ReedSolomonCoding } from './CodingEngine.js';
import { BlockPacker } from './BlockPacker.js';
import { ProtocolV1 } from './Protocol.js';
import { QRGenerator } from './QRGenerator.js';
import { Transmitter } from './Transmitter.js';

const homePage = document.getElementById("homePage");
const sendPage = document.getElementById("sendPage");
const receivePage = document.getElementById("receivePage");
const sendButton = document.getElementById("sendButton");
const receiveButton = document.getElementById("receiveButton");
const sendBack = document.getElementById("sendBack");
const receiveBack = document.getElementById("receiveBack");

function showPage(page) {
    homePage.classList.remove("active");
    sendPage.classList.remove("active");
    receivePage.classList.remove("active");
    page.classList.add("active");
    window.scrollTo(0, 0);
}

sendButton.addEventListener("click", () => showPage(sendPage));
receiveButton.addEventListener("click", () => showPage(receivePage));
sendBack.addEventListener("click", () => showPage(homePage));
receiveBack.addEventListener("click", () => showPage(homePage));

/* ================= FILE INPUT & UI ================= */
const fileInput = document.getElementById("fileInput");
const uploadBox = document.getElementById("uploadBox");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const removeFile = document.getElementById("removeFile");
const prepareButton = document.getElementById("prepareButton");
const transmissionSettings = document.getElementById("transmissionSettings");
const statusText = document.getElementById("statusText");

// Analytics UI
const statsWindow = document.getElementById("statsWindow");
const statOriginalSize = document.getElementById("statOriginalSize");
const statPreparedSize = document.getElementById("statPreparedSize");
const statChunks = document.getElementById("statChunks");
const statFrames = document.getElementById("statFrames");

// Playback UI (Phase 7)
const playbackZone = document.getElementById("playbackZone");
const qrDisplay = document.getElementById("qrDisplay");
const uiFpsActual = document.getElementById("uiFpsActual");
const uiFrameProgress = document.getElementById("uiFrameProgress");
const btnPlay = document.getElementById("btnPlay");
const btnPause = document.getElementById("btnPause");
const btnStop = document.getElementById("btnStop");

let currentFile = null;
let activeTransmitter = null;

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

// Make the entire upload box clickable
uploadBox.addEventListener("click", (e) => {
    if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
        fileInput.click();
    }
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    currentFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    fileInfo.classList.remove("hidden");
    transmissionSettings.classList.remove("hidden");
    statsWindow.classList.add("hidden");
    playbackZone.classList.add("hidden");
    
    if (activeTransmitter) {
        activeTransmitter.stop();
        activeTransmitter = null;
    }
    
    prepareButton.disabled = false;
    prepareButton.classList.remove("disabled");
    uploadBox.classList.add("has-file");
    
    statusText.style.color = "var(--muted)";
    statusText.textContent = "Ready to prepare transmission.";
});

removeFile.addEventListener("click", () => {
    fileInput.value = "";
    currentFile = null;
    
    fileInfo.classList.add("hidden");
    transmissionSettings.classList.add("hidden");
    statsWindow.classList.add("hidden");
    playbackZone.classList.add("hidden");
    
    if (activeTransmitter) {
        activeTransmitter.stop();
        activeTransmitter = null;
    }
    
    prepareButton.disabled = true;
    prepareButton.classList.add("disabled");
    uploadBox.classList.remove("has-file");
    
    statusText.style.color = "var(--muted)";
    statusText.textContent = "Select a file to process.";
});

/* ================= PIPELINE EXECUTION ================= */
prepareButton.addEventListener("click", async () => {
    if (!currentFile) return;

    const selectedMode = document.querySelector('input[name="transferMode"]:checked').value;
    
    prepareButton.disabled = true;
    prepareButton.textContent = "Processing Pipeline...";
    statusText.style.color = "var(--accent-light)";

    try {
        // --- PHASE 1 & 2 ---
        statusText.textContent = `Running Phase 1 & 2 (Understanding File)...`;
        const preparedFile = await FileProcessor.prepareForTransmission(currentFile);
        
        statOriginalSize.textContent = formatFileSize(preparedFile.originalSize);
        statPreparedSize.textContent = `${formatFileSize(preparedFile.preparedSize)} ${preparedFile.isCompressed ? '(GZIP)' : ''}`;
        
        // --- PHASE 3 Setup ---
        const codingEngine = new ReedSolomonCoding(25); 
        
        // --- PHASE 4 (Block Packing) ---
        statusText.textContent = `Running Phase 4 (RS Packing)... 0%`;
        
        // REDUCED TO 8 BLOCKS PER FRAME TO ENSURE NO OVERFLOW CRASHES
        const packingInfo = await BlockPacker.pack(
            preparedFile.preparedBytes, codingEngine, 230, 2, 
            (progress) => {
                statusText.textContent = `Running Phase 4 (RS Packing)... ${Math.floor(progress * 100)}%`;
            }
        );
        statChunks.textContent = `${packingInfo.totalPackedPayloads} Packed Payloads`;

        // --- PHASE 5 (Framing Protocol) ---
        statusText.textContent = `Running Phase 5 (Framing Protocol)... 0%`;
        const sessionId = ProtocolV1.generateSessionId();
        const metadataFrame = ProtocolV1.createMetadataFrame(sessionId, preparedFile, packingInfo, selectedMode);
        const dataFrames = await ProtocolV1.createDataFrames(sessionId, packingInfo, (progress) => {
            statusText.textContent = `Running Phase 5 (Framing Protocol)... ${Math.floor(progress * 100)}%`;
        });
        const endFrame = ProtocolV1.createEndFrame(sessionId, packingInfo.totalPackedPayloads);

        const finalProtocolStream = {
            sessionId,
            metadata: metadataFrame,
            data: dataFrames,
            end: endFrame,
            totalFrames: 1 + dataFrames.length + 1 
        };
        
        statFrames.textContent = finalProtocolStream.totalFrames;
        statsWindow.classList.remove("hidden");

        // --- PHASE 6 (QR Generation) ---
        statusText.textContent = `Running Phase 6 (Pre-rendering QR Codes)... 0%`;
        const qrImageArray = await QRGenerator.generatePreRenderedFrames(
            finalProtocolStream, 
            (progress) => {
                statusText.textContent = `Running Phase 6 (Rendering QR Codes)... ${Math.floor(progress * 100)}%`;
            }
        );

        statusText.style.color = "var(--success)";
        statusText.innerHTML = `<strong>Pipeline Complete! Ready to transmit.</strong>`;
        prepareButton.textContent = "Pipeline Done ✓";
        
        // --- PHASE 7 (Initialize Transmitter) ---
        activeTransmitter = new Transmitter(qrImageArray, 15);
        
        activeTransmitter.onFrameUpdate = (imgSrc, current, total) => {
            qrDisplay.src = imgSrc;
            uiFrameProgress.textContent = `${current} / ${total}`;
        };
        
        activeTransmitter.onFpsUpdate = (actualFps) => {
            uiFpsActual.textContent = actualFps;
            if(actualFps < 12) uiFpsActual.style.color = "#ef4444"; 
            else uiFpsActual.style.color = "var(--success)";
        };
        
        qrDisplay.src = qrImageArray[0];
        uiFrameProgress.textContent = `1 / ${qrImageArray.length}`;
        
        playbackZone.classList.remove("hidden");
        
    } catch (error) {
        console.error("Transmission preparation failed:", error);
        statusText.style.color = "#ef4444";
        statusText.textContent = "Error during pipeline. Check console.";
        prepareButton.disabled = false;
        prepareButton.textContent = "Prepare Transmission →";
    }
});

/* ================= PLAYBACK CONTROLS ================= */
btnPlay.addEventListener("click", () => {
    if(activeTransmitter) activeTransmitter.start();
});

btnPause.addEventListener("click", () => {
    if(activeTransmitter) activeTransmitter.pause();
});

btnStop.addEventListener("click", () => {
    if(activeTransmitter) {
        activeTransmitter.stop();
        uiFpsActual.textContent = "0";
    }
});