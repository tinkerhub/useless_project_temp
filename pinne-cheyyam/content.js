
// Declare randomSentence globally to maintain its value across overlay restorations
let randomSentence = "";

// Function to inject CSS styles
function injectStyles() {
  // Avoid injecting styles multiple times
  if (document.getElementById("pinnecheyyam-styles")) return;

  const style = document.createElement("style");
  style.id = "pinnecheyyam-styles";
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
      top: 10px;
      right: 10px;
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
      resize: none;
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

    /* Styles for Rickroll overlay */
    #rickroll-overlay-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: none; /* Outer container with white background */
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10001;
    }

    #rickroll-overlay-container h2 {
      margin-bottom: 20px;
      color: white;
      font-size: 32px;
      font-family: Arial, sans-serif;
    }

    #rickroll-overlay {
      width: 80%;
      height: 80%;
      background-color: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 8px;
      overflow: hidden;
    }

    #rickroll-overlay iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `;
  document.head.appendChild(style);
}

// Function to create the main productive overlay
function createOverlay(distractingSites) {
  // Check if the overlay already exists
  if (document.getElementById("productive-overlay")) return;

  // Inject necessary CSS styles for the overlay
  injectStyles();

  // List of challenging sentences
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
    "Sometimes I feel like I am diagonally parked in a parallel universe.",
    "I told my computer I needed a break, and now it won't stop showing me coffee ads.",
    "Why do software engineers never play hide and seek? Because good luck hiding from bugs.",
    "I'm on a seafood diet. I see food and I eat it.",
    "Time flies like an arrow; fruit flies like a banana.",
    "To err is human; to blame it on technology is even more so.",
    "Parallel lines have so much in common. It’s a shame they’ll never meet.",
    "My email password has been hacked again. That’s the third time I’ve had to rename the cat.",
    "I asked my computer for advice, but it just gave me a byte.",
    "Why don't some couples go to the gym? Because some relationships don't work out!",
    "I would tell you a UDP joke, but you might not get it.",
    "Artificial intelligence is no match for natural stupidity.",
    "If at first you don't succeed, redefine success.",
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "I'm reading a book on anti-gravity. It's impossible to put down!",
    "It’s hard to explain puns to kleptomaniacs because they always take things literally.",
    "Why don’t skeletons fight each other? They don’t have the guts.",
    "I'm not lazy, I'm on energy-saving mode.",
    "Why did the programmer quit his job? Because he didn't get arrays.",
    "Talk is cheap? Have you ever talked to a lawyer?",
    "I’m a big fan of whiteboards. They’re re-markable!"
];


  // Choose a random sentence and assign globally
  randomSentence = sentences[Math.floor(Math.random() * sentences.length)];

  // Create the overlay div with the content
  const overlay = document.createElement("div");
  overlay.id = "productive-overlay";
  overlay.innerHTML = `
    <div class="overlay-content">
      <button id="close-overlay" aria-label="Close Overlay">Close</button>
      <h2>അതൊക്കെ പിന്നെ ചെയ്യാം</h2>
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

  // Select elements
  const closeButton = document.getElementById("close-overlay");
  const inputArea = overlay.querySelector('.input-area');
  const errorText = overlay.querySelector('.error-text');
  const successText = overlay.querySelector('.success-text');
  const checkButton = overlay.querySelector('#check-button');

  // Attach event listeners
  closeButton.addEventListener("click", handleTryingToClose);
  checkButton.addEventListener('click', checkSentence);
  inputArea.addEventListener('paste', preventPaste);
  inputArea.addEventListener('keypress', handleKeyPress);

  // Initialize button movement functionality
  initializeMoveButton(closeButton);
}

// Function to handle closing the overlay
function handleTryingToClose() {
  // Replace the current overlay content with Rickroll embed
  const overlay = document.getElementById("productive-overlay");
  if (!overlay) return;

  overlay.innerHTML = `
    <div id="rickroll-overlay-container">
      <h2>You have been RickRolled!</h2>
      <div id="rickroll-overlay">
        <iframe 
          src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&loop=1&playlist=dQw4w9WgXcQ" 
          frameborder="0" 
          allow="autoplay; encrypted-media" 
          allowfullscreen
        ></iframe>
      </div>
    </div>
  `;

  // After the video duration (e.g., 3 minutes 33 seconds), restore the original overlay
  const videoDuration = 213000; // 213,000 milliseconds = 3 minutes 33 seconds
  setTimeout(() => {
    restoreOverlay();
  }, videoDuration);
}

// Function to restore the original overlay content
function restoreOverlay() {
  const overlay = document.getElementById("productive-overlay");
  if (!overlay) return;

  // Recreate the overlay content with the same randomSentence
  overlay.innerHTML = `
    <div class="overlay-content">
      <button id="close-overlay" aria-label="Close Overlay">Close</button>
      <h2>അതൊക്കെ പിന്നെ ചെയ്യാം</h2>
      <div class="game-container">
        <div class="target-text">${randomSentence}</div>
        <textarea class="input-area" placeholder="Type the sentence here..." rows="3"></textarea>
        <button id="check-button">Check Sentence</button>
        <div class="error-text"></div>
        <div class="success-text"></div>
      </div>
    </div>
  `;

  // Re-select elements
  const newCloseButton = document.getElementById("close-overlay");
  const newInputArea = overlay.querySelector('.input-area');
  const newErrorText = overlay.querySelector('.error-text');
  const newSuccessText = overlay.querySelector('.success-text');
  const newCheckButton = overlay.querySelector('#check-button');

  // Reattach event listeners
  newCloseButton.addEventListener("click", handleTryingToClose);
  newCheckButton.addEventListener('click', checkSentence);
  newInputArea.addEventListener('paste', preventPaste);
  newInputArea.addEventListener('keypress', handleKeyPress);

  // Reinitialize the moveButton functionality
  initializeMoveButton(newCloseButton);
}

// Function to check the sentence input
function checkSentence() {
  const overlay = document.getElementById("productive-overlay");
  if (!overlay) return;

  const inputArea = overlay.querySelector('.input-area');
  const errorText = overlay.querySelector('.error-text');
  const successText = overlay.querySelector('.success-text');

  const userInput = inputArea.value.trim();
  if (userInput === randomSentence) {
    successText.textContent = "Okay, എന്നാൽ ചെയ്തോളൂ";
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

// Function to prevent paste actions in the input area
function preventPaste(e) {
  e.preventDefault();
  const overlay = document.getElementById("productive-overlay");
  if (!overlay) return;
  const errorText = overlay.querySelector('.error-text');
  errorText.textContent = "copy-paste ഒന്നും നടക്കില്ല മോനെ";
}

// Function to handle Enter key press in the textarea
function handleKeyPress(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    checkSentence();
  }
}

// Function to move the close button slightly
function moveButton(closeButton) {
  const maxOffset = 120; // Maximum pixels to move
  const randomOffsetX = Math.floor(Math.random() * (maxOffset * 2 + 1)) - maxOffset; // -10 to +10
  const randomOffsetY = Math.floor(Math.random() * (maxOffset * 2 + 1)) - maxOffset; // -10 to +10
  closeButton.style.transform = `translate(${randomOffsetX}px, ${randomOffsetY}px)`;
}

// Initialize button movement functionality
function initializeMoveButton(closeButton) {
  const overlayContent = closeButton.parentElement;
  if (!overlayContent) return;

  overlayContent.addEventListener("mousemove", (e) => {
    const buttonRect = closeButton.getBoundingClientRect();
    const distance = Math.hypot(
      e.clientX - (buttonRect.left + buttonRect.width / 2),
      e.clientY - (buttonRect.top + buttonRect.height / 2)
    );

    if (distance < 150) {
      // 1/10 chance to not move
      if (Math.random() >= 0.2) {
        moveButton(closeButton);
      }
    }
  });

  // Move the button every 5 seconds with a 10% chance to not move
  setInterval(() => {
    if (Math.random() >= 0.2) {
      moveButton(closeButton);
    }
  }, 2000);
}

// Function to check if the current site is productive
function checkSiteType() {
  const currentUrl = window.location.href;

  // First check if we have storage permission
  chrome.storage.sync.get(['enabled', 'productiveSites', 'distractingSites'], (data) => {
    if (chrome.runtime.lastError) {
      console.error('Storage permission error:', chrome.runtime.lastError);
      return;
    }

    // If not enabled, ensure any existing overlay is removed
    if (!data.enabled) {
      removeOverlay();
      return;
    }

    const productiveSites = data.productiveSites || [];
    const distractingSites = data.distractingSites || [];

    // Normalize URLs for comparison
    const normalizedCurrentUrl = new URL(currentUrl).hostname.replace('www.', '').toLowerCase();

    const isProductiveSite = productiveSites.some(site => {
      const normalizedSite = site.replace('www.', '').replace('http://', '').replace('https://', '').toLowerCase();
      return normalizedCurrentUrl.includes(normalizedSite);
    });

    if (isProductiveSite) {
      createOverlay(distractingSites);
    } else {
      removeOverlay();
    }
  });
}

// Function to remove the overlay
function removeOverlay() {
  const overlay = document.getElementById("productive-overlay");
  if (overlay) {
    overlay.remove();
    document.body.style.overflow = '';
  }
}

// Listen for changes in storage to dynamically enable/disable the overlay
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.enabled || changes.productiveSites || changes.distractingSites)) {
    checkSiteType();
  }
});

// Initial check on page load
window.addEventListener('load', checkSiteType);

// Also check when the user navigates within the page (for single-page applications)
window.addEventListener('hashchange', checkSiteType);
window.addEventListener('popstate', checkSiteType);
