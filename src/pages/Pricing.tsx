import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { createSubscriptionCheckout, createFlexCheckout } from '@/lib/stripe';
import { createEnhancedSubscriptionCheckout, createEnhancedFlexCheckout } from '@/lib/checkoutEnhancements';
import { Button } from '@/components/ui/button';
import { Check, Info, ChevronRight, Gift, Star } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { getStripePriceId } from '@/lib/subscriptionUtils';
import { cn } from '@/lib/utils';
import { usePageAnalytics } from '@/components/analytics/PageAnalytics';
import { trackSubscription, trackButtonClick, trackFeatureUsage, trackError } from '@/utils/analytics';
import ServiceTypeSelector from '@/components/pricing/ServiceTypeSelector';
import DFYPricingPlans from '@/components/pricing/DFYPricingPlans';

const Pricing: React.FC = () => {
  // Analytics: Track page view automatically
  usePageAnalytics('Pricing - EngagePerfect');

  const [searchParams] = useSearchParams();
  const basicPlanRef = useRef<HTMLDivElement>(null);
  
  // Get initial billing cycle from URL params or default to yearly
  const urlBilling = searchParams.get('billing');
  const initialBillingCycle = (urlBilling === 'monthly' || urlBilling === 'yearly') ? urlBilling : 'yearly';
  
  // Set yearly as the default billing cycle for DIY, monthly only for DFY
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(initialBillingCycle);
  const [serviceType, setServiceType] = useState<'diy' | 'dfy'>('diy');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('pricing');
  const [isLoading, setIsLoading] = useState<{
    [key: string]: boolean;
  }>({});
  
  // Handle URL params and auto-scroll to Basic plan
  useEffect(() => {
    const highlightPlan = searchParams.get('highlight');
    if (highlightPlan === 'basic' && basicPlanRef.current) {
      // Smooth scroll to Basic plan after a brief delay
      setTimeout(() => {
        basicPlanRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add a subtle highlight animation
        basicPlanRef.current?.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2', 'ring-offset-background');
        setTimeout(() => {
          basicPlanRef.current?.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2', 'ring-offset-background');
        }, 3000);
      }, 500);
    }
  }, [searchParams]);
  
  // Analytics: Track billing cycle changes
  const handleBillingCycleChange = (cycle: 'monthly' | 'yearly') => {
    setBillingCycle(cycle);
    trackFeatureUsage('billing_cycle_toggle', {
      selected_cycle: cycle,
      previous_cycle: billingCycle
    });
  };

  // Handle service type change
  const handleServiceTypeChange = (type: 'diy' | 'dfy') => {
    setServiceType(type);
    // Reset billing cycle to yearly for DIY, keep monthly for DFY
    if (type === 'diy') {
      setBillingCycle('yearly');
    }
    trackFeatureUsage('service_type_toggle', {
      selected_type: type,
      previous_type: serviceType
    });
  };

  const handlePurchase = async (plan: string, priceId: string) => {
    try {
      // Analytics: Track subscription attempt
      trackSubscription('purchase_initiated', plan);
      trackButtonClick('subscribe', `${plan}_${billingCycle}`);
      
      setIsLoading(prev => ({
        ...prev,
        [plan]: true
      }));
      
      if (!currentUser) {
        // Redirect to signup if user is not logged in
        navigate('/signup', {
          state: {
            from: 'pricing',
            plan
          }
        });
        return;
      }
      
      let checkoutUrl: string;
      
      if (plan === 'flexy') {
        // Use enhanced flex checkout with promotion code support
        checkoutUrl = await createEnhancedFlexCheckout(currentUser.uid, priceId);
      } else {
        // Handle different service types
        const isDFYPlan = plan.startsWith('dfy');
        const isPremiumPlan = plan.includes('premium');
        
        if (isDFYPlan) {
          // DFY plans start immediately (no trial)
          checkoutUrl = await createEnhancedSubscriptionCheckout(currentUser.uid, priceId, {
            trialDays: 0,
            includeUpsells: false,
            serviceType: 'dfy'
          });
        } else {
          // DIY plans: Only Basic plans get trials, Premium plans start immediately
          checkoutUrl = await createEnhancedSubscriptionCheckout(currentUser.uid, priceId, {
            trialDays: isPremiumPlan ? 0 : 5,
            includeUpsells: true,
            serviceType: 'diy'
          });
        }
      }
      
      // Redirect to the checkout URL
      window.location.href = checkoutUrl;
      
      // Analytics: Track successful checkout redirect
      trackSubscription('checkout_redirect_success', plan);
      
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      
      // Analytics: Track checkout error
      trackError('checkout_error', error.message, 'pricing_page');
      trackSubscription('checkout_failed', plan);
      
      toast({
        title: t('errors.title', 'Error'),
        description: `${t('errors.checkout')}: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(prev => ({
        ...prev,
        [plan]: false
      }));
    }
  };

  const freeTrial = () => {
    if (!currentUser) {
      navigate('/signup', {
        state: {
          from: 'pricing',
          plan: 'trial'
        }
      });
      return;
    }

    // In a real implementation, we would call an API to activate the trial
    navigate('/caption-generator');
  };

  return (
    <div className="min-h-screen bg-adaptive-primary text-adaptive-primary">
      <div className="px-4 py-16 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-gray-50">
            {serviceType === 'diy' ? t('title') : t('dfyPlans.title', 'Professional Content Services')}
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-200 mb-6 max-w-2xl mx-auto">
            {serviceType === 'diy' 
              ? t('subtitle') 
              : t('dfyPlans.subtitle', 'Choose your managed content service tier')
            }
          </p>
          
          {/* Service Type Selector */}
          <ServiceTypeSelector
            selectedServiceType={serviceType}
            onServiceTypeChange={handleServiceTypeChange}
          />
          
          {/* Billing cycle switch - only show for DIY service */}
          {serviceType === 'diy' && (
            <div className="inline-flex items-center bg-adaptive-tertiary backdrop-blur-sm rounded-full p-1 mb-4 border border-adaptive">
            <button 
              className={cn(
                "py-2 px-4 rounded-full transition-colors duration-200", 
                billingCycle === 'monthly' 
                  ? 'bg-violet-600 text-white' 
                  : 'text-adaptive-secondary hover:text-adaptive-primary'
              )} 
              onClick={() => handleBillingCycleChange('monthly')}
            >
              {t('billingCycle.monthly')}
            </button>
            <button 
              className={cn(
                "py-2 px-4 rounded-full transition-colors duration-200", 
                billingCycle === 'yearly' 
                  ? 'bg-violet-600 text-white' 
                  : 'text-adaptive-secondary hover:text-adaptive-primary'
              )} 
              onClick={() => handleBillingCycleChange('yearly')}
            >
              {t('billingCycle.yearly')}
            </button>
            </div>
          )}
          
          {serviceType === 'diy' && billingCycle === 'yearly' && (
            <div className="text-sm text-green-400 font-medium mb-3">
              {t('yearlyDiscount')}
            </div>
          )}
        </div>

        {/* Free Trial Banner - only show for DIY service */}
        {serviceType === 'diy' && (
          <div className="bg-gradient-to-r from-violet-700 to-indigo-600 rounded-xl p-6 shadow-lg mb-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <Gift className="h-8 w-8 text-white mr-4" />
                <div>
                  <h3 className="text-xl font-bold text-white">{t('freeTrialBanner.title')}</h3>
                  <p className="text-white/90">{t('freeTrialBanner.description')}</p>
                </div>
              </div>
              <Button 
                className="bg-white text-violet-700 hover:bg-white/90 px-6 py-5 text-base font-medium shadow-md"
                onClick={freeTrial}
              >
                {t('freeTrialBanner.button')}
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Pricing Cards - Show different plans based on service type */}
        {serviceType === 'diy' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 mb-12 max-w-6xl mx-auto">          {/* Free Plan */}
          <div className="card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1 rounded-xl">
            <div className="p-6 border-b border-adaptive">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-adaptive-primary">{t('plans.free.title')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {t('plans.free.description')}
                  </p>
                </div>
              </div>
                <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adaptive-primary">{t('plans.free.price')}</span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm ml-2">{t('plans.free.period')}</span>
                </div>
                <div className="text-sm text-adaptive-tertiary font-medium mt-1">
                  <span className="text-gray-500 dark:text-gray-400">{t('plans.free.noCreditCard')}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.free.features.requests')}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.free.features.sharing')}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.free.features.captions')}</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 text-red-400 mr-2 flex-shrink-0">🚫</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('plans.free.features.noBlog')}</span>
                </li>
              </ul>
              
              <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  {t('plans.free.highlight')}
                </p>
              </div>
              
              <Button 
                className="w-full bg-adaptive-tertiary hover:bg-adaptive-secondary text-adaptive-primary py-6 text-base shadow-lg border border-adaptive" 
                onClick={freeTrial} 
              >
                {t('plans.free.button')}
              </Button>
              <p className="text-xs text-center text-adaptive-tertiary mt-3">
                <span className="text-gray-500 dark:text-gray-400">{t('plans.free.noCreditCard')}</span>
              </p>
            </div>
          </div>          {/* Basic Plan */}
          <div 
            ref={basicPlanRef}
            className="card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-1 rounded-xl"
          >
            <div className="p-6 border-b border-adaptive">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-adaptive-primary">{t('plans.basic.title')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {t('plans.basic.description')}
                  </p>
                </div>
              </div>
                <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adaptive-primary">
                    {billingCycle === 'monthly' ? t('plans.basic.price.monthly') : t('plans.basic.price.yearly')}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm ml-2">
                    {billingCycle === 'monthly' ? t('plans.basic.period.monthly') : t('plans.basic.period.yearly')}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-400 font-medium mt-1">
                    {t('plans.basic.yearlySaving')}
                  </div>
                )}
              </div>
                <div className="mt-4 space-y-2">
                <div className="inline-flex items-center bg-violet-600/20 px-3 py-1 rounded-full">
                  <Gift className="h-4 w-4 text-violet-400 mr-1" />
                  <span className="text-xs font-medium text-violet-400">{t('plans.basic.trial')}</span>
                </div>
                {billingCycle === 'monthly' && (
                  <div className="inline-flex items-center bg-green-600/20 px-3 py-1 rounded-full ml-2">
                    <span className="text-xs font-medium text-green-400">{t('plans.basic.discount')}</span>
                  </div>
                )}
              </div>
            </div>              <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.basic.features.trialRequests')}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {billingCycle === 'monthly' ? t('plans.basic.features.captions.monthly') : t('plans.basic.features.captions.yearly')}
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {billingCycle === 'monthly' ? t('plans.basic.features.blogs.monthly') : t('plans.basic.features.blogs.yearly')} {t('plans.basic.features.blogs.wordLimit')}
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.basic.features.mediaSupport')}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.basic.features.customization')}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.basic.features.preview')}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.basic.features.sharing')}</span>
                </li>
              </ul>
              
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('plans.basic.highlight')}
                </p>
              </div>
              
              <Button 
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 text-base shadow-lg border border-adaptive" 
                onClick={() => handlePurchase(
                  billingCycle === 'monthly' ? 'basicMonth' : 'basicYear',
                  getStripePriceId(billingCycle === 'monthly' ? 'basicMonth' : 'basicYear', billingCycle)
                )} 
                disabled={isLoading[billingCycle === 'monthly' ? 'basicMonth' : 'basicYear']}
              >
                {isLoading[billingCycle === 'monthly' ? 'basicMonth' : 'basicYear'] ? t('plans.basic.processing') : t('plans.basic.button')}
              </Button>
              <p className="text-xs text-center text-adaptive-tertiary mt-3">
                <span className="text-gray-500 dark:text-gray-400">{t('plans.basic.terms')}</span>
              </p>
            </div>
          </div>            {/* Premium Plan */}
          <div className="card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-1 transform scale-105 z-10 rounded-xl">
            <div className="absolute top-0 right-0 left-0">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium py-1 text-center rounded-t-lg">
                {t('plans.premium.badge')}
              </div>
            </div>
            
            <div className="p-6 pt-8 border-b border-adaptive">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-adaptive-primary">{t('plans.premium.title')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {t('plans.premium.description')}
                  </p>
                </div>
                <Star className="h-5 w-5 text-orange-400" />
              </div>
                <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adaptive-primary">
                    {billingCycle === 'monthly' ? t('plans.premium.price.monthly') : t('plans.premium.price.yearly')}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm ml-2">
                    {billingCycle === 'monthly' ? t('plans.premium.period.monthly') : t('plans.premium.period.yearly')}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-400 font-medium mt-1">
                    {t('plans.premium.yearlySaving')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {billingCycle === 'monthly' ? t('plans.premium.features.captions.monthly') : t('plans.premium.features.captions.yearly')} {t('plans.premium.features.captions.note')}
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {billingCycle === 'monthly' ? t('plans.premium.features.blogs.monthly') : t('plans.premium.features.blogs.yearly')} {t('plans.premium.features.blogs.wordLimit')}
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.premium.features.seoOptimization')}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.premium.features.previews')}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.premium.features.formatting')}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.premium.features.analytics')}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('plans.premium.features.priority')}</span>
                </li>
              </ul>
              
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  {t('plans.premium.highlight')}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                  {t('plans.premium.creditNote')}
                </p>
              </div>
                <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-6 text-base shadow-lg border border-adaptive" 
                onClick={() => handlePurchase(
                  billingCycle === 'monthly' ? 'premiumMonth' : 'premiumYear',
                  getStripePriceId(billingCycle === 'monthly' ? 'premiumMonth' : 'premiumYear', billingCycle)
                )} 
                disabled={isLoading[billingCycle === 'monthly' ? 'premiumMonth' : 'premiumYear']}
              >
                {isLoading[billingCycle === 'monthly' ? 'premiumMonth' : 'premiumYear'] ? t('plans.premium.processing') : t('plans.premium.button')}
              </Button>
              <p className="text-xs text-center text-adaptive-tertiary mt-3">
                <span className="text-gray-500 dark:text-gray-400">{t('plans.premium.terms')}</span>
              </p>
            </div>
          </div>
          </div>
        ) : (
          <div className="mb-12">
            <DFYPricingPlans onPurchase={handlePurchase} isLoading={isLoading} />
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto px-4 card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-50">{t('faq.title')}</h2>
            <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">{t('faq.items.trial.question')}</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                {t('faq.items.trial.answer')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">{t('faq.items.credits.question')}</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                {t('faq.items.credits.answer')}
              </AccordionContent>
            </AccordionItem>
              <AccordionItem value="item-3" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">{t('faq.items.discountCode.question')}</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                {t('faq.items.discountCode.answer')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">{t('faq.items.terminology.question')}</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                <div dangerouslySetInnerHTML={{ __html: t('faq.items.terminology.answer') }} />
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">{t('faq.items.tracking.question')}</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                {t('faq.items.tracking.answer')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">{t('faq.items.planDifference.question')}</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                {t('faq.items.planDifference.answer')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">{t('faq.items.changePlans.question')}</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                {t('faq.items.changePlans.answer')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">{t('faq.items.refunds.question')}</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                {t('faq.items.refunds.answer')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>        {/* Plan features section */}
        <div className="max-w-4xl mx-auto px-4 card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive mb-10">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-50">{t('allPlansInclude.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">{t('allPlansInclude.features.aiGeneration.title')}</h3>
                <p className="text-sm text-gray-300">{t('allPlansInclude.features.aiGeneration.description')}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">{t('allPlansInclude.features.mobileOptimized.title')}</h3>
                <p className="text-sm text-gray-300">{t('allPlansInclude.features.mobileOptimized.description')}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">{t('allPlansInclude.features.multiPlatform.title')}</h3>
                <p className="text-sm text-gray-300">{t('allPlansInclude.features.multiPlatform.description')}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">{t('allPlansInclude.features.creditBased.title')}</h3>
                <p className="text-sm text-gray-300">{t('allPlansInclude.features.creditBased.description')}</p>
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-400 mt-6">{t('allPlansInclude.vatIncluded')}</p>
        </div>
        
        {/* Call to action */}
        <div className="text-center mt-10 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-50">{t('cta.title')}</h2>
          <p className="text-adaptive-secondary mb-6 max-w-2xl mx-auto">
            {t('cta.description')}
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 rounded-lg text-lg shadow-lg border border-adaptive" onClick={freeTrial}>
            {t('cta.button')}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
