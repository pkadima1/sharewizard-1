import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InspirationHub from '@/components/inspiration/InspirationHub';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const InspirationHubDemo: React.FC = () => {
  const navigate = useNavigate();

  const handleExport = (ideas: any[]) => {
    console.log('Exported ideas:', ideas);
    // Here you would typically send the ideas to your backend or save them
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Inspiration Hub Demo</h1>
              <p className="text-muted-foreground">
                Multi-step content inspiration workflow
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>About the Inspiration Hub</CardTitle>
              <CardDescription>
                This component demonstrates a complete multi-step workflow for content inspiration:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Multi-step flow with progress tracking</li>
                    <li>• Industry/niche selection with popular options</li>
                    <li>• Keyword generation with trends integration</li>
                    <li>• AI-powered content idea generation</li>
                    <li>• Export functionality for selected ideas</li>
                    <li>• Auto-detection of user location</li>
                    <li>• Localization support (EN/FR)</li>
                    <li>• Persistent user preferences</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Technical Highlights:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• TypeScript with full type safety</li>
                    <li>• React hooks for state management</li>
                    <li>• Responsive design with Tailwind CSS</li>
                    <li>• Shadcn/ui components</li>
                    <li>• i18n internationalization</li>
                    <li>• Geolocation API integration</li>
                    <li>• LocalStorage for persistence</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspiration Hub Component */}
          <InspirationHub onExport={handleExport} />
        </div>
      </div>
    </div>
  );
};

export default InspirationHubDemo; 