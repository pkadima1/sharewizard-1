/**
 * Production Performance Monitor
 * Tracks and reports performance metrics for production optimization
 */

import { getConfig } from '@/config/production';
import { logInfo, logWarn } from './productionErrorHandler';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    averageLoadTime: number;
    slowestOperation: string;
    fastestOperation: string;
    totalOperations: number;
  };
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  private constructor() {
    this.initializeMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeMonitoring(): void {
    const config = getConfig();
    
    if (!config.analytics.trackPerformance) {
      return;
    }

    this.isMonitoring = true;
    this.setupPerformanceObservers();
  }

  private setupPerformanceObservers(): void {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.recordNavigationTiming(entry as PerformanceNavigationTiming);
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        logWarn('Failed to setup navigation performance observer', { component: 'performance' });
      }

      // Monitor resource loading
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              this.recordResourceTiming(entry as PerformanceResourceTiming);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        logWarn('Failed to setup resource performance observer', { component: 'performance' });
      }

      // Monitor long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'longtask') {
              this.recordLongTask(entry as PerformanceEntry);
            }
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        logWarn('Failed to setup long task performance observer', { component: 'performance' });
      }
    }
  }

  private recordNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = [
      { name: 'domContentLoaded', value: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart, unit: 'ms' },
      { name: 'loadComplete', value: entry.loadEventEnd - entry.loadEventStart, unit: 'ms' },
      { name: 'firstPaint', value: entry.responseStart - entry.requestStart, unit: 'ms' },
      { name: 'totalLoadTime', value: entry.loadEventEnd - entry.fetchStart, unit: 'ms' },
    ];

    metrics.forEach(metric => {
      this.recordMetric(metric.name, metric.value, metric.unit, {
        url: window.location.href,
        type: 'navigation',
      });
    });
  }

  private recordResourceTiming(entry: PerformanceResourceTiming): void {
    const loadTime = entry.responseEnd - entry.fetchStart;
    
    // Only record slow resources (> 1 second)
    if (loadTime > 1000) {
      this.recordMetric('slowResource', loadTime, 'ms', {
        resource: entry.name,
        type: entry.initiatorType,
        size: entry.transferSize,
      });
    }
  }

  private recordLongTask(entry: PerformanceEntry): void {
    this.recordMetric('longTask', entry.duration, 'ms', {
      startTime: entry.startTime,
      type: 'longtask',
    });
    
    logWarn(`Long task detected: ${entry.duration}ms`, { 
      component: 'performance',
      action: 'long_task_detected',
    });
  }

  recordMetric(
    name: string, 
    value: number, 
    unit: string = 'ms', 
    context?: Record<string, unknown>
  ): void {
    if (!this.isMonitoring) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // Log slow operations
    if (value > 1000 && unit === 'ms') {
      logWarn(`Slow operation detected: ${name} took ${value}ms`, {
        component: 'performance',
        action: 'slow_operation',
      });
    }
  }

  measureOperation<T>(
    name: string,
    operation: () => T | Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    
    return Promise.resolve(operation()).finally(() => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', context);
    });
  }

  async measureAsyncOperation<T>(
    name: string,
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, 'ms', {
        ...context,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  getPerformanceReport(): PerformanceReport {
    const recentMetrics = this.metrics.filter(
      metric => Date.now() - metric.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    if (recentMetrics.length === 0) {
      return {
        metrics: [],
        summary: {
          averageLoadTime: 0,
          slowestOperation: '',
          fastestOperation: '',
          totalOperations: 0,
        },
      };
    }

    const loadTimeMetrics = recentMetrics.filter(m => m.name.includes('load') || m.name.includes('Load'));
    const averageLoadTime = loadTimeMetrics.length > 0 
      ? loadTimeMetrics.reduce((sum, m) => sum + m.value, 0) / loadTimeMetrics.length 
      : 0;

    const sortedByValue = [...recentMetrics].sort((a, b) => b.value - a.value);
    const slowestOperation = sortedByValue[0]?.name || '';
    const fastestOperation = sortedByValue[sortedByValue.length - 1]?.name || '';

    return {
      metrics: recentMetrics,
      summary: {
        averageLoadTime,
        slowestOperation,
        fastestOperation,
        totalOperations: recentMetrics.length,
      },
    };
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length;
  }

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export convenience functions
export const measureOperation = <T>(
  name: string, 
  operation: () => T | Promise<T>, 
  context?: Record<string, unknown>
): Promise<T> => {
  return performanceMonitor.measureOperation(name, operation, context);
};

export const recordMetric = (
  name: string, 
  value: number, 
  unit?: string, 
  context?: Record<string, unknown>
): void => {
  performanceMonitor.recordMetric(name, value, unit, context);
}; 