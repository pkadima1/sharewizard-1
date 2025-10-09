/**
 * ReferralStatusDisplay Component
 * 
 * Debug component to show current referral status.
 * Useful for testing and development.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useReferralStatus } from '@/hooks/useReferralCapture';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { clearReferralData } from '@/lib/referrals';

interface ReferralStatusDisplayProps {
  isDevelopment?: boolean;
}

const ReferralStatusDisplay: React.FC<ReferralStatusDisplayProps> = ({ 
  isDevelopment = import.meta.env.DEV 
}) => {
  const { t } = useTranslation('partners');
  const referralStatus = useReferralStatus();

  // Only show in development mode
  if (!isDevelopment) {
    return null;
  }

  const handleClearReferral = () => {
    clearReferralData();
    window.location.reload();
  };

  if (!referralStatus.hasReferral) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 z-50 bg-gray-50 border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">{t('referral.debugTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Badge variant="secondary">{t('referral.noActiveReferral')}</Badge>
          <p className="text-xs text-gray-500 mt-2">
            {t('referral.testInstructions')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-green-50 border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-green-700">✅ Active Referral</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            {referralStatus.referralCode}
          </Badge>
        </div>
        
        {referralStatus.partnerInfo && (
          <div className="text-sm">
            <p className="font-medium text-green-800">
              {referralStatus.partnerInfo.displayName}
            </p>
            {referralStatus.partnerInfo.companyName && (
              <p className="text-green-600 text-xs">
                {referralStatus.partnerInfo.companyName}
              </p>
            )}
            <p className="text-green-600 text-xs">
              {t('dashboard.commissionRate')}: {(referralStatus.partnerInfo.commissionRate * 100).toFixed(0)}%
            </p>
          </div>
        )}
        
        {referralStatus.timestamp && (
          <p className="text-xs text-green-500">
            {t('referral.capturedStatus')}: {new Date(referralStatus.timestamp).toLocaleString()}
          </p>
        )}
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleClearReferral}
          className="w-full text-xs bg-white hover:bg-red-50 border-red-200 text-red-600"
        >
          {t('referral.clearReferral')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReferralStatusDisplay;
