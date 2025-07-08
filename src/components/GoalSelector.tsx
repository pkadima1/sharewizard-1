// GoalSelector.tsx - IMPROVED VERSION
import React from 'react';
import { TrendingUp, DollarSign, Flame, BookOpen, Target, Users, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Define the content goals with their properties
const CONTENT_GOALS = [
  {
    id: 'boost-engagement',
    titleKey: 'boostEngagement',
    descriptionKey: 'boostEngagement',
    bestForKey: 'boostEngagement',
    examplesKey: 'boostEngagement',
    icon: Flame,
    bgColor: 'bg-gradient-to-r from-orange-400 to-orange-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-orange-500/20',
    priority: 1, // Higher priority goals appear first
  },
  {
    id: 'grow-audience',
    titleKey: 'growAudience',
    descriptionKey: 'growAudience',
    bestForKey: 'growAudience',
    examplesKey: 'growAudience',
    icon: TrendingUp,
    bgColor: 'bg-gradient-to-r from-green-400 to-emerald-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-green-500/20',
    priority: 2,
  },
  {
    id: 'share-knowledge',
    titleKey: 'shareKnowledge',
    descriptionKey: 'shareKnowledge',
    bestForKey: 'shareKnowledge',
    examplesKey: 'shareKnowledge',
    icon: BookOpen,
    bgColor: 'bg-gradient-to-r from-purple-400 to-purple-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-purple-500/20',
    priority: 3,
  },
  {
    id: 'drive-sales',
    titleKey: 'driveSales',
    descriptionKey: 'driveSales',
    bestForKey: 'driveSales',
    examplesKey: 'driveSales',
    icon: DollarSign,
    bgColor: 'bg-gradient-to-r from-blue-400 to-blue-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-blue-500/20',
    priority: 4,
  },
  {
    id: 'brand-awareness',
    titleKey: 'brandAwareness',
    descriptionKey: 'brandAwareness',
    bestForKey: 'brandAwareness',
    examplesKey: 'brandAwareness',
    icon: Target,
    bgColor: 'bg-gradient-to-r from-pink-400 to-pink-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-pink-500/20',
    priority: 5,
  },
  {
    id: 'build-community',
    titleKey: 'buildCommunity',
    descriptionKey: 'buildCommunity',
    bestForKey: 'buildCommunity',
    examplesKey: 'buildCommunity',
    icon: Users,
    bgColor: 'bg-gradient-to-r from-amber-400 to-amber-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-amber-500/20',
    priority: 6,
  }
];

interface GoalSelectorProps {
  selectedGoal: string;
  onGoalChange: (goal: string) => void;
}

const GoalSelector: React.FC<GoalSelectorProps> = ({ 
  selectedGoal, 
  onGoalChange 
}) => {
  const { t } = useTranslation('caption-generator');
  
  // Get selected goal details for the info box
  const selectedGoalDetails = CONTENT_GOALS.find(goal => goal.id === selectedGoal);

  // Sort goals by priority
  const sortedGoals = [...CONTENT_GOALS].sort((a, b) => a.priority - b.priority);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Heading and description */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('steps.goal.heading')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          {t('steps.goal.subheading')}
        </p>
      </div>

      {/* Goals grid with improved mobile layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        {sortedGoals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => onGoalChange(goal.id)}
            className={cn(
              goal.bgColor,
              "relative rounded-xl p-5 text-white transition-all duration-300 transform",
              "flex items-start hover:-translate-y-1",
              selectedGoal === goal.id 
                ? "ring-4 ring-white/30 shadow-xl scale-[1.02]" 
                : "ring-0 hover:ring-2 hover:ring-white/20 hover:shadow-lg"
            )}
            aria-label={t('steps.goal.selectGoalAriaLabel', { goalTitle: t(`steps.goal.goals.${goal.titleKey}.title`) })}
          >
            <div className="flex flex-col space-y-3 w-full">
              {/* Icon and selected indicator */}
              <div className="flex justify-between items-center mb-1">
                <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
                  <goal.icon className="w-5 h-5" />
                </div>
                
                {selectedGoal === goal.id && (
                  <div className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {t('steps.goal.selected')}
                  </div>
                )}
              </div>
              
              {/* Goal title and description */}
              <div>
                <h3 className="text-lg font-semibold">{t(`steps.goal.goals.${goal.titleKey}.title`)}</h3>
                <p className="text-sm text-white/90 mt-1 line-clamp-2">{t(`steps.goal.goals.${goal.descriptionKey}.description`)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Enhanced info box with selected goal details */}
      {selectedGoalDetails && (
        <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/30 flex space-x-4 mt-6 animate-fadeIn">
          <div className={cn(
            "p-3 rounded-lg self-start",
            selectedGoalDetails.bgColor
          )}>
            <selectedGoalDetails.icon className="w-6 h-6 text-white" />
          </div>
          
          <div className="space-y-2 flex-1">
            <h3 className="text-blue-300 font-medium flex items-center">
              <Info className="w-4 h-4 mr-1.5" />
              {t('steps.goal.goalStrategy')}: {t(`steps.goal.goals.${selectedGoalDetails.titleKey}.title`)}
            </h3>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                {t('steps.goal.optimizedFor')} <span className="text-white font-medium">{t(`steps.goal.goals.${selectedGoalDetails.titleKey}.title`).toLowerCase()}</span>. 
                {t('steps.goal.bestForText')} <span className="text-blue-200">{t(`steps.goal.goals.${selectedGoalDetails.bestForKey}.bestFor`).toLowerCase()}</span>.
              </p>
              
              <div className="text-xs text-gray-400 bg-blue-950/50 p-3 rounded-lg">
                <span className="text-blue-300 font-medium block mb-1">{t('steps.goal.contentExamples')}:</span>
                {t(`steps.goal.goals.${selectedGoalDetails.examplesKey}.examples`)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tip box for better guidance */}
      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg mt-2">
        <p className="flex items-start">
          <Info className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('steps.goal.tipTitle')}</span> {t('steps.goal.tipText')}
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

export default GoalSelector;