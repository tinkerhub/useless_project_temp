chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRIGGER_DISTRACTION') {
    // Before creating the overlay, ensure that distractions are enabled
    chrome.storage.sync.get(['enabled'], (result) => {
      if (result.enabled) {
        createOverlay();
      }
    });
  }
});

// Function to create the overlay
function createOverlay() {
  // Check if the overlay already exists
  if (document.getElementById("productive-overlay")) return;

  // Create the overlay div
  const overlay = document.createElement("div");
  overlay.id = "productive-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.zIndex = "10000";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.color = "white";
  overlay.style.fontSize = "24px";
  overlay.style.textAlign = "center";

  // Message content with Tailwind classes
  overlay.innerHTML = `
    <div class="bg-gray-800 p-8 rounded-lg shadow-lg">
      <p class="text-xl mb-6">You are on a productive site! Take a break?</p>
      <button id="close-overlay" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out shadow-md">
        Close
      </button>
    </div>
  `;

  // Append overlay to body
  document.body.appendChild(overlay);

  // Close overlay button functionality
  document.getElementById("close-overlay").addEventListener("click", () => {
    overlay.remove();
    document.body.style.overflow = '';
  });

  // Prevent scrolling
  document.body.style.overflow = 'hidden';
}