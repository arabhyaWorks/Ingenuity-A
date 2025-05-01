let isEnabled = false;
let audioQueue = []; // Array to hold audio clips in sequence
let isPlaying = false; // Flag to track if an audio is currently playing

// Variables for debouncing and tracking captions
let captionTimeout; // Timeout ID for debouncing
let lastCaption = ''; // Store the last processed caption

// Listen for start signal from popup
window.addEventListener('message', (event) => {
  if (event.data.type === 'startIngenuity') {
    isEnabled = true;
    muteYouTubeAudio();
    enableCaptions();
    observeCaptions();
    chrome.runtime.sendMessage({ type: 'addLog', message: 'Ingenuity enabled' });
  }
});

// Function to mute YouTube audio
function muteYouTubeAudio() {
  const video = document.querySelector('video');
  if (video && isEnabled) {
    video.muted = true;
    chrome.runtime.sendMessage({ type: 'addLog', message: 'Muted YouTube audio' });
  }
}

// Function to enable captions
function enableCaptions() {
  const captionButton = document.querySelector('.ytp-subtitles-button');
  if (captionButton && isEnabled && captionButton.getAttribute('aria-pressed') === 'false') {
    captionButton.click();
    chrome.runtime.sendMessage({ type: 'addLog', message: 'Captions enabled' });
  }
}

// Observe caption changes with debouncing and duplicate checking
function observeCaptions() {
  const observer = new MutationObserver((mutations) => {
    // Clear any existing timeout to reset the debounce
    clearTimeout(captionTimeout);
    
    // Set a new timeout to process the caption after 500ms of no mutations
    captionTimeout = setTimeout(() => {
      const captionElement = document.querySelector('.ytp-caption-segment');
      if (captionElement && isEnabled) {
        const captionText = captionElement.textContent.trim();
        // Only process if the caption exists and is different from the last one
        if (captionText && captionText !== lastCaption) {
          lastCaption = captionText; // Update the last processed caption
          chrome.runtime.sendMessage({ type: 'newCaption', caption: captionText });
          chrome.runtime.sendMessage({ type: 'addLog', message: `Extracted caption: "${captionText}"` });
        }
      }
    }, 500); // 500ms debounce time; adjust if needed
  });

  const captionContainer = document.querySelector('.ytp-caption-window-container');
  if (captionContainer && isEnabled) {
    observer.observe(captionContainer, { childList: true, subtree: true });
  }
}

// Initial log when content script loads
chrome.runtime.sendMessage({ type: 'addLog', message: 'Content script loaded' });

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'playAudio') {
    console.log('Received audio content in content script:', message.audioContent.substring(0, 50) + '...');
    // Add the new audio content to the queue
    audioQueue.push(message.audioContent);
    // If no audio is currently playing, start playing the queue
    if (!isPlaying) {
      playNextAudio();
    }
  }
});

// Function to play the next audio in the queue
function playNextAudio() {
  // If the queue is empty, stop playback
  if (audioQueue.length === 0) {
    isPlaying = false;
    return;
  }

  // Set the flag to indicate an audio is playing
  isPlaying = true;
  // Get the next audio content from the queue
  const audioContent = audioQueue.shift(); // Remove and return the first item
  const audio = new Audio(`data:audio/wav;base64,${audioContent}`);

  // Play the audio and handle completion or errors
  audio.play()
    .then(() => {
      // When the audio finishes, play the next one
      audio.onended = () => {
        playNextAudio();
      };
    })
    .catch((error) => {
      console.error('Audio playback error:', error);
      chrome.runtime.sendMessage({ type: 'addLog', message: 'Audio playback error: ' + error.message });
      playNextAudio(); // Continue to the next audio even if there’s an error
    });

  // Log that the audio is playing
  chrome.runtime.sendMessage({ type: 'addLog', message: 'Playing TTS audio' });
}