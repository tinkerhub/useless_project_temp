/*
 * =========================================================
 * Useless Project 3.0
 * Receiver Web Interface
 * =========================================================
 *
 * PHONE CAMERA
 *      ↓
 * ZXing QR DECODER
 *      ↓
 * RAW QR BYTE SEGMENTS
 *      ↓
 * POST /frame
 *      ↓
 * PYTHON RECEIVER
 *
 * The Sender is NOT modified.
 * =========================================================
 */


/* ---------------------------------------------------------
   ZXing
   --------------------------------------------------------- */

const ZXING_URL =
    "https://unpkg.com/@zxing/browser@latest";


let zxingLoaded = false;

let codeReader = null;

let scannerControls = null;


/* ---------------------------------------------------------
   DOM
   --------------------------------------------------------- */

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const camera =
    document.getElementById(
        "camera"
    );

const cameraMessage =
    document.getElementById(
        "cameraMessage"
    );

const startCameraButton =
    document.getElementById(
        "startCameraButton"
    );

const stopCameraButton =
    document.getElementById(
        "stopCameraButton"
    );

const resetButton =
    document.getElementById(
        "resetButton"
    );

const sessionIdElement =
    document.getElementById(
        "sessionId"
    );

const fileNameElement =
    document.getElementById(
        "fileName"
    );

const frameCountElement =
    document.getElementById(
        "frameCount"
    );

const duplicateCountElement =
    document.getElementById(
        "duplicateCount"
    );

const progressElement =
    document.getElementById(
        "progress"
    );

const progressText =
    document.getElementById(
        "progressText"
    );

const transferStatus =
    document.getElementById(
        "transferStatus"
    );

const resultCard =
    document.getElementById(
        "resultCard"
    );

const resultFileName =
    document.getElementById(
        "resultFileName"
    );

const verificationStatus =
    document.getElementById(
        "verificationStatus"
    );

const downloadButton =
    document.getElementById(
        "downloadButton"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );


/* ---------------------------------------------------------
   State
   --------------------------------------------------------- */

let scanning = false;

let lastPayloadKey = null;

let lastPayloadTime = 0;


/*
 * The same QR may remain in front of the camera
 * for multiple camera frames.
 */
const DUPLICATE_SCAN_INTERVAL = 350;


/* ---------------------------------------------------------
   Server
   --------------------------------------------------------- */

/*
 * The webpage and Python API are hosted by the
 * same Render service.
 *
 * Example:
 *
 * https://useless-project-receiver.onrender.com
 *
 * Therefore we simply use the current origin.
 */

function getServerUrl() {

    return window.location.origin;
}


/* ---------------------------------------------------------
   UI helpers
   --------------------------------------------------------- */

function setConnectionStatus(
    message,
    connected
) {

    if (!connectionStatus) {
        return;
    }

    connectionStatus.textContent =
        message;

    connectionStatus.classList.toggle(
        "connected",
        connected
    );

    connectionStatus.classList.toggle(
        "disconnected",
        !connected
    );
}


function setTransferStatus(
    message,
    type = "waiting"
) {

    if (!transferStatus) {
        return;
    }

    transferStatus.textContent =
        message;

    transferStatus.className =
        `status ${type}`;
}


function showError(message) {

    if (!errorMessage) {
        return;
    }

    errorMessage.textContent =
        message;

    errorMessage.classList.remove(
        "hidden"
    );
}


function clearError() {

    if (!errorMessage) {
        return;
    }

    errorMessage.textContent =
        "";

    errorMessage.classList.add(
        "hidden"
    );
}


function updateProgress(
    received,
    total
) {

    const safeTotal =
        Number(total) || 0;

    const safeReceived =
        Number(received) || 0;

    const percent =
        safeTotal > 0
            ? Math.min(
                100,
                (safeReceived / safeTotal) * 100
            )
            : 0;

    if (progressElement) {

        progressElement.style.width =
            `${percent}%`;
    }

    if (progressText) {

        progressText.textContent =
            `${percent.toFixed(1)}%`;
    }

    if (frameCountElement) {

        frameCountElement.textContent =
            `${safeReceived} / ${safeTotal}`;
    }
}


/* ---------------------------------------------------------
   Load ZXing
   --------------------------------------------------------- */

async function loadZXing() {

    if (zxingLoaded) {
        return;
    }

    if (
        window.ZXingBrowser &&
        window.ZXingBrowser.BrowserQRCodeReader
    ) {

        zxingLoaded = true;

        return;
    }

    await new Promise(
        (resolve, reject) => {

            const existingScript =
                document.querySelector(
                    'script[data-zxing="true"]'
                );

            if (existingScript) {

                existingScript.addEventListener(
                    "load",
                    resolve,
                    { once: true }
                );

                existingScript.addEventListener(
                    "error",
                    reject,
                    { once: true }
                );

                return;
            }

            const script =
                document.createElement(
                    "script"
                );

            script.src =
                ZXING_URL;

            script.async =
                true;

            script.dataset.zxing =
                "true";

            script.onload =
                resolve;

            script.onerror =
                () => {

                    reject(
                        new Error(
                            "Unable to load ZXing QR decoder."
                        )
                    );
                };

            document.head.appendChild(
                script
            );
        }
    );

    if (
        !window.ZXingBrowser ||
        !window.ZXingBrowser.BrowserQRCodeReader
    ) {

        throw new Error(
            "ZXing loaded, but BrowserQRCodeReader is unavailable."
        );
    }

    zxingLoaded = true;
}


/* ---------------------------------------------------------
   Camera
   --------------------------------------------------------- */

async function startCamera() {

    clearError();

    if (scanning) {
        return;
    }

    try {

        await loadZXing();

        cameraMessage.textContent =
            "Starting camera...";

        /*
         * ZXing handles the camera stream itself.
         *
         * The browser receives the camera permission
         * request here.
         */

        codeReader =
            new window.ZXingBrowser
                .BrowserQRCodeReader();

        /*
         * Stop any previous scanner.
         */

        if (scannerControls) {

            scannerControls.stop();

            scannerControls =
                null;
        }

        /*
         * Start continuous QR decoding.
         *
         * Passing null lets ZXing choose an available
         * camera while preferring the environment camera.
         */

        scannerControls =
            await codeReader
                .decodeFromConstraints(
                    {
                        video: {
                            facingMode: {
                                ideal: "environment"
                            },
                            width: {
                                ideal: 1920
                            },
                            height: {
                                ideal: 1080
                            }
                        },
                        audio: false
                    },
                    camera,
                    handleZXingResult
                );

        scanning = true;

        startCameraButton.disabled =
            true;

        stopCameraButton.disabled =
            false;

        setConnectionStatus(
            "Receiver ready",
            true
        );

        setTransferStatus(
            "Scanning for QR...",
            "receiving"
        );

        cameraMessage.textContent =
            "Scanning for QR codes...";

    } catch (error) {

        stopCamera();

        showError(
            getCameraErrorMessage(
                error
            )
        );

        cameraMessage.textContent =
            "Camera unavailable";
    }
}


/* ---------------------------------------------------------
   ZXing result callback
   --------------------------------------------------------- */

function handleZXingResult(
    result,
    error
) {

    if (!scanning && scannerControls) {
        /*
         * The first callback may happen immediately
         * while the scanner is being initialized.
         *
         * Allow it.
         */
    }

    /*
     * No QR found in this camera frame.
     *
     * ZXing reports this frequently while scanning.
     * Do not show it as an error.
     */

    if (!result) {
        return;
    }

    try {

        const bytes =
            qrResultToBytes(
                result
            );

        if (
            !bytes ||
            bytes.length === 0
        ) {

            cameraMessage.textContent =
                "QR detected, but no binary payload found.";

            return;
        }

        /*
         * Protocol V1:
         *
         * 0x00 = METADATA
         * 0x01 = DATA
         * 0x02 = END
         */

        const frameType =
            bytes[0];

        if (
            frameType !== 0x00 &&
            frameType !== 0x01 &&
            frameType !== 0x02
        ) {

            cameraMessage.textContent =
                `QR decoded (${bytes.length} bytes), `
                + "unknown protocol frame.";

            return;
        }

        cameraMessage.textContent =
            `QR FOUND — ${bytes.length} bytes`;

        handleQRCodeBytes(
            bytes
        );

    } catch (decodeError) {

        console.error(
            "QR result processing error:",
            decodeError
        );
    }
}


/* ---------------------------------------------------------
   Extract original QR byte payload
   --------------------------------------------------------- */

function qrResultToBytes(result) {

    if (!result) {
        return null;
    }

    /*
     * ZXing stores QR BYTE mode segments in
     * ResultMetadataType.BYTE_SEGMENTS.
     *
     * The Sender explicitly uses QR byte mode,
     * so these are the bytes we need.
     */

    if (
        typeof result.getResultMetadata ===
        "function"
    ) {

        const metadata =
            result.getResultMetadata();

        if (metadata) {

            /*
             * ResultMetadataType.BYTE_SEGMENTS
             * is enum value 2 in ZXing.
             */

            let segments = null;

            if (
                typeof metadata.get ===
                "function"
            ) {

                segments =
                    metadata.get(2);

            } else if (
                metadata instanceof Map
            ) {

                segments =
                    metadata.get(2);

            } else if (
                metadata[2]
            ) {

                segments =
                    metadata[2];
            }

            if (
                Array.isArray(
                    segments
                ) &&
                segments.length > 0
            ) {

                return combineByteSegments(
                    segments
                );
            }
        }
    }

    /*
     * Some ZXing builds expose raw bytes directly.
     *
     * Keep this as a fallback.
     */

    if (
        typeof result.getRawBytes ===
        "function"
    ) {

        const raw =
            result.getRawBytes();

        if (raw && raw.length > 0) {

            return new Uint8Array(
                raw
            );
        }
    }

    /*
     * Older builds may expose rawBytes
     * as a property.
     */

    if (
        result.rawBytes &&
        result.rawBytes.length > 0
    ) {

        return new Uint8Array(
            result.rawBytes
        );
    }

    return null;
}


/* ---------------------------------------------------------
   Combine QR byte segments
   --------------------------------------------------------- */

function combineByteSegments(
    segments
) {

    let totalLength = 0;

    for (
        const segment
        of segments
    ) {

        if (
            segment &&
            segment.length
        ) {

            totalLength +=
                segment.length;
        }
    }

    if (totalLength === 0) {
        return null;
    }

    const combined =
        new Uint8Array(
            totalLength
        );

    let offset = 0;

    for (
        const segment
        of segments
    ) {

        if (
            !segment ||
            !segment.length
        ) {

            continue;
        }

        const bytes =
            segment instanceof Uint8Array
                ? segment
                : new Uint8Array(
                    segment
                );

        combined.set(
            bytes,
            offset
        );

        offset +=
            bytes.length;
    }

    return combined;
}


/* ---------------------------------------------------------
   Process QR bytes
   --------------------------------------------------------- */

function handleQRCodeBytes(
    bytes
) {

    const fingerprint =
        payloadFingerprint(
            bytes
        );

    const now =
        performance.now();

    /*
     * Do not repeatedly POST the same visible QR.
     */

    if (
        fingerprint === lastPayloadKey &&
        now - lastPayloadTime <
            DUPLICATE_SCAN_INTERVAL
    ) {

        return;
    }

    lastPayloadKey =
        fingerprint;

    lastPayloadTime =
        now;

    sendFrame(
        bytes
    );
}


/* ---------------------------------------------------------
   Payload fingerprint
   --------------------------------------------------------- */

function payloadFingerprint(
    bytes
) {

    let hash =
        2166136261;

    for (
        let i = 0;
        i < bytes.length;
        i++
    ) {

        hash ^= bytes[i];

        hash =
            Math.imul(
                hash,
                16777619
            );
    }

    return (
        hash >>> 0
    ).toString(16);
}


/* ---------------------------------------------------------
   Send frame to Python Receiver
   --------------------------------------------------------- */

async function sendFrame(
    bytes
) {

    try {

        const response =
            await fetch(
                `${getServerUrl()}/frame`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/octet-stream"
                    },

                    body: bytes,

                    cache: "no-store"
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                `HTTP ${response.status}`
            );
        }

        applyFrameResult(
            result
        );

        cameraMessage.textContent =
            `FRAME RECEIVED — ${bytes.length} bytes`;

    } catch (error) {

        console.error(
            "Frame send failed:",
            error
        );

        showError(
            `Frame send failed: ${error.message}`
        );

        cameraMessage.textContent =
            "QR decoded, but frame could not be sent.";
    }
}


/* ---------------------------------------------------------
   Apply server frame result
   --------------------------------------------------------- */

function applyFrameResult(
    result
) {

    if (!result) {
        return;
    }

    if (
        result.type ===
        "METADATA"
    ) {

        sessionIdElement.textContent =
            result.session_id ??
            "—";

        fileNameElement.textContent =
            result.filename ??
            "—";

        updateProgress(
            0,
            result.total_frames
        );

        duplicateCountElement.textContent =
            "0";

        setTransferStatus(
            "Metadata received",
            "receiving"
        );

        return;
    }


    if (
        result.type ===
        "DATA"
    ) {

        if (
            result.session_id !==
            undefined
        ) {

            sessionIdElement.textContent =
                result.session_id;
        }

        updateProgress(
            result.received_frames,
            result.total_frames
        );

        duplicateCountElement.textContent =
            result.duplicate_frames ??
            0;

        setTransferStatus(
            result.complete
                ? "All data frames received"
                : "Receiving data...",
            "receiving"
        );

        return;
    }


    if (
        result.type === "END" &&
        result.complete
    ) {

        showCompletion(
            result
        );
    }
}


/* ---------------------------------------------------------
   Status polling
   --------------------------------------------------------- */

async function refreshStatus() {

    try {

        const response =
            await fetch(
                `${getServerUrl()}/status`,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            return;
        }

        const status =
            await response.json();

        applyStatus(
            status
        );

    } catch (error) {

        /*
         * Do not spam the UI while the server
         * is temporarily unavailable.
         */

        console.warn(
            "Status request failed:",
            error
        );
    }
}


function applyStatus(
    status
) {

    if (!status) {
        return;
    }

    if (
        status.session_id !==
            undefined &&
        status.session_id !== null
    ) {

        sessionIdElement.textContent =
            status.session_id;
    }

    if (status.filename) {

        fileNameElement.textContent =
            status.filename;
    }

    updateProgress(
        status.received_frames,
        status.total_frames
    );

    duplicateCountElement.textContent =
        status.duplicate_frames ??
        0;

    if (status.completed) {

        showCompletion(
            status
        );

    } else if (
        status.session_active
    ) {

        setTransferStatus(
            "Receiving...",
            "receiving"
        );
    }
}


/* ---------------------------------------------------------
   Completion
   --------------------------------------------------------- */

function showCompletion(
    result
) {

    if (resultCard) {

        resultCard.classList.remove(
            "hidden"
        );
    }

    if (resultFileName) {

        resultFileName.textContent =
            result.filename
            || fileNameElement.textContent
            || "received_file";
    }

    if (verificationStatus) {

        verificationStatus.textContent =
            result.verified
                ? "✓ VERIFIED"
                : "Verification pending";
    }

    setTransferStatus(
        result.verified
            ? "Transfer complete — SHA-256 verified"
            : "Transfer complete",
        result.verified
            ? "complete"
            : "waiting"
    );

    /*
     * Download support will be connected once
     * the Receiver API exposes the generated file.
     */

    if (downloadButton) {

        downloadButton.classList.add(
            "hidden"
        );
    }
}


/* ---------------------------------------------------------
   Camera error messages
   --------------------------------------------------------- */

function getCameraErrorMessage(
    error
) {

    if (!error) {

        return (
            "Unable to start the camera."
        );
    }

    if (
        error.name ===
        "NotAllowedError"
    ) {

        return (
            "Camera permission was denied. "
            + "Allow camera access and try again."
        );
    }

    if (
        error.name ===
        "NotFoundError"
    ) {

        return (
            "No camera was found on this device."
        );
    }

    if (
        error.name ===
        "NotReadableError"
    ) {

        return (
            "The camera is already being used "
            + "by another application."
        );
    }

    if (
        error.name ===
        "SecurityError"
    ) {

        return (
            "Camera access requires HTTPS."
        );
    }

    return (
        `Camera error: ${
            error.message ||
            error.name ||
            "unknown error"
        }`
    );
}


/* ---------------------------------------------------------
   Stop camera
   --------------------------------------------------------- */

function stopCamera() {

    scanning = false;

    if (scannerControls) {

        try {

            scannerControls.stop();

        } catch (error) {

            console.warn(
                "Scanner stop error:",
                error
            );
        }

        scannerControls =
            null;
    }

    if (codeReader) {

        try {

            if (
                typeof codeReader.reset ===
                "function"
            ) {

                codeReader.reset();
            }

        } catch (error) {

            console.warn(
                "ZXing reset error:",
                error
            );
        }
    }

    startCameraButton.disabled =
        false;

    stopCameraButton.disabled =
        true;

    if (cameraMessage) {

        cameraMessage.textContent =
            "Camera stopped";
    }
}


/* ---------------------------------------------------------
   Reset Receiver
   --------------------------------------------------------- */

async function resetReceiver() {

    clearError();

    try {

        stopCamera();

        const response =
            await fetch(
                `${getServerUrl()}/reset`,
                {
                    method: "POST",
                    cache: "no-store"
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                `HTTP ${response.status}`
            );
        }

        lastPayloadKey =
            null;

        lastPayloadTime =
            0;

        if (sessionIdElement) {

            sessionIdElement.textContent =
                "—";
        }

        if (fileNameElement) {

            fileNameElement.textContent =
                "—";
        }

        if (frameCountElement) {

            frameCountElement.textContent =
                "0 / 0";
        }

        if (duplicateCountElement) {

            duplicateCountElement.textContent =
                "0";
        }

        if (progressElement) {

            progressElement.style.width =
                "0%";
        }

        if (progressText) {

            progressText.textContent =
                "0%";
        }

        if (resultCard) {

            resultCard.classList.add(
                "hidden"
            );
        }

        setTransferStatus(
            "Ready",
            "waiting"
        );

        cameraMessage.textContent =
            "Camera stopped";

    } catch (error) {

        showError(
            `Reset failed: ${error.message}`
        );
    }
}


/* ---------------------------------------------------------
   Button events
   --------------------------------------------------------- */

if (startCameraButton) {

    startCameraButton.addEventListener(
        "click",
        startCamera
    );
}


if (stopCameraButton) {

    stopCameraButton.addEventListener(
        "click",
        stopCamera
    );
}


if (resetButton) {

    resetButton.addEventListener(
        "click",
        resetReceiver
    );
}


/* ---------------------------------------------------------
   Initial state
   --------------------------------------------------------- */

setConnectionStatus(
    "Receiver ready",
    true
);

setTransferStatus(
    "Ready to scan",
    "waiting"
);

if (stopCameraButton) {

    stopCameraButton.disabled =
        true;
}


/*
 * Poll the Python receiver periodically.
 *
 * This keeps the UI synchronized even if a frame
 * was processed immediately before a browser update.
 */

setInterval(
    refreshStatus,
    1000
);

refreshStatus();