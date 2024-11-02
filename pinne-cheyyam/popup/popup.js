document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggle");
  const optionsLink = document.getElementById("openOptions");
  const statusText = document.getElementById("status");

  // Function to update the button and status based on the current state
  function updateUI(isEnabled) {
    if (isEnabled) {
      toggleButton.textContent = "Stop";
      toggleButton.classList.remove("bg-yellow-500", "hover:bg-yellow-600");
      toggleButton.classList.add("bg-red-500", "hover:bg-red-600");
      statusText.textContent = "Status: Enabled";
      statusText.classList.remove("text-red-600");
      statusText.classList.add("text-emerald-600");
    } else {
      toggleButton.textContent = "Start Annoying";
      toggleButton.classList.remove("bg-red-500", "hover:bg-red-600");
      toggleButton.classList.add("bg-yellow-500", "hover:bg-yellow-600");
      statusText.textContent = "Status: Disabled";
      statusText.classList.remove("text-emerald-600");
      statusText.classList.add("text-red-600");
    }
  }

  // Retrieve the current state from chrome.storage
  chrome.storage.sync.get(["enabled"], (result) => {
    const isEnabled = result.enabled || false;
    updateUI(isEnabled);
  });

  // Add click event listener to the toggle button
  toggleButton.addEventListener("click", () => {
    // Get the current state
    chrome.storage.sync.get(["enabled"], (result) => {
      const isEnabled = result.enabled || false;
      const newState = !isEnabled;

      // Save the new state to chrome.storage
      chrome.storage.sync.set({ enabled: newState }, () => {
        // Update the UI
        updateUI(newState);

        // Notify the background script about the state change
        chrome.runtime.sendMessage({
          type: "TOGGLE_ENABLED",
          enabled: newState,
        });
      });
    });
  });

  // Add click event listener to the settings link
  optionsLink.addEventListener("click", () => {
    // Opens the options page
    chrome.runtime.openOptionsPage();
  });
});
