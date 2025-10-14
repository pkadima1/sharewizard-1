/**
 * AdminDashboard.tsx - v1.0.0
 * 
 * Purpose: Main admin dashboard page with navigation to different admin tools
 * Features: Chat management, user management, system overview
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ChatAdminDashboard from '@/components/admin/ChatAdminDashboard';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { 
  Users, 
  MessageCircle, 
  BarChart3, 
  Settings,
  Shield,
  DollarSign
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const [stats, setStats] = useState({
    totalUsers: 0,
    supportChats: 0,
    contentGenerated: 0,
    systemStatus: 'Online'
  });
  const [loading, setLoading] = useState(true);
    // Check if user is admin
  const isAdmin = currentUser?.email?.toLowerCase() === 'engageperfect@gmail.com';
  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin || !currentUser) return;
      
      try {
        setLoading(true);
        const db = getFirestore();
        
        // Get users count - ensure we're querying the right collection
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;
        console.log('Found users:', totalUsers);
        
        // Get support chats count - verify the collection name
        const chatsRef = collection(db, 'supportChats');
        const chatsSnapshot = await getDocs(chatsRef);
        const supportChats = chatsSnapshot.size;
        console.log('Found support chats:', supportChats);
        
        // Get content generated count (from captions and longform content)
        // Verify these collection names match what's in your database
        const captionsRef = collection(db, 'generatedCaptions');
        const captionsSnapshot = await getDocs(captionsRef);
        const captionsCount = captionsSnapshot.size;
        console.log('Found generated captions:', captionsCount);
        
        const longformRef = collection(db, 'generatedContent');
        const longformSnapshot = await getDocs(longformRef);
        const longformCount = longformSnapshot.size;
        console.log('Found generated content:', longformCount);
        
        const contentGenerated = captionsCount + longformCount;
        
        setStats({
          totalUsers,
          supportChats,
          contentGenerated,
          systemStatus: 'Online'
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [isAdmin, currentUser]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                EngagePerfect Admin
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentUser?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Support Chats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.supportChats}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Content Generated</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.contentGenerated}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '...' : stats.systemStatus}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Admin Tools
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href={`/${currentLanguage}/admin/partners`}
                className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Partner Management
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage partners, codes & commissions
                  </p>
                </div>
              </a>
              
              <a
                href={`/${currentLanguage}/admin/pending-partners`}
                className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Partner Applications
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review & approve partner applications
                  </p>
                </div>
              </a>
              
              <a
                href={`/${currentLanguage}/admin/partner-payouts`}
                className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Partner Payouts
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage partner earnings & payouts
                  </p>
                </div>
              </a>
              
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-50">
                <BarChart3 className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-500 dark:text-gray-400">
                    Analytics Dashboard
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Coming soon
                  </p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-50">
                <Settings className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-500 dark:text-gray-400">
                    System Settings
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Admin Dashboard */}
        <ChatAdminDashboard />
      </div>
    </div>
  );
};

export default AdminDashboard;
