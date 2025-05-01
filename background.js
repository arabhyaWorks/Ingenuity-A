chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'newCaption') {
    chrome.runtime.sendMessage({ type: 'addLog', message: 'Sending caption to TTS API' });
    generateTTS(message.caption);
    sendResponse({ status: 'TTS processing started' });
  } else if (message.type === 'addLog') {
    chrome.runtime.sendMessage({ type: 'addLog', message: message.message });
  }
});

async function generateTTS(text) {
  console.log('Starting TTS generation for text:', text);
  const apiKey = 'cfe1250e-0f42-4e80-9064-e5f5c7864709';
  const url = 'https://api.sarvam.ai/text-to-speech';
  const payload = {
    inputs: [text],
    target_language_code: 'en-IN',
    speaker: 'meera',
    pitch: 0,
    pace: 1.0,
    loudness: 1.0,
    speech_sample_rate: 8000,
    enable_preprocessing: false,
    model: 'bulbul:v1'
  };
  console.log('Request payload:', payload);

  try {
    console.log('Sending request to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Subscription-Key': apiKey
      },
      body: JSON.stringify(payload)
    });
    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    console.log('Response data:', data);
    const audioContent = data.audios[0];
    console.log('Audio content extracted:', audioContent.substring(0, 50) + '...');
    chrome.runtime.sendMessage({ type: 'addLog', message: 'Received TTS response' });

    // Send audio to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'playAudio', audioContent });
    });
  } catch (error) {
    console.error('TTS Error:', error);
    chrome.runtime.sendMessage({ type: 'addLog', message: 'TTS API error: ' + error.message });
  }
}

function playAudio(base64Audio) {
  const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
  audio.play().catch((error) => {
    console.error('Audio playback error:', error);
    chrome.runtime.sendMessage({ type: 'addLog', message: 'Audio playback error' });
  });
  chrome.runtime.sendMessage({ type: 'addLog', message: 'Playing TTS audio' });
}

