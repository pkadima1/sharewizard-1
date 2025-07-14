/**
 * Higher-Order Component (HOC) for automatic page view tracking
 * Wraps any component to automatically track page views when mounted
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/analytics';

interface WithAnalyticsProps {
  pageTitle?: string;
  trackOnMount?: boolean;
  customPath?: string;
}

/**
 * HOC that adds analytics page tracking to any component
 * @param WrappedComponent - The component to wrap
 * @param options - Analytics options
 */
export function withPageAnalytics<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAnalyticsProps = {}
) {
  const {
    pageTitle,
    trackOnMount = true,
    customPath
  } = options;

  const WithAnalyticsComponent: React.FC<P> = (props) => {
    const location = useLocation();

    useEffect(() => {
      if (trackOnMount) {
        const path = customPath || location.pathname;
        const title = pageTitle || document.title;
        
        // Track page view
        trackPageView(path, title);
      }
    }, [location.pathname, pageTitle, customPath, trackOnMount]);

    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  WithAnalyticsComponent.displayName = `withPageAnalytics(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithAnalyticsComponent;
}

/**
 * React Hook for manual page tracking
 * Use this when you need more control over when page views are tracked
 */
export function usePageAnalytics(
  pageTitle?: string,
  customPath?: string,
  dependencies: React.DependencyList = []
) {
  const location = useLocation();

  useEffect(() => {
    const path = customPath || location.pathname;
    const title = pageTitle || document.title;
    
    trackPageView(path, title);
  }, [location.pathname, pageTitle, customPath, ...dependencies]);
}

/**
 * Component wrapper for automatic page tracking
 * Use this as a wrapper component instead of HOC if preferred
 */
interface PageAnalyticsWrapperProps {
  pageTitle?: string;
  customPath?: string;
  children: React.ReactNode;
}

export const PageAnalyticsWrapper: React.FC<PageAnalyticsWrapperProps> = ({
  pageTitle,
  customPath,
  children
}) => {
  usePageAnalytics(pageTitle, customPath);
  return <>{children}</>;
};
