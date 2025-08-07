/**
 * ContentIdeaUsageIntegration Component
 * 
 * Example integration showing how to use ContentIdeaUsageTracker
 * with existing content generation components
 */

import React, { useState } from 'react';
import ContentIdeaUsageTracker from './ContentIdeaUsageTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Lightbulb, 
  BarChart3, 
  Crown, 
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import useContentIdeaUsage from '@/hooks/useContentIdeaUsage';

const ContentIdeaUsageIntegration: React.FC = () => {
  const { userProfile } = useAuth();
  const { usageStatus, canGenerateContentIdea, getCostEstimate } = useContentIdeaUsage();
  const [showUsageTracker, setShowUsageTracker] = useState(false);

  const handleGenerateIdea = () => {
    if (!canGenerateContentIdea()) {
      // Show upgrade prompt or usage tracker
      setShowUsageTracker(true);
      return;
    }

    // Proceed with idea generation
    console.log('Generating content idea...');
  };

  const getStatusIcon = () => {
    if (usageStatus.isOutOfRequests) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    if (usageStatus.isRunningLow) {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
    if (usageStatus.isPremium) {
      return <Crown className="h-5 w-5 text-purple-500" />;
    }
    return <Lock className="h-5 w-5 text-gray-500" />;
  };

  const getStatusText = () => {
    if (usageStatus.isOutOfRequests) {
      return 'Limit reached';
    }
    if (usageStatus.isRunningLow) {
      return 'Running low';
    }
    if (usageStatus.isPremium) {
      return 'Unlimited';
    }
    return 'Limited';
  };

  return (
    <div className="space-y-6">
      {/* Integration Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Content Idea Generation
          </CardTitle>
          <CardDescription>
            Generate AI-powered content ideas with usage tracking and analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage Status Overview */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h4 className="font-medium">Usage Status</h4>
                <p className="text-sm text-muted-foreground">
                  {usageStatus.requestsUsed} / {usageStatus.requestsLimit} requests used
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={usageStatus.isOutOfRequests ? "destructive" : usageStatus.isRunningLow ? "secondary" : "default"}>
                {getStatusText()}
              </Badge>
              {usageStatus.isPremium && usageStatus.estimatedCostPerIdea && (
                <Badge variant="outline" className="text-xs">
                  ${usageStatus.estimatedCostPerIdea.toFixed(4)} per idea
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerateIdea}
              disabled={!canGenerateContentIdea()}
              className="flex items-center gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Generate Content Idea
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowUsageTracker(!showUsageTracker)}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showUsageTracker ? 'Hide' : 'Show'} Usage Tracker
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {usageStatus.requestsRemaining}
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {usageStatus.usagePercentage.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Used</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {usageStatus.planType}
              </div>
              <div className="text-xs text-muted-foreground">Plan</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {usageStatus.isPremium ? '∞' : usageStatus.requestsLimit}
              </div>
              <div className="text-xs text-muted-foreground">Limit</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tracker Integration */}
      {showUsageTracker && (
        <ContentIdeaUsageTracker
          className="w-full"
          showHistory={true}
          showAnalytics={true}
          showSharing={true}
          onShare={(idea) => {
            console.log('Sharing idea:', idea);
            // Handle sharing logic
          }}
        />
      )}

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Examples</CardTitle>
          <CardDescription>
            Different ways to integrate the usage tracker with your components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Basic Integration</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Simple usage tracking with default settings
              </p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`<ContentIdeaUsageTracker />`}
              </pre>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">With Custom Handlers</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Custom upgrade and sharing logic
              </p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`<ContentIdeaUsageTracker
  onUpgrade={() => navigate('/pricing')}
  onShare={handleShare}
  showHistory={true}
  showAnalytics={true}
/>`}
              </pre>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Hook Integration</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Using the useContentIdeaUsage hook
              </p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`const { usageStatus, canGenerateContentIdea } = useContentIdeaUsage();

if (!canGenerateContentIdea()) {
  return <UpgradePrompt />;
}`}
              </pre>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Dashboard Layout</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Integrated into dashboard layout
              </p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <ContentIdeaUsageTracker className="lg:col-span-2" />
  <div className="space-y-4">
    <QuickStats />
    <RecentActivity />
  </div>
</div>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentIdeaUsageIntegration; 