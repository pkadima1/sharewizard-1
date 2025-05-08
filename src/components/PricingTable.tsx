
import React from 'react';
import { 
  Check, 
  X, 
  ArrowRight,
  CircleDollarSign,
  ShoppingCart,
  CreditCard,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createSubscriptionCheckout, createFlexCheckout } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

interface PricingFeature {
  name: string;
  free: boolean;
  basic: boolean;
  premium: boolean;
  flex: boolean;
}

const features: PricingFeature[] = [
  { 
    name: "Social media post generation", 
    free: true, 
    basic: true, 
    premium: true, 
    flex: true 
  },
  { 
    name: "Basic content templates", 
    free: true, 
    basic: true, 
    premium: true, 
    flex: true 
  },
  { 
    name: "Save draft posts", 
    free: false, 
    basic: true, 
    premium: true, 
    flex: true 
  },
  { 
    name: "Premium templates", 
    free: false, 
    basic: false, 
    premium: true, 
    flex: true 
  },
  { 
    name: "Advanced AI customization", 
    free: false, 
    basic: false, 
    premium: true, 
    flex: true 
  },
  { 
    name: "Priority support", 
    free: false, 
    basic: false, 
    premium: true, 
    flex: true
  },
];

const PricingTable: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  
  const currentPlan = userProfile?.plan_type || 'free';
  
  const handleSubscribe = async (plan: 'basic' | 'premium') => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const priceId = plan === 'basic' ? 'price_basic_monthly' : 'price_premium_monthly';
      const url = await createSubscriptionCheckout(currentUser.uid, priceId);
      window.location.assign(url);
    } catch (error: any) {
      console.error(`Error subscribing to ${plan} plan:`, error);
      toast({
        title: "Error",
        description: `Failed to process subscription: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleBuyFlex = async () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please log in to purchase Flex packs",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const priceId = 'price_flex_pack';
      const url = await createFlexCheckout(currentUser.uid, priceId, 1);
      window.location.assign(url);
    } catch (error: any) {
      console.error("Error purchasing Flex pack:", error);
      toast({
        title: "Error",
        description: `Failed to process purchase: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  const renderFeatureStatus = (isIncluded: boolean) => {
    return isIncluded ? (
      <Check className="text-green-500 w-5 h-5" />
    ) : (
      <X className="text-gray-300 w-5 h-5" />
    );
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the plan that best fits your needs. All plans include our core AI post generation features.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Free Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <CircleDollarSign className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold">Free</h3>
            <div className="mt-4 text-3xl font-bold">$0</div>
            <div className="text-sm text-gray-500">Forever free</div>
            
            <div className="mt-6">
              <div className="text-sm font-medium mb-1">Includes:</div>
              <div className="text-sm">1 request</div>
            </div>
          </div>
          
          <div className="p-6">
            <Button 
              className="w-full mb-4" 
              variant={currentPlan === 'free' ? "outline" : "default"}
              disabled={currentPlan === 'free'}
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Start Free'}
            </Button>
            
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-2">{renderFeatureStatus(feature.free)}</span>
                  <span className="text-sm">{feature.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Basic Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <CreditCard className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold">Basic</h3>
            <div className="mt-4 text-3xl font-bold">$9.99</div>
            <div className="text-sm text-gray-500">per month</div>
            
            <div className="mt-6">
              <div className="text-sm font-medium mb-1">Includes:</div>
              <div className="text-sm">75 requests/month</div>
              <div className="mt-2 text-xs text-blue-600">Start with 5-day free trial</div>
            </div>
          </div>
          
          <div className="p-6">
            <Button 
              className="w-full mb-4" 
              variant={currentPlan === 'basic' ? "outline" : "default"}
              disabled={currentPlan === 'basic'}
              onClick={() => handleSubscribe('basic')}
            >
              {currentPlan === 'basic' ? 'Current Plan' : 'Start Trial'}
            </Button>
            
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-2">{renderFeatureStatus(feature.basic)}</span>
                  <span className="text-sm">{feature.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Premium Plan */}
        <div className="bg-white rounded-xl shadow-md border-2 border-blue-500 overflow-hidden relative transition-all hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
            POPULAR
          </div>
          
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold">Premium</h3>
            <div className="mt-4 text-3xl font-bold">$24.99</div>
            <div className="text-sm text-gray-500">per month</div>
            
            <div className="mt-6">
              <div className="text-sm font-medium mb-1">Includes:</div>
              <div className="text-sm">250 requests/month</div>
              <div className="mt-2 text-xs text-blue-600">Start with 5-day free trial</div>
            </div>
          </div>
          
          <div className="p-6">
            <Button 
              className="w-full mb-4 bg-blue-500 hover:bg-blue-600" 
              variant={currentPlan === 'premium' ? "outline" : "default"}
              disabled={currentPlan === 'premium'}
              onClick={() => handleSubscribe('premium')}
            >
              {currentPlan === 'premium' ? 'Current Plan' : 'Start Trial'}
            </Button>
            
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-2">{renderFeatureStatus(feature.premium)}</span>
                  <span className="text-sm">{feature.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Flex Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <ShoppingCart className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold">Flex</h3>
            <div className="mt-4 text-3xl font-bold">$9.99</div>
            <div className="text-sm text-gray-500">one-time purchase</div>
            
            <div className="mt-6">
              <div className="text-sm font-medium mb-1">Includes:</div>
              <div className="text-sm">50 requests (never expire)</div>
              <div className="mt-2 text-xs text-green-600">Buy as many as you need</div>
            </div>
          </div>
          
          <div className="p-6">
            <Button 
              className="w-full mb-4 bg-green-600 hover:bg-green-700" 
              variant="default"
              onClick={handleBuyFlex}
            >
              Buy Now
            </Button>
            
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-2">{renderFeatureStatus(feature.flex)}</span>
                  <span className="text-sm">{feature.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Embed the Stripe Pricing Table as an alternative */}
      <div className="mt-16">
        <h3 className="text-xl font-semibold text-center mb-8">Or, choose from our Stripe checkout options:</h3>
        <div className="max-w-3xl mx-auto">
          <div dangerouslySetInnerHTML={{ 
            __html: `<stripe-pricing-table pricing-table-id="prctbl_1QzLaLGCd9fidigrJgMAKYwM" publishable-key="pk_test_51Qk8jFGCd9fidigrAGg1nszClaepwj0eyd7XFaxaiweCgCvl63VUQKbN40DlLjcXyhRAm7qWEK92k5Ks9nVKv3Jk008PaVRpPv"></stripe-pricing-table>`
          }} />
        </div>
      </div>
      
      {/* FAQ section */}
      <div className="mt-16">
        <h3 className="text-2xl font-semibold text-center mb-8">Frequently Asked Questions</h3>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="text-lg font-medium mb-2">What happens when I run out of requests?</h4>
            <p className="text-gray-600">
              When you run out of requests, you'll need to upgrade your plan or purchase Flex packs to continue using the service.
              Free users can start a trial, while paid users can upgrade or buy additional Flex packs.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="text-lg font-medium mb-2">Can I cancel my subscription anytime?</h4>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time through the customer portal. 
              You'll still have access to your current plan until the end of your billing period.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="text-lg font-medium mb-2">Do Flex packs expire?</h4>
            <p className="text-gray-600">
              No, Flex packs never expire. They're a one-time purchase that gives you additional requests 
              whenever you need them, making them perfect for occasional users or those who need extra capacity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingTable;
