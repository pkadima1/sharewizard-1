import React, { useState } from 'react';
import GoogleTrendsWidget from './GoogleTrendsWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import type { TrendingData } from '@/types/google-trends';

const GoogleTrendsExample: React.FC = () => {
  const { t } = useTranslation('inspiration');
  const [keywords, setKeywords] = useState<string[]>(['artificial intelligence', 'machine learning']);
  const [geo, setGeo] = useState<string>('US');
  const [timeframe, setTimeframe] = useState<string>('today 12-m');
  const [trendsData, setTrendsData] = useState<TrendingData | null>(null);

  const handleKeywordsChange = (value: string) => {
    setKeywords(value.split(',').map(k => k.trim()).filter(k => k.length > 0));
  };

  const handleTrendsData = (data: TrendingData) => {
    setTrendsData(data);
    console.log('Trends data received:', data);
  };

  const handleLoad = () => {
    console.log('Google Trends widget loaded successfully');
  };

  const handleError = (error: Error) => {
    console.error('Google Trends widget error:', error);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('googleTrends.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                value={keywords.join(', ')}
                onChange={(e) => handleKeywordsChange(e.target.value)}
                placeholder="Enter keywords..."
              />
            </div>
            <div>
              <Label htmlFor="geo">Location</Label>
              <Input
                id="geo"
                value={geo}
                onChange={(e) => setGeo(e.target.value)}
                placeholder="US"
              />
            </div>
            <div>
              <Label htmlFor="timeframe">Timeframe</Label>
              <Input
                id="timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="today 12-m"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <GoogleTrendsWidget
        keywords={keywords}
        geo={geo}
        timeframe={timeframe}
        onTrendsData={handleTrendsData}
        onLoad={handleLoad}
        onError={handleError}
      />

      {trendsData && (
        <Card>
          <CardHeader>
            <CardTitle>Trends Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
              {JSON.stringify(trendsData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleTrendsExample; 