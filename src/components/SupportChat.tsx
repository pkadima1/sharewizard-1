/**
 * SupportChat.tsx - v1.0.0
 * 
 * Purpose: Floating support chat widget powered by OpenAI
 * Features: Chat interface, message history, typing indicators, mobile-friendly
 * Interactions: Connects to Firebase Cloud Function for AI responses
 */

import React, { useRef, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User,
  Loader2,
  Minus,
  Maximize2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../contexts/ChatContext';
import ChatUserInfoForm from './ChatUserInfoForm';

interface ChatFormData {
  message: string;
}

interface SupportChatProps {
  className?: string;
}

const SupportChat: React.FC<SupportChatProps> = ({ className }) => {
  const { t } = useTranslation();
  // Get chat state and actions from context
  const { 
    isOpen, 
    messages, 
    isTyping, 
    isSubmitting, 
    hasProvidedInfo,
    openChat, 
    closeChat, 
    sendMessage,
    setUserInfo
  } = useChat();
  
  // Local state for minimize/maximize
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Form handling
  const { register, handleSubmit, reset, formState } = useForm<ChatFormData>();
  
  // Refs for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle message submission
  const onSubmit = async (data: ChatFormData) => {
    if (!data.message.trim()) return;
    
    // Send message through context
    await sendMessage(data.message);
    reset(); // Clear input
  };

  // Format timestamp for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`fixed z-50 ${className}`}>
      {/* Floating Chat Icon */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8">
          <button
            onClick={openChat}
            className="group bg-primary hover:bg-primary-dark text-white rounded-full w-16 h-16 md:w-14 md:h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30"
            aria-label="Open support chat"
          >
            <MessageCircle className="h-7 w-7 md:h-6 md:w-6 group-hover:scale-110 transition-transform" />
            
            {/* Notification dot (optional - you can add logic to show when needed) */}
            <div className="absolute -top-1 -right-1 w-4 h-4 md:w-3 md:h-3 bg-red-500 rounded-full animate-pulse shadow-sm" />
          </button>
          
          {/* Helpful tooltip */}
          <div className="absolute bottom-full right-0 mb-3 mr-2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            {t('support.title')}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Chat Popup - Better positioning for different screen sizes */}
      {isOpen && (
        <div 
          className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:top-auto md:left-auto bg-black/50 md:bg-transparent flex items-end md:items-end justify-center md:justify-end p-4 md:p-0"
          onClick={(e) => {
            // Close chat when clicking overlay on mobile (not on desktop)
            if (e.target === e.currentTarget && window.innerWidth < 768) {
              closeChat();
            }
          }}
        >
          {/* Chat Container */}
          <div className={`bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md md:w-96 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-4 duration-300 ${
            isMinimized ? 'h-auto md:h-auto' : 'h-[85vh] md:h-[500px]'
          }`}>
            
            {/* Chat Header */}
            <div className="bg-primary text-white px-4 py-4 md:py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 md:h-4 md:w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-base md:text-sm">{t('support.title')}</h3>
                  {!isMinimized && (
                    <p className="text-sm md:text-xs text-primary-100">{t('support.subtitle')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Minimize/Maximize Button */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-white/20 rounded-full p-2 md:p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-5 w-5 md:h-4 md:w-4" />
                  ) : (
                    <Minus className="h-5 w-5 md:h-4 md:w-4" />
                  )}
                </button>
                {/* Close Button */}
                <button
                  onClick={closeChat}
                  className="hover:bg-white/20 rounded-full p-2 md:p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label="Close chat"
                >
                  <X className="h-6 w-6 md:h-5 md:w-5" />
                </button>
              </div>
            </div>

          {/* Messages Area or User Info Form - Only show when not minimized */}
          {!isMinimized && (
            <>
              {!hasProvidedInfo ? (
                // Show user info form if not provided
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-1">
                  <ChatUserInfoForm 
                    onSubmit={setUserInfo}
                    isSubmitting={isSubmitting}
                  />
                </div>
              ) : (
                // Show chat interface if user info is provided
                <>
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800"
                  >
                {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 md:w-7 md:h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-white rounded-br-md shadow-sm'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-600'
                  }`}>
                    <p className="text-sm md:text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' 
                        ? 'text-primary-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-[85%]">
                  <div className="w-8 h-8 md:w-7 md:h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('support.typing')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-3">
              <input
                {...register('message', { required: true })}
                type="text"
                placeholder={t('support.placeholder')}
                disabled={isSubmitting || isTyping}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-gray-800 dark:text-white disabled:opacity-50 transition-colors"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isSubmitting || isTyping}
                className="bg-primary hover:bg-primary-dark text-white rounded-xl px-4 py-3 md:py-2 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="Send message"
              >
                {formState.isSubmitting ? (
                  <Loader2 className="h-5 w-5 md:h-4 md:w-4 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 md:h-4 md:w-4" />
                )}
              </button>
            </form>
            
            {/* Footer */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center leading-relaxed">
              {t('support.footer')}
            </p>
          </div>
                </>
              )}
            </>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default SupportChat;
