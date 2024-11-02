chrome.runtime.onInstalled.addListener(() => {
  console.log('Pinne-Cheyyam Extension installed.');
});

// Listen for messages from popup.js to toggle the monitoring state
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_ENABLED') {
    const isEnabled = message.enabled;
    console.log(`Distractions enabled: ${isEnabled}`);

    if (isEnabled) {
      startMonitoring(); // Start monitoring with random intervals
    } else {
      stopMonitoring(); // Stop monitoring
    }
  }
});

// Variable to manage the random delay interval
let monitoringInterval = null;
const MAX_DELAY_SECONDS = 30; // Set your max delay (x) in seconds here

// Function to generate a random interval in milliseconds
function getRandomInterval() {
  return Math.floor(Math.random() * MAX_DELAY_SECONDS * 1000);
}

// Function to start monitoring productive sites with a random delay
function startMonitoring() {
  if (monitoringInterval) return; // Already monitoring

  scheduleNextDistraction(); // Start the first randomized interval
}

// Function to stop monitoring
function stopMonitoring() {
  if (monitoringInterval) {
    clearTimeout(monitoringInterval);
    monitoringInterval = null;
  }
}

// Function to schedule the next distraction after a random delay
function scheduleNextDistraction() {
  if (monitoringInterval) clearTimeout(monitoringInterval);

  const delay = getRandomInterval();
  console.log(`Next distraction in ${delay / 1000} seconds`);

  monitoringInterval = setTimeout(() => {
    monitorActiveTab(); // Trigger the distraction check
    scheduleNextDistraction(); // Schedule the next one
  }, delay);
}

// Function to monitor the active tab and check if it's a productive site
function monitorActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    const activeTab = tabs[0];
    const url = activeTab.url;

    chrome.storage.sync.get(['productiveSites', 'distractingSites'], (data) => {
      const productiveSites = data.productiveSites || [];
      const distractingSites = data.distractingSites || [];

      // Check if the current URL matches any productive site
      if (productiveSites.some(site => url.includes(site))) {
        // Trigger distraction by sending a message to content.js
        chrome.tabs.sendMessage(activeTab.id, { type: 'TRIGGER_DISTRACTION' });
      }

      // Optionally, handle distracting sites if needed
      if (distractingSites.some(site => url.includes(site))) {
        console.log("You are on a distracting site!");
        // Implement any additional logic for distracting sites here
      }
    });
  });
}
