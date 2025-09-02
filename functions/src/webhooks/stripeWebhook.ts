/**
 * Stripe Webhook Handler with Enhanced Referral Correlation
 * 
 * Handles checkout.session.completed and customer.subscription.created events
 * to maintain proper referral → customer/subscription mapping with robust idempotency.
 * 
 * Key Features:
 * - Signature verification for security
 * - Idempotency guards using event IDs
 * - Comprehensive referral tracking
 * - Customer/subscription correlation
 * - Commission processing integration
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { handleSubscriptionCheckoutCompleted } from "../stripeHelpers.js";
import { processReferralCommission } from "../referralCommissions.js";
import { config } from "../config/secrets.js";
import { initializeFirebaseAdmin, getFirestore } from "../config/firebase-admin.js";
import { DEFAULT_COMMISSION_RATE } from "../types/partners.js";

// Initialize Firebase Admin with hybrid configuration
initializeFirebaseAdmin();

// Initialize Firestore using the helper function for consistency
const db = getFirestore();

// Get webhook secret from environment or config
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || config.stripeWebhookSecret;
if (!webhookSecret) {
  console.warn("⚠️ STRIPE_WEBHOOK_SECRET is not set. Webhook signature verification will fail.");
}

// Get Stripe secret key from env or extension config
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || config.stripeSecretKey;
if (!stripeSecretKey) {
  console.warn("⚠️ STRIPE_SECRET_KEY is not set. Webhook functions will not work until this is configured.");
}

// Initialize Stripe with secret key (only if available)
let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-04-30.basil" // Using latest Stripe API version as of May 2025
  });
} else {
  console.warn("⚠️ Stripe not initialized due to missing secret key");
}

/**
 * Interface for referral tracking document
 */
interface ReferralTrackingDoc {
  id: string;
  partnerId: string;
  referralCode: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  planId?: string;
  currency: string;
  source: string;
  amount?: number;
  purchaseType: 'subscription' | 'one_time';
  productType?: string;
  quantity?: number;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  eventIds: string[]; // For idempotency tracking
  metadata?: Record<string, any>;
}

/**
 * Handle checkout.session.completed events
 * 
 * Creates or updates referral tracking document with customer correlation.
 * Captures: { partnerId, code, stripeCustomerId, planId, currency, source }
 * Uses session metadata for comprehensive tracking.
 * 
 * Idempotency: Guards writes with event IDs to prevent duplicate processing.
 */
async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session
): Promise<void> {
  const eventId = event.id;
  const metadata = session.metadata || {};
  const referralCode = metadata.referralCode;
  const partnerId = metadata.partnerId;
  
  console.log("🎯 Processing checkout.session.completed:", {
    eventId,
    sessionId: session.id,
    customerId: session.customer,
    mode: session.mode,
    amount: session.amount_total,
    hasReferralData: !!(referralCode && partnerId)
  });
  
  // Only process if we have referral information from metadata
  if (!referralCode || !partnerId) {
    console.log("ℹ️ No referral information in checkout session metadata, skipping referral tracking");
    return;
  }
  
  console.log("📈 Processing referral checkout with metadata:", {
    referralCode,
    partnerId,
    partnerName: metadata.partnerName,
    source: metadata.source
  });
  
  try {
    // Create unique document ID based on referral code and customer
    const referralDocId = `${referralCode}_${session.customer}`;
    const referralRef = db.collection('referrals').doc(referralDocId);
    
    // Use transaction for atomic upsert with idempotency
    await db.runTransaction(async (transaction) => {
      const existingDoc = await transaction.get(referralRef);
      
      // Idempotency check: verify this event hasn't been processed already
      if (existingDoc.exists) {
        const existingData = existingDoc.data() as ReferralTrackingDoc;
        if (existingData.eventIds && existingData.eventIds.includes(eventId)) {
          console.log("✅ Event already processed (idempotency guard triggered):", eventId);
          return;
        }
      }
      
      // Extract plan information for commission calculation
      const planId = metadata.planId || 
                   (session.mode === 'subscription' ? 'subscription_plan' : 'one_time_purchase');
      
      // Prepare comprehensive referral tracking data as specified
      const referralData: Partial<ReferralTrackingDoc> = {
        partnerId,                                    // ✅ Required: partnerId
        referralCode,                                // ✅ Required: code  
        stripeCustomerId: session.customer as string, // ✅ Required: stripeCustomerId
        planId,                                      // ✅ Required: planId
        currency: session.currency || 'usd',        // ✅ Required: currency
        source: metadata.source || 'referral_link',  // ✅ Required: source
        
        // Additional tracking data for comprehensive analytics
        amount: session.amount_total || 0,
        purchaseType: session.mode === 'subscription' ? 'subscription' : 'one_time',
        productType: metadata.product_type,
        quantity: metadata.quantity ? parseInt(metadata.quantity, 10) : undefined,
        updatedAt: admin.firestore.Timestamp.now(),
        
        // Store subscription ID if this is a subscription checkout
        ...(session.subscription && { 
          stripeSubscriptionId: session.subscription as string 
        }),
        
        // Enhanced metadata for partner analytics and notifications
        metadata: {
          stripeSessionId: session.id,
          partnerName: metadata.partnerName || 'Unknown Partner',
          partnerEmail: metadata.partnerEmail || '',
          checkoutType: metadata.checkout_type || session.mode,
          userId: metadata.user_id || '',
          sessionMode: session.mode,
          sessionStatus: session.payment_status,
          createdAt: metadata.created_at,
          userAgent: metadata.user_agent || '',
          sourceUrl: metadata.source_url || ''
        }
      };
      
      
      // Upsert logic: update existing or create new referral document
      if (existingDoc.exists) {
        // Update existing document with new event ID and preserve existing data
        const existingData = existingDoc.data() as ReferralTrackingDoc;
        const updatedEventIds = [...(existingData.eventIds || []), eventId];
        
        transaction.update(referralRef, {
          ...referralData,
          eventIds: updatedEventIds,
          // Preserve existing subscription ID if it exists (important for correlation)
          stripeSubscriptionId: existingData.stripeSubscriptionId || referralData.stripeSubscriptionId
        });
        
        console.log("✅ Updated existing referral tracking document:", {
          docId: referralRef.id,
          eventId,
          preservedSubscriptionId: existingData.stripeSubscriptionId
        });
      } else {
        // Create new referral tracking document
        transaction.set(referralRef, {
          id: referralRef.id,
          ...referralData,
          createdAt: admin.firestore.Timestamp.now(),
          eventIds: [eventId] // Initialize with current event ID
        });
        
        console.log("✅ Created new referral tracking document:", {
          docId: referralRef.id,
          eventId,
          referralCode,
          partnerId
        });
      }
    });
    
    // Process subscription-specific logic if this was a subscription checkout
    if (session.mode === "subscription" && session.subscription && stripe) {
      try {
        await handleSubscriptionCheckoutCompleted(
          session.customer as string,
          session.subscription as string,
          stripe
        );
        
        console.log("✅ Successfully processed subscription checkout correlation:", {
          customerId: session.customer,
          subscriptionId: session.subscription,
          referralCode
        });
      } catch (subscriptionError) {
        console.error("❌ Error in subscription processing (continuing with referral tracking):", subscriptionError);
        // Don't throw - referral tracking should succeed even if subscription processing fails
      }
    }
    
    // Process commission calculation (existing integration)
    try {
      const commissionId = await processReferralCommission(session);
      if (commissionId) {
        console.log("✅ Referral commission processed successfully:", {
          commissionId,
          referralCode,
          partnerId,
          amount: session.amount_total
        });
      }
    } catch (commissionError) {
      console.error("❌ Error processing referral commission (continuing with tracking):", commissionError);
      // Don't throw - referral tracking should succeed even if commission processing fails
    }
    
  } catch (error) {
    console.error("❌ Error handling checkout.session.completed:", error);
    throw error; // Re-throw to trigger webhook retry
  }
}

/**
 * Handle customer.subscription.created events
 * 
 * Correlates subscription ID with existing referral tracking document.
 * Looks up referral metadata by stripeCustomerId and attaches stripeSubscriptionId.
 * 
 * Idempotency: Guards updates with event IDs to prevent duplicate processing.
 */
async function handleSubscriptionCreated(
  event: Stripe.Event,
  subscription: Stripe.Subscription
): Promise<void> {
  const eventId = event.id;
  const customerId = subscription.customer as string;
  
  console.log("🔗 Processing customer.subscription.created for referral correlation:", {
    eventId,
    subscriptionId: subscription.id,
    customerId,
    status: subscription.status,
    startDate: subscription.start_date
  });
  
  try {
    // Look up existing referral tracking documents by customer ID
    const referralsQuery = db.collection('referrals')
      .where('stripeCustomerId', '==', customerId)
      .limit(5); // Reasonable limit to prevent excessive reads
    
    const referralSnapshot = await referralsQuery.get();
    
    if (referralSnapshot.empty) {
      console.log("ℹ️ No referral tracking found for customer - no correlation needed:", customerId);
      return;
    }
    
    console.log(`📊 Found ${referralSnapshot.size} referral document(s) for customer:`, customerId);
    
    // Use batch operations for efficient multiple document updates
    const batch = db.batch();
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each referral document found for this customer
    for (const docSnapshot of referralSnapshot.docs) {
      const referralData = docSnapshot.data() as ReferralTrackingDoc;
      
      // Idempotency check: ensure this subscription creation event hasn't been processed
      if (referralData.eventIds && referralData.eventIds.includes(eventId)) {
        console.log("✅ Subscription creation already processed for referral document:", {
          docId: docSnapshot.id,
          eventId,
          existingSubscriptionId: referralData.stripeSubscriptionId
        });
        skippedCount++;
        continue;
      }
      
      // Prepare subscription correlation data
      const updatedEventIds = [...(referralData.eventIds || []), eventId];
      const subscriptionMetadata = {
        subscriptionStatus: subscription.status,
        subscriptionStartDate: subscription.start_date ? new Date(subscription.start_date * 1000) : null,
        subscriptionCurrentPeriodEnd: (subscription as any).current_period_end 
          ? new Date((subscription as any).current_period_end * 1000) 
          : null,
        subscriptionTrialEnd: (subscription as any).trial_end 
          ? new Date((subscription as any).trial_end * 1000) 
          : null
      };
      
      // Add to batch: attach subscription ID and update metadata
      batch.update(docSnapshot.ref, {
        stripeSubscriptionId: subscription.id,  // ✅ Attach subscription ID as required
        eventIds: updatedEventIds,              // ✅ Idempotency tracking
        updatedAt: admin.firestore.Timestamp.now(),
        
        // Enhanced subscription correlation metadata
        'metadata.subscriptionCorrelatedAt': admin.firestore.Timestamp.now(),
        'metadata.subscriptionStatus': subscriptionMetadata.subscriptionStatus,
        'metadata.subscriptionStartDate': subscriptionMetadata.subscriptionStartDate,
        'metadata.subscriptionCurrentPeriodEnd': subscriptionMetadata.subscriptionCurrentPeriodEnd,
        'metadata.subscriptionTrialEnd': subscriptionMetadata.subscriptionTrialEnd,
        'metadata.correlationEventId': eventId
      });
      
      updatedCount++;
      
      console.log("📝 Queued referral document for subscription correlation:", {
        docId: docSnapshot.id,
        referralCode: referralData.referralCode,
        partnerId: referralData.partnerId,
        subscriptionId: subscription.id
      });
    }
    
    // Execute all updates atomically
    if (updatedCount > 0) {
      await batch.commit();
      
      console.log("✅ Successfully correlated subscription with referral tracking:", {
        subscriptionId: subscription.id,
        customerId,
        documentsUpdated: updatedCount,
        documentsSkipped: skippedCount,
        totalFound: referralSnapshot.size
      });
    } else {
      console.log("ℹ️ No referral documents needed subscription correlation (all already processed):", {
        subscriptionId: subscription.id,
        documentsSkipped: skippedCount
      });
    }
    
  } catch (error) {
    console.error("❌ Error handling customer.subscription.created:", error);
    throw error; // Re-throw to trigger webhook retry
  }
}

/**
 * Handle invoice.paid events - Task 6: Commission ledger on invoice.paid
 * 
 * Accrues commissions only when money is collected.
 * Creates commission ledger entries for partner payouts.
 * 
 * Idempotency: Guards writes with event IDs to prevent duplicate processing.
 */
async function handleInvoicePaid(
  event: Stripe.Event,
  invoice: Stripe.Invoice
): Promise<void> {
  const eventId = event.id;

  console.log("💰 Processing invoice.paid for commission accrual:", {
    eventId,
    invoiceId: invoice.id,
    customerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
    subscriptionId: (invoice as any).subscription,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    status: invoice.status
  });

  try {
    // Extract key data from invoice
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    const subscriptionId = (invoice as any).subscription as string | null;
    const amountPaid = invoice.amount_paid;
    const currency = invoice.currency;
    const periodStart = invoice.period_start;
    const periodEnd = invoice.period_end;

    if (!customerId) {
      console.warn("⚠️ No customer ID found in invoice, skipping commission accrual");
      return;
    }

    if (amountPaid <= 0) {
      console.warn("⚠️ Invoice amount paid is zero or negative, skipping commission accrual");
      return;
    }

    // Resolve referral by stripeSubscriptionId or stripeCustomerId
    let referralQuery;
    if (subscriptionId) {
      // Try to find referral by subscription ID first (more specific)
      referralQuery = db.collection('referrals')
        .where('stripeSubscriptionId', '==', subscriptionId)
        .limit(1);
    } else {
      // Fall back to customer ID lookup
      referralQuery = db.collection('referrals')
        .where('stripeCustomerId', '==', customerId)
        .limit(1);
    }

    const referralSnapshot = await referralQuery.get();

    if (referralSnapshot.empty) {
      console.log("ℹ️ No referral found for invoice, skipping commission accrual:", {
        customerId,
        subscriptionId,
        invoiceId: invoice.id
      });
      return;
    }

    const referralDoc = referralSnapshot.docs[0];
    const referralData = referralDoc.data();
    const partnerId = referralData.partnerId;
    const referralCode = referralData.referralCode;

    if (!partnerId) {
      console.warn("⚠️ No partner ID found in referral data, skipping commission accrual");
      return;
    }

    // Fetch partner's commission rate (with default fallback)
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    
    if (!partnerDoc.exists) {
      console.warn("⚠️ Partner not found for commission accrual:", partnerId);
      return;
    }

    const partnerData = partnerDoc.data()!;
    const commissionRate = partnerData.commissionRate || DEFAULT_COMMISSION_RATE;

    // Compute commission amount = amount_paid * commissionRate (use integer cents)
    const commissionAmount = Math.round(amountPaid * commissionRate);

    console.log("💰 Calculating commission for invoice payment:", {
      partnerId,
      referralCode,
      amountPaid,
      commissionRate,
      commissionAmount,
      currency
    });

    // Create unique commission ledger entry ID
    const ledgerEntryId = `${invoice.id}_${partnerId}`;
    const ledgerRef = db.collection('commission_ledger').doc(ledgerEntryId);

    // Check for existing entry (idempotency)
    const existingEntry = await ledgerRef.get();
    if (existingEntry.exists) {
      const existingData = existingEntry.data() as any;
      if (existingData.eventIds && existingData.eventIds.includes(eventId)) {
        console.log("✅ Commission ledger entry already processed (idempotency guard):", eventId);
        return;
      }
    }

    // Write ledger entry to commission_ledger
    const ledgerEntry = {
      partnerId,
      referralId: referralDoc.id,
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscriptionId || '',
      amountGross: amountPaid,
      commissionRate,
      commissionAmount,
      currency,
      periodStart: admin.firestore.Timestamp.fromDate(new Date(periodStart * 1000)),
      periodEnd: admin.firestore.Timestamp.fromDate(new Date(periodEnd * 1000)),
      status: 'accrued' as 'accrued' | 'paid' | 'reversed' | 'pending',
      createdAt: admin.firestore.Timestamp.now(),
      eventIds: existingEntry.exists 
        ? [...(existingEntry.data()!.eventIds || []), eventId]
        : [eventId],
      
      // Additional Stripe metadata for reference
      stripeMetadata: {
        invoiceStatus: invoice.status,
        subscriptionStatus: subscriptionId ? 'active' : 'none',
        customerId: customerId,
        priceId: (invoice.lines?.data?.[0] as any)?.price?.id || ''
      }
    };

    // Save commission ledger entry
    await ledgerRef.set(ledgerEntry, { merge: true });

    console.log("✅ Commission ledger entry created successfully:", {
      ledgerEntryId,
      partnerId,
      commissionAmount,
      currency,
      status: 'accrued'
    });

  } catch (error) {
    console.error("❌ Error handling invoice.paid:", error);
    throw error; // Re-throw to trigger webhook retry
  }
}

/**
 * Handle invoice.payment_action_required events
 * 
 * Tracks when invoices require additional payment action.
 * Could be used for commission status updates if needed.
 */
async function handleInvoicePaymentActionRequired(
  event: Stripe.Event,
  invoice: Stripe.Invoice
): Promise<void> {
  const eventId = event.id;

  console.log("⚠️ Processing invoice.payment_action_required:", {
    eventId,
    invoiceId: invoice.id,
    customerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
    subscriptionId: (invoice as any).subscription,
    status: invoice.status
  });

  // For now, we just log this event. In the future, we could:
  // - Update commission ledger entries to mark them as "pending payment action"
  // - Send notifications to partners about delayed payments
  // - Track payment failure rates for analytics

  console.log("ℹ️ Invoice payment action required - tracked for analytics");
}

/**
 * Handle invoice.voided events
 * 
 * Creates reversed commission ledger entries when invoices are voided.
 * Ensures accurate commission tracking for partner payouts.
 */
async function handleInvoiceVoided(
  event: Stripe.Event,
  invoice: Stripe.Invoice
): Promise<void> {
  const eventId = event.id;
  const invoiceId = invoice.id;

  console.log("❌ Processing invoice.voided for commission reversal:", {
    eventId,
    invoiceId,
    customerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
    subscriptionId: (invoice as any).subscription,
    amountPaid: invoice.amount_paid
  });

  try {
    // Find existing commission ledger entries for this invoice
    const existingEntriesSnapshot = await db.collection('commission_ledger')
      .where('stripeInvoiceId', '==', invoiceId)
      .get();

    if (existingEntriesSnapshot.empty) {
      console.log("ℹ️ No commission ledger entries found for voided invoice:", invoiceId);
      return;
    }

    // Create reversal entries for each commission that was accrued
    const batch = db.batch();
    let reversalCount = 0;

    for (const entryDoc of existingEntriesSnapshot.docs) {
      const entryData = entryDoc.data();
      
      // Skip if already reversed
      if (entryData.status === 'reversed') {
        console.log("ℹ️ Commission already reversed, skipping:", entryDoc.id);
        continue;
      }

      // Create reversal entry ID
      const reversalEntryId = `${invoiceId}_${entryData.partnerId}_reversal`;
      const reversalRef = db.collection('commission_ledger').doc(reversalEntryId);

      // Check if reversal already exists (idempotency)
      const existingReversal = await reversalRef.get();
      if (existingReversal.exists) {
        console.log("✅ Reversal entry already exists (idempotency guard):", reversalEntryId);
        continue;
      }

      // Create reversal entry with negative commission amount
      const reversalEntry = {
        ...entryData,
        commissionAmount: -Math.abs(entryData.commissionAmount), // Ensure negative
        status: 'reversed' as 'accrued' | 'paid' | 'reversed' | 'pending',
        createdAt: admin.firestore.Timestamp.now(),
        reversalReason: 'Invoice voided',
        reversedAt: admin.firestore.Timestamp.now(),
        eventIds: [eventId],
        
        // Update metadata to reflect reversal
        stripeMetadata: {
          ...entryData.stripeMetadata,
          invoiceStatus: 'void',
          reversalEventId: eventId,
          originalEntryId: entryDoc.id
        }
      };

      batch.set(reversalRef, reversalEntry);
      reversalCount++;

      console.log("📝 Queued commission reversal entry:", {
        reversalEntryId,
        partnerId: entryData.partnerId,
        originalCommission: entryData.commissionAmount,
        reversalAmount: reversalEntry.commissionAmount
      });
    }

    // Execute all reversals atomically
    if (reversalCount > 0) {
      await batch.commit();
      
      console.log("✅ Successfully created commission reversal entries:", {
        invoiceId,
        reversalCount,
        eventId
      });
    }

  } catch (error) {
    console.error("❌ Error handling invoice.voided:", error);
    throw error; // Re-throw to trigger webhook retry
  }
}

/**
 * Main Stripe webhook handler with enhanced signature verification
 * 
 * Processes checkout.session.completed and customer.subscription.created events
 * for comprehensive referral → customer/subscription mapping.
 * 
 * Features:
 * - Robust signature verification for security
 * - Comprehensive event logging for debugging
 * - Graceful error handling with proper HTTP responses
 * - Idempotency guarantees across all event types
 */
export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  // Pre-flight checks for webhook configuration
  if (!stripe) {
    console.error("❌ Stripe not initialized - missing STRIPE_SECRET_KEY");
    res.status(500).send({ 
      error: "Webhook configuration error", 
      message: "Stripe not configured" 
    });
    return;
  }

  if (!webhookSecret) {
    console.error("❌ Webhook secret not configured - signature verification will fail");
    res.status(500).send({ 
      error: "Webhook configuration error", 
      message: "Webhook secret not configured" 
    });
    return;
  }

  // Extract and validate Stripe signature
  const signature = req.headers["stripe-signature"];
  
  if (!signature) {
    console.error("❌ No Stripe signature found in request headers");
    res.status(400).send({ 
      error: "Webhook signature missing", 
      message: "No signature provided" 
    });
    return;
  }
  
  let event: Stripe.Event;
  
  try {
    // ========================================
    // SIGNATURE VERIFICATION (Security Critical)
    // ========================================
    // 
    // Verify the webhook signature to ensure:
    // 1. The request actually came from Stripe
    // 2. The payload hasn't been tampered with
    // 3. The webhook is not being replayed maliciously
    //
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      webhookSecret
    );
    
    console.log(`🎣 Verified and received Stripe webhook event:`, {
      eventType: event.type,
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString(),
      livemode: event.livemode
    });
    
  } catch (signatureError: any) {
    console.error("❌ Webhook signature verification failed:", signatureError.message);
    res.status(400).send({ 
      error: "Webhook signature verification failed", 
      message: signatureError.message 
    });
    return;
  }
  
  try {
    // ========================================
    // EVENT PROCESSING WITH CORRELATION
    // ========================================
    
    // Process specific event types for referral correlation
    switch (event.type) {
      
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log("🛒 Processing checkout.session.completed:", {
          sessionId: session.id,
          customerId: session.customer,
          mode: session.mode,
          paymentStatus: session.payment_status,
          amount: session.amount_total,
          currency: session.currency
        });
        
        await handleCheckoutSessionCompleted(event, session);
        break;
      }
      
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log("🔄 Processing customer.subscription.created:", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          startDate: subscription.start_date
        });
        
        await handleSubscriptionCreated(event, subscription);
        break;
      }
      
      // Optional: Handle subscription updates for referral tracking
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log("📝 Subscription updated (tracked for referral analytics):", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          previousAttributes: event.data.previous_attributes
        });
        
        // Could add logic here to update referral tracking with status changes
        // for partner analytics (subscription renewals, cancellations, etc.)
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log("🗑️ Subscription deleted (tracked for referral analytics):", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          canceledAt: (subscription as any).canceled_at
        });
        
        // Could add logic here to handle cancellations in referral tracking
        // for partner commission adjustments or analytics
        break;
      }

      // 🆕 Task 6: Commission ledger on invoice.paid
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log("💰 Processing invoice.paid for commission accrual:", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: (invoice as any).subscription,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end
        });
        
        await handleInvoicePaid(event, invoice);
        break;
      }

      case "invoice.payment_action_required": {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log("⚠️ Processing invoice.payment_action_required for commission tracking:", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: (invoice as any).subscription,
          status: invoice.status
        });
        
        await handleInvoicePaymentActionRequired(event, invoice);
        break;
      }

      case "invoice.voided": {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log("❌ Processing invoice.voided for commission reversal:", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: (invoice as any).subscription,
          amountPaid: invoice.amount_paid
        });
        
        await handleInvoiceVoided(event, invoice);
        break;
      }
      
      default:
        console.log(`ℹ️ Received unhandled event type (ignoring):`, {
          eventType: event.type,
          eventId: event.id
        });
    }
    
    // Success response with comprehensive details for Stripe dashboard
    res.status(200).send({ 
      received: true, 
      processed: true,
      eventType: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString(),
      webhookVersion: "v2.0.0"
    });
    
  } catch (processingError: any) {
    console.error("❌ Error processing webhook event:", {
      eventType: event.type,
      eventId: event.id,
      error: processingError.message,
      stack: processingError.stack
    });
    
    // Return error response to trigger Stripe's retry mechanism
    res.status(400).send({ 
      error: "Webhook processing failed", 
      message: processingError.message,
      eventType: event.type,
      eventId: event.id
    });
    return;
  }
});

/**
 * Utility function to get referral tracking by customer ID (for debugging/admin)
 */
export const getReferralsByCustomer = functions.https.onCall(async (data: any, context?: any) => {
  // Verify admin authentication if needed
  if (!context?.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { customerId } = data;
  
  if (!customerId) {
    throw new functions.https.HttpsError('invalid-argument', 'customerId is required');
  }
  
  try {
    const referralsQuery = db.collection('referrals')
      .where('stripeCustomerId', '==', customerId);
    
    const snapshot = await referralsQuery.get();
    const referrals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { referrals };
  } catch (error) {
    console.error('Error getting referrals by customer:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get referrals');
  }
});

/**
 * Utility function to get referral tracking by partner ID (for partner dashboard)
 */
export const getReferralsByPartner = functions.https.onCall(async (data: any, context?: any) => {
  // Verify authentication
  if (!context?.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  
  const { partnerId, limit = 50 } = data;
  
  if (!partnerId) {
    throw new functions.https.HttpsError('invalid-argument', 'partnerId is required');
  }
  
  try {
    const referralsQuery = db.collection('referrals')
      .where('partnerId', '==', partnerId)
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    const snapshot = await referralsQuery.get();
    const referrals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { referrals };
  } catch (error) {
    console.error('Error getting referrals by partner:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get referrals');
  }
});
