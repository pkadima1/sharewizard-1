/**
 * ContextualHelp.tsx
 * v1.0.0
 * Purpose: Provides contextual help and guidance for each wizard step
 * Features: Step-specific tips, examples, video tutorials, expandable sections,
 * support contact, and engagement tracking
 */

import React, { useState, useEffect } from 'react';
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

// Step-specific help content configuration
const HELP_CONTENT = {
  0: { // What & Who (Topic + Audience)
    title: "Define Topic & Target Audience",
    tips: [
      "Be specific about your topic - avoid broad, generic subjects",
      "Clearly define your target audience demographics and interests",
      "Consider your audience's pain points and what value you can provide"
    ],
    learnMoreSections: [
      {
        title: "Topic Definition Best Practices",
        content: "A well-defined topic guides the entire content creation process. It should be clear, specific, and aligned with your audience's interests.",
        examples: {
          good: ["10 Email Marketing Strategies for E-commerce", "How to Style Wide-Leg Jeans for Different Body Types", "React vs Vue: Performance Comparison 2024"],
          bad: ["Marketing", "Fashion", "Programming"]
        }
      },
      {
        title: "Defining Your Target Audience",
        content: "Understanding your audience is crucial for creating content that resonates. Consider their age, interests, challenges, and preferred communication style.",
        examples: {
          good: ["Tech-savvy millennials interested in productivity apps", "Small business owners struggling with social media marketing", "Fitness enthusiasts looking for home workout routines"],
          bad: ["Everyone", "People who like technology", "Social media users"]
        }
      }
    ],
    videos: [
      {
        title: "How to Choose Winning Content Topics",
        thumbnail: "/api/placeholder/300/200",
        duration: "4:32",
        url: "https://example.com/video1"
      },
      {
        title: "Audience Research Masterclass",
        thumbnail: "/api/placeholder/300/200",
        duration: "6:45",
        url: "https://example.com/video2"
      }
    ],
    estimatedTime: "3-5 minutes"
  },
  1: { // Media & Visuals
    title: "Upload Media & Visual Content",
    tips: [
      "Upload high-quality images (min 800x600px) for better content suggestions",
      "Choose images that directly relate to your topic",
      "Enable image suggestions to enhance your content with relevant visuals"
    ],
    learnMoreSections: [
      {
        title: "Choosing the Right Images",
        content: "Images should be relevant, high-quality, and properly sized. They help our AI understand your content context and generate more accurate suggestions.",
        examples: {
          good: ["Product photos for product reviews", "Infographics for data-driven posts", "Behind-the-scenes photos for personal content"],
          bad: ["Blurry or low-resolution images", "Stock photos unrelated to your topic", "Images with watermarks or copyright issues"]
        }
      },
      {
        title: "Visual Content Strategy",
        content: "Visual elements enhance engagement and comprehension. They should support your content narrative and provide additional value.",
        examples: {
          good: ["Screenshots for tutorials", "Charts for data visualization", "Before/after photos for transformations"],
          bad: ["Decorative images without purpose", "Overwhelming number of visuals", "Poor quality or irrelevant images"]
        }
      }
    ],
    videos: [
      {
        title: "Visual Content Best Practices",
        thumbnail: "/api/placeholder/300/200",
        duration: "5:15",
        url: "https://example.com/video-visuals"
      }
    ],
    estimatedTime: "2-4 minutes"
  },  2: { // SEO & Keywords
    title: "SEO Keywords & Title Optimization",
    tips: [
      "Include your primary keyword in the title naturally",
      "Use long-tail keywords for better targeting",
      "Keep titles under 60 characters for SEO"
    ],
    learnMoreSections: [
      {
        title: "Keyword Research Fundamentals",
        content: "Effective keywords balance search volume with competition. Focus on terms your audience actually searches for.",
        examples: {
          good: ["how to meal prep for weight loss", "best project management tools 2024", "beginner yoga poses for back pain"],
          bad: ["food", "tools", "exercise"]
        }
      },
      {
        title: "SEO Title Optimization",
        content: "Great titles are compelling to humans while being optimized for search engines. They should clearly indicate what value the content provides.",
        examples: {
          good: ["7 Proven Email Subject Lines That Boost Open Rates", "Complete Guide to Remote Work Productivity in 2024", "Why Your Content Marketing Isn't Working (And How to Fix It)"],
          bad: ["Email Tips", "Work From Home", "Marketing Problems"]
        }
      }
    ],
    videos: [
      {
        title: "SEO Title Writing Secrets",
        thumbnail: "/api/placeholder/300/200",
        duration: "5:18",
        url: "https://example.com/video3"
      },
      {
        title: "Keyword Research Tools Tutorial",
        thumbnail: "/api/placeholder/300/200",
        duration: "8:22",
        url: "https://example.com/video4"
      }
    ],
    estimatedTime: "4-6 minutes"
  },
  3: { // Structure & Tone
    title: "Content Structure & Tone",
    tips: [
      "Match your tone to your audience and brand personality",
      "Use clear section headings for better readability",
      "Include a strong call-to-action that aligns with your goals"
    ],
    learnMoreSections: [
      {
        title: "Content Structure Types",
        content: "Different content types work better for different goals. Choose a structure that serves your content purpose.",
        examples: {
          good: ["Problem-Solution-CTA for service businesses", "How-to steps for educational content", "Story-Lesson-Application for thought leadership"],
          bad: ["Random thoughts without structure", "Multiple CTAs competing for attention", "No clear beginning, middle, or end"]
        }
      },
      {
        title: "Tone & Voice Guidelines",
        content: "Your content tone should reflect your brand personality while being appropriate for your audience and topic.",
        examples: {
          good: ["Professional but approachable for B2B content", "Casual and encouraging for fitness content", "Authoritative but accessible for educational content"],
          bad: ["Overly formal for lifestyle content", "Too casual for legal advice", "Inconsistent tone throughout the piece"]
        }
      }
    ],
    videos: [
      {
        title: "Content Structure Frameworks",
        thumbnail: "/api/placeholder/300/200",
        duration: "7:15",
        url: "https://example.com/video5"
      }
    ],
    estimatedTime: "3-4 minutes"
  },
  4: { // Generation Settings
    title: "Generation Settings",
    tips: [
      "SEO-optimal content is typically 1200-1800 words",
      "Enable plagiarism checking for professional content",
      "Choose output format based on your publishing platform"
    ],
    learnMoreSections: [
      {
        title: "Word Count Optimization",
        content: "Content length should match your topic depth and audience expectations. Longer isn't always better.",
        examples: {
          good: ["1500+ words for comprehensive guides", "800-1200 words for how-to articles", "300-600 words for quick tips"],
          bad: ["5000 words for simple concepts", "200 words for complex topics", "Padding content just to hit word count"]
        }
      },
      {
        title: "Format Selection Guide",
        content: "Choose the output format that best fits your publishing workflow and platform requirements.",
        examples: {
          good: ["Markdown for GitHub/developer blogs", "HTML for direct web publishing", "Google Docs for collaborative editing"],
          bad: ["Wrong format for your platform", "Format that requires conversion", "Format that loses important styling"]
        }
      }
    ],
    videos: [
      {
        title: "Content Length Best Practices",
        thumbnail: "/api/placeholder/300/200",
        duration: "4:47",
        url: "https://example.com/video6"
      }
    ],
    estimatedTime: "2-3 minutes"
  },
  5: { // Review & Generate
    title: "Review & Generate",
    tips: [
      "Review all sections for completeness before generating",
      "Higher SEO scores typically lead to better content performance",
      "Use Quick Edit to make final adjustments"
    ],
    learnMoreSections: [
      {
        title: "Pre-Generation Checklist",
        content: "A final review ensures your content will meet your goals and audience needs.",
        examples: {
          good: ["All required fields completed", "Keywords naturally integrated", "Clear value proposition", "Appropriate tone selected"],
          bad: ["Missing key information", "Keyword stuffing", "Unclear objectives", "Mismatched tone and audience"]
        }
      },
      {
        title: "Understanding SEO Scores",
        content: "Our SEO scoring considers multiple factors including keyword usage, content structure, and readability.",
        examples: {
          good: ["90+ score indicates excellent optimization", "Strong keyword strategy", "Clear content structure", "Appropriate reading level"],
          bad: ["Low scores often mean missing keywords", "Poor content structure", "Unclear value proposition", "Mismatched audience level"]
        }
      }
    ],
    videos: [
      {
        title: "Content Review Process",
        thumbnail: "/api/placeholder/300/200",
        duration: "3:28",
        url: "https://example.com/video7"
      }
    ],
    estimatedTime: "1-2 minutes"
  }
};

interface ContextualHelpProps {
  currentStep: number;
  className?: string;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({ currentStep, className = '' }) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [showAllTips, setShowAllTips] = useState(false);
  const [helpEngagement, setHelpEngagement] = useState({
    sectionsViewed: 0,
    videosClicked: 0,
    supportContacted: false
  });

  const helpContent = HELP_CONTENT[currentStep] || HELP_CONTENT[0];

  // Track help engagement
  const trackEngagement = (action: string, data?: any) => {
    console.log('Help engagement:', action, data);
    
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
      trackEngagement('section_expanded', { sectionIndex, title: helpContent.learnMoreSections[sectionIndex].title });
    }
    setExpandedSections(newExpanded);
  };

  const handleVideoClick = (video: any) => {
    trackEngagement('video_clicked', { title: video.title, url: video.url });
    // In a real app, you'd open the video in a modal or new tab
    window.open(video.url, '_blank');
  };

  const handleSupportContact = () => {
    trackEngagement('support_contacted', { step: currentStep });
    // In a real app, you'd open a support modal or chat
    alert('Support feature would open here. For now, please email support@example.com');
  };

  const ExampleSection: React.FC<{ examples: { good: string[], bad: string[] } }> = ({ examples }) => (
    <div className="mt-3 space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        {/* Good Examples */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">Good Examples</span>
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
            <span className="text-sm font-medium text-red-800 dark:text-red-200">Avoid These</span>
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
    <Card className={`p-4 border-l-4 border-l-blue-500 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">{helpContent.title}</h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Estimated time: {helpContent.estimatedTime}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          Step {currentStep + 1}
        </Badge>
      </div>

      {/* Quick Tips */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium">Quick Tips</span>
        </div>
        <div className="space-y-2">
          {helpContent.tips.slice(0, showAllTips ? undefined : 2).map((tip, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span>{tip}</span>
            </div>
          ))}
          {helpContent.tips.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllTips(!showAllTips)}
              className="text-xs h-6 p-0 text-blue-600 hover:text-blue-700"
            >
              {showAllTips ? 'Show less' : `Show ${helpContent.tips.length - 2} more tips`}
            </Button>
          )}
        </div>
      </div>

      {/* Learn More Sections */}
      {helpContent.learnMoreSections && helpContent.learnMoreSections.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Learn More</span>
          </div>
          {helpContent.learnMoreSections.map((section, index) => (
            <Collapsible key={index} open={expandedSections.has(index)} onOpenChange={() => toggleSection(index)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-left p-2 h-auto">
                  <span className="text-sm font-medium">{section.title}</span>
                  {expandedSections.has(index) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-2">
                <div className="py-2 space-y-3">
                  <p className="text-sm text-muted-foreground">{section.content}</p>
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
            <Play className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Video Tutorials</span>
          </div>
          <div className="grid gap-3">
            {helpContent.videos.map((video, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleVideoClick(video)}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <Play className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {video.duration}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{video.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{video.duration}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Contact */}
      <div className="pt-3 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-muted-foreground">Still stuck?</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSupportContact}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-3 w-3" />
            Contact Support
          </Button>
        </div>
      </div>

      {/* Engagement Stats (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 pt-3 border-t border-dashed">
          <div className="text-xs text-muted-foreground">
            <div>Help Engagement:</div>
            <div>• Sections viewed: {helpEngagement.sectionsViewed}</div>
            <div>• Videos clicked: {helpEngagement.videosClicked}</div>
            <div>• Support contacted: {helpEngagement.supportContacted ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ContextualHelp;
