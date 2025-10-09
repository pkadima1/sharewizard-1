import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStripePriceId } from '@/lib/subscriptionUtils';

interface DFYPricingPlansProps {
  onPurchase: (planType: string, priceId: string) => void;
  isLoading: { [key: string]: boolean };
}

const DFYPricingPlans: React.FC<DFYPricingPlansProps> = ({ onPurchase, isLoading }) => {
  const { t } = useTranslation('pricing');
  
  const dfyPlans = [
    {
      id: 'dfySilver',
      name: t('dfyPlans.silver.name', 'Silver Starter'),
      price: t('dfyPlans.silver.price', '€297'),
      period: t('dfyPlans.silver.period', '/month'),
      badge: null,
      icon: <Star className="h-6 w-6" />,
      features: [
        t('dfyPlans.silver.features.blogPosts', '16 blog posts (800-1,000 words)'),
        t('dfyPlans.silver.features.images', '1 image per blog + captions'),
        t('dfyPlans.silver.features.scheduling', 'Scheduling to social channels'),
        t('dfyPlans.silver.features.review', 'Domain-specialist human review included')
      ],
      buttonText: t('dfyPlans.silver.button', 'Get Starter'),
      popular: false,
      color: 'violet'
    },
    {
      id: 'dfyGold',
      name: t('dfyPlans.gold.name', 'Golden Growth'),
      price: t('dfyPlans.gold.price', '€497'),
      period: t('dfyPlans.gold.period', '/month'),
      badge: t('dfyPlans.gold.badge', 'Most Popular'),
      icon: <Crown className="h-6 w-6" />,
      features: [
        t('dfyPlans.gold.features.blogPosts', '30 blog posts (1,000-1,200 words)'),
        t('dfyPlans.gold.features.images', '2 images per blog'),
        t('dfyPlans.gold.features.reels', '6 reels/month'),
        t('dfyPlans.gold.features.captions', '60 caption + media posts'),
        t('dfyPlans.gold.features.podcasts', '4 audio podcast summaries'),
        t('dfyPlans.gold.features.strategyCall', '20-min monthly strategy call'),
        t('dfyPlans.gold.features.report', 'Monthly insights report'),
        t('dfyPlans.gold.features.review', 'Domain-specialist human review included')
      ],
      buttonText: t('dfyPlans.gold.button', 'Upgrade to Growth'),
      popular: true,
      color: 'orange'
    },
    {
      id: 'dfyPlatinum',
      name: t('dfyPlans.platinum.name', 'Platinum Pro'),
      price: t('dfyPlans.platinum.price', '€997'),
      period: t('dfyPlans.platinum.period', '/month'),
      badge: null,
      icon: <Zap className="h-6 w-6" />,
      features: [
        t('dfyPlans.platinum.features.blogPosts', '50 blog posts (1,000-1,400 words)'),
        t('dfyPlans.platinum.features.images', '2 images per blog'),
        t('dfyPlans.platinum.features.reels', '10 reels/month'),
        t('dfyPlans.platinum.features.captions', '100 caption + media posts'),
        t('dfyPlans.platinum.features.monitoring', 'Competitor monitoring'),
        t('dfyPlans.platinum.features.strategyCall', '30-min monthly strategy call'),
        t('dfyPlans.platinum.features.review', 'Domain-specialist human review included')
      ],
      buttonText: t('dfyPlans.platinum.button', 'Scale with Pro'),
      popular: false,
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string, isPopular: boolean) => {
    const baseClasses = isPopular ? 'ring-2 scale-105' : '';
    
    switch (color) {
      case 'orange':
        return {
          card: `${baseClasses} ring-orange-500`,
          badge: 'bg-orange-500 text-white',
          icon: 'text-orange-500',
          button: 'bg-orange-500 hover:bg-orange-600 text-white',
          highlight: 'bg-orange-50 dark:bg-orange-900/20',
          highlightText: 'text-orange-700 dark:text-orange-300'
        };
      case 'purple':
        return {
          card: `${baseClasses} ring-purple-500`,
          badge: 'bg-purple-500 text-white',
          icon: 'text-purple-500',
          button: 'bg-purple-500 hover:bg-purple-600 text-white',
          highlight: 'bg-purple-50 dark:bg-purple-900/20',
          highlightText: 'text-purple-700 dark:text-purple-300'
        };
      default: // violet
        return {
          card: `${baseClasses} ring-violet-500`,
          badge: 'bg-violet-500 text-white',
          icon: 'text-violet-500',
          button: 'bg-violet-500 hover:bg-violet-600 text-white',
          highlight: 'bg-violet-50 dark:bg-violet-900/20',
          highlightText: 'text-violet-700 dark:text-violet-300'
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
      {dfyPlans.map((plan) => {
        const colors = getColorClasses(plan.color, plan.popular);
        
        return (
          <div 
            key={plan.id}
            className={cn(
              "card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 rounded-xl",
              colors.card
            )}
          >
            {plan.badge && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className={cn("px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg", colors.badge)}>
                  {plan.badge}
                </span>
              </div>
            )}
            
            <div className="p-5 border-b border-adaptive">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center mb-2">
                    <div className={cn("mr-3", colors.icon)}>{plan.icon}</div>
                    <h3 className="text-xl font-bold text-adaptive-primary">
                      {plan.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {t(`dfyPlans.${plan.id.split('dfy')[1].toLowerCase()}.description`, 'Professional managed content service')}
                  </p>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adaptive-primary">
                    {plan.price}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm ml-2">
                    {plan.period}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <ul className="space-y-2.5 mb-5">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className={cn("mb-3 p-3 rounded-lg", colors.highlight)}>
                <p className={cn("text-xs", colors.highlightText)}>
                  {t(`dfyPlans.${plan.id.split('dfy')[1].toLowerCase()}.highlight`, 'Professional managed service with human oversight')}
                </p>
              </div>
              
              <Button
                className={cn("w-full py-6 text-base font-medium shadow-lg border border-adaptive", colors.button)}
                onClick={() => onPurchase(plan.id, getStripePriceId(plan.id, 'monthly'))}
                disabled={isLoading[plan.id]}
              >
                {isLoading[plan.id] ? t('loading.processing', 'Processing...') : plan.buttonText}
              </Button>
              
              <p className="text-xs text-center text-adaptive-tertiary mt-2">
                <span className="text-gray-500 dark:text-gray-400">
                  {t('dfyPlans.terms', 'Managed service subscription. Cancel anytime.')}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default DFYPricingPlans;
