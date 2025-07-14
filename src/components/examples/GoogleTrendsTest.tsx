import React, { useState } from 'react';
import SmartKeywordGenerator from '@/components/wizard/smart/SmartKeywordGenerator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Flame, BarChart3 } from 'lucide-react';

const GoogleTrendsTest: React.FC = () => {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [trendsData, setTrendsData] = useState<any[]>([]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              Google Trends Integration Test
            </h1>
            <p className="text-orange-700 dark:text-orange-300">
              Test the enhanced SmartKeywordGenerator with Google Trends integration
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-600" />
            <span className="font-medium">🔥 Hot Keywords:</span>
            <Badge variant="destructive" className="text-xs">
              {trendsData.filter(kw => kw.isTrending).length} trending
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Total Keywords:</span>
            <Badge variant="secondary" className="text-xs">
              {selectedKeywords.length} selected
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="font-medium">Trends Data:</span>
            <Badge variant="outline" className="text-xs">
              {trendsData.length > 0 ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Test Instructions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">How to Test:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Enter a topic (e.g., "email marketing", "digital transformation", "AI tools")</li>
          <li>Select an industry and audience</li>
          <li>Click "Regenerate" to generate keywords</li>
          <li>Look for the 🔥 <strong>Hot</strong> badges on trending keywords</li>
          <li>Check the "Trending Score" in keyword metrics</li>
          <li>Scroll down to see the Google Trends widget</li>
          <li>Keywords will be automatically sorted by trending popularity</li>
        </ol>
      </Card>

      {/* SmartKeywordGenerator with Trends Enabled */}
      <SmartKeywordGenerator
        topic=""
        industry=""
        audience=""
        selectedKeywords={selectedKeywords}
        onKeywordsChange={setSelectedKeywords}
        maxKeywords={20}
        enableTrendsIntegration={true}
        onTrendsData={(trends) => {
          console.log('Google Trends data received:', trends);
          setTrendsData(trends);
        }}
        className="w-full"
      />

      {/* Trends Data Display */}
      {trendsData.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Trends Analysis Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Trending Keywords:</h4>
              <div className="space-y-1">
                {trendsData
                  .filter(kw => kw.isTrending)
                  .slice(0, 5)
                  .map((keyword, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded">
                      <Flame className="h-3 w-3 text-red-600" />
                      <span className="text-sm font-medium">{keyword.keyword}</span>
                      <Badge variant="destructive" className="text-xs">
                        Score: {keyword.trendingScore}/100
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">All Keywords (Sorted by Trend):</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {trendsData.slice(0, 10).map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                    <span className="text-sm">{keyword.keyword}</span>
                    <div className="flex items-center gap-1">
                      {keyword.isTrending && <Flame className="h-3 w-3 text-red-600" />}
                      <Badge variant="outline" className="text-xs">
                        {keyword.trendingScore}/100
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GoogleTrendsTest; 