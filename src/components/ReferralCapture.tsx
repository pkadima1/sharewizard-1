/**
 * ReferralCapture Component
 * 
 * Global component that captures referral codes from URL parameters
 * and shows appropriate toast notifications to users.
 */

import React from 'react';
import { useReferralCapture } from '@/hooks/useReferralCapture';

const ReferralCapture: React.FC = () => {
  // This hook automatically captures referral codes and shows toasts
  useReferralCapture(true);
  
  // This component doesn't render anything visible
  return null;
};

export default ReferralCapture;
