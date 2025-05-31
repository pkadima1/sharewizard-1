/**
 * Step4ToneStructure.jsx
 * v2.0.0
 * Purpose: Enhanced step with structure preview, tone examples, visual sections,
 * word count estimates, and CTA previews. Two-column layout with real-time preview.
 */

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Info, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Clock, 
  Quote, 
  Target, 
  Hash,
  CheckCircle2,
  ExternalLink,
  Download,
  Phone,
  Mail,
  Globe,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import ContentPreview from '@/components/wizard/smart/ContentPreview';

// Content tone options with examples
const TONE_OPTIONS = [
  { 
    value: 'friendly', 
    label: 'Friendly', 
    description: 'Approachable and conversational',
    example: "Hey there! Let's talk about something that could completely change how you approach...",
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  { 
    value: 'professional', 
    label: 'Professional', 
    description: 'Formal and authoritative',
    example: "Studies indicate that strategic implementation of these methodologies can significantly...",
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  { 
    value: 'thought-provoking', 
    label: 'Thought-Provoking', 
    description: 'Challenging and reflective',
    example: "What if everything you thought you knew about this topic was fundamentally flawed?",
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  { 
    value: 'expert', 
    label: 'Expert', 
    description: 'Technical and detailed',
    example: "The implementation leverages advanced algorithms and established frameworks to optimize...",
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  },
  { 
    value: 'persuasive', 
    label: 'Persuasive', 
    description: 'Compelling and influential',
    example: "You're just three steps away from achieving results that others can only dream of...",
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
];

// Content type options
const CONTENT_TYPE_OPTIONS = [
  { value: 'blog-article', label: 'Blog Article' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'case-study', label: 'Case Study' },
  { value: 'guide', label: 'Guide' },
  { value: 'thought-piece', label: 'Thought Piece' }
];

// Structure format options with word count estimates
const STRUCTURE_FORMAT_OPTIONS = [
  { 
    value: 'intro-points-cta', 
    label: 'Intro + 3 Main Points + CTA',
    sections: [
      { name: 'Introduction', words: 150, description: 'Hook and overview' },
      { name: 'Main Point 1', words: 200, description: 'First key concept' },
      { name: 'Main Point 2', words: 200, description: 'Second key concept' },
      { name: 'Main Point 3', words: 200, description: 'Third key concept' },
      { name: 'Call to Action', words: 50, description: 'Clear next step' }
    ]
  },
  { 
    value: 'problem-solution-cta', 
    label: 'Problem → Solution → Call to Action',
    sections: [
      { name: 'Problem Identification', words: 200, description: 'Define the challenge' },
      { name: 'Impact & Consequences', words: 150, description: 'Why it matters' },
      { name: 'Solution Overview', words: 250, description: 'Your approach' },
      { name: 'Implementation Steps', words: 150, description: 'How to apply' },
      { name: 'Call to Action', words: 50, description: 'Next steps' }
    ]
  },
  { 
    value: 'story-facts-lessons', 
    label: 'Story + Facts + Lessons',
    sections: [
      { name: 'Opening Story', words: 200, description: 'Engaging narrative' },
      { name: 'Key Facts & Data', words: 200, description: 'Supporting evidence' },
      { name: 'Analysis', words: 200, description: 'What it means' },
      { name: 'Lessons Learned', words: 150, description: 'Takeaways' },
      { name: 'Application', words: 50, description: 'How to use' }
    ]
  },
  { 
    value: 'listicle', 
    label: 'Listicle (e.g. 5 ways to...)',
    sections: [
      { name: 'Introduction', words: 100, description: 'List overview' },
      { name: 'Point 1', words: 140, description: 'First item' },
      { name: 'Point 2', words: 140, description: 'Second item' },
      { name: 'Point 3', words: 140, description: 'Third item' },
      { name: 'Point 4', words: 140, description: 'Fourth item' },
      { name: 'Point 5', words: 140, description: 'Fifth item' }
    ]
  },
  { 
    value: 'custom', 
    label: 'Custom outline',
    sections: [
      { name: 'Custom Structure', words: 800, description: 'Define your own sections' }
    ]
  }
];

// CTA type options with previews
const CTA_TYPE_OPTIONS = [
  { 
    value: 'subscribe', 
    label: 'Subscribe', 
    icon: Mail,
    preview: "Ready to get more insights like this? Subscribe to our newsletter for weekly tips delivered straight to your inbox.",
    buttonText: "Subscribe Now"
  },
  { 
    value: 'book-call', 
    label: 'Book a Call', 
    icon: Phone,
    preview: "Want to dive deeper? Book a free 30-minute consultation to discuss your specific needs and goals.",
    buttonText: "Schedule Call"
  },
  { 
    value: 'download', 
    label: 'Download Freebie', 
    icon: Download,
    preview: "Take action today! Download our free resource guide with templates and checklists to get started.",
    buttonText: "Download Free Guide"
  },
  { 
    value: 'visit-website', 
    label: 'Visit Website', 
    icon: Globe,
    preview: "Learn more about our solutions and see how we can help you achieve your goals.",
    buttonText: "Visit Our Website"
  },
  { 
    value: 'none', 
    label: 'None', 
    icon: ExternalLink,
    preview: "Content ends with a strong conclusion without a specific call to action.",
    buttonText: ""
  }
];

const Step4ToneStructure = ({ formData, updateFormData }) => {
  // State for UI interactions
  const [showStructureNotes, setShowStructureNotes] = useState(
    formData.structureFormat === 'custom' || !!formData.structureNotes
  );
  const [expandedSections, setExpandedSections] = useState(new Set(['tone', 'structure']));
  const [showToneExample, setShowToneExample] = useState(false);
  // Initialize from formData
  useEffect(() => {
    // Set default values for any missing fields
    if (!formData.contentTone) updateFormData('contentTone', 'professional');
    if (!formData.contentType) updateFormData('contentType', 'blog-article');
    if (!formData.structureFormat) updateFormData('structureFormat', 'intro-points-cta');
    if (!formData.ctaType) updateFormData('ctaType', 'none');
    if (formData.includeStats === undefined) updateFormData('includeStats', false);
    if (!formData.wordCount) updateFormData('wordCount', 800);
    
    // Check if we should show structure notes based on selection
    if (formData.structureFormat === 'custom') {
      setShowStructureNotes(true);
    }
  }, []);

  // Handle structure format change
  const handleStructureFormatChange = (value) => {
    updateFormData('structureFormat', value);
    if (value === 'custom') {
      setShowStructureNotes(true);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Get selected tone details
  const getSelectedTone = () => {
    return TONE_OPTIONS.find(t => t.value === formData.contentTone) || TONE_OPTIONS[1];
  };

  // Get selected structure details
  const getSelectedStructure = () => {
    return STRUCTURE_FORMAT_OPTIONS.find(s => s.value === formData.structureFormat) || STRUCTURE_FORMAT_OPTIONS[0];
  };

  // Get selected CTA details
  const getSelectedCTA = () => {
    return CTA_TYPE_OPTIONS.find(c => c.value === formData.ctaType) || CTA_TYPE_OPTIONS[4];
  };
  // Calculate total word count
  const calculateTotalWords = () => {
    const structure = getSelectedStructure();
    return structure.sections.reduce((total, section) => total + section.words, 0);
  };
  // Get content length recommendation based on content type and tone
  const getContentLengthRecommendation = () => {
    const currentCount = formData.wordCount || 800;
    
    // Define optimal ranges for different content types
    const contentRanges = {
      'blog-article': [1200, 1800],
      'newsletter': [800, 1200],
      'case-study': [1500, 2500],
      'guide': [2000, 3000],
      'thought-piece': [1000, 1500]
    };
    
    const contentType = formData.contentType || 'blog-article';
    const [min, max] = contentRanges[contentType] || [1200, 1800];
    
    if (currentCount >= 1200 && currentCount <= 1800) {
      return " this length is ideal for SEO and reader engagement.";
    } else if (currentCount >= min && currentCount <= max) {
      return ` a length of ${min}-${max} words is recommended for optimal results.`;
    } else if (currentCount < min) {
      return ` consider adding more content. At least ${min} words is recommended.`;
    } else {
      return " your content might be too lengthy for optimal engagement. Consider breaking it into multiple pieces.";
    }
  };
  
  // Get word count status for badge and visual indicators
  const getWordCountStatus = () => {
    const currentCount = formData.wordCount || 800;
    const contentType = formData.contentType || 'blog-article';
    
    // Define optimal ranges for different content types
    const contentRanges = {
      'blog-article': [1200, 1800],
      'newsletter': [800, 1200],
      'case-study': [1500, 2500],
      'guide': [2000, 3000],
      'thought-piece': [1000, 1500]
    };
    
    const [min, max] = contentRanges[contentType] || [1200, 1800];
    
    // SEO optimal range always takes precedence
    if (currentCount >= 1200 && currentCount <= 1800) {
      return { status: 'optimal', message: 'SEO Optimal' };
    } else if (currentCount < min) {
      return { status: 'warning', message: 'Too Short' };
    } else if (currentCount > max) {
      return { status: 'warning', message: 'Very Long' };
    } else {
      return { status: 'normal', message: `${currentCount} words` };
    }
  };
  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold">Content Structure & Tone</h2>
          <p className="text-muted-foreground">
            Define how your blog content should be structured and the tone it should have.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Tone Selection Card */}
            <Card className="p-4 border-l-4 border-l-primary shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Quote className="h-4 w-4" />
                    Content Tone
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToneExample(!showToneExample)}
                  >
                    {showToneExample ? 'Hide' : 'Show'} Example
                  </Button>
                </div>

                <div className="space-y-2">
                  <Select
                    value={formData.contentTone}
                    onValueChange={(value) => updateFormData('contentTone', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <div className="flex items-center gap-2">
                            <span>{tone.label}</span>
                            <Badge variant="secondary" className={tone.color}>
                              {tone.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone Description */}
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {getSelectedTone().description}
                  </p>
                </div>

                {/* Tone Example */}
                {showToneExample && (
                  <div className="p-3 border rounded-md bg-background">
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      WRITING SAMPLE
                    </Label>
                    <p className="text-sm italic">
                      "{getSelectedTone().example}"
                    </p>
                  </div>
                )}

                {/* Content Type */}
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-sm font-medium">Content Type</Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => updateFormData('contentType', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Structure Format Card */}            {/* Word Count Card - NEW */}
            <Card className="p-4 border-l-4 border-l-purple-500 shadow-sm overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    Content Length
                  </h3>
                  
                  {/* Word Count Status Badge */}
                  {getWordCountStatus().status === 'optimal' ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      SEO Optimal
                    </Badge>
                  ) : getWordCountStatus().status === 'warning' ? (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getWordCountStatus().message}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formData.wordCount || 800} words
                    </Badge>
                  )}
                </div>

                {/* Word Count Slider with Current Value Display */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="word-count" className="text-sm font-medium flex items-center gap-1.5">
                      <span>Word Count:</span> 
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {formData.wordCount || 800}
                      </span>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <input
                      id="word-count"
                      type="range"
                      className="w-full accent-purple-500 h-2 bg-purple-100 dark:bg-purple-900 rounded-full appearance-none cursor-pointer"
                      min="300"
                      max="3000"
                      step="100"
                      value={formData.wordCount || 800}
                      onChange={(e) => updateFormData('wordCount', parseInt(e.target.value))}
                    />
                    
                    {/* SEO Optimal Range Highlight */}
                    <div 
                      className="absolute top-0 h-2 bg-green-300 dark:bg-green-800/50 rounded-full pointer-events-none"
                      style={{ 
                        left: `${(1200 - 300) / (3000 - 300) * 100}%`, 
                        width: `${(1800 - 1200) / (3000 - 300) * 100}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>300</span>
                    <span className="font-medium text-green-600">1200-1800 (SEO Optimal)</span>
                    <span>3000</span>
                  </div>
                </div>

                {/* Content Length Recommendation */}
                <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-purple-600" />
                    <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      Content Length Impact
                    </h4>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    For {formData.contentType || 'blog-article'} content with a {formData.contentTone || 'professional'} tone, 
                    {getContentLengthRecommendation()}
                  </p>
                  
                  {/* Reading Time Estimate */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-purple-600 dark:text-purple-400">
                    <Clock className="h-3 w-3" />
                    <span>Estimated reading time: {Math.ceil((formData.wordCount || 800) / 200)} minutes</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Structure Format
                  </h3>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {calculateTotalWords()} words
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Select
                    value={formData.structureFormat}
                    onValueChange={handleStructureFormatChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select structure format" />
                    </SelectTrigger>
                    <SelectContent>
                      {STRUCTURE_FORMAT_OPTIONS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Structure Sections Preview */}
                <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">
                      STRUCTURE BREAKDOWN
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection('structure')}
                      className="h-6 w-6 p-0"
                    >
                      {expandedSections.has('structure') ? 
                        <ChevronDown className="h-3 w-3" /> : 
                        <ChevronRight className="h-3 w-3" />
                      }
                    </Button>
                  </div>
                  
                  {expandedSections.has('structure') && (
                    <div className="space-y-2">
                      {getSelectedStructure().sections.map((section, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">{section.name}</p>
                              <p className="text-xs text-muted-foreground">{section.description}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {section.words}w
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Statistics Toggle */}
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                  <div>
                    <Label className="text-sm font-medium">Include Statistics & Data</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add relevant statistics and data to support your points.
                    </p>
                  </div>
                  <Switch
                    checked={formData.includeStats}
                    onCheckedChange={(checked) => updateFormData('includeStats', checked)}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                {/* Custom Structure Notes */}
                {(formData.structureFormat === 'custom' || showStructureNotes) && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm font-medium">
                      Structure Notes {formData.structureFormat === 'custom' ? '(Required)' : '(Optional)'}
                    </Label>
                    <Textarea
                      placeholder="e.g. Include an introduction, 3 key sections, and a conclusion with call to action"
                      value={formData.structureNotes || ''}
                      onChange={(e) => updateFormData('structureNotes', e.target.value)}
                      rows={4}
                      className="w-full resize-y"
                    />
                  </div>
                )}

                {!showStructureNotes && formData.structureFormat !== 'custom' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStructureNotes(true)}
                    className="w-full"
                  >
                    Add Custom Structure Notes
                  </Button>
                )}
              </div>
            </Card>

            {/* CTA Selection Card */}
            <Card className="p-4 border-l-4 border-l-green-500 shadow-sm">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Call to Action
                </h3>

                <div className="space-y-2">
                  <Select
                    value={formData.ctaType}
                    onValueChange={(value) => updateFormData('ctaType', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select CTA type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CTA_TYPE_OPTIONS.map((cta) => {
                        const IconComponent = cta.icon;
                        return (
                          <SelectItem key={cta.value} value={cta.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {cta.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* CTA Preview */}
                {formData.ctaType && formData.ctaType !== 'none' && (
                  <div className="p-3 border rounded-md bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      CTA PREVIEW
                    </Label>
                    <p className="text-sm mb-3">{getSelectedCTA().preview}</p>                    {getSelectedCTA().buttonText && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        {React.createElement(getSelectedCTA().icon, { className: "h-4 w-4 mr-2" })}
                        {getSelectedCTA().buttonText}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card className="p-4 border-l-4 border-l-purple-500 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Content Preview
                </h3>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Live Preview
                </Badge>
              </div>
              
              <ContentPreview
                topic={formData.topic}
                keywords={formData.keywords || []}
                contentTone={formData.contentTone}
                structureFormat={formData.structureFormat}                wordCount={formData.wordCount || calculateTotalWords()}
                includeImages={formData.includeImages}
                audience={formData.audience}
                industry={formData.industry}
                className="border-0 shadow-none"
              />
            </Card>
          </div>
        </div>

        {/* Helper tip box */}        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-100 dark:border-blue-900 rounded-md">
          <h3 className="font-medium text-blue-800 dark:text-blue-400 flex items-center gap-2 mb-2">
            <Info className="h-4 w-4" />
            <span>Content Structure & Length Tips</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Structure Impact:</strong> The structure you choose impacts how readers engage with your content. 
                Clear sections with headers and a strong opening paragraph typically perform better for SEO.
              </p>
            </div>
            <div>
              <p className="text-purple-700 dark:text-purple-300">
                <strong>Tone Consistency:</strong> Maintain your chosen tone throughout the content. 
                The preview updates in real-time to show how your selections will affect the final output.
              </p>
            </div>
            <div>
              <p className="text-green-700 dark:text-green-300">
                <strong>Optimal Length:</strong> For SEO purposes, articles between 1200-1800 words tend to rank better.
                Shorter content works well for newsletters, while comprehensive guides benefit from longer content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Step4ToneStructure;
