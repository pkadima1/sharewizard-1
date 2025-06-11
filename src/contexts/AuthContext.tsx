import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { 
  checkUserPlan, 
  markUserForTrial, 
  getStripePriceId 
} from '@/lib/subscriptionUtils';
import { createSubscriptionCheckout } from '@/lib/stripe';

interface AuthContextType {
  currentUser: User | null;
  userProfile: any | null;
  loading: boolean;
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
  subscription: any | null;
}

interface AdditionalUserData {
  displayName?: string;
  [key: string]: any;
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
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const createUserProfile = async (user: User, additionalData: AdditionalUserData = {}) => {
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
          
          toast({
            title: "Profile created",
            description: "Your user profile has been created successfully",
          });
        } catch (error: any) {
          console.error("Error creating user profile:", error);
          toast({
            title: "Error",
            description: `Failed to create user profile: ${error.message || 'Check Firestore rules'}`,
            variant: "destructive",
          });
          throw error;
        }
      }
      
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setUserProfile({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error: any) {
      console.error("Error in profile creation flow:", error);
      toast({
        title: "Error",
        description: `Profile creation failed: ${error.message || 'Permission denied - check Firestore rules'}`,
        variant: "destructive",
      });
    }
  };

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
        const userData = updatedUserDoc.data();
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
    } catch (error: any) {
      console.error("Error tracking request usage:", error);
      toast({
        title: "Error",
        description: `Failed to track request usage: ${error.message}`,
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
    } catch (error: any) {
      console.error("Error activating trial:", error);
      toast({
        title: "Error",
        description: `Failed to activate trial: ${error.message}`,
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
    } catch (error: any) {
      console.error("Error checking request availability:", error);
      return {
        canMakeRequest: false,
        message: `Error: ${error.message}`,
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
    } catch (error: any) {
      // Handle user not found error appropriately
      if (error.code === 'auth/user-not-found') {
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
        const userData = userDoc.data();
        setUserProfile({ id: userDoc.id, ...userData });
        return true;
      } else {
        console.warn("User profile not found in Firestore during refresh");
        return false;
      }
    } catch (error: any) {
      console.error("Error refreshing user profile:", error);
      toast({
        title: "Error",
        description: `Failed to refresh profile: ${error.message || 'Check your connection'}`,
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
        const subscriptionData = snapshot.docs[0]?.data();
        
        if (subscriptionData) {
          console.log("Active subscription found:", subscriptionData);
          setSubscription(subscriptionData);

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
              let planType = 'free';
              if (subscriptionData.status === 'trialing') {
                planType = 'trial';
              } else if (subscriptionData.role === 'basicMonth' || subscriptionData.role === 'basicYear') {
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
              setUserProfile({ id: updatedUserDoc.id, ...updatedUserDoc.data() });
            }
          }
        } else {
          console.log("No active subscription found");
          setSubscription(null);
        }
      }, (error) => {
        console.error("Error getting subscription:", error);
      });
    }

    return () => {
      if (unsubscribeFromSubscription) {
        unsubscribeFromSubscription();
      }
    };
  }, [currentUser]);  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            setUserProfile({ id: userDoc.id, ...userDoc.data() });
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
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
          toast({
            title: "Error",
            description: `Failed to load profile: ${error.message || 'Check your connection'}`,
            variant: "destructive",
          });
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);
  const value = {
    currentUser,
    userProfile,
    loading,
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
