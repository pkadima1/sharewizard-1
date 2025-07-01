const testData = {
  "contents": [{
    "parts": [{
      "text": "Generate a simple JSON object with the key 'test' and value 'success'"
    }]
  }],
  "generationConfig": {
    "temperature": 0.6,
    "topK": 40,
    "topP": 0.9,
    "maxOutputTokens": 3000,
    "responseMimeType": "application/json"
  }
};

const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': 'AIzaSyCpR4uDO8BCX4N_ujo3-ifhNmqNtddrMV4'
  },
  body: JSON.stringify(testData)
});

const result = await response.json();
console.log('Response status:', response.status);
console.log('Response:', JSON.stringify(result, null, 2));
