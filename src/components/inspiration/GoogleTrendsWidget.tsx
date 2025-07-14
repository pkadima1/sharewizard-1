import React, { useEffect, useRef, useState } from 'react';
import Script from 'react-load-script';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GoogleTrendsWidgetProps } from '@/types/google-trends';

const GoogleTrendsWidget: React.FC<GoogleTrendsWidgetProps> = ({
  keywords,
  geo = 'US',
  timeframe = 'today 12-m',
  className = '',
  onTrendsData,
  onLoad,
  onError
}) => {
  const { t } = useTranslation('inspiration');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate unique container ID
  const containerId = `google-trends-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle script load success
  const handleScriptLoad = () => {
    setIsScriptLoaded(true);
    console.log('Google Trends script loaded successfully');
  };

  // Handle script load error
  const handleScriptError = () => {
    const errorMsg = t('googleTrends.errors.scriptLoadFailed');
    setError(errorMsg);
    onError?.(new Error(errorMsg));
    console.error('Failed to load Google Trends script');
  };

  // Initialize widget when script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current) return;

    try {
      // Wait a bit for the script to fully initialize
      const timer = setTimeout(() => {
        if (window.trends?.embed?.renderExploreWidget) {
          // Prepare the data structure as per Google Trends API
          const comparisonItems = keywords.map(keyword => ({
            keyword,
            geo,
            time: timeframe
          }));

          const data = {
            comparisonItem: comparisonItems,
            category: 0,
            property: ""
          };

          const options = {
            exploreQuery: `q=${keywords.join(',')}&geo=${geo}&date=${timeframe}`,
            guestPath: "https://trends.google.com:443/trends/embed/"
          };

          // Render the widget
          window.trends.embed.renderExploreWidget("TIMESERIES", data, options);
          
          setIsWidgetLoaded(true);
          onLoad?.();

          // Call onTrendsData callback with the data
          onTrendsData?.({
            keywords,
            geo,
            timeframe,
            data: { comparisonItems, options }
          });

          console.log('Google Trends widget rendered successfully');
        } else {
          const errorMsg = t('googleTrends.errors.widgetInitFailed');
          setError(errorMsg);
          onError?.(new Error(errorMsg));
          console.error('Google Trends widget not available');
        }
      }, 1000);

      return () => clearTimeout(timer);
    } catch (err) {
      const errorMsg = t('googleTrends.errors.widgetRenderFailed');
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      console.error('Error rendering Google Trends widget:', err);
    }
  }, [isScriptLoaded, keywords, geo, timeframe, onTrendsData, onLoad, onError, t]);

  // Reset states when props change
  useEffect(() => {
    setIsWidgetLoaded(false);
    setError(null);
  }, [keywords, geo, timeframe]);

  return (
    <Card className={`p-4 ${className}`}>
      {/* Script Loader */}
      <Script
        url="https://ssl.gstatic.com/trends_nrtr/3343_RC01/embed_loader.js"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="font-medium text-lg">
          {t('googleTrends.title')}
        </h3>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {!isScriptLoaded && !error && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('googleTrends.loading.script')}</span>
          </div>
        </div>
      )}

      {/* Widget Loading State */}
      {isScriptLoaded && !isWidgetLoaded && !error && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('googleTrends.loading.widget')}</span>
          </div>
        </div>
      )}

      {/* Widget Container */}
      <div
        ref={containerRef}
        id={containerId}
        className="min-h-[300px] w-full"
        style={{ minHeight: '300px' }}
      />

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-muted-foreground">
          <div>Keywords: {keywords.join(', ')}</div>
          <div>Geo: {geo}</div>
          <div>Timeframe: {timeframe}</div>
          <div>Container ID: {containerId}</div>
        </div>
      )}
    </Card>
  );
};

export default GoogleTrendsWidget; 