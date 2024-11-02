// content.js

function createOverlay(distractingSites) {
  // Check if the overlay already exists
  if (document.getElementById("productive-overlay")) return;

  // Rest of the CSS styles remain the same...
  const style = document.createElement("style");
  style.innerHTML = `
    #productive-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    }

    #productive-overlay .overlay-content {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 600px;
      width: 80%;
      text-align: center;
      color: #333;
      position: relative;
    }

    #productive-overlay #close-overlay {
      position: absolute;
      padding: 10px 20px;
      font-size: 18px;
      background-color: #176B87;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: transform 0.3s ease;
    }

    #productive-overlay .game-container {
      margin-top: 20px;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    #productive-overlay .target-text {
      font-size: 18px;
      margin-bottom: 15px;
      color: #444;
      line-height: 1.5;
    }

    #productive-overlay .input-area {
      width: 100%;
      padding: 10px;
      margin-top: 10px;
      border: 2px solid #176B87;
      border-radius: 5px;
      font-size: 16px;
    }

    #productive-overlay .error-text {
      color: #ff0000;
      margin-top: 10px;
    }

    #productive-overlay .success-text {
      color: #008000;
      margin-top: 10px;
    }

    #check-button {
      margin-top: 15px;
      padding: 10px 20px;
      font-size: 16px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    #check-button:hover {
      background-color: #218838;
    }
  `;
  document.head.appendChild(style);

  // List of challenging sentences remains the same...
  const sentences = [
    "The quick brown fox jumps over the lazy dog while contemplating quantum physics.",
    "In a parallel universe, purple elephants dance tango under moonlit skyscrapers.",
    "Procrastination is the art of keeping up with yesterday's responsibilities tomorrow.",
    "Seven silly scientists studied seriously, sustaining substantial strain surprisingly.",
    "Efficiency is doing things right, effectiveness is doing the right things at the right time.",
    "Before you criticize someone, walk a mile in their shoes, then you'll be a mile away.",
    "Life is what happens while you're busy making other plans for productivity.",
    "The early bird might get the worm, but the second mouse gets the cheese.",
    "If you think adventure is dangerous, try routine; it is lethal to productivity.",
    "Sometimes I feel like I am diagonally parked in a parallel universe."
  ];

  // Choose a random sentence
  const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];

  // Create the overlay div with the same content...
  const overlay = document.createElement("div");
  overlay.id = "productive-overlay";
  overlay.innerHTML = `
    <div class="overlay-content">
      <button id="close-overlay">Close</button>
      <h2>ബാ പിന്നെ പഠിക്കാം</h2>
      <div class="game-container">
        <div class="target-text">${randomSentence}</div>
        <textarea class="input-area" placeholder="Type the sentence here..." rows="3"></textarea>
        <button id="check-button">Check Sentence</button>
        <div class="error-text"></div>
        <div class="success-text"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const closeButton = document.getElementById("close-overlay");
  const overlayDiv = document.getElementById("productive-overlay");
  const inputArea = overlay.querySelector('.input-area');
  const errorText = overlay.querySelector('.error-text');
  const successText = overlay.querySelector('.success-text');
  const checkButton = overlay.querySelector('#check-button');

  // Fixed redirectToRandomSite function
  function redirectToRandomSite() {
    if (distractingSites && distractingSites.length > 0) {
      const randomSite = distractingSites[Math.floor(Math.random() * distractingSites.length)];
      // Ensure URL has proper protocol and format
      const url = randomSite.startsWith('http') ? randomSite : `https://${randomSite}`;
      window.location.href = url;
    } else {
      errorText.textContent = "No distracting sites configured. Configure some in extension settings!";
    }
  }

  // Rest of the functions remain the same...
  function checkSentence() {
    const userInput = inputArea.value.trim();
    if (userInput === randomSentence) {
      successText.textContent = "Okay , എന്നാ പഠിച്ചോ ";
      errorText.textContent = "";
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
      }, 2000);
    } else {
      errorText.textContent = "wrong മച്ചു";
      successText.textContent = "";
      const differences = [];
      for (let i = 0; i < Math.max(userInput.length, randomSentence.length); i++) {
        if (userInput[i] !== randomSentence[i]) {
          differences.push(i);
        }
      }
      if (differences.length > 0) {
        errorText.textContent += ` Check character position ${differences[0] + 1}.`;
      }
    }
  }

  inputArea.addEventListener('paste', (e) => {
    e.preventDefault();
    errorText.textContent = "copy-paste ഒന്നും നടക്കൂലേ മോനെ";
  });

  checkButton.addEventListener('click', checkSentence);

  inputArea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      checkSentence();
    }
  });

  function moveButton() {
    const overlayContent = overlay.querySelector('.overlay-content');
    const contentRect = overlayContent.getBoundingClientRect();
    const buttonRect = closeButton.getBoundingClientRect();

    const maxX = contentRect.width - buttonRect.width - 20;
    const maxY = contentRect.height - buttonRect.height - 20;

    const randomX = Math.max(0, Math.min(maxX, Math.floor(Math.random() * maxX)));
    const randomY = Math.max(0, Math.min(maxY, Math.floor(Math.random() * maxY)));

    closeButton.style.transform = `translate(${randomX}px, ${randomY}px)`;
  }

  const overlayContent = overlay.querySelector('.overlay-content');
  overlayContent.addEventListener("mousemove", (e) => {
    const buttonRect = closeButton.getBoundingClientRect();
    const distance = Math.hypot(
      e.clientX - (buttonRect.left + buttonRect.width / 2),
      e.clientY - (buttonRect.top + buttonRect.height / 2)
    );

    if (distance < 100) {
      moveButton();
    }
  });

  moveButton();

  closeButton.addEventListener("click", () => {
    overlay.remove();
    document.body.style.overflow = '';
    redirectToRandomSite();
  });

  setInterval(moveButton, 2000);
}

// Updated checkSiteType function with proper error handling
function checkSiteType() {
  const currentUrl = window.location.href;

  // First check if we have storage permission
  chrome.storage.sync.get(['productiveSites', 'distractingSites'], (data) => {
    if (chrome.runtime.lastError) {
      console.error('Storage permission error:', chrome.runtime.lastError);
      return;
    }

    const productiveSites = data.productiveSites || [];
    const distractingSites = data.distractingSites || [];

    // Normalize URLs for comparison
    const normalizedCurrentUrl = new URL(currentUrl).hostname.replace('www.', '');
    
    const isProductiveSite = productiveSites.some(site => {
      const normalizedSite = site.replace('www.', '').replace('http://', '').replace('https://', '');
      return normalizedCurrentUrl.includes(normalizedSite);
    });

    const isDistractingSite = distractingSites.some(site => {
      const normalizedSite = site.replace('www.', '').replace('http://', '').replace('https://', '');
      return normalizedCurrentUrl.includes(normalizedSite);
    });

    if (isProductiveSite) {
      createOverlay(distractingSites);
    }

    if (isDistractingSite) {
      alert("You are on a distracting site!");
    }
  });
}

// Ensure storage permission is present in manifest.json
window.addEventListener('load', checkSiteType);