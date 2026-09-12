// Characters to use for CAPTCHA (avoiding confusing chars like I, O, 0, 1)
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// DOM Elements
const captchaDisplay = document.getElementById("captcha-display");
const captchaInput = document.getElementById("captcha-input");
const submitBtn = document.getElementById("submit-btn");
const messageArea = document.getElementById("message-area");
const progressBar = document.getElementById("progress-bar");
const frustrationPercentageDisplay = document.getElementById("frustration-percentage");
const attemptCounterDisplay = document.getElementById("attempt-counter");
const achievementDisplay = document.getElementById("achievement");
const mainCard = document.querySelector(".card");

// Matter.js setup
const Engine = Matter.Engine,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite;

let engine, world;
let ground, leftWall, rightWall;
const captchaBodies = [];

// State Variables
let currentCaptcha = "";
let frustrationLevel = 0;
let attempts = 0;
let isMaxFrustration = false;
let captchaInterval; // Store the interval so we can manage it if needed
let currentIntervalMs = 5000; // Start at 5 seconds

// Funny Messages for when CAPTCHA changes
const changeMessages = [
    "😂 CAPTCHA changed! Try again!",
    "Too slow! 😈",
    "You almost had it!",
    "Nice typing. Unfortunately, the CAPTCHA disagrees.",
    "Did you really think it would be that easy? 😂",
    "CAPTCHA says NO.",
    "Your patience is being tested.",
    "Even a robot would give up."
];

// Funny Messages for incorrect submission
const failureMessages = [
    "❌ Wrong! Did you really think it would work? 😈",
    "❌ Nope. CAPTCHA wins again.",
    "😂 So close... maybe.",
    "❌ Your confidence was impressive.",
    "🤖 CAPTCHA: 1 | Human: 0"
];

// Generate a random 5-character string
function generateCaptcha() {
    let result = "";
    for (let i = 0; i < 5; i++) {
        result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return result;
}

// Update the CAPTCHA display
function updateCaptcha() {
    // If there is an existing CAPTCHA, leave it in the background
    if (currentCaptcha) {
        const bgCaptcha = document.createElement("div");
        bgCaptcha.textContent = currentCaptcha;
        bgCaptcha.classList.add("bg-captcha");
        document.body.appendChild(bgCaptcha);
        
        // Let the browser render it to get its true dimensions
        const rect = bgCaptcha.getBoundingClientRect();
        
        // Randomly pick left or right side of the screen to drop pieces
        const isLeft = Math.random() > 0.5;
        const sideOffset = isLeft ? (window.innerWidth * 0.15) : (window.innerWidth * 0.85);
        const randomX = sideOffset + (Math.random() * 100 - 50); 
        const startY = -100; // Start above the screen
        
        // Create physics body
        const body = Bodies.rectangle(randomX, startY, rect.width, rect.height, {
            restitution: 0.1, // Less bouncy
            friction: 0.8,    // High friction to stack well
            density: 0.05
        });
        
        // Initial random rotation to make it fall interestingly
        Matter.Body.setAngle(body, (Math.random() * 60 - 30) * (Math.PI / 180));
        
        Composite.add(world, body);
        captchaBodies.push({ elem: bgCaptcha, body: body });
    }

    currentCaptcha = generateCaptcha();
    captchaDisplay.textContent = currentCaptcha;

    // Add a small shake animation by toggling the class
    captchaDisplay.classList.remove("captcha-anim");
    void captchaDisplay.offsetWidth; // Trigger reflow to restart animation
    captchaDisplay.classList.add("captcha-anim");

    // If we haven't reached max frustration, increase it slightly and show a message
    if (!isMaxFrustration && frustrationLevel > 0) {
        // We check frustrationLevel > 0 so it doesn't show a message on the very first load
        increaseFrustration(5);
        showRandomMessage(changeMessages);
    }
}

// Show a random message from an array
function showRandomMessage(messageArray) {
    if (isMaxFrustration) return; // Don't override the max frustration message
    const randomIndex = Math.floor(Math.random() * messageArray.length);
    messageArea.textContent = messageArray[randomIndex];
}

// Update Frustration Meter
function increaseFrustration(amount) {
    frustrationLevel += amount;

    // Cap at 100%
    if (frustrationLevel >= 100) {
        frustrationLevel = 100;
        triggerMaxFrustration();
    }

    // Update UI elements
    frustrationPercentageDisplay.textContent = frustrationLevel;
    progressBar.style.width = frustrationLevel + "%";
}

// Handle what happens at 100% frustration
function triggerMaxFrustration() {
    if (isMaxFrustration) return; // Prevent triggering multiple times
    isMaxFrustration = true;

    // Calculate arbitrary funny marks
    const finalMarks = attempts * -10;

    // Special messages and styles for maximum frustration
    messageArea.innerHTML = `💀 MAXIMUM FRUSTRATION ACHIEVED<br><br><span style="color: #fff;">Final Marks: ${finalMarks}</span>`;
    messageArea.style.color = "#ef4444"; // Red color

    // Add crazy CSS animation to the main card
    mainCard.classList.add("max-frustration");

    // Update achievement
    achievementDisplay.textContent = `🏆 Achievement Unlocked: Professional CAPTCHA Sufferer (Failed ${attempts} times)`;
}

// Handle Submit Button Click
function handleSubmit() {
    // Get user input and convert to uppercase to match CAPTCHA
    const userInput = captchaInput.value.trim().toUpperCase();

    // Don't do anything if empty
    if (!userInput) return;

    // Increase attempts
    attempts++;
    attemptCounterDisplay.textContent = attempts;

    if (userInput === currentCaptcha) {
        // Success case
        messageArea.textContent = "😳 YOU GOT IT?! Here's another one, but faster!";
        messageArea.style.color = "#fbbf24"; // Default warning color
        achievementDisplay.textContent = "🏆 Achievement Unlocked: CAPTCHA Survivor";

        // Change timer to 5 seconds
        currentIntervalMs = 5000;
        
        // Pop up another captcha immediately
        updateCaptcha();
        
        // Restart timer with new speed
        clearInterval(captchaInterval);
        captchaInterval = setInterval(updateCaptcha, currentIntervalMs);
    } else {
        // Failure case
        if (!isMaxFrustration) {
            showRandomMessage(failureMessages);
        }
        increaseFrustration(10); // Penalty for getting it wrong
        
        // Speed up the CAPTCHA (decrease interval) by 1 second per mistake, down to a minimum of 0.5s
        if (currentIntervalMs > 500) {
            currentIntervalMs = Math.max(500, currentIntervalMs - 1000);
            
            // Restart the timer with the new faster speed
            clearInterval(captchaInterval);
            captchaInterval = setInterval(updateCaptcha, currentIntervalMs);
        }

        // Evolve achievements based on attempts
        if (attempts === 5) {
            achievementDisplay.textContent = "🏆 Achievement Unlocked: Persistent Fool";
        } else if (attempts === 15) {
            achievementDisplay.textContent = "🏆 Achievement Unlocked: You Have Too Much Patience";
        } else if (attempts === 30) {
            achievementDisplay.textContent = "🏆 Achievement Unlocked: Please Just Stop";
        }
    }

    // Clear input field
    captchaInput.value = "";

    // Keep focus on input for better UX (and easier frustration)
    captchaInput.focus();
}

// Event Listeners
submitBtn.addEventListener("click", handleSubmit);

// Allow pressing "Enter" key to submit
captchaInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        handleSubmit();
    }
});

// Physics initialization
function initPhysics() {
    engine = Engine.create();
    world = engine.world;
    
    // Add walls and ground
    const thickness = 50;
    ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + thickness/2, window.innerWidth * 2, thickness, { isStatic: true });
    leftWall = Bodies.rectangle(-thickness/2, window.innerHeight / 2, thickness, window.innerHeight * 2, { isStatic: true });
    rightWall = Bodies.rectangle(window.innerWidth + thickness/2, window.innerHeight / 2, thickness, window.innerHeight * 2, { isStatic: true });
    
    Composite.add(world, [ground, leftWall, rightWall]);
    
    Runner.run(Runner.create(), engine);
    
    // Start rendering DOM elements to match physics bodies
    requestAnimationFrame(updateDOM);
}

function updateDOM() {
    for (let i = 0; i < captchaBodies.length; i++) {
        const item = captchaBodies[i];
        item.elem.style.left = item.body.position.x + "px";
        item.elem.style.top = item.body.position.y + "px";
        item.elem.style.transform = `translate(-50%, -50%) rotate(${item.body.angle}rad)`;
    }
    requestAnimationFrame(updateDOM);
}

// Handle window resize for physics boundaries
window.addEventListener('resize', () => {
    if (ground) {
        Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + 25 });
        Matter.Body.setPosition(rightWall, { x: window.innerWidth + 25, y: window.innerHeight / 2 });
    }
});

// Initialize Project
function init() {
    initPhysics();

    // Set initial CAPTCHA
    updateCaptcha();

    // THE CORE JOKE: Start CAPTCHA timer based on currentIntervalMs (10s initially)
    captchaInterval = setInterval(updateCaptcha, currentIntervalMs);
}

// Start everything when the page loads
window.onload = init;
