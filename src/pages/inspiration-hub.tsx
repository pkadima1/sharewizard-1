import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { 
  ChevronRight, 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Sparkles, 
  ArrowRight,
  Search,
  FileText,
  Users,
  BarChart3,
  Zap,
  Brain,
  Globe,
  Clock,
  Star,
  ArrowUpRight,
  SkipForward
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import InspirationHub from '@/components/inspiration/InspirationHub';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trackPageView, trackButtonClick, trackFeatureUsage } from '@/utils/analytics';

const InspirationHubPage: React.FC = () => {
  const { t } = useTranslation('inspiration-hub');
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // Page metadata
  const pageTitle = t('page.title', 'Inspiration Hub - AI-Powered Content Ideas | EngagePerfect');
  const pageDescription = t('page.description', 'Discover trending topics, generate content ideas, and explore AI-powered inspiration for your social media and content marketing. Get personalized suggestions based on your industry and audience.');
  const pageKeywords = t('page.keywords', 'content ideas, trending topics, social media inspiration, AI content generation, marketing ideas, content strategy');

  // Analytics tracking
  useEffect(() => {
    // Track page view
    trackPageView(location.pathname, pageTitle);
    
    // Track feature usage
    trackFeatureUsage('inspiration_hub_visited', {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });

    // Simulate loading state
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [location.pathname, pageTitle]);

  // Handle skip button clicks
  const handleSkipToCaption = () => {
    trackButtonClick('skip_to_caption_generator', 'inspiration_hub');
    // Smooth scroll to caption generator section or navigate
  };

  const handleSkipToLongform = () => {
    trackButtonClick('skip_to_longform_content', 'inspiration_hub');
    // Smooth scroll to longform content section or navigate
  };

  // Breadcrumb navigation
  const breadcrumbs = [
    { name: t('breadcrumbs.home'), href: '/home' },
    { name: t('breadcrumbs.inspiration'), href: '/inspiration-hub', current: true }
  ];

  // Hero section features
  const heroFeatures = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: t('hero.features.trending.title'),
      description: t('hero.features.trending.description')
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: t('hero.features.personalized.title'),
      description: t('hero.features.personalized.description')
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: t('hero.features.ai.title'),
      description: t('hero.features.ai.description')
    }
  ];

  // Quick action cards
  const quickActions = [
    {
      title: t('quickActions.captionGenerator.title'),
      description: t('quickActions.captionGenerator.description'),
      icon: <FileText className="h-6 w-6" />,
      href: '/caption-generator',
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
      action: 'caption_generator'
    },
    {
      title: t('quickActions.longformContent.title'),
      description: t('quickActions.longformContent.description'),
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/longform',
      color: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
      action: 'longform_content'
    },
    {
      title: t('quickActions.trendingTopics.title'),
      description: t('quickActions.trendingTopics.description'),
      icon: <TrendingUp className="h-6 w-6" />,
      href: '#trending',
      color: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
      action: 'trending_topics'
    }
  ];

  const handleQuickAction = (action: string) => {
    trackButtonClick(`quick_action_${action}`, 'inspiration_hub');
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="min-h-screen bg-gray-950 text-white">
        <ErrorBoundary>
          <Navbar />
        </ErrorBoundary>

        {/* Spacing for navbar */}
        <div className="h-28"></div>

        {/* Breadcrumb Navigation */}
        <nav className="container mx-auto px-4 sm:px-6 py-4 max-w-6xl">
          <ol className="flex items-center space-x-2 text-sm text-gray-400">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.name} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
                {breadcrumb.current ? (
                  <span className="text-white font-medium">{breadcrumb.name}</span>
                ) : (
                  <Link 
                    to={breadcrumb.href}
                    className="hover:text-white transition-colors"
                  >
                    {breadcrumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
          <div className="text-center space-y-8">
            {/* Main Hero Content */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                  <Lightbulb className="h-8 w-8 text-white" />
                </div>
                <Badge variant="secondary" className="text-sm">
                  {t('hero.badge')}
                </Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                {t('hero.title')}
              </h1>

              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {t('hero.subtitle')}
              </p>

              {/* Skip Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSkipToCaption}
                  className="flex items-center gap-2 group"
                >
                  <SkipForward className="h-4 w-4" />
                  {t('hero.skipButtons.captionGenerator')}
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSkipToLongform}
                  className="flex items-center gap-2 group"
                >
                  <SkipForward className="h-4 w-4" />
                  {t('hero.skipButtons.longformContent')}
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Hero Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              {heroFeatures.map((feature, index) => (
                <Card key={index} className="p-6 bg-gray-900/50 border-gray-800 hover:border-blue-800 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {t('quickActions.title')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('quickActions.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={index}
                className={`p-6 border-2 hover:scale-105 transition-all duration-300 cursor-pointer ${action.color}`}
                onClick={() => handleQuickAction(action.action)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-current/20 rounded-lg">
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{action.title}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {action.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{t('quickActions.getStarted')}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="bg-gray-800" />

        {/* Main Inspiration Hub Component */}
        <section className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t('mainSection.title')}
              </h2>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('mainSection.description')}
            </p>
          </div>

          <ErrorBoundary>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400">{t('loading.title')}</p>
                  <p className="text-sm text-gray-500">{t('loading.description')}</p>
                </div>
              </div>
            ) : (
              <InspirationHub />
            )}
          </ErrorBoundary>
        </section>

        {/* Value Proposition Section */}
        <section className="container mx-auto px-4 sm:px-6 py-16 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold">
                {t('valueProposition.title')}
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                {t('valueProposition.description')}
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: <Zap className="h-5 w-5" />, text: t('valueProposition.benefits.speed') },
                  { icon: <Target className="h-5 w-5" />, text: t('valueProposition.benefits.relevance') },
                  { icon: <Globe className="h-5 w-5" />, text: t('valueProposition.benefits.trends') },
                  { icon: <Users className="h-5 w-5" />, text: t('valueProposition.benefits.audience') }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      {benefit.icon}
                    </div>
                    <span className="text-gray-300">{benefit.text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link 
                  to="/caption-generator"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => trackButtonClick('cta_start_creating', 'inspiration_hub')}
                >
                  {t('valueProposition.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <Card className="p-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Star className="h-6 w-6 text-yellow-500" />
                    <h3 className="text-xl font-semibold">{t('valueProposition.stats.title')}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">10M+</div>
                      <div className="text-sm text-gray-400">{t('valueProposition.stats.content')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">500K+</div>
                      <div className="text-sm text-gray-400">{t('valueProposition.stats.users')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">95%</div>
                      <div className="text-sm text-gray-400">{t('valueProposition.stats.satisfaction')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">24/7</div>
                      <div className="text-sm text-gray-400">{t('valueProposition.stats.support')}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <ErrorBoundary>
          <Footer />
        </ErrorBoundary>
      </div>
    </>
  );
};

export default InspirationHubPage; 