# Longform Content Generation Testing Guide

## Overview

This document provides instructions for testing the Firebase Cloud Function integration for longform content generation in the ShareWizard application. The integration allows users to generate high-quality, SEO-optimized content based on their inputs.

## Prerequisites

- Firebase account with Firestore and Cloud Functions enabled
- Proper API keys for Gemini AI and OpenAI set up in Firebase environment
- ShareWizard application running locally or deployed

## Testing Options

### Option 1: Using the Wizard Flow

The most realistic testing approach is to go through the complete wizard flow:

1. Navigate to `/longform` in the application
2. Complete all wizard steps:
   - Step 1: Define topic
   - Step 2: Set audience and industry
   - Step 3: Configure keywords and SEO title
   - Step 4: Select content structure and tone
   - Step 5: Configure media and output settings
   - Step 6: Review and generate content

This approach tests the complete user experience but requires filling out multiple forms.

### Option 2: Using the Test Component

For faster testing during development, use the dedicated test component:

1. Navigate to `/test-longform` in the application (only available in development mode)
2. The component comes pre-configured with test data
3. Click "Run Test Generation" to trigger the generation process
4. View the detailed results including:
   - Generation summary
   - Generated content
   - Content outline
   - Performance metrics

This approach allows for quick iterations and focused testing of the Cloud Function integration.

## What to Test

### Functional Testing

- **Basic Generation**: Verify that content is generated successfully
- **Progress Tracking**: Confirm that progress indicators update correctly
- **Error Handling**: Test error scenarios by modifying the test data
- **Response Processing**: Verify that all parts of the function response are handled correctly

### Performance Testing

- **Generation Time**: Monitor the time taken for outline and content generation
- **Response Size**: Check the size of the generated content and outline
- **UI Responsiveness**: Ensure the UI remains responsive during generation

### Edge Cases

- **Large Word Counts**: Test with word counts at the upper limit (5000)
- **Special Characters**: Include special characters in input fields
- **Long Keywords**: Test with very long or complex keywords
- **Empty Optional Fields**: Test with minimal required input only

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Ensure you're logged in
   - Check Firebase authentication rules

2. **Timeout Errors**:
   - Reduce word count for testing
   - Check function timeout settings in Firebase

3. **API Key Issues**:
   - Verify API keys are properly set in Firebase environment
   - Check usage limits for both Gemini and OpenAI

4. **CORS Errors**:
   - Verify that your domain is in the allowed origins list in the function

### Viewing Logs

To see detailed logs for debugging:

1. Open Firebase Console
2. Navigate to Functions > Logs
3. Filter for "generateLongformContent" function
4. Look for error messages or warnings

## Deployment Checklist

Before deploying to production:

- [ ] Test all error scenarios
- [ ] Verify progress indicators match actual generation time
- [ ] Check that generated content meets quality expectations
- [ ] Ensure all UI states (loading, error, success) work correctly
- [ ] Test on different devices and screen sizes
- [ ] Verify that Firestore records are created correctly
- [ ] Check that user credit/usage tracking works properly
