chrome.runtime.onInstalled.addListener(() => {
  console.log('Pinne-Cheyyam Extension installed.');
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_ENABLED') {
    const isEnabled = message.enabled;
    console.log(`Distractions enabled: ${isEnabled}`);

    if (isEnabled) {
      // Start monitoring productive sites
      startMonitoring();
    } else {
      // Stop monitoring productive sites
      stopMonitoring();
    }
  }
});

// Variables to manage monitoring
let monitoringInterval = null;

// Function to start monitoring productive sites
function startMonitoring() {
  if (monitoringInterval) return; // Already monitoring

  monitoringInterval = setInterval(() => {
    monitorActiveTab();
  }, 1000); // Check every second
}

// Function to stop monitoring productive sites
function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

// Function to monitor the active tab
function monitorActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    const activeTab = tabs[0];
    const url = activeTab.url;

    // Retrieve the site lists from storage
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