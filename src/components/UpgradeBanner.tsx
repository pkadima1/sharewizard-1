import React from 'react';
import { useTranslation } from 'react-i18next';

const UpgradeBanner = () => {
  const { t } = useTranslation(['common', 'wizard']);
  
  return (
    <div className="bg-[#1e1e1e] text-white p-6 rounded-xl shadow-lg text-center max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-2">{t('wizard:upgradeBanner.title', '🎁 You\'ve Used Your 3 Free Captions')}</h2>
      <p className="text-sm text-gray-300 mb-1">{t('wizard:upgradeBanner.subtitle', 'But you\'re just getting started…')}</p>      <ul className="text-left text-gray-100 mt-4 mb-4 space-y-2 list-disc list-inside">
        <li dangerouslySetInnerHTML={{ __html: t('wizard:upgradeBanner.bonusRequests', '<strong>Includes 5 Bonus Requests</strong> with 5-Day Free Trial') }} />
        <li dangerouslySetInnerHTML={{ __html: t('wizard:upgradeBanner.basicPlan', '<strong>Basic Monthly Plan:</strong> Only $8.00/month') }} />
        <li>{t('wizard:upgradeBanner.requestsPerMonth', '70 requests/month — cancel anytime')}</li>
      </ul>      <p className="text-xs text-gray-400 mb-4"
         dangerouslySetInnerHTML={{ __html: t('wizard:upgradeBanner.trialPromo', '🎯 Start with our <strong>5-day free trial</strong> — includes 5 bonus requests') }}
      />
      
      <div className="flex items-center justify-center mb-4 text-sm text-gray-300">
        <span className="inline-flex items-center">
          <span className="mr-2">🎯</span>
          <span dangerouslySetInnerHTML={{ __html: t('wizard:upgradeBanner.checkboxText', 'Start with our <strong>5-day free trial</strong> — includes 5 bonus requests') }} />
        </span>
      </div>

      <a
        href="https://engageperfect.com/pricing?plan=basic_monthly"
        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white font-semibold text-base"
      >
        {t('wizard:upgradeBanner.ctaButton', 'Start Free Trial for $8.00/month →')}
      </a>
    </div>
  );
};

export default UpgradeBanner;