document.getElementById('start').addEventListener('click', () => {
  console.log('Annoying started!');
});

document.getElementById('openOptions').addEventListener('click', () => {
  // Opens the options page
  chrome.runtime.openOptionsPage();
});