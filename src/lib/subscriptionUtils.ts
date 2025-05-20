// subscriptionUtils.ts - UPDATED VERSION
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_REQUEST_LIMIT } from './constants';

export const checkUserRequestAvailability = async (userId: string): Promise<{
  canMakeRequest: boolean;
  requestsUsed: number;
  requestsLimit: number;
  planType: string;
}> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { 
        canMakeRequest: false, 
        requestsUsed: 0, 
        requestsLimit: 0,
        planType: 'free'
      };
    }

    const userData = userDoc.data();
    const requestsUsed = userData.requests_used || 0;
    const requestsLimit = userData.requests_limit || 
      (userData.plan_type && DEFAULT_REQUEST_LIMIT[userData.plan_type]) || 
      DEFAULT_REQUEST_LIMIT.free;
    const planType = userData.plan_type || 'free';
    
    return {
      canMakeRequest: requestsUsed < requestsLimit,
      requestsUsed,
      requestsLimit,
      planType
    };
  } catch (error) {
    console.error("Error checking request availability:", error);
    return { 
      canMakeRequest: false, 
      requestsUsed: 0, 
      requestsLimit: 0,
      planType: 'free'
    };
  }
};

export const checkUserPlan = async (userId: string): Promise<{
  status: 'OK' | 'UPGRADE' | 'LIMIT_REACHED';
  message: string;
  usagePercentage: number;
}> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { 
        status: 'UPGRADE', 
        message: 'User profile not found. Please contact support.',
        usagePercentage: 100
      };
    }    
    
    const userData = userDoc.data();
    const requestsUsed = userData.requests_used || 0;
    const requestsLimit = userData.requests_limit || 
      (userData.plan_type && DEFAULT_REQUEST_LIMIT[userData.plan_type]) || 
      DEFAULT_REQUEST_LIMIT.free;
    const planType = userData.plan_type || 'free';
    const usagePercentage = calculateUsagePercentage(requestsUsed, requestsLimit);
    
    if (requestsUsed >= requestsLimit) {
      // Updated to handle only basicMonth and basicYear plan types
      if (planType === 'free') {
        return {
          status: 'UPGRADE',
          message: 'You have used all your free requests. Choose a plan and start a trial to continue.',
          usagePercentage
        };
      } else if (planType === 'trial') {
        return {
          status: 'UPGRADE',
          message: 'Your trial requests are used up. Upgrade to a paid plan to continue.',
          usagePercentage
        };
      } else if (planType === 'basicMonth' || planType === 'basicYear') {
        // Handle both basic plan variations
        return {
          status: 'LIMIT_REACHED',
          message: 'You have reached your request limit. Add Flex packs for additional requests.',
          usagePercentage
        };
      } else if (planType === 'flexy') {
        return {
          status: 'LIMIT_REACHED',
          message: 'You have used all your Flex requests. Purchase more to continue.',
          usagePercentage
        };
      }
    }
    
    if (usagePercentage >= 80) {
      return {
        status: 'OK',
        message: `You're running low on requests (${requestsLimit - requestsUsed} left). Consider upgrading soon.`,
        usagePercentage
      };
    }
    
    return {
      status: 'OK',
      message: `You have ${requestsLimit - requestsUsed} requests remaining.`,
      usagePercentage
    };
  } catch (error: any) {
    console.error("Error checking user plan:", error);
    return { 
      status: 'UPGRADE', 
      message: `Error checking plan: ${error.message}`,
      usagePercentage: 0
    };
  }
};

export const calculateUsagePercentage = (used: number, limit: number): number => {
  if (limit === 0) return 100;
  return Math.min((used / limit) * 100, 100);
};

export const formatPlanName = (planType: string): string => {
  // Removed 'basic' case entirely
  switch (planType) {
    case 'free':
      return 'Free Plan';
    case 'trial':
      return 'Trial Plan';
    case 'basicMonth':
      return 'Basic Monthly Plan';
    case 'basicYear':
      return 'Basic Yearly Plan';
    case 'flexy':
      return 'Flex Purchase';
    default:
      return 'Unknown Plan';
  }
};

export const getDaysRemainingInPlan = (endDate: any): number => {
  if (!endDate) return 0;
  
  const endDateTime = endDate.seconds ? 
    new Date(endDate.seconds * 1000) : 
    new Date(endDate);
    
  const now = new Date();
  const diffTime = endDateTime.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

export const getSuggestedUpgrade = (currentPlan: string): string => {
  // Removed 'basic' case entirely
  switch (currentPlan) {
    case 'free':
      return 'Choose a plan and start your 5-day free trial with our Basic plan.';
    case 'trial':
      return 'Your trial will end soon. Upgrade to continue.';
    case 'basicMonth':
      return 'Save money by switching to yearly billing, or add Flex packs as needed.';
    case 'basicYear':
      return 'You\'re on our best plan! Need more? Add Flex packs for additional requests.';
    case 'flexy':
      return 'Need more requests? Purchase additional Flex packs anytime.';
    default:
      return 'Upgrade your plan to access more features.';
  }
};

export const resetUsageCounter = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      requests_used: 0
    });
    return true;
  } catch (error) {
    console.error("Error resetting usage counter:", error);
    return false;
  }
};

export const handleMidSessionLimitReaching = async (userId: string): Promise<boolean> => {
  const { canMakeRequest, requestsUsed, requestsLimit } = await checkUserRequestAvailability(userId);
  return requestsUsed === requestsLimit - 1;
};

export const addFlexRequests = async (userId: string, additionalRequests: number): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      requests_limit: increment(additionalRequests),
      plan_type: 'flexy'
    });
    return true;
  } catch (error) {
    console.error("Error adding flex requests:", error);
    return false;
  }
};

export const prepareDataForSharing = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  if (data instanceof File || data instanceof Blob) {
    return {
      type: data instanceof File ? 'file' : 'blob',
      name: data instanceof File ? data.name : 'blob',
      size: data.size,
      lastModified: data instanceof File ? data.lastModified : Date.now(),
    };
  }
  
  if (Array.isArray(data)) {
    return data.map(item => prepareDataForSharing(item));
  }
  
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'function' && typeof value !== 'symbol') {
      result[key] = prepareDataForSharing(value);
    }
  }
  
  return result;
};

export const safeShareContent = async (content: any, title: string = 'Check out this caption!'): Promise<boolean> => {
  try {
    const cleanContent = typeof content === 'string' ? content : JSON.stringify(content);
    
    const shareData = {
      title: title,
      text: cleanContent,
      url: window.location.href
    };
    
    if (navigator.share) {
      await navigator.share(shareData);
      return true;
    } else {
      console.log('Web Share API not supported, copying to clipboard instead');
      await navigator.clipboard.writeText(cleanContent);
      return true;
    }
  } catch (error) {
    console.error('Error sharing content:', error);
    return false;
  }
};

export const safeDownloadContent = (content: string, filename: string): boolean => {
  try {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading content:', error);
    return false;
  }
};

export const markUserForTrial = async (
  userId: string, 
  planSelected: 'basicMonth' | 'basicYear' = 'basicMonth', 
  selectedCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error("User document not found");
      return false;
    }
    
    const userData = userDoc.data();
    
    if (userData.plan_type !== 'free') {
      console.error("User is not on free plan, cannot mark for trial");
      return false;
    }
    
    console.log("Marking user for trial:", userId);
    console.log("Selected plan for trial:", planSelected);
    console.log("Selected cycle for trial:", selectedCycle);
    
    await updateDoc(userRef, {
      selected_plan: planSelected,
      selected_cycle: selectedCycle,
      trial_pending: true
    });
    
    console.log("User marked for trial, redirecting to Stripe");
    return true;
  } catch (error: any) {
    console.error("Error marking user for trial:", error);
    return false;
  }
};

export const activateTrialAfterPayment = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error("User document not found");
      return false;
    }
    
    const userData = userDoc.data();
    
    if (!userData.trial_pending) {
      console.error("No pending trial for this user");
      return false;
    }
    
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 5);
    
    await updateDoc(userRef, {
      plan_type: 'trial',
      requests_limit: DEFAULT_REQUEST_LIMIT.trial,
      trial_end_date: trialEndDate,
      requests_used: 0,
      has_used_trial: true,
      trial_pending: false
    });
    
    console.log("Trial activated successfully after payment confirmation");
    return true;
  } catch (error: any) {
    console.error("Error activating trial after payment:", error);
    return false;
  }
};

export const isPlanEligibleForTrial = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    
    return userData.plan_type === 'free' && !userData.has_used_trial;
  } catch (error) {
    console.error("Error checking trial eligibility:", error);
    return false;
  }
};

export const getPlanFeatures = (planType: string, cycle: 'monthly' | 'yearly' = 'monthly'): string[] => {
  const baseFeatures = [
    '5 free requests during trial',
  ];
  
  // Removed 'basic' case entirely, only using basicMonth and basicYear
  switch (planType) {
    case 'free':
      return [
        '3 free requests',
        'Manual share support',
        'Post ideas and captions'
      ];
    case 'basicMonth':
      return [
        ...baseFeatures,
        '70 requests/month',
        'Single platform support',
        'Post ideas and captions',
        'Mobile-friendly ready to post preview & download',
        'Manual sharing on social media platforms',
        'Friendly customer support'
      ];
    case 'basicYear':
      return [
        ...baseFeatures,
        '900 requests/year',
        'Single platform support',
        'Post ideas and captions',
        'Mobile-friendly ready to post preview & download',
        'Manual sharing on social media platforms',
        'Friendly customer support'
      ];
    case 'flexy':
      return [
        'No monthly commitment',
        'Works with Basic plans',
        '20 additional requests per pack',
        'Use with any plan'
      ];
    default:
      return baseFeatures;
  }
};

export const getPlanBilling = (planType: string, cycle: 'monthly' | 'yearly' = 'monthly'): { price: string, saving?: string, promo?: string } => {
  // Removed 'basic' case entirely
  switch (planType) {
    case 'basicMonth':
      return { price: '£5.99/month', promo: '£2.99 for 1st month (-49.9%)' };
    case 'basicYear':
      return { price: '£29.99/year', saving: 'Save 58%' };
    case 'flexy':
      return { price: '£1.99 per pack' };
    default:
      return { price: 'Free' };
  }
};

export const getStripePriceId = (planType: string, cycle: 'monthly' | 'yearly' = 'monthly'): string => {
  // Removed 'basic' case entirely
  switch (planType) {
    case 'basicMonth':
      return 'price_1RQkCnGCd9fidigr9N0HDUvq'; // Basic Plan Monthly
    case 'basicYear':
      return 'price_1RQkCwGCd9fidigrPeVinl74'; // Basic Plan Yearly
    case 'flexy':
      return 'price_1RQkD0GCd9fidigrgxJu0iKw';
    default:
      return '';
  }
};

export const getStripeProductId = (planType: string, cycle: 'monthly' | 'yearly' = 'monthly'): string => {
  // Removed 'basic' case entirely
  switch (planType) {
    case 'basicMonth':
      return 'prod_SLR4jh9pTyTHPm'; // Basic Plan Monthly
    case 'basicYear':
      return 'prod_SLR55czo8NpcuP'; // Basic Plan Yearly
    case 'flexy':
      return 'prod_SLR57yTpxpuzit';
    default:
      return '';
  }
};

export const getStripePurchaseUrl = (planType: string, cycle: 'monthly' | 'yearly' = 'monthly'): string => {
  // Removed 'basic' case entirely
  switch (planType) {
    case 'basicMonth':
      return 'https://buy.stripe.com/7sYdR961v2PV9WyfNHeAg00';
    case 'basicYear':
      return 'https://buy.stripe.com/9B6cN5gG90HNecOfNHeAg01';
    case 'flexy':
      return 'https://buy.stripe.com/9B6eVdey1bmrd8KatneAg02';
    default:
      return '';
  }
};

export const STRIPE_CUSTOMER_PORTAL_URL = 'https://billing.stripe.com/p/login/test_7sI01W9bs7V07sYdQQ';

export const clearTrialPending = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error("User document not found when clearing trial pending status");
      return false;
    }
    
    const userData = userDoc.data();
    
    if (userData.trial_pending) {
      console.log("Clearing trial pending status for user after cancelled checkout:", userId);
      
      await updateDoc(userRef, {
        trial_pending: false,
        selected_plan: null
      });
      
      console.log("Trial pending status cleared successfully");
      return true;
    }
    
    return true; // Already not pending, so success
  } catch (error: any) {
    console.error("Error clearing trial pending status:", error);
    return false;
  }
};

export { createSubscriptionCheckout, createFlexCheckout, openCustomerPortal } from './stripe';