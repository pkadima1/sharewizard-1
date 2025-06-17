/**
 * AdminDashboard.tsx - v1.0.0
 * 
 * Purpose: Main admin dashboard page with navigation to different admin tools
 * Features: Chat management, user management, system overview
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ChatAdminDashboard from '@/components/admin/ChatAdminDashboard';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { 
  Users, 
  MessageCircle, 
  BarChart3, 
  Settings,
  Shield 
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    supportChats: 0,
    contentGenerated: 0,
    systemStatus: 'Online'
  });
  const [loading, setLoading] = useState(true);
    // Check if user is admin
  const isAdmin = currentUser?.email?.toLowerCase() === 'engageperfect@gmail.com' || 
                  currentUser?.uid === 'admin-uid-here'; // Using exact email match for security with lowercase comparison
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

        {/* Chat Admin Dashboard */}
        <ChatAdminDashboard />
      </div>
    </div>
  );
};

export default AdminDashboard;
