// ToneSelector.tsx - IMPROVED VERSION
import React, { useState } from 'react';
import { 
  Briefcase, 
  Smile, 
  LucideIcon, 
  Target, 
  Sparkles, 
  BookOpen, 
  Info, 
  MessageSquare,
  Lightbulb,
  Laugh 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';

// Define the content tones with enhanced properties
const CONTENT_TONES = [
  {
    id: 'professional',
    title: 'Professional',
    description: 'Formal and business-like approach',
    icon: Briefcase,
    bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
    hoverBgColor: 'hover:shadow-lg hover:shadow-blue-500/20',
    examples: 'Industry expertise, data-driven content, business updates',
    works: 'LinkedIn, corporate blogs, B2B content',
    emoji: '👔',
    priority: 1,
  },
  {
    id: 'casual',
    title: 'Casual',
    description: 'Relaxed and friendly tone',
    icon: MessageSquare,
    bgColor: 'bg-gradient-to-r from-cyan-400 to-cyan-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-cyan-500/20',
    examples: 'Everyday conversation, personal stories, community posts',
    works: 'Instagram, Facebook, personal blogs',
    emoji: '😊',
    priority: 2,
  },
  {
    id: 'humorous',
    title: 'Humorous',
    description: 'Fun and entertaining style',
    icon: Laugh,
    bgColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-orange-500/20',
    examples: 'Jokes, witty observations, playful content',
    works: 'Twitter, TikTok, Instagram stories',
    emoji: '😂',
    priority: 3,
  },
  {
    id: 'inspirational',
    title: 'Inspirational',
    description: 'Motivating and uplifting',
    icon: Sparkles,
    bgColor: 'bg-gradient-to-r from-rose-400 to-pink-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-pink-500/20',
    examples: 'Success stories, quotes, aspirational content',
    works: 'Instagram, Pinterest, motivational posts',
    emoji: '✨',
    priority: 4,
  },
  {
    id: 'persuasive',
    title: 'Persuasive',
    description: 'Convincing and compelling',
    icon: Target,
    bgColor: 'bg-gradient-to-r from-purple-400 to-purple-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-purple-500/20',
    examples: 'Calls to action, product promotions, advocacy',
    works: 'Landing pages, sales emails, promotional content',
    emoji: '🎯',
    priority: 5,
  },
  {
    id: 'educational',
    title: 'Educational',
    description: 'Informative and instructive',
    icon: Lightbulb,
    bgColor: 'bg-gradient-to-r from-green-400 to-green-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-green-500/20',
    examples: 'How-to guides, tutorials, informative content',
    works: 'YouTube, Medium, educational platforms',
    emoji: '📚',
    priority: 6,
  }
];

interface ToneSelectorProps {
  selectedTone: string;
  onToneChange: (tone: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const ToneSelector: React.FC<ToneSelectorProps> = ({ 
  selectedTone, 
  onToneChange,
  onGenerate,
  isGenerating
}) => {  const { t } = useTranslation(['wizard', 'common']);

  // Get selected tone details
  const selectedToneDetails = CONTENT_TONES.find(tone => tone.id === selectedTone);
  
  // State for preview text example
  const [showTonePreview, setShowTonePreview] = useState(false);
  
  // Sort tones by priority
  const sortedTones = [...CONTENT_TONES].sort((a, b) => a.priority - b.priority);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Heading and description */}      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('wizard:steps.step5.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          {t('wizard:steps.step5.description')}
        </p>
      </div>      {/* Tones grid with improved layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {sortedTones.map((tone) => (
          <button
            key={tone.id}
            onClick={() => onToneChange(tone.id)}
            className={cn(
              tone.bgColor,
              "relative rounded-xl p-5 text-white transition-all duration-300 transform",
              "flex flex-col items-start hover:-translate-y-1",
              selectedTone === tone.id 
                ? "ring-4 ring-white/30 shadow-xl scale-[1.02]" 
                : "ring-0 hover:ring-2 hover:ring-white/20 hover:shadow-lg"
            )}
            aria-label={`Select ${t(`wizard:steps.step5.${tone.id}`)} tone`}
          >
            {/* Emoji badge in top-right corner */}
            <div className="absolute -top-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">
              <span className="text-lg" role="img" aria-label={`${t(`wizard:steps.step5.${tone.id}`)} emoji`}>
                {tone.emoji}
              </span>
            </div>
            
            <div className="flex flex-col space-y-3 w-full">
              {/* Icon and selected indicator */}
              <div className="flex justify-between items-center">
                <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
                  <tone.icon className="w-5 h-5" />
                </div>
                
                {selectedTone === tone.id && (                  <div className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {t('common:selected')}
                  </div>
                )}
              </div>
                {/* Tone title and description */}
              <div className="mt-1">
                <h3 className="text-lg font-semibold">{t(`wizard:steps.step5.${tone.id}`)}</h3>
                <p className="text-sm text-white/90 mt-1">{t(`wizard:tone.descriptions.${tone.id}`)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Tone preview section */}
      {selectedToneDetails && (
        <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/30 mt-6 animate-fadeIn">
          <div className="flex items-center mb-3">
            <div className={cn(
              "p-2.5 rounded-lg mr-3",
              selectedToneDetails.bgColor
            )}>
              <selectedToneDetails.icon className="w-5 h-5 text-white" />
            </div>            <h3 className="text-blue-300 font-medium">
              {t(`wizard:steps.step5.${selectedToneDetails.id}`)} {t('wizard:tone.details')}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">            <div className="bg-blue-950/40 p-3 rounded-lg">
              <p className="text-blue-200 font-medium mb-1">{t('wizard:tone.bestUsedFor')}:</p>
              <p className="text-gray-300">{t(`wizard:tone.examples.${selectedToneDetails.id}`)}</p>
            </div>
            
            <div className="bg-blue-950/40 p-3 rounded-lg">
              <p className="text-blue-200 font-medium mb-1">{t('wizard:tone.worksWellOn')}:</p>
              <p className="text-gray-300">{t(`wizard:tone.works.${selectedToneDetails.id}`)}</p>
            </div>
          </div>
          
          {/* Tone preview toggle button */}
          <button 
            onClick={() => setShowTonePreview(!showTonePreview)}
            className="mt-3 text-xs text-blue-300 hover:text-blue-200 flex items-center"
          >
            <Info className="w-3.5 h-3.5 mr-1" />
            {showTonePreview ? t('wizard:tone.hideToneExample') : t('wizard:tone.showToneExample')}
          </button>
          
          {/* Example text that shows when toggle is clicked */}
          {showTonePreview && (
            <div className="mt-2 p-3 bg-white/5 rounded-lg border border-blue-800/30 text-sm text-gray-300 animate-fadeIn">
              {/* Sample caption in the selected tone */}
              {selectedToneDetails.id === 'professional' && 
                t('Our latest research reveals industry-leading insights on market trends. Learn how these findings can enhance your business strategy in our detailed analysis.')
              }
              {selectedToneDetails.id === 'casual' && 
                t('Just hanging out at the beach today! The waves are perfect and I can\'t get enough of this sunshine. Who else is enjoying the weekend? ☀️🌊')
              }
              {selectedToneDetails.id === 'humorous' && 
                t('When your coffee kicks in and suddenly you\'re ready to conquer the world... or at least your inbox. Anyone else feel like a superhero after caffeine? ☕💪😂')
              }
              {selectedToneDetails.id === 'persuasive' && 
                t('Don\'t miss this opportunity to transform your results. With our proven method, you\'ll see immediate improvements. Take action today while this offer lasts.')
              }
              {selectedToneDetails.id === 'inspirational' && 
                t('Every challenge you face is preparing you for something greater. Keep pushing forward—your breakthrough moment is closer than you think. ✨')
              }
              {selectedToneDetails.id === 'educational' && 
                t('Did you know that honeybees communicate through dance? The \'waggle dance\' indicates direction and distance to food sources, demonstrating their remarkable intelligence.')
              }
            </div>
          )}
        </div>
      )}
      
      {/* Generate button with improved styling */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onGenerate}
          disabled={!selectedTone || isGenerating}
          className={cn(
            "relative px-8 py-4 rounded-xl font-medium transition-all duration-300",
            "flex items-center gap-2 text-base",
            !selectedTone || isGenerating
              ? "bg-primary/60 text-white/80 dark:bg-primary/40 cursor-not-allowed"
              : selectedToneDetails
                ? selectedToneDetails.bgColor + " text-white hover:shadow-lg hover:-translate-y-1"
                : "bg-primary hover:bg-primary/90 text-white dark:bg-primary/80 dark:hover:bg-primary/70 shadow-sm hover:shadow-md"
          )}
        >
          {isGenerating ? (
            <>
              <div className="h-5 w-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
              <span>{t('wizard:steps.step6.generating')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-1.5" />
              <span>{t('wizard:wizard.generate')}</span>
            </>
          )}
        </Button>
      </div>
      
      {/* Helper tip */}
      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg">
        <p className="flex items-start">
          <Info className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('common:tip')}:</span> {t('wizard:tone.tipText')}
          </span>
        </p>
      </div>
    </div>
  );
};

// Add a simple fade-in animation
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

// Add the styles to the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}

export default ToneSelector;