// Toggle sidebar visibility
document.getElementById('toggle-btn').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
  });
  
  // Start button functionality
  document.getElementById('start-btn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          window.postMessage({ type: 'startIngenuity' }, '*');
        }
      });
    });
    addLogEntry('Ingenuity started');
  });
  
  // Function to add log entries
  function addLogEntry(message) {
    const logList = document.getElementById('log-list');
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    logList.appendChild(li);
    logList.scrollTop = logList.scrollHeight; // Auto-scroll to latest log
  }
  
  // Listen for log messages from content.js or background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'addLog') {
      addLogEntry(message.message);
    }
  });
  
  // Initial log
  addLogEntry('Popup initialized');