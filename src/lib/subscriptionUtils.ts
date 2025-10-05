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
        };      } else if (planType === 'basicMonth' || planType === 'basicYear') {
        // Handle both basic plan variations
        return {
          status: 'LIMIT_REACHED',
          message: 'You have reached your request limit. Add Flex packs for additional requests.',
          usagePercentage
        };
      } else if (planType === 'premiumMonth' || planType === 'premiumYear') {
        // Handle both premium plan variations
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
    case 'premiumMonth':
      return 'Premium Monthly Plan';
    case 'premiumYear':
      return 'Premium Yearly Plan';
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
      return 'Save money by switching to yearly billing, or upgrade to Premium for more requests.';
    case 'basicYear':
      return 'Upgrade to Premium for more requests, or add Flex packs as needed.';
    case 'premiumMonth':
      return 'Save money by switching to yearly billing, or add Flex packs as needed.';
    case 'premiumYear':
      return 'You\'re on our highest plan! Need more? Add Flex packs for additional requests.';
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
    case 'basicYear':      return [
        ...baseFeatures,
        '900 requests/year',
        'Single platform support',
        'Post ideas and captions',
        'Mobile-friendly ready to post preview & download',
        'Manual sharing on social media platforms',
        'Friendly customer support'
      ];
    case 'premiumMonth':
      return [
        ...baseFeatures,
        '500 requests/month',
        'Multi-platform support',
        'Advanced post ideas and captions',
        'Mobile-friendly ready to post preview & download',
        'Manual sharing on social media platforms',
        'Priority customer support',
        'Advanced analytics'
      ];
    case 'premiumYear':
      return [
        ...baseFeatures,
        '6000 requests/year',
        'Multi-platform support',
        'Advanced post ideas and captions',
        'Mobile-friendly ready to post preview & download',
        'Manual sharing on social media platforms',
        'Priority customer support',
        'Advanced analytics'
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
  // Updated with EUR pricing for Estonia organization
  switch (planType) {
    case 'basicMonth':
      return { price: '€8/month' };
    case 'basicYear':
      return { price: '€40/year', saving: 'Save 58%' };
    case 'premiumMonth':
      return { price: '€29/month' };
    case 'premiumYear':
      return { price: '€199/year', saving: 'Save €149/year' };
    case 'flexy':
      return { price: '€3 per pack' };
    
    // DFY Service Plans
    case 'dfySilver':
      return { price: '€297/month' };
    case 'dfyGold':
      return { price: '€497/month' };
    case 'dfyPlatinum':
      return { price: '€997/month' };
    default:
      return { price: 'Free' };
  }
};

export const getStripePriceId = (planType: string, cycle: 'monthly' | 'yearly' = 'monthly'): string => {
  // Updated with Estonia Stripe organization price IDs - CASE SENSITIVE ACCURACY
  switch (planType) {
    // DIY Service Plans
    case 'basicMonth':
      return 'price_1SCnAL8AHkLKjeVHKTbul7zu'; // Eng_Perfect_BasicMonth - €8/month
    case 'basicYear':
      return 'price_1SCn0C8AHkLKjeVHaIm0y9Fb'; // Eng_Perfect_BasicYear - €40/year (corrected: HaIm0y9Fb)
    case 'premiumMonth':
      return 'price_1SCmor8AHkLKjeVHlCHyxR7f'; // Eng_Perfect_PremiumMonth - €29/month (corrected: HlCHyxR7f)
    case 'premiumYear':
      return 'price_1SCm5A8AHkLKjeVH7Hle1wl2'; // Eng_Perfect_Premium_Year - €199/year
    case 'flexy':
      return 'price_1RTHNhGCd9fidigrric9VnxJ'; // Flex Plan (keeping existing)
    
    // DFY Service Plans
    case 'dfySilver':
      return 'price_1SCoNk8AHkLKjeVHvxIEwRib'; // Silver Starter - €297/month
    case 'dfyGold':
      return 'price_1SCoji8AHkLKjeVHz77lzCmX'; // Golden Growth - €497/month (corrected from Excel)
    case 'dfyPlatinum':
      return 'price_1SCoty8AHkLKjeVHDGdUy6C0'; // Platinum Pro - €997/month
    default:
      return '';
  }
};

export const getStripeProductId = (planType: string, cycle: 'monthly' | 'yearly' = 'monthly'): string => {
  // Updated with Estonia Stripe organization product IDs - CASE SENSITIVE ACCURACY
  switch (planType) {
    // DIY Service Plans
    case 'basicMonth':
      return 'prod_T95LKpcmJ2nOgq'; // Eng_Perfect_BasicMonth
    case 'basicYear':
      return 'prod_T95AHbAGNlnWMe'; // Eng_Perfect_BasicYear (corrected: NlnWMe)
    case 'premiumMonth':
      return 'prod_T94yxSjx8xT4Ga'; // Eng_Perfect_PremiumMonth
    case 'premiumYear':
      return 'prod_T94DlV1263MoHf'; // Eng_Perfect_Premium_Year (corrected: T94DlV1263MoHf)
    case 'flexy':
      return 'prod_SO3UmcTFa3cSl7'; // Flex Plan (keeping existing)
    
    // DFY Service Plans
    case 'dfySilver':
      return 'prod_T96aHxuFqm4F4C'; // Silver Starter
    case 'dfyGold':
      return 'prod_T96xEaw8ftOzrC'; // Golden Growth
    case 'dfyPlatinum':
      return 'prod_T9787TZfpJXhOQ'; // Platinum Pro
    default:
      return '';
  }
};

export const getStripePurchaseUrl = (planType: string, cycle: 'monthly' | 'yearly' = 'monthly'): string => {
  // Updated purchase URLs with Estonia Stripe organization URLs - CASE SENSITIVE ACCURACY
  switch (planType) {
    // DIY Service Plans
    case 'basicMonth':
      return 'https://buy.stripe.com/6oU14h7JKcRT34ecgV1Fe02'; // Eng_Perfect_BasicMonth - €8/month (corrected: 6oU14h7JKcRT34ecgV1Fe02)
    case 'basicYear':
      return 'https://buy.stripe.com/4gM00d9RS8BDfR01Ch1Fe03'; // Eng_Perfect_BasicYear - €40/year (corrected: 4gM00d9RS8BDfR01Ch1Fe03)
    case 'premiumMonth':
      return 'https://buy.stripe.com/cNi9AN1lm5prcEO94J1Fe01'; // Eng_Perfect_PremiumMonth - €29/month
    case 'premiumYear':
      return 'https://buy.stripe.com/eVq8wJ7JKf0120adkZ1Fe00'; // Eng_Perfect_Premium_Year - €199/year
    case 'flexy':
      return 'https://buy.stripe.com/28E4gz2PjeyDd8KatneAg05'; // Flex Plan (keeping existing)
    
    // DFY Service Plans
    case 'dfySilver':
      return 'https://buy.stripe.com/14A6oB6FG3hjfR0ft71Fe04'; // Silver Starter - €297/month (corrected: 14A6oB6FG3hjfR0ft71Fe04)
    case 'dfyGold':
      return 'https://buy.stripe.com/7sY6oBe883hjfR0a8N1Fe05'; // Golden Growth - €497/month
    case 'dfyPlatinum':
      return 'https://buy.stripe.com/eVq6oB6FG5prcEOdkZ1Fe06'; // Platinum Pro - €997/month (corrected: eVq6oB6FG5prcEOdkZ1Fe06)
    default:
      return '';
  }
};

export const STRIPE_CUSTOMER_PORTAL_URL = 'https://billing.stripe.com/p/login/7sYdR961v2PV9WyfNHeAg00';

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