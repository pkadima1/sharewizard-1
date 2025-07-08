/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

/**
 * ShareWizard Firebase Functions
 * 
 * This module exports the Firebase Cloud Functions for the ShareWizard application.
 */

// Export generateCaptions function
export { generateCaptionsV3 } from "./services/openai.js";
export { syncSubscriptionToUserProfile } from "./syncSubscription.js";

// Export longform content generation function
export { generateLongformContent } from "./services/longformContent.js";

// Export test functions (for debugging - remove in production)
// export { testGeminiOnly } from "./services/testGemini.js";
// export { testLongformNoAuth } from "./services/testLongformNoAuth.js";

// Export support chat function
export { supportChat } from './supportChat.js';

// Export admin chat dashboard functions
export { getChatAnalytics } from './adminChatFunctions.js';
export { getChatConversations } from './adminChatFunctions.js';
export { getChatMessages } from './adminChatFunctions.js';
export { exportChatData } from './adminChatFunctions.js';

// Add any additional function exports below

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
