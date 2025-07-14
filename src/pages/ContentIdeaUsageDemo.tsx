/**
 * ContentIdeaUsageDemo Component
 * 
 * Demo page showcasing the ContentIdeaUsageTracker component
 * with different user scenarios and states
 */

import React, { useState } from 'react';
import ContentIdeaUsageTracker from '@/components/ContentIdeaUsageTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Crown, 
  Lock, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Share2,
  Download,
  Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ContentIdeaUsageDemo: React.FC = () => {
  const { t } = useTranslation('longform');
  const [selectedScenario, setSelectedScenario] = useState('free');

  // Mock user scenarios
  const scenarios = {
    free: {
      name: 'Free User',
      description: 'Limited usage with upgrade prompts',
      icon: <Lock className="h-4 w-4" />,
      badge: <Badge variant="outline">Free Plan</Badge>,
      usage: { used: 2, limit: 3, percentage: 67 }
    },
    trial: {
      name: 'Trial User',
      description: '5-day trial with premium features',
      icon: <Clock className="h-4 w-4" />,
      badge: <Badge variant="secondary">Trial</Badge>,
      usage: { used: 3, limit: 5, percentage: 60 }
    },
    basic: {
      name: 'Basic User',
      description: 'Monthly plan with 70 requests',
      icon: <User className="h-4 w-4" />,
      badge: <Badge variant="default">Basic</Badge>,
      usage: { used: 45, limit: 70, percentage: 64 }
    },
    premium: {
      name: 'Premium User',
      description: 'Unlimited with cost tracking',
      icon: <Crown className="h-4 w-4" />,
      badge: <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">Premium</Badge>,
      usage: { used: 150, limit: 500, percentage: 30 }
    },
    lowUsage: {
      name: 'Low Usage Warning',
      description: 'Running low on requests',
      icon: <AlertTriangle className="h-4 w-4" />,
      badge: <Badge variant="secondary">Warning</Badge>,
      usage: { used: 65, limit: 70, percentage: 93 }
    },
    limitReached: {
      name: 'Limit Reached',
      description: 'No requests remaining',
      icon: <AlertTriangle className="h-4 w-4" />,
      badge: <Badge variant="destructive">Limit Reached</Badge>,
      usage: { used: 3, limit: 3, percentage: 100 }
    }
  };

  const handleShare = (idea: any) => {
    console.log('Sharing idea:', idea);
    // Demo sharing functionality
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Content Idea Usage Tracker Demo</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive usage tracking for content idea generation with real-time monitoring, 
          upgrade prompts, usage history, analytics, and sharing functionality.
        </p>
      </div>

      {/* Scenario Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            User Scenarios
          </CardTitle>
          <CardDescription>
            Select different user scenarios to see how the usage tracker adapts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedScenario} onValueChange={setSelectedScenario}>
            <TabsList className="grid w-full grid-cols-6">
              {Object.entries(scenarios).map(([key, scenario]) => (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  {scenario.icon}
                  <span className="hidden sm:inline">{scenario.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(scenarios).map(([key, scenario]) => (
              <TabsContent key={key} value={key} className="mt-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {scenario.icon}
                    <div>
                      <h3 className="font-medium">{scenario.name}</h3>
                      <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    </div>
                  </div>
                  {scenario.badge}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Usage: {scenario.usage.used}/{scenario.usage.limit}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Remaining: {scenario.usage.limit - scenario.usage.used}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Percentage: {scenario.usage.percentage}%</span>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Usage Tracker Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Usage Tracker Component
          </CardTitle>
          <CardDescription>
            Interactive usage tracking with {scenarios[selectedScenario as keyof typeof scenarios].name.toLowerCase()} scenario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContentIdeaUsageTracker
            className="w-full"
            showHistory={true}
            showAnalytics={true}
            showSharing={true}
            onShare={handleShare}
          />
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Real-time Usage</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track current usage with visual progress indicators and remaining request counts.
              Shows daily reset times and plan-specific limits.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Upgrade Prompts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Smart upgrade suggestions when approaching limits. Different prompts for free,
              trial, and paid users with relevant plan options.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Usage History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete history of generated content ideas with performance metrics,
              cost tracking, and export functionality for analysis.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Detailed analytics including engagement scores, platform breakdown,
              cost analysis, and top-performing content ideas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-pink-600" />
              <CardTitle className="text-lg">Sharing Features</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Built-in sharing functionality for generated ideas with social media
              integration and clipboard support for easy distribution.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Cost Tracking</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              For premium users, track estimated costs per content idea generation
              with detailed breakdowns and cost optimization insights.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Integration Examples
          </CardTitle>
          <CardDescription>
            How to integrate the ContentIdeaUsageTracker into your existing components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Basic Integration</h4>
              <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
{`import ContentIdeaUsageTracker from '@/components/ContentIdeaUsageTracker';

<ContentIdeaUsageTracker
  className="w-full"
  showHistory={true}
  showAnalytics={true}
  onShare={handleShare}
/>`}
              </pre>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">With Custom Handlers</h4>
              <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
{`<ContentIdeaUsageTracker
  onUpgrade={() => navigate('/pricing')}
  onShare={(idea) => {
    // Custom sharing logic
    shareToSocialMedia(idea);
  }}
  showHistory={userProfile?.plan_type !== 'free'}
  showAnalytics={userProfile?.plan_type === 'premium'}
/>`}
              </pre>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Dashboard Integration</h4>
              <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
{`// In your dashboard component
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
          <CardDescription>
            Comprehensive usage tracking with advanced analytics and user management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-600">✅ Current Usage Display</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time usage tracking (X/3 requests used today)</li>
                <li>• Visual progress indicators</li>
                <li>• Remaining request count</li>
                <li>• Plan-specific limits</li>
              </ul>

              <h4 className="font-medium text-green-600">✅ Reset Time Tracking</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Daily reset at midnight</li>
                <li>• Trial expiration countdown</li>
                <li>• Subscription renewal dates</li>
                <li>• Time until next reset</li>
              </ul>

              <h4 className="font-medium text-green-600">✅ Upgrade Prompts</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Smart upgrade suggestions</li>
                <li>• Plan-specific recommendations</li>
                <li>• Flex pack purchases</li>
                <li>• Trial activation</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-green-600">✅ Usage History</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete generation history</li>
                <li>• Performance metrics</li>
                <li>• Cost tracking</li>
                <li>• Export functionality</li>
              </ul>

              <h4 className="font-medium text-green-600">✅ Analytics Dashboard</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Engagement analytics</li>
                <li>• Platform breakdown</li>
                <li>• Cost analysis</li>
                <li>• Top-performing ideas</li>
              </ul>

              <h4 className="font-medium text-green-600">✅ Sharing Functionality</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Social media integration</li>
                <li>• Clipboard support</li>
                <li>• Share count tracking</li>
                <li>• Custom sharing handlers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentIdeaUsageDemo; 