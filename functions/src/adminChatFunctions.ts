/**
 * adminChatFunctions.ts - v1.0.0
 * 
 * Purpose: Firebase Cloud Functions for Chat Admin Dashboard
 * Features: Analytics, conversation management, data export
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin if not already initialized
try {
  initializeApp();
} catch (error: unknown) {
  if ((error as { code?: string }).code !== "app/duplicate-app") {
    console.error("Firebase admin initialization error", error);
  }
}

const db = getFirestore();

// Check if user is admin
const isAdmin = (uid: string, email?: string): boolean => {
  // Implement your admin check logic here - ensure case-insensitive email comparison
  return email?.toLowerCase() === 'engageperfect@gmail.com' || uid === 'admin-uid-here';
};

// Get chat analytics
export const getChatAnalytics = onCall({
  cors: ["*"],
  timeoutSeconds: 60,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (!isAdmin(request.auth.uid, request.auth.token.email)) {
    throw new HttpsError("permission-denied", "Admin access required");
  }

  try {
    const { dateRange = 'week' } = request.data;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get all support chats
    const chatsSnapshot = await db.collection('supportChats').get();
    let totalConversations = 0;
    let totalMessages = 0;
    const messagesPerDay: { [key: string]: number } = {};
    const commonQuestions: { [key: string]: number } = {};

    for (const chatDoc of chatsSnapshot.docs) {
      const messagesSnapshot = await chatDoc.ref
        .collection('messages')
        .where('timestamp', '>=', Timestamp.fromDate(startDate))
        .get();

      if (messagesSnapshot.size > 0) {
        totalConversations++;
        totalMessages += messagesSnapshot.size;

        // Process messages for analytics
        messagesSnapshot.forEach(messageDoc => {
          const message = messageDoc.data();
          const date = message.timestamp?.toDate();
          
          if (date) {
            const dateKey = date.toISOString().split('T')[0];
            messagesPerDay[dateKey] = (messagesPerDay[dateKey] || 0) + 1;
          }

          // Extract common questions (user messages)
          if (message.role === 'user') {
            const content = message.content.toLowerCase();
            // Simple keyword extraction - you can improve this
            if (content.includes('subscription') || content.includes('plan')) {
              commonQuestions['Subscription questions'] = (commonQuestions['Subscription questions'] || 0) + 1;
            } else if (content.includes('caption') || content.includes('generate')) {
              commonQuestions['Caption generation help'] = (commonQuestions['Caption generation help'] || 0) + 1;
            } else if (content.includes('error') || content.includes('problem')) {
              commonQuestions['Technical issues'] = (commonQuestions['Technical issues'] || 0) + 1;
            } else {
              commonQuestions['General inquiries'] = (commonQuestions['General inquiries'] || 0) + 1;
            }
          }
        });
      }
    }

// Convert objects to arrays for frontend consumption
   const messagesPerDayArray = Object.entries(messagesPerDay).map(([date, count]) => ({
     date,
     count
   })).sort((a, b) => a.date.localeCompare(b.date));

   const commonQuestionsArray = Object.entries(commonQuestions)
     .map(([question, count]) => ({ question, count }))
     .sort((a, b) => b.count - a.count);

   // Calculate average response time (mock data for now - you can implement real calculation)
   const averageResponseTime = 2.3; // seconds
   const satisfactionRating = 4.2; // out of 5

   // Generate hourly activity data (mock data)
   const userActivity = Array.from({ length: 24 }, (_, hour) => ({
     hour,
     count: Math.floor(Math.random() * 50) // Replace with real data
   }));

   return {
     totalConversations,
     totalMessages,
     averageResponseTime,
     satisfactionRating,
     messagesPerDay: messagesPerDayArray,
     commonQuestions: commonQuestionsArray,
     userActivity
   };

 } catch (error) {
   console.error('Error fetching chat analytics:', error);
   throw new HttpsError("internal", "Failed to fetch analytics");
 }
});

// Get chat conversations
export const getChatConversations = onCall({
 cors: ["*"],
 timeoutSeconds: 60,
}, async (request) => {
 if (!request.auth) {
   throw new HttpsError("unauthenticated", "Authentication required");
 }

 if (!isAdmin(request.auth.uid, request.auth.token.email)) {
   throw new HttpsError("permission-denied", "Admin access required");
 }

 try {
   const { status = 'all', search = '', dateRange = 'week' } = request.data;
   
   // Calculate date range
   const now = new Date();
   let startDate: Date;
   
   switch (dateRange) {
     case 'today':
       startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
       break;
     case 'week':
       startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
       break;
     case 'month':
       startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
       break;
     default:
       startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
   }

   const conversations = [];
   const chatsSnapshot = await db.collection('supportChats').get();

   for (const chatDoc of chatsSnapshot.docs) {
     const userId = chatDoc.id;
     
     // Get user info
     const userDoc = await db.collection('users').doc(userId).get();
     const userData = userDoc.data();
     
     // Get messages
     const messagesSnapshot = await chatDoc.ref
       .collection('messages')
       .where('timestamp', '>=', Timestamp.fromDate(startDate))
       .orderBy('timestamp', 'desc')
       .limit(50)
       .get();

     if (messagesSnapshot.size > 0) {
       const messages = messagesSnapshot.docs.map(doc => doc.data());
       const lastMessage = messages[0];
       
       // Determine conversation status (simplified logic)
       const lastActivity = lastMessage.timestamp?.toDate() || new Date();
       const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
       
       let conversationStatus = 'active';
       if (hoursSinceLastActivity > 24) {
         conversationStatus = 'resolved';
       } else if (hoursSinceLastActivity > 2) {
         conversationStatus = 'pending';
       }

       // Apply status filter
       if (status !== 'all' && conversationStatus !== status) {
         continue;
       }

       // Apply search filter
       if (search && !lastMessage.content.toLowerCase().includes(search.toLowerCase()) &&
           !userData?.email?.toLowerCase().includes(search.toLowerCase())) {
         continue;
       }

       // Get feedback/rating (if exists)
       const feedbackDoc = await chatDoc.ref.collection('feedback').limit(1).get();
       let rating = undefined;
       let feedback = undefined;
       
       if (!feedbackDoc.empty) {
         const feedbackData = feedbackDoc.docs[0].data();
         rating = feedbackData.rating;
         feedback = feedbackData.comment;
       }

       conversations.push({
         id: userId,
         userId,
         userName: userData?.displayName,
         userEmail: userData?.email,
         lastMessage: lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : ''),
         messageCount: messagesSnapshot.size,
         lastActivity,
         status: conversationStatus,
         rating,
         feedback
       });
     }
   }

   // Sort by last activity
   conversations.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

   return { conversations };

 } catch (error) {
   console.error('Error fetching conversations:', error);
   throw new HttpsError("internal", "Failed to fetch conversations");
 }
});

// Get messages for a specific conversation
export const getChatMessages = onCall({
 cors: ["*"],
 timeoutSeconds: 30,
}, async (request) => {
 if (!request.auth) {
   throw new HttpsError("unauthenticated", "Authentication required");
 }

 if (!isAdmin(request.auth.uid, request.auth.token.email)) {
   throw new HttpsError("permission-denied", "Admin access required");
 }

 try {
   const { conversationId } = request.data;
   
   if (!conversationId) {
     throw new HttpsError("invalid-argument", "Conversation ID is required");
   }

   const messagesSnapshot = await db
     .collection('supportChats')
     .doc(conversationId)
     .collection('messages')
     .orderBy('timestamp', 'asc')
     .get();

   const messages = messagesSnapshot.docs.map(doc => ({
     id: doc.id,
     ...doc.data(),
     timestamp: doc.data().timestamp?.toDate()
   }));

   return { messages };

 } catch (error) {
   console.error('Error fetching conversation messages:', error);
   throw new HttpsError("internal", "Failed to fetch messages");
 }
});

// Export chat data
export const exportChatData = onCall({
 cors: ["*"],
 timeoutSeconds: 120,
}, async (request) => {
 if (!request.auth) {
   throw new HttpsError("unauthenticated", "Authentication required");
 }

 if (!isAdmin(request.auth.uid, request.auth.token.email)) {
   throw new HttpsError("permission-denied", "Admin access required");
 }

 try {
   const { dateRange = 'week' } = request.data;
   
   // This would generate and return CSV data
   // For now, returning a simple structure
   const conversations: Array<{
     userId: string;
     userEmail?: string;
     messageCount: number;
     lastActivity: Date;
     status: string;
     rating?: number;
     feedback?: string;
   }> = []; // Use the same logic as getChatConversations
   
   // Convert to CSV format
   const csvHeader = 'User ID,User Email,Message Count,Last Activity,Status,Rating,Feedback\n';
   const csvRows = conversations.map(conv => 
     `"${conv.userId}","${conv.userEmail || ''}","${conv.messageCount}","${conv.lastActivity}","${conv.status}","${conv.rating || ''}","${conv.feedback || ''}"`
   ).join('\n');
   
   const csvData = csvHeader + csvRows;
   
   return { 
     data: csvData,
     filename: `chat-export-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
   };

 } catch (error) {
   console.error('Error exporting chat data:', error);
   throw new HttpsError("internal", "Failed to export data");
 }
});
