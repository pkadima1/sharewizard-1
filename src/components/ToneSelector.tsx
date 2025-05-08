import React from 'react';
import { Briefcase, Smile, LucideIcon, Target, Sparkles, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

// Define the content tones with their properties
const CONTENT_TONES = [
  {
    id: 'professional',
    title: 'Professional',
    description: 'Formal and business-like approach',
    icon: Briefcase,
    bgColor: 'bg-gradient-to-r from-blue-400 to-blue-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-blue-500/20',
  },
  {
    id: 'casual',
    title: 'Casual',
    description: 'Relaxed and friendly tone',
    icon: Smile,
    bgColor: 'bg-gradient-to-r from-cyan-400 to-cyan-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-cyan-500/20',
  },
  {
    id: 'humorous',
    title: 'Humorous',
    description: 'Fun and entertaining style',
    icon: Smile,
    bgColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-orange-500/20',
  },
  {
    id: 'persuasive',
    title: 'Persuasive',
    description: 'Convincing and compelling',
    icon: Target,
    bgColor: 'bg-gradient-to-r from-purple-400 to-purple-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-purple-500/20',
  },
  {
    id: 'inspirational',
    title: 'Inspirational',
    description: 'Motivating and uplifting',
    icon: Sparkles,
    bgColor: 'bg-gradient-to-r from-pink-400 to-pink-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-pink-500/20',
  },
  {
    id: 'educational',
    title: 'Educational',
    description: 'Informative and instructive',
    icon: BookOpen,
    bgColor: 'bg-gradient-to-r from-green-400 to-green-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-green-500/20',
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
}) => {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {CONTENT_TONES.map((tone) => (
          <button
            key={tone.id}
            onClick={() => onToneChange(tone.id)}
            className={cn(
              tone.bgColor,
              tone.hoverBgColor,
              "relative rounded-xl p-5 text-white transition-all duration-300 transform hover:scale-[1.02]",
              "flex items-start",
              selectedTone === tone.id 
                ? "ring-4 ring-white/30 shadow-xl scale-[1.02]" 
                : "ring-0"
            )}
          >
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex justify-between items-center">
                <div className="bg-white/20 rounded-lg p-2">
                  <tone.icon className="w-6 h-6" />
                </div>
                
                {selectedTone === tone.id && (
                  <div className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    Selected
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                <h3 className="text-xl font-semibold">{tone.title}</h3>
                <p className="text-sm text-white/80 mt-1">{tone.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4 mb-6">
        Select the tone that best fits your content
      </div>

      <div className="flex justify-center pt-4">
        <Button
          onClick={onGenerate}
          disabled={!selectedTone || isGenerating}
          className={cn(
            "relative px-6 py-3 text-white rounded-lg font-medium transition-all duration-200",
            "flex items-center gap-2 overflow-hidden",
            !selectedTone || isGenerating
              ? "bg-primary/60 dark:bg-primary/40 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 dark:bg-primary/80 dark:hover:bg-primary/70 shadow-sm hover:shadow-md"
          )}
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
              <span>Generating...</span>
            </>
          ) : (
            <span>Generate</span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ToneSelector;
