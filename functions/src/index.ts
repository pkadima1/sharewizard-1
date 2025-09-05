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

// Export support chat function
export { supportChat } from './supportChat.js';

// Export admin chat dashboard functions
export { getChatAnalytics } from './adminChatFunctions.js';
export { getChatConversations } from './adminChatFunctions.js';
export { getChatMessages } from './adminChatFunctions.js';
export { exportChatData } from './adminChatFunctions.js';

// Export contact form functions
export { processContactForm } from './contactForm.js';
export { getContactFormAnalytics } from './contactForm.js';

// Export partner system functions
export { createPartner } from './partners/createPartner.js';
export { createPartnerCode } from './partners/createPartnerCode.js';
export { registerPartner } from './partners/registerPartner.js';
export { checkUserByEmail } from './partners/checkUserByEmail.js';
export { approvePartner } from './partners/approvePartner.js';
export { rejectPartner } from './partners/rejectPartner.js';

// Export partner notification functions
export { notifyPartnerApproved } from './partners/notifications.js';
export { notifyPartnerRejected } from './partners/notifications.js';

// Export Stripe webhook functions
export { handleStripeWebhook } from './webhooks/stripeWebhook.js';
export { getReferralsByCustomer } from './webhooks/stripeWebhook.js';
export { getReferralsByPartner } from './webhooks/stripeWebhook.js';

// Export checkout session creation function
export { createCheckoutSession } from './createCheckoutSession.js';

// Export payout system functions
export { monthlyCommissionReport } from './payouts/monthlyReport.js';
export { generateManualCommissionReport } from './payouts/monthlyReport.js';
export { getPayoutReport } from './payouts/monthlyReport.js';

// Add any additional function exports below

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export { generateContentIdeas } from "./generateContentIdeas.js";
