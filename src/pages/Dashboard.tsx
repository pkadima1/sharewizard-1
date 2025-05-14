import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Upload, Camera, PenTool, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { clearTrialPending } from '@/lib/subscriptionUtils';

const Dashboard: React.FC = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
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
  }, [currentUser, navigate, refreshUserProfile]);
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
      
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {currentUser.displayName || 'User'}!
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3">
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

          <div className="stats-card dark:bg-gray-800 dark:text-white">
            <h3 className="text-lg font-medium">Engagement Metrics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Performance of your published content</p>
            <div className="mt-4">
              <p className="text-center text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          </div>

          <div className="stats-card dark:bg-gray-800 dark:text-white">
            <h3 className="text-lg font-medium">Quick Actions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Common tasks you might want to do</p>
            <div className="mt-4 space-y-2">
              <Button className="w-full flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                Create New Post
              </Button>
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Content
              </Button>
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Create Media
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
