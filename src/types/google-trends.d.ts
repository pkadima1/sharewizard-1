declare global {
  interface Window {
    trends?: {
      embed?: {
        renderExploreWidget?: (
          widgetType: string,
          data: GoogleTrendsData,
          options: GoogleTrendsOptions
        ) => void;
      };
    };
  }
}

export interface GoogleTrendsData {
  comparisonItem: Array<{
    keyword: string;
    geo: string;
    time: string;
  }>;
  category: number;
  property: string;
}

export interface GoogleTrendsOptions {
  exploreQuery: string;
  guestPath: string;
}

export interface GoogleTrendsWidgetProps {
  keywords: string[];
  geo?: string;
  timeframe?: string;
  className?: string;
  onTrendsData?: (data: any) => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export interface TrendingData {
  keywords: string[];
  geo: string;
  timeframe: string;
  data: any;
}

export {}; 