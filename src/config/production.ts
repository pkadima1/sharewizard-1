/**
 * Production Configuration
 * Centralized configuration for production environment
 */

export const PRODUCTION_CONFIG = {
  // API Configuration
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    baseUrl: process.env.VITE_API_BASE_URL || 'https://api.engageperfect.com',
  },
  
  // Cache Configuration
  cache: {
    maxSize: 1000,
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    enableStats: true,
    enableWarming: true,
    evictionPolicy: 'hybrid' as const,
  },
  
  // Analytics Configuration
  analytics: {
    enabled: true,
    debugMode: false,
    trackErrors: true,
    trackPerformance: true,
  },
  
  // Error Handling
  errorHandling: {
    showUserFriendlyErrors: true,
    logToConsole: false, // Disable console logs in production
    reportToAnalytics: true,
  },
  
  // Performance
  performance: {
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enableServiceWorker: true,
  },
  
  // Security
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
  },
  
  // Feature Flags
  features: {
    enableAdvancedAnalytics: true,
    enableAITestMode: false,
    enableDebugMode: false,
    enableExperimentalFeatures: false,
  },
};

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

// Environment-specific overrides
export const getConfig = () => {
  if (isProduction) {
    return {
      ...PRODUCTION_CONFIG,
      errorHandling: {
        ...PRODUCTION_CONFIG.errorHandling,
        logToConsole: false,
      },
      features: {
        ...PRODUCTION_CONFIG.features,
        enableDebugMode: false,
        enableExperimentalFeatures: false,
      },
    };
  }
  
  return {
    ...PRODUCTION_CONFIG,
    errorHandling: {
      ...PRODUCTION_CONFIG.errorHandling,
      logToConsole: true,
    },
    features: {
      ...PRODUCTION_CONFIG.features,
      enableDebugMode: true,
      enableExperimentalFeatures: true,
    },
  };
}; 