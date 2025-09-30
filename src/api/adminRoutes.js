/**
 * API routes for the admin dashboard
 * These routes connect the frontend to the Firebase functions
 */

import express from 'express';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../lib/firebase';

const router = express.Router();
const functions = getFunctions(firebaseApp);

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const token = await user.getIdToken();
    const email = user.email;    if (email?.toLowerCase() === 'engageperfect@gmail.com') {
      req.user = user;
      req.token = token;
      next();
    } else {
      console.log('Access denied for:', email);
      res.status(403).json({ error: 'Not authorized' });
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Get chat analytics
router.get('/chat-analytics', isAdmin, async (req, res) => {
  try {
    const getChatAnalytics = httpsCallable(functions, 'getChatAnalytics');
    const result = await getChatAnalytics({ dateRange: req.query.range || 'week' });
    res.json(result.data);
  } catch (error) {
    console.error('Error fetching chat analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get chat conversations
router.get('/chat-conversations', isAdmin, async (req, res) => {
  try {
    const getChatConversations = httpsCallable(functions, 'getChatConversations');
    const result = await getChatConversations({ 
      status: req.query.status || 'all',
      search: req.query.search || '',
      dateRange: req.query.range || 'week'
    });
    res.json(result.data);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get chat messages for a specific conversation
router.get('/chat-messages/:conversationId', isAdmin, async (req, res) => {
  try {
    const getChatMessages = httpsCallable(functions, 'getChatMessages');
    const result = await getChatMessages({ 
      conversationId: req.params.conversationId
    });
    res.json(result.data);
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Export chat data
router.post('/export-chats', isAdmin, async (req, res) => {
  try {
    const exportChatData = httpsCallable(functions, 'exportChatData');
    const result = await exportChatData({ 
      dateRange: req.body.dateRange || 'week',
      status: req.body.status || 'all',
      format: req.body.format || 'csv'
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
    res.send(result.data.data);
  } catch (error) {
    console.error('Error exporting chat data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
