/**
 * ContextualHelp.tsx
 * v1.0.0
 * Purpose: Provides contextual help and guidance for each wizard step
 * Features: Step-specific tips, examples, video tutorials, expandable sections,
 * support contact, and engagement tracking
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Play,
  MessageCircle,
  BookOpen,
  Lightbulb,
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  Users,
  Star,
  AlertTriangle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { createSupportEmail, sendContactEmail } from '@/lib/emailUtils';
import { toast } from '@/hooks/use-toast';

interface ContextualHelpProps {
  currentStep: number;
  className?: string;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({ currentStep, className = '' }) => {
  const { t } = useTranslation('longform');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [showAllTips, setShowAllTips] = useState(false);
  const [helpEngagement, setHelpEngagement] = useState({
    sectionsViewed: 0,
    videosClicked: 0,
    supportContacted: false
  });

  // Get help content from translations
  const getHelpContent = (step: number) => {
    const stepKey = step.toString();
    return {
      title: t(`contextualHelp.steps.${stepKey}.title`, ''),
      tips: t(`contextualHelp.steps.${stepKey}.tips`, { returnObjects: true }) as string[] || [],
      learnMoreSections: t(`contextualHelp.steps.${stepKey}.learnMoreSections`, { returnObjects: true }) as Array<{ title: string; content: string }> || [],
      videos: t(`contextualHelp.steps.${stepKey}.videos`, { returnObjects: true }) as Array<{ title: string; url: string; duration: string }> || [],
      estimatedTime: t(`contextualHelp.steps.${stepKey}.estimatedTime`, '')
    };
  };

  const helpContent = getHelpContent(currentStep);

  // Track help engagement
  const trackEngagement = (action: string, data?: Record<string, unknown>) => {
    console.log(t('debug.helpEngagement'), action, data);
    
    // Update local state
    setHelpEngagement(prev => {
      const updated = { ...prev };
      switch (action) {
        case 'section_expanded':
          updated.sectionsViewed += 1;
          break;
        case 'video_clicked':
          updated.videosClicked += 1;
          break;
        case 'support_contacted':
          updated.supportContacted = true;
          break;
      }
      return updated;
    });

    // In a real app, you'd send this to analytics
    // analytics.track('help_engagement', { action, step: currentStep, ...data });
  };

  const toggleSection = (sectionIndex: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionIndex)) {
      newExpanded.delete(sectionIndex);
    } else {
      newExpanded.add(sectionIndex);
      trackEngagement('section_expanded', { sectionIndex, title: helpContent.learnMoreSections[sectionIndex]?.title });
    }
    setExpandedSections(newExpanded);
  };

  const handleVideoClick = (video: { title: string; url: string; duration: string }) => {
    trackEngagement('video_clicked', { title: video.title, url: video.url });
    // In a real app, you'd open the video in a modal or new tab
    window.open(video.url, '_blank');
  };

  const handleSupportContact = async () => {
    trackEngagement('support_contacted', { step: currentStep });
    
    try {
      // Create support email with context
      const supportEmail = createSupportEmail(
        'User requested support from contextual help',
        { 
          currentStep, 
          helpEngagement,
          timestamp: new Date().toISOString()
        }
      );

      // Send the email
      const success = await sendContactEmail(supportEmail);
      
      if (success) {
        toast({
          title: "Support Request Sent",
          description: "Your support request has been sent to our team. We'll get back to you soon!",
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Support contact error:', error);
      toast({
        title: "Error",
        description: "Failed to send support request. Please try emailing us directly at engageperfect@gmail.com",
        variant: "destructive"
      });
    }
  };

  const ExampleSection: React.FC<{ examples: { good: string[], bad: string[] } }> = ({ examples }) => (
    <div className="mt-3 space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        {/* Good Examples */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">{t('contextualHelp.goodExamples')}</span>
          </div>
          <div className="space-y-1">
            {examples.good.map((example, index) => (
              <div key={index} className="text-xs p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded">
                {example}
              </div>
            ))}
          </div>
        </div>

        {/* Bad Examples */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">{t('contextualHelp.avoidThese')}</span>
          </div>
          <div className="space-y-1">
            {examples.bad.map((example, index) => (
              <div key={index} className="text-xs p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded">
                {example}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={`p-4 border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-gray-900 dark:to-purple-950/20 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <HelpCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 leading-tight">{helpContent.title}</h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              {t('contextualHelp.estimatedTime', { time: helpContent.estimatedTime })}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          {t('wizard.progress.step', { current: currentStep + 1, total: 6 })}
        </Badge>
      </div>

      {/* Quick Tips */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-500 rounded flex items-center justify-center">
            <Lightbulb className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-medium">{t('contextualHelp.quickTips')}</span>
        </div>
        <div className="space-y-2">
          {helpContent.tips.slice(0, showAllTips ? undefined : 2).map((tip, index) => (
            <div key={index} className="flex items-start gap-3 text-sm text-muted-foreground p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 mt-1.5 flex-shrink-0"></div>
              <span className="leading-relaxed">{tip}</span>
            </div>
          ))}
          {helpContent.tips.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllTips(!showAllTips)}
              className="text-xs h-6 p-0 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 mt-2"
            >
              {showAllTips ? t('contextualHelp.showLess') : t('contextualHelp.showMore', { count: helpContent.tips.length - 2 })}
            </Button>
          )}
        </div>
      </div>

      {/* Learn More Sections */}
      {helpContent.learnMoreSections && helpContent.learnMoreSections.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded flex items-center justify-center">
              <BookOpen className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium">{t('contextualHelp.learnMore')}</span>
          </div>
          {helpContent.learnMoreSections.map((section, index) => (
            <Collapsible key={index} open={expandedSections.has(index)} onOpenChange={() => toggleSection(index)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-left p-3 h-auto rounded-lg border border-green-100 dark:border-green-900/30 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors">
                  <span className="text-sm font-medium">{section.title}</span>
                  {expandedSections.has(index) ? (
                    <ChevronUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-3 pr-3">
                <div className="py-3 space-y-3 border-l-2 border-green-200 dark:border-green-800 pl-4 ml-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                  {section.examples && (
                    <ExampleSection examples={section.examples} />
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Video Tutorials */}
      {helpContent.videos && helpContent.videos.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
              <Play className="h-3 w-3 text-white fill-white" />
            </div>
            <span className="text-sm font-medium">{t('contextualHelp.videoTutorials')}</span>
            <Badge variant="secondary" className="text-xs ml-auto">
              {helpContent.videos.length} {helpContent.videos.length === 1 ? 'video' : 'videos'}
            </Badge>
          </div>
          <div className="space-y-2">
            {helpContent.videos.map((video, index) => (
              <div
                key={index}
                className="group relative overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800"
                onClick={() => handleVideoClick(video)}
              >
                {/* Video thumbnail with gradient overlay */}
                <div className="relative">
                  <div className="w-full h-20 bg-gradient-to-br from-purple-100 via-blue-50 to-pink-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 flex items-center justify-center relative overflow-hidden">
                    {/* Subtle pattern background */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.15)_1px,transparent_0)] bg-[length:12px_12px]"></div>
                    </div>
                    
                    {/* Play button with enhanced styling */}
                    <div className="relative z-10 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    
                    {/* Duration badge with better positioning */}
                    <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      {video.duration || '2:30'}
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </div>
                </div>
                
                {/* Video info with improved layout */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight line-clamp-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{video.duration || '2:30'}</span>
                        <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('contextualHelp.tutorial')}</span>
                      </div>
                    </div>
                    
                    {/* External link indicator */}
                    <div className="flex-shrink-0 p-1 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                      <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                    </div>
                  </div>
                  
                  {/* Video description if available */}
                  {video.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
                
                {/* Progress bar if watched percentage is available */}
                {video.watchedPercentage && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${video.watchedPercentage}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* View all videos link if there are many */}
          {helpContent.videos.length > 3 && (
            <div className="mt-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                onClick={() => {
                  // Open video library or playlist
                  trackEngagement('view_all_videos', { stepVideos: helpContent.videos.length });
                }}
              >
                <BookOpen className="h-3 w-3 mr-1" />
                View all {helpContent.videos.length} videos
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Support Contact */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-red-950/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t('contextualHelp.stillStuck')}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSupportContact}
            className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
          >
            <MessageCircle className="h-3 w-3" />
            {t('contextualHelp.contactSupport')}
          </Button>
        </div>
      </div>

      {/* Engagement Stats (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 pt-3 border-t border-dashed">
          <div className="text-xs text-muted-foreground">
            <div>{t('contextualHelp.helpEngagement')}</div>
            <div>{t('contextualHelp.sectionsViewed', { count: helpEngagement.sectionsViewed })}</div>
            <div>{t('contextualHelp.videosClicked', { count: helpEngagement.videosClicked })}</div>
            <div>{t('contextualHelp.supportContacted', { contacted: helpEngagement.supportContacted ? t('contextualHelp.yes') : t('contextualHelp.no') })}</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ContextualHelp;
