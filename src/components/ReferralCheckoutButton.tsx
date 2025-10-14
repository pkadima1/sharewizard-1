/**
 * Example React Component showing how to use the new checkout system with referral metadata
 * 
 * This demonstrates the complete integration of Task 4 requirements:
 * 1. Reading referral code from client and passing to backend
 * 2. Validating code against Firestore and resolving partnerId
 * 3. Setting client_reference_id and metadata for webhooks
 * 4. Using customer_creation: 'always' for tracking
 * 5. Comprehensive error handling and user feedback
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { createAutoReferralCheckout, createSubscriptionCheckoutWithReferral } from '../lib/checkoutSession';
import { getReferralCode } from '../lib/referrals';

interface ReferralCheckoutButtonProps {
  priceId: string;
  mode: 'subscription' | 'payment';
  quantity?: number;
  planName: string;
  children: React.ReactNode;
}

export const ReferralCheckoutButton: React.FC<ReferralCheckoutButtonProps> = ({
  priceId,
  mode,
  quantity = 1,
  planName,
  children
}) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [hasReferral, setHasReferral] = useState(false);

  // Detect referral code on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const detectedReferralCode = getReferralCode(urlParams);
    
    if (detectedReferralCode) {
      setReferralCode(detectedReferralCode);
      setHasReferral(true);
      console.log('🎯 Referral code detected for checkout:', detectedReferralCode);
    }
  }, []);

  const handleCheckout = async () => {
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Starting referral-enhanced checkout process');
      
      // ========================================
      // TASK 4 IMPLEMENTATION: CHECKOUT SESSION WITH REFERRAL METADATA
      // ========================================
      // 
      // This function call demonstrates the complete Task 4 implementation:
      // 1. ✅ Reads current referral code via client call
      // 2. ✅ Passes referral code to backend Cloud Function
      // 3. ✅ Backend validates code against Firestore
      // 4. ✅ Backend resolves partnerId from validated code
      // 5. ✅ Backend sets client_reference_id: <referralCode>
      // 6. ✅ Backend sets metadata: { referralCode, partnerId, source: 'link' }
      // 7. ✅ Backend sets customer_creation: 'always'
      // 8. ✅ Returns session URL and proceeds as normal
      //
      const checkoutResult = await createAutoReferralCheckout(
        currentUser.uid,
        priceId,
        mode,
        {
          quantity,
          successUrl: `${window.location.origin}/dashboard?checkout_success=true&plan=${planName}`,
          cancelUrl: `${window.location.origin}/pricing?checkout_canceled=true`
        }
      );

      console.log('✅ Checkout session created with referral tracking:', {
        sessionId: checkoutResult.sessionId,
        hasReferral: checkoutResult.hasReferral,
        partnerId: checkoutResult.partnerId
      });

      // Redirect to Stripe Checkout
      if (checkoutResult.url) {
        window.location.href = checkoutResult.url;
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (error: any) {
      console.error('❌ Checkout failed:', error);
      setIsLoading(false);
      
      // Show user-friendly error message
      alert(`Checkout failed: ${error.message}`);
    }
  };

  return (
    <div className="relative">
      {/* Referral Status Indicator */}
      {hasReferral && (
        <div className="mb-2 text-sm text-green-600 font-medium">
          🎉 {t('referrals.applied')} (Code: {referralCode})
        </div>
      )}
      
      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={isLoading || !currentUser}
        className={`
          w-full px-6 py-3 rounded-lg font-semibold text-white
          ${isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
          transition-colors duration-200
        `}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>{t('referrals.processing')}</span>
          </div>
        ) : (
          children
        )}
      </button>
      
      {/* Processing Status */}
      {isLoading && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {hasReferral ? t('referrals.validating') : t('referrals.checkout.sessionCreated')}
        </div>
      )}
    </div>
  );
};

/**
 * Example usage in a pricing component
 */
export const PricingCardWithReferral: React.FC<{
  planName: string;
  priceId: string;
  price: string;
  features: string[];
}> = ({ planName, priceId, price, features }) => {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-2">{planName}</h3>
      <div className="text-3xl font-bold mb-4">{price}</div>
      
      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm">
            <span className="text-green-500 mr-2">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      
      {/* ========================================
          TASK 4 USAGE EXAMPLE
          ========================================
          
          This ReferralCheckoutButton demonstrates the complete
          Task 4 implementation in a real React component:
          
          1. Automatically detects referral codes from URL
          2. Validates referral codes via backend
          3. Creates checkout sessions with proper metadata
          4. Handles all error cases gracefully
          5. Provides user feedback throughout the process
      */}
      <ReferralCheckoutButton
        priceId={priceId}
        mode="subscription"
        planName={planName}
      >
        Get Started
      </ReferralCheckoutButton>
    </div>
  );
};

/**
 * Example usage for Flex pack purchases
 */
export const FlexPackCheckoutButton: React.FC<{
  priceId: string;
  quantity: number;
  packName: string;
}> = ({ priceId, quantity, packName }) => {
  return (
    <ReferralCheckoutButton
      priceId={priceId}
      mode="payment"
      quantity={quantity}
      planName={packName}
    >
      Buy {quantity} Credits
    </ReferralCheckoutButton>
  );
};

export default ReferralCheckoutButton;
