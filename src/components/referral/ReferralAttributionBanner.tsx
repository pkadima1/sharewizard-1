/**
 * Referral Attribution Banner Component
 * 
 * Displays referral attribution information to users who were referred by a partner.
 * Shows partner information and commission details in a user-friendly banner.
 * 
 * Features:
 * - Partner information display
 * - Commission rate information
 * - Referral code display
 * - Dismissible banner
 * - Localization support
 */

import React, { useState } from 'react';
import { useReferralAttribution } from '@/hooks/useReferralAttribution';
import { useTranslation } from 'react-i18next';
import { 
  Gift, 
  User, 
  Percent, 
  X, 
  ExternalLink,
  CheckCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Props for ReferralAttributionBanner component
 */
interface ReferralAttributionBannerProps {
  /** Whether to show the banner */
  show?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * Referral Attribution Banner Component
 */
export const ReferralAttributionBanner: React.FC<ReferralAttributionBannerProps> = ({
  show = true,
  onDismiss,
  showDetails = false,
  className = ''
}) => {
  const { t } = useTranslation('referrals');
  const { 
    hasReferralCode, 
    referralCode, 
    partnerInfo, 
    attributionResult, 
    isProcessing,
    error,
    clearAttribution 
  } = useReferralAttribution(false);
  
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if dismissed, no referral code, or not requested
  if (!show || isDismissed || !hasReferralCode || !referralCode) {
    return null;
  }

  // Show processing state
  if (isProcessing) {
    return (
      <Card className={`border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 dark:text-blue-200">
              {t('banner.processing')}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t('banner.error', { error })}
        </AlertDescription>
      </Alert>
    );
  }

  // Show success state
  if (attributionResult?.success && partnerInfo) {
    return (
      <Card className={`border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-lg text-green-800 dark:text-green-200">
                {t('banner.title')}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsDismissed(true);
                onDismiss?.();
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-green-700 dark:text-green-300">
            {t('banner.subtitle', { partnerName: partnerInfo.displayName })}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Partner Information */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-green-800 dark:text-green-200">
                  {partnerInfo.displayName}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {t('banner.referredBy')}
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                {referralCode}
              </Badge>
            </div>

            {/* Commission Information */}
            <div className="bg-green-100 dark:bg-green-800/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  {t('banner.commissionRate')}
                </span>
              </div>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {(partnerInfo.commissionRate * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                {t('banner.commissionDescription')}
              </div>
            </div>

            {/* Success Message */}
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm text-green-700 dark:text-green-300">
                {t('banner.successMessage', { partnerName: partnerInfo.displayName })}
              </div>
            </div>

            {/* Detailed Information */}
            {showDetails && (
              <div className="border-t border-green-200 dark:border-green-700 pt-3">
                <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                  <div>{t('banner.details.referralCode')}: {referralCode}</div>
                  <div>{t('banner.details.partnerId')}: {partnerInfo.partnerId}</div>
                  <div>{t('banner.details.commissionRate')}: {(partnerInfo.commissionRate * 100).toFixed(0)}%</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDismissed(true);
                  onDismiss?.();
                }}
                className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-800/30"
              >
                {t('banner.dismiss')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAttribution}
                className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-800/30"
              >
                {t('banner.clear')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show referral code without partner info
  if (hasReferralCode && referralCode) {
    return (
      <Card className={`border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gift className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  {t('banner.referralCode')}: {referralCode}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {t('banner.validating')}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsDismissed(true);
                onDismiss?.();
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default ReferralAttributionBanner;

