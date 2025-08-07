/**
 * ChatAdminDashboard.tsx - v1.0.0
 * 
 * Purpose: Admin dashboard for managing EngagePerfect support chats
 * Features: Chat analytics, conversation history, search, user feedback monitoring
 * Interactions: Firebase admin functions, real-time chat monitoring
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Search, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Star,
  AlertCircle,
  BarChart3,
  Clock,
  MessageSquare,
  User,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

// TypeScript interfaces
interface ChatConversation {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  lastMessage: string;
  messageCount: number;
  lastActivity: Date;
  status: 'active' | 'resolved' | 'pending';
  rating?: number;
  feedback?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  userId: string;
}

interface ChatAnalytics {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  satisfactionRating: number;
  messagesPerDay: Array<{ date: string; count: number }>;
  commonQuestions: Array<{ question: string; count: number }>;
  userActivity: Array<{ hour: number; count: number }>;
}

interface AdminDashboardProps {
  className?: string;
}

const ChatAdminDashboard: React.FC<AdminDashboardProps> = ({ className }) => {
  const { currentUser } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'analytics'>('overview');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved' | 'pending'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  // Check if user is admin
  const isAdmin = currentUser?.email === 'engageperfect@gmail.com' || 
                  currentUser?.uid === 'admin-uid-here'; // Using exact email match for security
  // Fetch chat analytics
  const fetchAnalytics = async () => {
    try {
      let token = '';
      if (currentUser) {
        token = await currentUser.getIdToken();
      }
      
      const response = await fetch('/api/admin/chat-analytics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      });      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analytics response error:', errorText);
        throw new Error(`Failed to fetch analytics: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load chat analytics');
    }
  };
  // Fetch recent conversations
  const fetchConversations = async () => {
    try {
      let token = '';
      if (currentUser) {
        token = await currentUser.getIdToken();
      }
      
      const response = await fetch(`/api/admin/chat-conversations?status=${filterStatus}&search=${searchTerm}&range=${dateRange}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Conversations response error:', await response.text());
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  };
  // Fetch messages for a specific conversation
  const fetchConversationMessages = async (conversationId: string) => {
    try {
      let token = '';
      if (currentUser) {
        token = await currentUser.getIdToken();
      }
      
      const response = await fetch(`/api/admin/chat-messages/${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Messages response error:', await response.text());
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setConversationMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load conversation messages');
    }
  };

  // Export chat data
  const exportChatData = async () => {
    try {
      const response = await fetch('/api/admin/export-chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dateRange,
          status: filterStatus,
          format: 'csv'
        }),
      });

      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-data-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Chat data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export chat data');
    }
  };

  // Initial data load
  useEffect(() => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    Promise.all([fetchAnalytics(), fetchConversations()])
      .finally(() => setIsLoading(false));
  }, [dateRange, filterStatus, isAdmin]);

  // Search functionality
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (isAdmin) fetchConversations();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // Handle conversation selection
  const handleConversationSelect = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    fetchConversationMessages(conversation.id);
    setExpandedConversation(expandedConversation === conversation.id ? null : conversation.id);
  };

  // Format date helper
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <MessageCircle className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chat Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Refresh data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              
              <button
                onClick={exportChatData}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'conversations', label: 'Conversations', icon: MessageSquare },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'conversations' | 'analytics')}
                className={`flex items-center space-x-2 pb-3 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'resolved' | 'pending')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'today' | 'week' | 'month')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-gray-700 dark:text-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Content Based on Active Tab */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && analytics && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Conversations</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalConversations}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalMessages}</p>
                      </div>
                      <MessageCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.averageResponseTime}s</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Rating</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.satisfactionRating.toFixed(1)}/5</p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                  </div>
                </div>

                {/* Common Questions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Common Questions</h3>
                  <div className="space-y-3">
                    {analytics.commonQuestions.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm text-gray-900 dark:text-white truncate flex-1 mr-4">{item.question}</span>
                        <span className="text-sm font-medium text-primary">{item.count} times</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversations Tab */}
            {activeTab === 'conversations' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversations List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Conversations</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {conversations.map((conversation) => (
                      <div key={conversation.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                        <button
                          onClick={() => handleConversationSelect(conversation)}
                          className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {conversation.userName || conversation.userEmail || `User ${conversation.userId.slice(-6)}`}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {conversation.lastMessage}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                conversation.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                conversation.status === 'resolved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {conversation.status}
                              </span>
                              {expandedConversation === conversation.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{conversation.messageCount} messages</span>
                            <span>{formatDate(conversation.lastActivity)}</span>
                          </div>
                          {conversation.rating && (
                            <div className="mt-1 flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < conversation.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          )}
                        </button>

                        {/* Expanded conversation messages */}
                        {expandedConversation === conversation.id && conversationMessages.length > 0 && (
                          <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-700">
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {conversationMessages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`p-2 rounded-lg text-sm ${
                                    message.role === 'user'
                                      ? 'bg-blue-100 dark:bg-blue-900 ml-4'
                                      : 'bg-white dark:bg-gray-600 mr-4'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <p className="text-gray-900 dark:text-white">{message.content}</p>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                                      {formatDate(message.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversation Details */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedConversation ? 'Conversation Details' : 'Select a Conversation'}
                    </h3>
                  </div>
                  <div className="p-4">
                    {selectedConversation ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">User Information</h4>
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-1">
                            <p className="text-sm"><span className="font-medium">Email:</span> {selectedConversation.userEmail}</p>
                            <p className="text-sm"><span className="font-medium">User ID:</span> {selectedConversation.userId}</p>
                            <p className="text-sm"><span className="font-medium">Status:</span> {selectedConversation.status}</p>
                            <p className="text-sm"><span className="font-medium">Messages:</span> {selectedConversation.messageCount}</p>
                          </div>
                        </div>

                        {selectedConversation.feedback && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">User Feedback</h4>
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              <div className="flex items-center mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < (selectedConversation.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                  {selectedConversation.rating}/5
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white">{selectedConversation.feedback}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Select a conversation to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                {/* Messages per day chart placeholder */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Messages Per Day</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Chart visualization would go here</p>
                  </div>
                </div>

                {/* User activity heatmap placeholder */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Activity by Hour</h3>
                  <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Activity heatmap would go here</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatAdminDashboard;
