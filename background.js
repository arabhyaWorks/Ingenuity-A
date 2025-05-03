chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'newCaption') {
    chrome.runtime.sendMessage({ type: 'addLog', message: 'Sending caption to TTS API' });
    generateTTS(message.caption);
    sendResponse({ status: 'TTS processing started' });
  } else if (message.type === 'addLog') {
    chrome.runtime.sendMessage({ type: 'addLog', message: message.message });
  }
});

// async function generateTTS(text) {
//   console.log('Starting TTS generation for text:', text);
//   const apiKey = 'cfe1250e-0f42-4e80-9064-e5f5c7864709';
//   const url = 'https://api.sarvam.ai/text-to-speech';
//   const payload = {
//     inputs: [text],
//     target_language_code: 'en-IN',
//     speaker: 'meera',
//     pitch: 0,
//     pace: 1.0,
//     loudness: 1.0,
//     speech_sample_rate: 8000,
//     enable_preprocessing: false,
//     model: 'bulbul:v1'
//   };
//   console.log('Request payload:', payload);

//   try {
//     console.log('Sending request to:', url);
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'API-Subscription-Key': apiKey
//       },
//       body: JSON.stringify(payload)
//     });
//     console.log('Response status:', response.status, response.statusText);

//     if (!response.ok) {
//       throw new Error('API request failed');
//     }

//     const data = await response.json();
//     console.log('Response data:', data);
//     const audioContent = data.audios[0];
//     console.log('Audio content extracted:', audioContent.substring(0, 50) + '...');
//     chrome.runtime.sendMessage({ type: 'addLog', message: 'Received TTS response' });

//     // Send audio to content script
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       chrome.tabs.sendMessage(tabs[0].id, { type: 'playAudio', audioContent });
//     });
//   } catch (error) {
//     console.error('TTS Error:', error);
//     chrome.runtime.sendMessage({ type: 'addLog', message: 'TTS API error: ' + error.message });
//   }
// }

async function generateTTS(text) {
  console.log('Starting TTS generation for text:', text);
  const apiKey = 'G1PL5w8C4R-YZHUK3JuNGbNZzLPwaNrhxjmGOtfuUQahFpdyfURwbsgyVYNx5vc-';
  const url = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
  const payload = {
    pipelineTasks: [
      {
        taskType: 'translation',
        config: {
          language: {
            sourceLanguage: 'en',
            targetLanguage: 'hi'
          },
          serviceId: 'ai4bharat/indictrans-v2-all-gpu--t4'
        }
      },
      {
        taskType: 'tts',
        config: {
          language: {
            sourceLanguage: 'hi'
          },
          serviceId: 'ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4',
          gender: 'male',
          samplingRate: 192000
        }
      }
    ],
    inputData: {
      input: [
        {
          source: text
        }
      ]
    }
  };
  console.log('Request payload:', payload);

  try {
    console.log('Sending request to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
        'Authorization': apiKey
      },
      body: JSON.stringify(payload)
    });
    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    console.log('Response data:', data);
    const audioContent = data.pipelineResponse[1].audio[0].audioContent;
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
  audio.playbackRate = 3; // Set playback speed to 1.5x
  audio.play().catch((error) => {
    console.error('Audio playback error:', error);
    chrome.runtime.sendMessage({ type: 'addLog', message: 'Audio playback error' });
  });
  chrome.runtime.sendMessage({ type: 'addLog', message: 'Playing TTS audio at 1.5x speed' });
}

// In background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'newCaptionsBatch') {
    message.captions.forEach(async (caption) => {
      const audioContent = await generateTTS(caption.text); // Your TTS generation logic
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'playAudio',
        audioContent: audioContent,
        startTime: caption.startTime
      });
    });
  }
});

