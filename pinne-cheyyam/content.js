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
    
    // Message content
    overlay.innerHTML = `
      <div>
        <p>You are on a productive site! Take a break?</p>
        <button id="close-overlay" style="
          margin-top: 20px;
          padding: 10px 20px;
          font-size: 18px;
          background-color: #176B87;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;
  
    // Append overlay to body
    document.body.appendChild(overlay);
  
    // Close overlay button functionality
    document.getElementById("close-overlay").addEventListener("click", () => {
      overlay.remove();
    });
  }
  
  function checkSiteType() {
    const currentUrl = window.location.href;
  
    // Retrieve the site lists from storage
    chrome.storage.sync.get(['productiveSites', 'distractingSites'], (data) => {
      const productiveSites = data.productiveSites || [];
      const distractingSites = data.distractingSites || [];
  
      // Check if the current URL matches any productive site
      if (productiveSites.some(site => currentUrl.includes(site))) {
        createOverlay(); // Display the overlay for productive sites
      }
  
      // Check if the current URL matches any distracting site
      if (distractingSites.some(site => currentUrl.includes(site))) {
        alert("You are on a distracting site!");
      }
    });
  }
  
  // Run the function when the page loads
  window.addEventListener('load', checkSiteType);
  