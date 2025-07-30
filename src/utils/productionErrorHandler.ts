/**
 * Production Error Handler
 * Centralized error handling for production environment
 */

import { getConfig } from '@/config/production';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

interface ErrorReport {
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ProductionErrorHandler {
  private static instance: ProductionErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private isReporting = false;

  private constructor() {
    // Initialize error handling
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ProductionErrorHandler {
    if (!ProductionErrorHandler.instance) {
      ProductionErrorHandler.instance = new ProductionErrorHandler();
    }
    return ProductionErrorHandler.instance;
  }

  private setupGlobalErrorHandlers(): void {
    const config = getConfig();
    
    if (config.errorHandling.reportToAnalytics) {
      // Global error handler
      window.addEventListener('error', (event) => {
        this.handleError(event.error || new Error(event.message), {
          component: 'global',
          action: 'unhandled_error',
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      });

      // Promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(new Error(event.reason), {
          component: 'global',
          action: 'unhandled_promise_rejection',
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      });
    }
  }

  handleError(
    error: Error | string,
    context: Partial<ErrorContext> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const config = getConfig();
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const errorReport: ErrorReport = {
      message: errorMessage,
      stack: errorStack,
      context: {
        component: context.component || 'unknown',
        action: context.action || 'unknown',
        userId: context.userId,
        timestamp: context.timestamp || Date.now(),
        userAgent: context.userAgent || navigator.userAgent,
        url: context.url || window.location.href,
      },
      severity,
    };

    // Log to console only in development
    if (config.errorHandling.logToConsole) {
      console.error('Error:', errorReport);
    }

    // Queue error for reporting
    this.errorQueue.push(errorReport);

    // Report errors in batches
    this.reportErrors();
  }

  private async reportErrors(): Promise<void> {
    if (this.isReporting || this.errorQueue.length === 0) {
      return;
    }

    this.isReporting = true;
    const config = getConfig();

    try {
      const errorsToReport = this.errorQueue.splice(0, 10); // Report in batches of 10

      if (config.analytics.enabled && config.errorHandling.reportToAnalytics) {
        // Report to analytics service
        await this.sendToAnalytics(errorsToReport);
      }
    } catch (reportingError) {
      // Don't let error reporting cause more errors
      if (config.errorHandling.logToConsole) {
        console.warn('Error reporting failed:', reportingError);
      }
    } finally {
      this.isReporting = false;
    }
  }

  private async sendToAnalytics(errors: ErrorReport[]): Promise<void> {
    // Implementation for sending errors to analytics service
    // This would typically send to Google Analytics, Sentry, or similar
    try {
      // Example: Send to Google Analytics
      if ((window as any).gtag) {
        errors.forEach(error => {
          (window as any).gtag('event', 'exception', {
            description: error.message,
            fatal: error.severity === 'critical',
            custom_map: {
              component: error.context.component,
              action: error.context.action,
              severity: error.severity,
            },
          });
        });
      }
    } catch (analyticsError) {
      // Fallback: just log the error
      if (getConfig().errorHandling.logToConsole) {
        console.warn('Analytics reporting failed:', analyticsError);
      }
    }
  }

  // Production-safe logging methods
  log(message: string, context?: Partial<ErrorContext>): void {
    const config = getConfig();
    if (config.errorHandling.logToConsole) {
      console.log(`[${context?.component || 'app'}] ${message}`);
    }
  }

  warn(message: string, context?: Partial<ErrorContext>): void {
    const config = getConfig();
    if (config.errorHandling.logToConsole) {
      console.warn(`[${context?.component || 'app'}] ${message}`);
    }
    this.handleError(message, context, 'low');
  }

  info(message: string, context?: Partial<ErrorContext>): void {
    const config = getConfig();
    if (config.errorHandling.logToConsole) {
      console.info(`[${context?.component || 'app'}] ${message}`);
    }
  }

  debug(message: string, context?: Partial<ErrorContext>): void {
    const config = getConfig();
    if (config.features.enableDebugMode && config.errorHandling.logToConsole) {
      console.debug(`[${context?.component || 'app'}] ${message}`);
    }
  }
}

// Export singleton instance
export const errorHandler = ProductionErrorHandler.getInstance();

// Export convenience functions
export const logError = (error: Error | string, context?: Partial<ErrorContext>, severity?: 'low' | 'medium' | 'high' | 'critical') => {
  errorHandler.handleError(error, context, severity);
};

export const logInfo = (message: string, context?: Partial<ErrorContext>) => {
  errorHandler.info(message, context);
};

export const logWarn = (message: string, context?: Partial<ErrorContext>) => {
  errorHandler.warn(message, context);
};

export const logDebug = (message: string, context?: Partial<ErrorContext>) => {
  errorHandler.debug(message, context);
}; 