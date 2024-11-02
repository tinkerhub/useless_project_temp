// options.js

// Helper function to update the display of the site lists
function updateSiteList(type, listId) {
  chrome.storage.sync.get([type], (result) => {
    const list = result[type] || [];
    const listElement = document.getElementById(listId);
    listElement.innerHTML = '';
    list.forEach((site, index) => {
      const listItem = document.createElement('li');
      listItem.className = 'flex justify-between items-center bg-white bg-opacity-30 p-2 rounded-md';
      listItem.textContent = site;

      // Add remove button
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.className = 'bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md';
      removeButton.onclick = () => removeSite(type, index);
      listItem.appendChild(removeButton);

      listElement.appendChild(listItem);
    });
  });
}

// Function to add a new site
function addSite(type, inputId, listId) {
  const inputElement = document.getElementById(inputId);
  const site = inputElement.value.trim();
  if (site) {
    chrome.storage.sync.get([type], (result) => {
      const sites = result[type] || [];
      sites.push(site);
      chrome.storage.sync.set({ [type]: sites }, () => {
        updateSiteList(type, listId);
        inputElement.value = '';
      });
    });
  }
}

// Function to remove a site
function removeSite(type, index) {
  chrome.storage.sync.get([type], (result) => {
    const sites = result[type] || [];
    sites.splice(index, 1);
    chrome.storage.sync.set({ [type]: sites }, () => {
      updateSiteList(type, type === 'productiveSites' ? 'productiveList' : 'distractingList');
    });
  });
}

// Event listeners for adding sites
document.getElementById('addProductive').addEventListener('click', () => addSite('productiveSites', 'productiveInput', 'productiveList'));
document.getElementById('addDistracting').addEventListener('click', () => addSite('distractingSites', 'distractingInput', 'distractingList'));

// Initialize lists on load
updateSiteList('productiveSites', 'productiveList');
updateSiteList('distractingSites', 'distractingList');
