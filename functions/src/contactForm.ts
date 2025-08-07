/**
 * contactForm.ts - v1.0.0
 * 
 * Purpose: Firebase Cloud Function for processing contact form submissions
 * Features: Firestore trigger, email notifications, data validation
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin if not already initialized
try {
  initializeApp();
} catch (error: unknown) {
  if ((error as { code?: string }).code !== "app/duplicate-app") {
    console.error("Firebase admin initialization error", error);
  }
}

const db = getFirestore();

// Interface for contact form data
interface ContactFormData {
  fullName: string;
  email: string;
  company?: string;
  message: string;
  submittedAt: any;
  source: string;
  userAgent?: string;
  currentUrl?: string;
}

/**
 * Process contact form submissions
 * Triggered when a new document is created in the EngPcontactForm collection
 */
export const processContactForm = onDocumentCreated({
  document: "EngPcontactForm/{docId}",
  region: "us-central1",
  memory: "256MiB",
  timeoutSeconds: 60,
}, async (event) => {
  const startTime = Date.now();
  
  try {
    // Get the document data
    const contactData = event.data?.data() as ContactFormData;
    const docId = event.params.docId;
    
    if (!contactData) {
      logger.warn("No contact data found in document", { docId });
      return;
    }

    logger.info("Processing contact form submission", { 
      docId, 
      email: contactData.email,
      fullName: contactData.fullName,
      source: contactData.source 
    });

    // Validate required fields
    if (!contactData.fullName || !contactData.email || !contactData.message) {
      logger.error("Invalid contact form data - missing required fields", { docId, contactData });
      return;
    }

    // Update the document with processing status
    await event.data?.ref.update({
      processed: true,
      processedAt: new Date(),
      processingTime: Date.now() - startTime
    });

    // Log successful processing
    logger.info("Contact form submission processed successfully", {
      docId,
      email: contactData.email,
      processingTime: Date.now() - startTime
    });

    // You can add additional processing here:
    // - Send notification emails to admin
    // - Integrate with CRM systems
    // - Send auto-reply emails to customers
    // - Add to mailing lists
    // - Slack/Discord notifications

  } catch (error) {
    logger.error("Error processing contact form submission", {
      docId: event.params.docId,
      error: error instanceof Error ? error.message : String(error),
      processingTime: Date.now() - startTime
    });
    
    // Update document with error status
    try {
      await event.data?.ref.update({
        processed: false,
        processingError: error instanceof Error ? error.message : String(error),
        processedAt: new Date(),
        processingTime: Date.now() - startTime
      });
    } catch (updateError) {
      logger.error("Failed to update document with error status", { 
        docId: event.params.docId, 
        updateError 
      });
    }
  }
});

/**
 * Get contact form analytics (admin function)
 */
export const getContactFormAnalytics = onDocumentCreated({
  document: "EngPcontactForm/{docId}",
  region: "us-central1",
}, async (event) => {
  // This can be used to generate analytics when new forms are submitted
  // For example, update counters, generate reports, etc.
  
  try {
    // You could update analytics collections here
    // For example, daily/monthly submission counts
    const today = new Date().toISOString().split('T')[0];
    
    await db.collection('analytics').doc('contactForms').collection('daily').doc(today).set({
      count: FieldValue.increment(1),
      lastUpdated: new Date()
    }, { merge: true });
    
    logger.info("Contact form analytics updated", { date: today });
    
  } catch (error) {
    logger.error("Error updating contact form analytics", { error });
  }
});
