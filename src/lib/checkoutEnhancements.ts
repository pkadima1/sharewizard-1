import { doc, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Enhanced version of subscription checkout that includes trial periods, upsells and coupons
 * This creates a checkout session with more options mimicking direct payment links
 */
export const createEnhancedSubscriptionCheckout = async (
  userId: string, 
  priceId: string, 
  options: {
    couponCode?: string;
    trialDays?: number;
    includeUpsells?: boolean;
  } = {}
) => {
  try {
    // Default values
    const trialDays = options.trialDays ?? 5; // Default 5-day trial
    const includeUpsells = options.includeUpsells ?? true; // Default to include upsells
    
    // Build checkout session payload
    const checkoutPayload: any = {
      price: priceId,
      success_url: `${window.location.origin}/dashboard?checkout_success=true`,
      cancel_url: `${window.location.origin}/pricing?checkout_canceled=true`,
      subscription_data: {
        trial_period_days: trialDays,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      client_reference_id: userId,
      payment_method_types: ['card'],
      mode: 'subscription',
      // Pass additional metadata
      metadata: {
        user_id: userId,
        source: 'EngagePerfect AI Web App',
        created_at: new Date().toISOString()
      }
    };
    
    // Add coupon if provided
    if (options.couponCode) {
      checkoutPayload.coupon = options.couponCode;
    }
    
    // Create the checkout session
    const docRef = await addDoc(
      collection(db, "customers", userId, "checkout_sessions"),
      checkoutPayload
    );

    return new Promise<string>((resolve, reject) => {
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const { error, url } = snap.data() as { error?: { message: string }, url?: string };
        
        if (error) {
          unsubscribe();
          reject(new Error(`Error: ${error.message}`));
        }
        
        if (url) {
          unsubscribe();
          resolve(url);
        }
      }, (error) => {
        unsubscribe();
        reject(error);
      });
    });
  } catch (error: any) {
    console.error("Error creating enhanced subscription checkout:", error);
    throw new Error(`Failed to create enhanced checkout session: ${error.message}`);
  }
};

/**
 * Enhanced version of flex checkout that includes promotional options
 */
export const createEnhancedFlexCheckout = async (
  userId: string, 
  priceId: string, 
  quantity: number = 1, 
  options: {
    couponCode?: string;
  } = {}
) => {
  try {
    // Build checkout session payload
    const checkoutPayload: any = {
      mode: "payment",
      price: priceId,
      quantity: quantity,
      success_url: `${window.location.origin}/dashboard?checkout_success=true`,
      cancel_url: `${window.location.origin}/pricing?checkout_canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      client_reference_id: userId,
      payment_method_types: ['card'],
      // Pass additional metadata
      metadata: {
        user_id: userId,
        source: 'EngagePerfect AI Web App',
        created_at: new Date().toISOString()
      }
    };
    
    // Add coupon if provided
    if (options.couponCode) {
      checkoutPayload.coupon = options.couponCode;
    }
    
    // Create the checkout session
    const docRef = await addDoc(
      collection(db, "customers", userId, "checkout_sessions"),
      checkoutPayload
    );

    return new Promise<string>((resolve, reject) => {
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const { error, url } = snap.data() as { error?: { message: string }, url?: string };
        
        if (error) {
          unsubscribe();
          reject(new Error(`Error: ${error.message}`));
        }
        
        if (url) {
          unsubscribe();
          resolve(url);
        }
      }, (error) => {
        unsubscribe();
        reject(error);
      });
    });
  } catch (error: any) {
    console.error("Error creating enhanced flex checkout:", error);
    throw new Error(`Failed to create enhanced checkout session: ${error.message}`);
  }
};
