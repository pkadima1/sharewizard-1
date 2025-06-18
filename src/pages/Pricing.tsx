import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { createSubscriptionCheckout, createFlexCheckout } from '@/lib/stripe';
import { createEnhancedSubscriptionCheckout, createEnhancedFlexCheckout } from '@/lib/checkoutEnhancements';
import { Button } from '@/components/ui/button';
import { Check, Info, ChevronRight, Gift, Star } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { getStripePriceId } from '@/lib/subscriptionUtils';
import { cn } from '@/lib/utils';

const Pricing: React.FC = () => {
  // Set yearly as the default billing cycle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('pricing');
  const [isLoading, setIsLoading] = useState<{
    [key: string]: boolean;
  }>({});  const handlePurchase = async (plan: string, priceId: string) => {
    try {
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
        // Only Basic plans get trials, Premium plans start immediately
        const isPremiumPlan = plan.includes('premium');
        checkoutUrl = await createEnhancedSubscriptionCheckout(currentUser.uid, priceId, {
          trialDays: isPremiumPlan ? 0 : 5,
          includeUpsells: true
        });
      }
      
      // Redirect to the checkout URL
      window.location.href = checkoutUrl;
      
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: `Failed to create checkout: ${error.message}`,
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
      <div className="px-4 py-[100px] animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-gray-50">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-700 dark:text-gray-200 mb-8 max-w-2xl mx-auto">Choose the plan that's right for you</p>
          
          {/* Billing cycle switch with yearly highlighted as default */}
          <div className="inline-flex items-center bg-adaptive-tertiary backdrop-blur-sm rounded-full p-1 mb-6 border border-adaptive">
            <button 
              className={cn(
                "py-2 px-4 rounded-full transition-colors duration-200", 
                billingCycle === 'monthly' 
                  ? 'bg-violet-600 text-white' 
                  : 'text-adaptive-secondary hover:text-adaptive-primary'
              )} 
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button 
              className={cn(
                "py-2 px-4 rounded-full transition-colors duration-200", 
                billingCycle === 'yearly' 
                  ? 'bg-violet-600 text-white' 
                  : 'text-adaptive-secondary hover:text-adaptive-primary'
              )} 
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
            </button>
          </div>
          {billingCycle === 'yearly' && (
            <div className="text-sm text-green-400 font-medium mb-4">
              Save significantly with our yearly plans!
            </div>
          )}
        </div>

        {/* Free Trial Banner */}
        <div className="bg-gradient-to-r from-violet-700 to-indigo-600 rounded-xl p-6 shadow-lg mb-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <Gift className="h-8 w-8 text-white mr-4" />
              <div>
                <h3 className="text-xl font-bold text-white">Start with a 5-day Free Trial</h3>
                <p className="text-white/90">Subscribe to any plan and get 5 free requests to try out all features</p>
              </div>
            </div>
            <Button 
              className="bg-white text-violet-700 hover:bg-white/90 px-6 py-5 text-base font-medium shadow-md"
              onClick={freeTrial}
            >
              Start Your Free Trial
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>        {/* Pricing Cards - Mobile responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 mb-16 max-w-6xl mx-auto">          {/* Free Plan */}
          <div className="card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1 rounded-xl">
            <div className="p-6 border-b border-adaptive">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-adaptive-primary">Free Plan</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    🔓 Try it free — no credit card required
                  </p>
                </div>
              </div>
                <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adaptive-primary">$0</span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm ml-2">forever</span>
                </div>
                <div className="text-sm text-adaptive-tertiary font-medium mt-1">
                  <span className="text-gray-500 dark:text-gray-400">No credit card required</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">3 free caption requests on signup</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Manual sharing support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Post ideas & captions (image-only)</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 text-red-400 mr-2 flex-shrink-0">🚫</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">No blog generation</span>
                </li>
              </ul>
              
              <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  🟣 Great for exploring EngagePerfect's core features.
                </p>
              </div>
              
              <Button 
                className="w-full bg-adaptive-tertiary hover:bg-adaptive-secondary text-adaptive-primary py-6 text-base shadow-lg border border-adaptive" 
                onClick={freeTrial} 
              >
                Sign Up Free
              </Button>
              <p className="text-xs text-center text-adaptive-tertiary mt-3">
                <span className="text-gray-500 dark:text-gray-400">No credit card required</span>
              </p>
            </div>
          </div>          {/* Basic Plan */}
          <div className="card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-1 rounded-xl">
            <div className="p-6 border-b border-adaptive">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-adaptive-primary">Basic Plan</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    ⭐ Perfect for casual creators & side hustlers
                  </p>
                </div>
              </div>
                <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adaptive-primary">
                    {billingCycle === 'monthly' ? '$8' : '$40'}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm ml-2">
                    {billingCycle === 'monthly' ? '/ month' : '/ year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-400 font-medium mt-1">
                    💡 Save 58% with yearly plan!
                  </div>
                )}
              </div>
                <div className="mt-4 space-y-2">
                <div className="inline-flex items-center bg-violet-600/20 px-3 py-1 rounded-full">
                  <Gift className="h-4 w-4 text-violet-400 mr-1" />
                  <span className="text-xs font-medium text-violet-400">5-DAY FREE TRIAL INCLUDED</span>
                </div>
                {billingCycle === 'monthly' && (
                  <div className="inline-flex items-center bg-green-600/20 px-3 py-1 rounded-full ml-2">
                    <span className="text-xs font-medium text-green-400">Use code PERFECTSTART for 50% off first month</span>
                  </div>
                )}
              </div>
            </div>              <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">5 free requests during trial</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {billingCycle === 'monthly' ? '70 captions/month' : '900 captions/year'}
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {billingCycle === 'monthly' ? '1 SEO blog/month' : '17 SEO blogs/year'} (up to 2000 words)
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Posts with image, video, and carousel support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Custom overlay text and emojis</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Mobile-friendly caption preview & download</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Manual sharing to social media</span>
                </li>
              </ul>
              
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  🟣 Includes image-only posts and custom tone support.
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
                {isLoading[billingCycle === 'monthly' ? 'basicMonth' : 'basicYear'] ? 'Processing...' : 'Start Free Trial with Basic'}
              </Button>
              <p className="text-xs text-center text-adaptive-tertiary mt-3">
                <span className="text-gray-500 dark:text-gray-400">Subscription begins after 5-day trial. Cancel anytime during trial.</span>
              </p>
            </div>
          </div>            {/* Premium Plan */}
          <div className="card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-1 transform scale-105 z-10 rounded-xl">
            <div className="absolute top-0 right-0 left-0">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium py-1 text-center rounded-t-lg">
                Most Popular
              </div>
            </div>
            
            <div className="p-6 pt-8 border-b border-adaptive">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-adaptive-primary">Premium Plan</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    🚀 Built for content creators, marketers & agencies
                  </p>
                </div>
                <Star className="h-5 w-5 text-orange-400" />
              </div>
                <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adaptive-primary">
                    {billingCycle === 'monthly' ? '$29' : '$199'}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm ml-2">
                    {billingCycle === 'monthly' ? '/month' : '/year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-400 font-medium mt-1">
                    🔥 Best Value - Save $149/year!
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {billingCycle === 'monthly' ? '500 captions/month' : '6000 captions/year'} (all media types)
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {billingCycle === 'monthly' ? '125 long-form blogs/month' : '1500 long-form blogs/year'} (up to 2,500 words)
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Includes SEO blog generator with EEAT & GEO optimization</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Instant social media previews</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Advanced formatting + external source linking</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Usage analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Priority processing & support</span>
                </li>
              </ul>
              
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  🟣 Ideal for newsletters, landing pages, ecommerce content & more.
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                  💡 Note: 1 blog = 4 credits, 1 caption = 1 credit
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
                {isLoading[billingCycle === 'monthly' ? 'premiumMonth' : 'premiumYear'] ? 'Processing...' : 'Upgrade to Premium'}
              </Button>
              <p className="text-xs text-center text-adaptive-tertiary mt-3">
                <span className="text-gray-500 dark:text-gray-400">Subscription starts immediately. Cancel anytime.</span>
              </p>
            </div>
          </div>
        </div>        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto px-4 card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-50">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">What's included in the free trial?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                Basic plans include a 5-day free trial with 5 free requests. You can test all features available in your chosen plan during this period. Your subscription will begin after the trial period unless you cancel. Premium plans start immediately without a trial period.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">How does the credit system work?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                Our credit system is simple: 1 caption generation = 1 credit, 1 blog generation = 4 credits. This reflects the complexity difference between generating a social media caption vs. a full SEO-optimized blog post with our advanced AI system. Credits are used from your monthly allowance and reset each billing cycle.
              </AccordionContent>
            </AccordionItem>
              <AccordionItem value="item-3" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">What does PERFECTSTART discount code offer?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                Use the discount code PERFECTSTART to get 50% off your first month on the Basic monthly plan only. This offer is not available for yearly plans or Premium plans. Enter the code at checkout to receive the discount on your first monthly billing cycle.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">What do SEO, EEAT, and GEO mean?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                <strong>SEO</strong> (Search Engine Optimization) - Techniques to improve your content's visibility in search results. <strong>EEAT</strong> (Experience, Expertise, Authoritativeness, Trustworthiness) - Google's quality guidelines for content evaluation. <strong>GEO</strong> (Generative Engine Optimization) - Tailoring content that sounds, connects, and feels human-like crafted.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">How do I track my credit usage?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                You can track your credit usage in your account dashboard. Each time you generate content, the appropriate credits are deducted (1 for captions, 4 for blogs). Your remaining credits for the current billing cycle are always visible, and you'll receive notifications when you're running low.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">What's the difference between Basic and Premium plans?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                Basic plans are perfect for casual users and side hustlers with limited blog generation (17 blogs/year) and include a 5-day free trial. Premium plans are designed for content creators, marketers, and agencies who need high-volume content creation with advanced features like EEAT optimization, priority support, and no trial period for immediate access.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">Can I change plans later?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle. Unused credits from your current plan will carry over when upgrading.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">Do you offer refunds?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                We offer a 14-day money-back guarantee if you're not satisfied with your subscription. Contact our support team to process your refund.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>        {/* Plan features section */}
        <div className="max-w-4xl mx-auto px-4 card-adaptive bg-adaptive-secondary shadow-adaptive-md border-adaptive mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-50">All Paid Plans Include</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">AI-generated captions & blogs</h3>
                <p className="text-sm text-gray-300">Captions (1 credit each) and SEO-optimized blogs (4 credits each)</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Mobile-optimized preview & sharing</h3>
                <p className="text-sm text-gray-300">Ready-to-use formatting for all platforms</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Multi-platform content creation</h3>
                <p className="text-sm text-gray-300">Optimized for Twitter, LinkedIn, Facebook, Instagram & more</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Credit-based fair usage</h3>
                <p className="text-sm text-gray-300">Simple pricing: 1 caption = 1 credit, 1 blog = 4 credits</p>
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-400 mt-6">VAT included in all prices</p>
        </div>
        
        {/* Call to action */}
        <div className="text-center mt-16 mb-10">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-50">Ready to get started?</h2>
          <p className="text-adaptive-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of content creators and businesses who use EngagePerfect AI to create engaging content that resonates with their audience.
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 rounded-lg text-lg shadow-lg border border-adaptive" onClick={freeTrial}>
            Start Your Free Trial Today
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
