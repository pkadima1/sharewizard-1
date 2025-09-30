import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  serverTimestamp, 
  collection, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  increment
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Check if we're using Firebase emulators
const isUsingEmulators = process.env.NODE_ENV === 'development' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
import { DEFAULT_REQUEST_LIMIT } from '@/lib/constants';
import { processSignupReferralAttribution } from '@/services/referralService';
import { 
  checkUserPlan, 
  markUserForTrial, 
  getStripePriceId 
} from '@/lib/subscriptionUtils';
import { createSubscriptionCheckout } from '@/lib/stripe';
import { UserProfile, Subscription } from '@/types/core';
import { createAppError } from '@/utils/typeGuards';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isPartner: boolean;
  signUp: (email: string, password: string, username: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<boolean>;
  incrementRequestUsage: () => Promise<boolean>;
  checkRequestAvailability: () => Promise<{
    canMakeRequest: boolean;
    message: string;
    usagePercentage: number;
  }>;
  activateFreeTrial: (selectedPlan: 'basicMonth' | 'basicYear', selectedCycle: 'monthly' | 'yearly') => Promise<boolean>;
  subscription: Subscription | null;
}

interface AdditionalUserData {
  displayName?: string;
  [key: string]: unknown;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isPartner, setIsPartner] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is a partner
  const checkPartnerRole = useCallback(async (uid: string): Promise<boolean> => {
    try {
      console.log('🔍 checkPartnerRole: Checking partner status for user:', uid);
      const partnerQuery = query(
        collection(db, 'partners'),
        where('uid', '==', uid),
        where('status', '==', 'active')
      );
      
      const partnerSnapshot = await getDocs(partnerQuery);
      const isPartnerUser = !partnerSnapshot.empty;
      
      console.log('🔍 checkPartnerRole: Partner status:', isPartnerUser);
      return isPartnerUser;
    } catch (error) {
      console.error('🔍 checkPartnerRole: Error checking partner role:', error);
      return false;
    }
  }, []);

  const createUserProfile = useCallback(async (user: User, additionalData: AdditionalUserData = {}) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    
    try {
      const snapshot = await getDoc(userRef);
      
      if (!snapshot.exists()) {
        const { email, displayName, photoURL } = user;
        const createdAt = serverTimestamp();
        
        try {
          await setDoc(userRef, {
            displayName: displayName || additionalData.displayName || '',
            email,
            photoURL: photoURL || '',
            createdAt,
            requests_used: 0,
            plan_type: 'free',
            requests_limit: DEFAULT_REQUEST_LIMIT.free,
            ...additionalData,
          });
          
          // Process referral attribution for new users
          try {
            const attributionResult = await processSignupReferralAttribution(
              user.uid,
              {
                source: 'signup',
                landingPage: window.location.href,
                userAgent: navigator.userAgent,
                referrerUrl: document.referrer
              }
            );
            
            if (attributionResult.success) {
              console.log('✅ User successfully attributed to partner:', {
                userId: user.uid,
                partnerId: attributionResult.partnerId,
                partnerName: attributionResult.partnerName,
                referralId: attributionResult.referralId
              });
              
              // Show success toast with partner information
              toast({
                title: "🎉 " + (window.i18next?.t?.('auth.referralAttribution.success.title') || "Referral Applied!"),
                description: (window.i18next?.t?.('auth.referralAttribution.success.description', { 
                  partnerName: attributionResult.partnerName 
                }) || `You've been attributed to ${attributionResult.partnerName}`),
                duration: 6000,
              });
            } else {
              console.log('ℹ️ No referral attribution for new user:', attributionResult.message);
            }
          } catch (attributionError) {
            console.error('⚠️ Referral attribution failed during signup:', attributionError);
            // Don't fail the signup process if attribution fails
          }
          
          toast({
            title: "Profile created",
            description: "Your user profile has been created successfully",
          });
        } catch (error: unknown) {
          const appError = createAppError(error);
          console.error("Error creating user profile:", appError.message);
          toast({
            title: "Error",
            description: `Failed to create user profile: ${appError.message || 'Check Firestore rules'}`,
            variant: "destructive",
          });
          throw appError;
        }
      }
      
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<UserProfile, 'id'>;
        setUserProfile({ id: userDoc.id, ...userData });
      }
    } catch (error: unknown) {
      console.error("Error in profile creation flow:", error);
      const errorMessage = error instanceof Error ? error.message : 'Permission denied - check Firestore rules';
      toast({
        title: "Error",
        description: `Profile creation failed: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const incrementRequestUsage = async (): Promise<boolean> => {
    if (!currentUser || !userProfile) {
      toast({
        title: "Error",
        description: "You must be logged in to make requests",
        variant: "destructive",
      });
      return false;
    }

    try {
      const planCheck = await checkUserPlan(currentUser.uid);
      
      if (planCheck.status !== 'OK') {
        toast({
          title: planCheck.status === 'UPGRADE' ? "Upgrade Required" : "Request Limit Reached",
          description: planCheck.message,
          variant: "destructive",
        });
        return false;
      }
      
      if (planCheck.usagePercentage >= 80) {
        toast({
          title: "Running Low on Requests",
          description: planCheck.message,
        });
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        requests_used: increment(1)
      });

      const updatedUserDoc = await getDoc(userRef);
      if (updatedUserDoc.exists()) {
        const userData = updatedUserDoc.data() as Omit<UserProfile, 'id'>;
        setUserProfile({ id: updatedUserDoc.id, ...userData });
        
        if (userData.requests_used >= userData.requests_limit) {
          toast({
            title: "Request limit reached",
            description: "You've reached your plan's request limit. Please upgrade to continue.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      }
      return false;
    } catch (error: unknown) {
      console.error("Error tracking request usage:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to track request usage: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const activateFreeTrial = async (selectedPlan: 'basicMonth' | 'basicYear', selectedCycle: 'monthly' | 'yearly'): Promise<boolean> => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to activate a trial",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const success = await markUserForTrial(currentUser.uid, selectedPlan, selectedCycle);
      
      if (success) {
        const priceId = getStripePriceId(selectedPlan, selectedCycle);
        
        if (!priceId) {
          toast({
            title: "Error",
            description: "Invalid plan selection",
            variant: "destructive",
          });
          return false;
        }
        
        const checkoutUrl = await createSubscriptionCheckout(currentUser.uid, priceId);
        window.location.href = checkoutUrl;
        
        return true;
      } else {
        toast({
          title: "Error",
          description: "Failed to set up trial. You might not be eligible.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: unknown) {
      console.error("Error activating trial:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to activate trial: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const checkRequestAvailability = async (): Promise<{
    canMakeRequest: boolean;
    message: string;
    usagePercentage: number;
  }> => {
    if (!currentUser) {
      return {
        canMakeRequest: false,
        message: "You must be logged in to make requests",
        usagePercentage: 0
      };
    }

    try {
      const planCheck = await checkUserPlan(currentUser.uid);
      
      return {
        canMakeRequest: planCheck.status === 'OK',
        message: planCheck.message,
        usagePercentage: planCheck.usagePercentage
      };
    } catch (error: unknown) {
      console.error("Error checking request availability:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        canMakeRequest: false,
        message: `Error: ${errorMessage}`,
        usagePercentage: 0
      };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        await updateProfile(result.user, {
          displayName: username,
        });
        
        await createUserProfile(result.user, { displayName: username });
      }
      
      return result;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };
  const login = async (email: string, password: string) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      // Handle user not found error appropriately
      if (error instanceof Error && 'code' in error && error.code === 'auth/user-not-found') {
        throw new Error("Account not found. Please sign up first.");
      }
      throw error;
    }
  };
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists before creating one
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      
      // Only create a profile if the user doesn't exist yet
      if (!userDoc.exists()) {
        await createUserProfile(result.user);
      }
      
      return result;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Add a function to refresh user profile data from Firestore
  const refreshUserProfile = async (): Promise<boolean> => {
    if (!currentUser) {
      return false;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<UserProfile, 'id'>;
        setUserProfile({ id: userDoc.id, ...userData });
        return true;
      } else {
        console.warn("User profile not found in Firestore during refresh");
        return false;
      }
    } catch (error: unknown) {
      console.error("Error refreshing user profile:", error);
      const errorMessage = error instanceof Error ? error.message : 'Check your connection';
      toast({
        title: "Error",
        description: `Failed to refresh profile: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    let unsubscribeFromSubscription: () => void = () => {};

    if (currentUser) {
      const subscriptionsRef = collection(db, 'customers', currentUser.uid, 'subscriptions');
      const activeSubscriptionsQuery = query(
        subscriptionsRef,
        where('status', 'in', ['trialing', 'active'])
      );

      unsubscribeFromSubscription = onSnapshot(activeSubscriptionsQuery, async (snapshot) => {
        const subscriptionDoc = snapshot.docs[0];
        
        if (subscriptionDoc) {
          const subscriptionData = subscriptionDoc.data();
          console.log("Active subscription found:", subscriptionData);
          
          // Transform Firestore data to match Subscription interface
          const subscription: Subscription = {
            id: subscriptionDoc.id,
            userId: currentUser.uid,
            status: subscriptionData.status as 'active' | 'canceled' | 'past_due' | 'unpaid',
            plan: subscriptionData.role as 'basic' | 'premium' | 'flexy',
            cycle: subscriptionData.interval as 'monthly' | 'yearly',
            currentPeriodStart: subscriptionData.current_period_start,
            currentPeriodEnd: subscriptionData.current_period_end,
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
            stripeSubscriptionId: subscriptionData.stripe_subscription_id || subscriptionData.id,
            stripeCustomerId: subscriptionData.stripe_customer_id || currentUser.uid
          };
          
          setSubscription(subscription);

          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (userData.trial_pending) {
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
              
              toast({
                title: "Trial Activated",
                description: "Your 5-day free trial has been activated.",
              });
            } else {
              let planType = 'free';              if (subscriptionData.status === 'trialing') {
                planType = 'trial';
              } else if (subscriptionData.role === 'basicMonth' || subscriptionData.role === 'basicYear') {
                planType = subscriptionData.role; // Use the actual role
              } else if (subscriptionData.role === 'premiumMonth' || subscriptionData.role === 'premiumYear') {
                planType = subscriptionData.role; // Use the actual role
              } else if (subscriptionData.role === 'flexy') {
                planType = 'flexy';
              }

              let requestsLimit = DEFAULT_REQUEST_LIMIT.free;
              if (subscriptionData.status === 'trialing') {
                requestsLimit = DEFAULT_REQUEST_LIMIT.trial;
              } else if (subscriptionData.role === 'basicMonth') {
                requestsLimit = DEFAULT_REQUEST_LIMIT.basicMonth;
              } else if (subscriptionData.role === 'basicYear') {
                requestsLimit = DEFAULT_REQUEST_LIMIT.basicYear;
              } else if (subscriptionData.role === 'premiumMonth') {
                requestsLimit = DEFAULT_REQUEST_LIMIT.premiumMonth;
              } else if (subscriptionData.role === 'premiumYear') {
                requestsLimit = DEFAULT_REQUEST_LIMIT.premiumYear;
              } else if (subscriptionData.role === 'flexy') {
                requestsLimit = DEFAULT_REQUEST_LIMIT.flexy;
              }

              const resetDate = new Date(subscriptionData.current_period_end.seconds * 1000);

              await updateDoc(userRef, {
                plan_type: planType,
                requests_limit: requestsLimit,
                reset_date: resetDate,
                trial_end_date: subscriptionData.status === 'trialing' ?
                  new Date(subscriptionData.trial_end.seconds * 1000) : null
              });
            }
            
            const updatedUserDoc = await getDoc(userRef);
            if (updatedUserDoc.exists()) {
              const userData = updatedUserDoc.data() as Omit<UserProfile, 'id'>;
              setUserProfile({ id: updatedUserDoc.id, ...userData });
            }
          }
        } else {
          console.log("No active subscription found");
          setSubscription(null);
        }
      }, (error: unknown) => {
        console.error("Error getting subscription:", error);
      });
    }

    return () => {
      if (unsubscribeFromSubscription) {
        unsubscribeFromSubscription();
      }
    };
  }, [currentUser, toast, createUserProfile]);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<UserProfile, 'id'>;
            setUserProfile({ id: userDoc.id, ...userData });
          } else {
            // In emulator mode, automatically create a development profile
            if (isUsingEmulators) {
              console.log("🔧 Creating development user profile in emulator");
              await createUserProfile(user, { displayName: user.displayName || 'Dev User' });
            } else {
              // Don't automatically create a profile in production
              console.warn("User exists in Firebase Auth but has no profile in Firestore");
            }
          }
          
          // Check partner role
          const partnerStatus = await checkPartnerRole(user.uid);
          setIsPartner(partnerStatus);
        } catch (error: unknown) {
          console.error("Error fetching user profile:", error);
          const errorMessage = error instanceof Error ? error.message : 'Check your connection';
          toast({
            title: "Error",
            description: `Failed to load profile: ${errorMessage}`,
            variant: "destructive",
          });
        }
      } else {
        setIsPartner(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [checkPartnerRole]);
  const value = {
    currentUser,
    userProfile,
    loading,
    isPartner,
    signUp,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    refreshUserProfile,
    incrementRequestUsage,
    checkRequestAvailability,
    activateFreeTrial,
    subscription
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
