/**
 * ChatContext.tsx - v1.0.0
 * 
 * Purpose: Global context provider for the AI support chat functionality
 * Features: State management, Firebase function calls, message history, typing indicators
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from './AuthContext';
import { functions } from '../lib/firebase';
import { toast } from 'sonner';

// TypeScript interfaces
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatUserInfo {
  firstName: string;
  email: string;
  topic: string;
}

interface ChatContextType {
  // Chat state
  isOpen: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  isSubmitting: boolean;
  messagesRemaining?: number;
  userInfo: ChatUserInfo | null;
  hasProvidedInfo: boolean;

  // Chat actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setUserInfo: (info: ChatUserInfo) => void;
}

// Create context with default values
const ChatContext = createContext<ChatContextType>({
  isOpen: false,
  messages: [],
  isTyping: false,
  isSubmitting: false,
  messagesRemaining: undefined,
  userInfo: null,
  hasProvidedInfo: false,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  sendMessage: async () => {},
  clearMessages: () => {},
  setUserInfo: () => {},
});

// Local storage keys
const CHAT_STORAGE_KEY = 'engageperfect_chat_messages';
const CHAT_LAST_ACTIVITY_KEY = 'engageperfect_chat_last_activity';
const CHAT_USER_INFO_KEY = 'engageperfect_chat_user_info';

/**
 * Provider component that wraps your app and makes chat context available to any
 * child component that calls useChat().
 */
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  
  // Chat state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [messagesRemaining, setMessagesRemaining] = useState<number | undefined>(undefined);
  const [userInfo, setUserInfoState] = useState<ChatUserInfo | null>(null);
  const [hasProvidedInfo, setHasProvidedInfo] = useState<boolean>(false);
  
  // Reference to store the last activity timestamp
  const lastActivityRef = useRef<Date>(new Date());
  
  // Load chat history from localStorage on mount
  useEffect(() => {
    if (currentUser?.uid) {
      try {
        // Try to load user info from localStorage
        const storedUserInfo = localStorage.getItem(`${CHAT_USER_INFO_KEY}_${currentUser.uid}`);
        const storedMessages = localStorage.getItem(`${CHAT_STORAGE_KEY}_${currentUser.uid}`);
        const lastActivity = localStorage.getItem(`${CHAT_LAST_ACTIVITY_KEY}_${currentUser.uid}`);
        
        // Load user info if available
        if (storedUserInfo) {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          setUserInfoState(parsedUserInfo);
          setHasProvidedInfo(true);
        }
        
        if (storedMessages && lastActivity) {
          const parsedMessages = JSON.parse(storedMessages);
          const parsedLastActivity = new Date(JSON.parse(lastActivity));
          const now = new Date();
          
          // Convert string timestamps to Date objects
          const formattedMessages = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          // Only restore chat if it's less than 24 hours old
          const hoursSinceLastActivity = (now.getTime() - parsedLastActivity.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastActivity < 24) {
            setMessages(formattedMessages);
            lastActivityRef.current = parsedLastActivity;
          } else {
            // Chat too old, clear everything
            setMessages([]);
            setUserInfoState(null);
            setHasProvidedInfo(false);
            lastActivityRef.current = now;
            // Clear old data
            localStorage.removeItem(`${CHAT_STORAGE_KEY}_${currentUser.uid}`);
            localStorage.removeItem(`${CHAT_USER_INFO_KEY}_${currentUser.uid}`);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // If there's an error, reset everything
        setMessages([]);
        setUserInfoState(null);
        setHasProvidedInfo(false);
      }
    }
  }, [currentUser?.uid]);
  
  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (currentUser?.uid && messages.length > 0) {
      try {
        localStorage.setItem(`${CHAT_STORAGE_KEY}_${currentUser.uid}`, JSON.stringify(messages));
        localStorage.setItem(`${CHAT_LAST_ACTIVITY_KEY}_${currentUser.uid}`, JSON.stringify(new Date()));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  }, [messages, currentUser?.uid]);
  
  // Chat actions
  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
    setHasProvidedInfo(false);
    setUserInfoState(null);
    
    if (currentUser?.uid) {
      localStorage.removeItem(`${CHAT_STORAGE_KEY}_${currentUser.uid}`);
      localStorage.removeItem(`${CHAT_USER_INFO_KEY}_${currentUser.uid}`);
      localStorage.setItem(`${CHAT_LAST_ACTIVITY_KEY}_${currentUser.uid}`, JSON.stringify(new Date()));
    }
  }, [currentUser?.uid]);

  // Set user information
  const setUserInfo = useCallback((info: ChatUserInfo) => {
    setUserInfoState(info);
    setHasProvidedInfo(true);
    
    // Store user info in localStorage
    if (currentUser?.uid) {
      localStorage.setItem(`${CHAT_USER_INFO_KEY}_${currentUser.uid}`, JSON.stringify(info));
    }
    
    // Create personalized welcome message
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: `Hi ${info.firstName}! Thanks for reaching out about "${info.topic}". I'm here to help you with EngagePerfect. What specific questions do you have?`,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, [currentUser]);
  
  // Send message to API and handle response
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !currentUser) return;
    
    // Create user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    
    // Set loading states
    setIsSubmitting(true);
    setIsTyping(true);
    
    try {
      // Get Firebase function
      const supportChatFunction = httpsCallable<
        { 
          messages: Array<{ role: 'user' | 'assistant', content: string }>,
          userInfo?: ChatUserInfo 
        },
        { reply: string, messagesRemaining?: number }
      >(functions, 'supportChat');
      
      // Prepare messages for API
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add the new user message
      messageHistory.push({
        role: userMessage.role,
        content: userMessage.content
      });
      
      // Call Firebase function with user info
      const response = await supportChatFunction({
        messages: messageHistory,
        userInfo: userInfo || undefined
      });
      
      // Extract response data
      const { reply, messagesRemaining: remaining } = response.data;
      
      // Create assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date()
      };
      
      // Update state with response
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update messages remaining if provided
      if (typeof remaining === 'number') {
        setMessagesRemaining(remaining);
      }
      
      // Update last activity
      lastActivityRef.current = new Date();
      
    } catch (error) {
      console.error('Support chat error:', error);
      
      // Create error message for user
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment or contact support directly.',
        timestamp: new Date()
      };
      
      // Add error message to chat
      setMessages(prev => [...prev, errorMessage]);
      
      // Show error toast
      toast.error('Failed to send message. Please try again.');
      
    } finally {
      // Reset loading states
      setIsSubmitting(false);
      setIsTyping(false);
    }
  }, [messages, currentUser]);
  
  // Context value
  const contextValue: ChatContextType = {
    isOpen,
    messages,
    isTyping,
    isSubmitting,
    messagesRemaining,
    userInfo,
    hasProvidedInfo,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    clearMessages,
    setUserInfo
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Hook that enables components to subscribe to chat context
 */
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
};
