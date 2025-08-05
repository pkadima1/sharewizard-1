# 🔧 Local Firebase Functions Testing Guide

## **Overview**
This guide will help you test the Firebase Functions locally, specifically the `generateLongformContent` function with the media integration fix.

## **Prerequisites**

### **1. Install Firebase CLI (if not already installed)**
```bash
npm install -g firebase-tools
```

### **2. Login to Firebase**
```bash
firebase login
```

### **3. Install Dependencies**
```bash
# Install root dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

## **Environment Setup**

### **1. Create Environment Variables**
Create a `.env` file in the root directory:

```bash
# .env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

### **2. Set Firebase Project**
```bash
firebase use engperfecthlc
```

## **Local Testing Setup**

### **1. Build the Functions**
```bash
cd functions
npm run build
cd ..
```

### **2. Start Firebase Emulators**
```bash
firebase emulators:start
```

This will start:
- **Functions Emulator**: http://localhost:5001
- **Firestore Emulator**: http://localhost:8081
- **Emulator UI**: http://localhost:4000

## **Testing the Media Integration Fix**

### **1. Test Function Locally**

Create a test script to call the function:

```bash
# Create test script
mkdir -p test-scripts
```

### **2. Test Data Structure**

Create a test file `test-scripts/test-longform.js`:

```javascript
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase config (use your project config)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "engperfecthlc.firebaseapp.com",
  projectId: "engperfecthlc",
  storageBucket: "engperfecthlc.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Connect to local emulator
functions.useEmulator('localhost', 5001);

// Test data with media files
const testData = {
  topic: "10 Proven Marketing Strategies That Drive Real Results",
  audience: "marketing professionals",
  industry: "digital marketing",
  keywords: ["marketing strategies", "digital marketing", "ROI"],
  contentTone: "professional",
  contentType: "blog-article",
  structureFormat: "intro-points-cta",
  wordCount: 800,
  includeImages: true,
  includeStats: false,
  includeReferences: false,
  tocRequired: false,
  summaryRequired: false,
  structuredData: false,
  enableMetadataBlock: false,
  plagiarismCheck: true,
  outputFormat: "markdown",
  ctaType: "none",
  structureNotes: "",
  // Test media URLs (replace with actual Firebase Storage URLs)
  mediaUrls: [
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.appspot.com/o/test-image-1.jpg",
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.appspot.com/o/test-image-2.jpg"
  ],
  mediaCaptions: [
    "Marketing strategy visualization",
    "ROI analysis chart"
  ],
  mediaAnalysis: [
    "Image shows marketing funnel with conversion metrics",
    "Chart displays ROI comparison across different channels"
  ],
  mediaPlacementStrategy: "auto",
  targetLocation: "",
  geographicScope: "global",
  marketFocus: [],
  localSeoKeywords: [],
  culturalContext: "",
  lang: "en"
};

// Call the function
async function testLongformGeneration() {
  try {
    console.log('🚀 Testing longform content generation with media integration...');
    
    const generateLongformContent = httpsCallable(functions, 'generateLongformContent');
    
    const result = await generateLongformContent(testData);
    
    console.log('✅ Function executed successfully!');
    console.log('📊 Response:', JSON.stringify(result.data, null, 2));
    
    // Check if media URLs are included in the generated content
    const content = result.data.content;
    if (content && testData.mediaUrls.length > 0) {
      const hasMediaReferences = testData.mediaUrls.some(url => content.includes(url));
      console.log('🖼️ Media Integration Check:', hasMediaReferences ? '✅ SUCCESS' : '❌ FAILED');
      
      if (hasMediaReferences) {
        console.log('✅ Media URLs are properly integrated in the generated content!');
      } else {
        console.log('❌ Media URLs are not found in the generated content');
        console.log('🔍 Generated content preview:', content.substring(0, 500) + '...');
      }
    }
    
  } catch (error) {
    console.error('❌ Function execution failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testLongformGeneration();
```

### **3. Run the Test**

```bash
# Install dependencies for test script
npm install firebase

# Run the test
node test-scripts/test-longform.js
```

## **Manual Testing via Emulator UI**

### **1. Access Emulator UI**
Open http://localhost:4000 in your browser

### **2. Test Function Manually**
1. Go to the **Functions** tab
2. Find `generateLongformContent`
3. Click **Test function**
4. Use this test data:

```json
{
  "topic": "10 Proven Marketing Strategies That Drive Real Results",
  "audience": "marketing professionals",
  "industry": "digital marketing",
  "keywords": ["marketing strategies", "digital marketing", "ROI"],
  "contentTone": "professional",
  "contentType": "blog-article",
  "structureFormat": "intro-points-cta",
  "wordCount": 800,
  "includeImages": true,
  "includeStats": false,
  "includeReferences": false,
  "tocRequired": false,
  "summaryRequired": false,
  "structuredData": false,
  "enableMetadataBlock": false,
  "plagiarismCheck": true,
  "outputFormat": "markdown",
  "ctaType": "none",
  "structureNotes": "",
  "mediaUrls": [
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.appspot.com/o/test-image-1.jpg",
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.appspot.com/o/test-image-2.jpg"
  ],
  "mediaCaptions": [
    "Marketing strategy visualization",
    "ROI analysis chart"
  ],
  "mediaAnalysis": [
    "Image shows marketing funnel with conversion metrics",
    "Chart displays ROI comparison across different channels"
  ],
  "mediaPlacementStrategy": "auto",
  "targetLocation": "",
  "geographicScope": "global",
  "marketFocus": [],
  "localSeoKeywords": [],
  "culturalContext": "",
  "lang": "en"
}
```

## **Expected Results**

### **✅ Success Indicators:**
1. Function executes without errors
2. Generated content includes actual Firebase Storage URLs
3. Content contains proper markdown image references like:
   ```markdown
   ![Marketing strategy visualization](https://firebasestorage.googleapis.com/...)
   ```

### **❌ Failure Indicators:**
1. Function throws errors
2. Generated content contains placeholder references like:
   ```markdown
   ![Marketing strategy visualization](image-1)
   ```

## **Debugging Tips**

### **1. Check Function Logs**
In the Emulator UI, check the **Logs** tab for detailed error messages.

### **2. Verify Environment Variables**
```bash
# Check if environment variables are loaded
echo $OPENAI_API_KEY
echo $GEMINI_API_KEY
```

### **3. Test API Keys**
```bash
# Test OpenAI API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Test Gemini API key
curl -H "Authorization: Bearer $GEMINI_API_KEY" https://generativelanguage.googleapis.com/v1beta/models
```

## **Deployment After Testing**

Once local testing is successful:

```bash
# Deploy to production
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:generateLongformContent
```

## **Troubleshooting**

### **Common Issues:**

1. **"API key not found" error**
   - Ensure `.env` file exists and has correct API keys
   - Restart emulators after adding environment variables

2. **"Function not found" error**
   - Ensure function is properly exported in `functions/src/index.ts`
   - Rebuild functions: `cd functions && npm run build`

3. **"CORS error"**
   - Check that emulator is running on correct port
   - Verify function configuration in `firebase.json`

4. **"Media URLs not found in content"**
   - Check the fix in `functions/src/services/longformContent.ts`
   - Verify that `mediaUrls` array contains valid URLs

## **Next Steps**

1. **Test with real media files** uploaded to Firebase Storage
2. **Test different media placement strategies** (auto, manual, semantic)
3. **Test with various content types** and structures
4. **Monitor function performance** and optimize if needed

---

**🎯 Goal**: Verify that the media integration fix works correctly and media URLs are properly included in generated content instead of placeholder references. 