import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Upload, Camera, PenTool, Sparkles, FileText, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { clearTrialPending } from '@/lib/subscriptionUtils';
import { useLongformContent } from '@/hooks/useLongformContent';
import LongformContentManager from '@/components/LongformContentManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch longform content
  const { longformContent, loading: longformLoading, error: longformError } = useLongformContent(currentUser?.uid || '');
  
  // Protect route - redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      // Refresh user profile data when the dashboard loads
      refreshUserProfile().then(() => {
        console.log("User profile refreshed");
      }).catch(error => {
        console.error("Error refreshing user profile:", error);
      });
    }
  }, [currentUser, navigate, refreshUserProfile]);  // Check URL parameters for initial tab and success messages
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    if (tabParam && ['overview', 'longform', 'captions'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    // Check if user just completed content generation
    if (location.state?.newContentGenerated) {
      toast({
        title: "Content Generated Successfully!",
        description: "Your long-form content has been generated and is ready for download.",
        variant: "default",
      });
      
      // Clear the state to prevent showing toast on refresh
      window.history.replaceState({}, document.title, location.pathname + location.search);
    }
  }, [location.search, location.state, toast]);

  // Check URL parameters for checkout status
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const checkoutCanceled = queryParams.get('checkout_canceled') === 'true';
    
    if (checkoutCanceled && currentUser) {
      // Clear any trial pending status if checkout was canceled
      clearTrialPending(currentUser.uid).then(() => {
        // If checkout was canceled, show a notification to the user
        toast({
          title: "Checkout canceled",
          description: "Your subscription process was canceled. No changes were made to your account.",
          variant: "default",
        });
        
        // Clean up the URL by removing the parameter
        navigate('/dashboard', { replace: true });
      }).catch(error => {
        console.error("Error clearing trial pending status:", error);
      });
    }
  }, [location, currentUser, navigate, toast]);

  if (!currentUser || !userProfile) {
    return <div>Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard:overview.title')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('dashboard:overview.welcome', { name: currentUser.displayName || 'User' })}
          </p>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('dashboard:overview.title')}
            </TabsTrigger>
            <TabsTrigger value="longform" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('dashboard:content.longform', 'Long-form Content')}
              {longformContent.length > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  {longformContent.length}
                </span>
              )}
            </TabsTrigger>            <TabsTrigger value="captions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('dashboard:content.captions', 'Captions')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Feature Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Link to="/caption-generator" className="block">
                <div className="stats-card dark:bg-gray-800 dark:text-white hover:translate-y-[-5px] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium">AI Caption Generator</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Create engaging captions for your social media content with AI
                  </p>
                  <Button className="w-full mt-4">
                    Generate Captions
                  </Button>
                </div>
              </Link>

              <Link to="/longform" className="block">
                <div className="stats-card dark:bg-gray-800 dark:text-white hover:translate-y-[-5px] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium">Long-form Content</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Generate comprehensive blog posts, articles, and guides
                  </p>
                  <Button className="w-full mt-4">
                    Create Content
                  </Button>
                </div>
              </Link>

              <div className="stats-card dark:bg-gray-800 dark:text-white">
                <h3 className="text-lg font-medium">Content Summary</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your content generation overview</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Long-form Articles:</span>
                    <span className="font-medium">{longformContent.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Words:</span>
                    <span className="font-medium">
                      {longformContent.reduce((total, content) => total + content.metadata.actualWordCount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg. Reading Time:</span>
                    <span className="font-medium">
                      {longformContent.length > 0 
                        ? Math.round(longformContent.reduce((total, content) => total + content.metadata.estimatedReadingTime, 0) / longformContent.length)
                        : 0} min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="stats-card dark:bg-gray-800 dark:text-white">
                <h3 className="text-lg font-medium">Quick Actions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Common tasks you might want to do</p>
                <div className="mt-4 space-y-2">
                  <Button 
                    className="w-full flex items-center gap-2"
                    onClick={() => navigate('/longform')}
                  >
                    <PenTool className="h-4 w-4" />
                    Create Article
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    onClick={() => navigate('/caption-generator')}
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Captions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    onClick={() => setActiveTab('longform')}
                    disabled={longformContent.length === 0}
                  >
                    <FileText className="h-4 w-4" />
                    View My Content
                  </Button>
                </div>
              </div>

              <div className="stats-card dark:bg-gray-800 dark:text-white">
                <h3 className="text-lg font-medium">Engagement Metrics</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Performance of your published content</p>
                <div className="mt-4">
                  <p className="text-center text-gray-500 dark:text-gray-400">No data available</p>
                </div>
              </div>

              <div className="stats-card dark:bg-gray-800 dark:text-white">
                <h3 className="text-lg font-medium">Recent Activity</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your latest content activity</p>
                <div className="mt-4">
                  {longformContent.length > 0 ? (
                    <div className="space-y-2">
                      {longformContent.slice(0, 3).map((content) => (
                        <div key={content.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="font-medium truncate">{content.inputs.topic}</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {content.metadata.actualWordCount} words • {
                              content.metadata.generatedAt && content.metadata.generatedAt.toDate 
                                ? content.metadata.generatedAt.toDate().toLocaleDateString()
                                : 'Recently'
                            }
                          </div>
                        </div>
                      ))}
                      {longformContent.length > 3 && (
                        <Button 
                          variant="link" 
                          className="text-xs p-0 h-auto"
                          onClick={() => setActiveTab('longform')}
                        >
                          View all {longformContent.length} articles →
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">No activity yet</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Long-form Content Tab */}
          <TabsContent value="longform" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Long-form Content</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage and download your generated articles, guides, and blog posts
                </p>
              </div>
              <Button onClick={() => navigate('/longform')} className="flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                Create New Content
              </Button>
            </div>
            
            <LongformContentManager 
              content={longformContent}
              loading={longformLoading}
              error={longformError}
            />
          </TabsContent>

          {/* Captions Tab */}
          <TabsContent value="captions" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Caption Generation</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your AI-generated social media captions
                </p>
              </div>
              <Button onClick={() => navigate('/caption-generator')} className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Captions
              </Button>
            </div>
            
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Caption Management Coming Soon</h3>
              <p className="text-sm">Caption history and management features will be available here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
