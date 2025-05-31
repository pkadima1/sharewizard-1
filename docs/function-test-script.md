# Firebase Cloud Function Integration Test Script

## Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project configured
- Development environment set up
- Firebase emulators installed (for local testing)

## Local Testing with Emulators

1. Start the Firebase emulators:
```bash
firebase emulators:start
```

2. Run the application in development mode:
```bash
npm run dev
```

3. Create a test user account for testing
4. Navigate through the wizard steps to reach Step 6
5. Fill out all required fields with test data
6. Click the Generate button and observe the behavior

## Test Cases

### 1. Basic Generation Flow

**Test Data:**
```javascript
const testData = {
  topic: "Effective Digital Marketing Strategies",
  audience: "Small Business Owners",
  industry: "E-commerce",
  contentTone: "professional",
  contentType: "blog-article",
  structureFormat: "intro-points-cta",
  wordCount: 1000,
  keywords: ["digital marketing", "small business", "ROI", "social media"],
  optimizedTitle: "10 Effective Digital Marketing Strategies for Small E-commerce Businesses",
  includeImages: true,
  outputFormat: "markdown"
};
```

**Expected Behavior:**
- Progress indicator should advance from 0% to 100%
- Generation stage should transition from "outline" to "content" to "complete"
- Upon completion, the user should be redirected to the dashboard
- Success toast should appear

### 2. Error Handling

**Simulate Error:**
Modify the Cloud Function temporarily to throw an error by adding this code at the beginning:

```javascript
// Add this near the start of the function to simulate an error
throw new HttpsError("internal", "Simulated error for testing");
```

**Expected Behavior:**
- Error alert should appear with the error message
- Retry button should be visible
- When retry is clicked, the generation process should restart

### 3. Insufficient Credits

**Simulate Condition:**
Modify the checkUsageLimits function to return:

```javascript
return {
  hasUsage: false,
  error: "limit_reached",
  message: "You've used all available requests. Upgrade to continue.",
  requestsRemaining: 0,
  planType: "free"
};
```

**Expected Behavior:**
- Generation should fail with appropriate error message
- User should be prompted to upgrade

## Production Testing

### 1. Live Function Performance

- Monitor function execution time in Firebase Console
- Verify that progress indicators in the UI roughly match actual function progress
- Check for any timeout issues with larger content requests

### 2. Error Tracking

- Set up error monitoring with Firebase Performance Monitoring
- Track common error patterns and adjust error handling accordingly

## Integration Checklist

- [ ] All required inputs are properly validated
- [ ] Progress indicators provide a good user experience
- [ ] Error messages are clear and actionable
- [ ] Successful generation redirects to the dashboard
- [ ] Function timeout is properly handled
- [ ] User is informed about generation costs before starting
- [ ] Content generation results are properly stored in Firestore
- [ ] User's credit balance is correctly updated after generation
