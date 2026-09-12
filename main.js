/* =========================================
   QWERTYn't - MAIN APPLICATION CONTROLLER
========================================= */

// DOM Elements
const pressedKeyDisplay = document.getElementById("pressedKeyDisplay");
const mappedKeyDisplay = document.getElementById("mappedKeyDisplay");
const restartBtn = document.getElementById("restartBtn");
const resultsOverlay = document.getElementById("resultsOverlay");
const closeResultsBtn = document.getElementById("closeResultsBtn");
const resNextBtn = document.getElementById("resNextBtn");
const resCopyBtn = document.getElementById("resCopyBtn");

// Toggles
const toggleNumbersBtn = document.getElementById("toggleNumbersBtn");
const toggleSoundBtn = document.getElementById("toggleSoundBtn");
const toggleKeyboardBtn = document.getElementById("toggleKeyboardBtn");
const keyboardWrapper = document.getElementById("keyboardWrapper");

// Config state
let currentTestConfig = {
    mode: "words", // "words", "time", "quote"
    subValue: "25", // "10", "25", "50" or "15", "30", "60"
    includeNumbers: false,
    sound: true,
    showKeyboard: true
};

let isTabPressed = false;

/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    setupConfigListeners();
    setupToggleListeners();
    setupKeyboardListeners();
    setupModalListeners();

    // Start initial test
    startNewTest();
});

function startNewTest() {
    hideResultsModal();

    let count = parseInt(currentTestConfig.subValue, 10) || 25;
    if (currentTestConfig.mode === "time") {
        setTimerMode("countdown", count);
    } else {
        setTimerMode("stopwatch");
    }

    setTimerExpireCallback(() => {
        finishChallenge(false); // Time expired finish
    });

    initializeTypingTest({
        count: count,
        includeNumbers: currentTestConfig.includeNumbers,
        mode: currentTestConfig.mode
    });

    if (pressedKeyDisplay) pressedKeyDisplay.textContent = "—";
    if (mappedKeyDisplay) mappedKeyDisplay.textContent = "—";
}

/* =========================================
   CONFIG BAR HANDLERS
========================================= */

function setupConfigListeners() {
    const modeBtns = document.querySelectorAll("#modeGroup .config-btn");
    const subGroup = document.getElementById("subOptionGroup");

    modeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            modeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const mode = btn.dataset.value;
            currentTestConfig.mode = mode;

            // Update sub-options depending on mode
            if (mode === "words") {
                subGroup.innerHTML = `
                    <button class="config-btn" data-mode-type="sub" data-value="10">10</button>
                    <button class="config-btn active" data-mode-type="sub" data-value="25">25</button>
                    <button class="config-btn" data-mode-type="sub" data-value="50">50</button>
                `;
                currentTestConfig.subValue = "25";
            } else if (mode === "time") {
                subGroup.innerHTML = `
                    <button class="config-btn" data-mode-type="sub" data-value="15">15s</button>
                    <button class="config-btn active" data-mode-type="sub" data-value="30">30s</button>
                    <button class="config-btn" data-mode-type="sub" data-value="60">60s</button>
                `;
                currentTestConfig.subValue = "30";
            } else if (mode === "quote") {
                subGroup.innerHTML = `<span style="font-size:11px; color:var(--text-muted); padding:0 8px;">Random Quotes</span>`;
                currentTestConfig.subValue = "quote";
            }

            attachSubListeners();
            startNewTest();
        });
    });

    attachSubListeners();
}

function attachSubListeners() {
    const subBtns = document.querySelectorAll("#subOptionGroup .config-btn");
    subBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            subBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTestConfig.subValue = btn.dataset.value.replace("s", "");
            startNewTest();
        });
    });
}

function setupToggleListeners() {
    if (toggleNumbersBtn) {
        toggleNumbersBtn.addEventListener("click", () => {
            currentTestConfig.includeNumbers = !currentTestConfig.includeNumbers;
            toggleNumbersBtn.classList.toggle("active", currentTestConfig.includeNumbers);
            startNewTest();
        });
    }

    if (toggleSoundBtn) {
        toggleSoundBtn.addEventListener("click", () => {
            currentTestConfig.sound = !currentTestConfig.sound;
            toggleSoundBtn.classList.toggle("active", currentTestConfig.sound);
            setSoundEnabled(currentTestConfig.sound);
        });
    }

    if (toggleKeyboardBtn) {
        toggleKeyboardBtn.addEventListener("click", () => {
            currentTestConfig.showKeyboard = !currentTestConfig.showKeyboard;
            toggleKeyboardBtn.classList.toggle("active", currentTestConfig.showKeyboard);
            if (keyboardWrapper) {
                keyboardWrapper.style.display = currentTestConfig.showKeyboard ? "flex" : "none";
            }
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener("click", () => {
            startNewTest();
        });
    }
}

/* =========================================
   KEYBOARD EVENT LISTENER & REMAPPING
========================================= */

function setupKeyboardListeners() {
    document.addEventListener("keydown", function (event) {
        // Hotkey: Tab
        if (event.key === "Tab") {
            isTabPressed = true;
            return;
        }

        // Hotkey: Tab + Enter -> Quick Restart
        if (isTabPressed && event.key === "Enter") {
            event.preventDefault();
            startNewTest();
            return;
        }

        // Allow system shortcuts (Ctrl+C, Ctrl+V, Ctrl+A, F5, F12)
        if (event.ctrlKey || event.metaKey || event.key.startsWith("F")) {
            return;
        }

        // Ignore modifier keys
        if (["Shift", "Control", "Alt", "CapsLock", "Escape"].includes(event.key)) {
            if (event.key === "Escape") {
                startNewTest();
            }
            return;
        }

        // BACKSPACE
        if (event.key === "Backspace") {
            event.preventDefault();
            handleBackspaceKey();
            highlightVirtualKey("Backspace");
            updateKeyHUDDisplay("BACKSPACE", "⌫");
            return;
        }

        // REMAPPED KEY PROCESSING
        const mappedChar = getMappedCharacter(event.key, event.shiftKey);
        event.preventDefault();

        // Pass to Monkeytype engine
        processTypedCharacter(mappedChar);

        // Highlight virtual keyboard key
        highlightVirtualKeyByPhysOrMapped(event.key, mappedChar);

        // Update HUD
        const physDisplay = event.key === " " ? "SPACE" : event.key.toUpperCase();
        const mappedDisplay = mappedChar === " " ? "SPACE" : mappedChar;
        updateKeyHUDDisplay(physDisplay, mappedDisplay);
    });

    document.addEventListener("keyup", function (event) {
        if (event.key === "Tab") {
            isTabPressed = false;
        }
        unhighlightAllVirtualKeys();
    });
}

function updateKeyHUDDisplay(phys, mapped) {
    if (pressedKeyDisplay) pressedKeyDisplay.textContent = phys;
    if (mappedKeyDisplay) mappedKeyDisplay.textContent = mapped;
}

/* =========================================
   VIRTUAL KEYBOARD HIGHLIGHTING
========================================= */

function highlightVirtualKeyByPhysOrMapped(physKey, mappedChar) {
    unhighlightAllVirtualKeys();

    if (!physKey) return;
    const lowerPhys = physKey.toLowerCase();

    // Query key element by physical key dataset
    const keyEl = document.querySelector(`.key[data-phys="${lowerPhys}"]`);
    if (keyEl) {
        keyEl.classList.add("active");
    }
}

function highlightVirtualKey(keyName) {
    unhighlightAllVirtualKeys();
}

function unhighlightAllVirtualKeys() {
    const keys = document.querySelectorAll(".key");
    keys.forEach(k => k.classList.remove("active"));
}

/* =========================================
   RESULTS MODAL & CANVAS CHART
========================================= */

function setupModalListeners() {
    if (closeResultsBtn) closeResultsBtn.addEventListener("click", hideResultsModal);
    if (resNextBtn) resNextBtn.addEventListener("click", startNewTest);
    if (resCopyBtn) {
        resCopyBtn.addEventListener("click", () => {
            const stats = getStatistics();
            const text = `QWERTYn't Results:
WPM: ${Math.round(stats.wpm)} | Keyboard Trust Level: ${stats.accuracyText}
Victims: ${stats.incorrect} | Time Wasted: ${stats.timeWasted.toFixed(1)}s
Progress: ${stats.progressPercent}% | Finished: ${stats.completionText}`;

            navigator.clipboard.writeText(text).then(() => {
                resCopyBtn.innerHTML = "<span>✓</span> Copied!";
                setTimeout(() => {
                    resCopyBtn.innerHTML = "<span>📋</span> Copy Results";
                }, 2000);
            });
        });
    }
}

function showResultsModal(stats) {
    if (!resultsOverlay) return;

    document.getElementById("resWpmVal").textContent = Math.round(stats.wpm);
    document.getElementById("resRawWpmVal").textContent = Math.round(stats.rawWpm);

    // 1. Accuracy -> Keyboard Trust Level
    document.getElementById("resTrustVal").textContent = `${stats.accuracy.toFixed(1)}%`;
    document.getElementById("resTrustSub").textContent = stats.accuracyText;

    // 2. Errors -> Victims
    document.getElementById("resVictimsVal").textContent = stats.incorrect;

    // 3. Time -> Time Wasted
    document.getElementById("resTimeWastedVal").textContent = `${stats.timeWasted.toFixed(1)}s`;

    // 4. Progress -> Pointlessness Progress
    document.getElementById("resProgressVal").textContent = `${stats.progressPercent}%`;

    // 5. Completion -> You Actually Finished This?
    document.getElementById("resFinishedVal").textContent = stats.completionText.split(" ")[0];
    document.getElementById("resFinishedSub").textContent = stats.completionText;

    resultsOverlay.classList.remove("hidden");

    // Render Canvas Performance Timeline
    renderResultsCanvasChart(stats.timeline);
}

function hideResultsModal() {
    if (resultsOverlay) {
        resultsOverlay.classList.add("hidden");
    }
}

/**
 * Render smooth WPM line & Error dots chart on HTML5 Canvas
 */
function renderResultsCanvasChart(timeline) {
    const canvas = document.getElementById("resultsChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!timeline || timeline.length < 2) {
        ctx.fillStyle = "#64748b";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Complete longer tests to view performance graph", width / 2, height / 2);
        return;
    }

    const padding = 20;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const maxWpm = Math.max(...timeline.map(d => d.wpm), 40);
    const maxSec = timeline[timeline.length - 1].second || 1;

    // Draw Grid Lines
    ctx.strokeStyle = "rgba(124, 58, 237, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const y = padding + (chartH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // Draw WPM Smooth Gradient Path
    ctx.beginPath();
    timeline.forEach((pt, idx) => {
        const x = padding + (pt.second / maxSec) * chartW;
        const y = padding + chartH - (pt.wpm / maxWpm) * chartH;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(124, 58, 237, 0.35)";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset

    // Draw Error Points
    timeline.forEach(pt => {
        if (pt.errors > 0) {
            const x = padding + (pt.second / maxSec) * chartW;
            const y = padding + chartH - (pt.wpm / maxWpm) * chartH;
            ctx.fillStyle = "#e11d48";
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

window.showResultsModal = showResultsModal;
window.hideResultsModal = hideResultsModal;
