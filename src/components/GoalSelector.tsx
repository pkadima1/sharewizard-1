
import React from 'react';
import { TrendingUp, DollarSign, Flame, BookOpen, Target, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the content goals with their properties
const CONTENT_GOALS = [
  {
    id: 'grow-audience',
    title: 'Grow Audience',
    description: 'Expand your follower base and reach',
    icon: TrendingUp,
    bgColor: 'bg-gradient-to-r from-green-400 to-emerald-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-green-500/20',
  },
  {
    id: 'drive-sales',
    title: 'Drive Sales',
    description: 'Convert followers into customers',
    icon: DollarSign,
    bgColor: 'bg-gradient-to-r from-blue-400 to-blue-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-blue-500/20',
  },
  {
    id: 'boost-engagement',
    title: 'Boost Engagement',
    description: 'Increase likes, comments and shares',
    icon: Flame,
    bgColor: 'bg-gradient-to-r from-orange-400 to-orange-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-orange-500/20',
  },
  {
    id: 'share-knowledge',
    title: 'Share Knowledge',
    description: 'Educate and provide value',
    icon: BookOpen,
    bgColor: 'bg-gradient-to-r from-purple-400 to-purple-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-purple-500/20',
  },
  {
    id: 'brand-awareness',
    title: 'Brand Awareness',
    description: 'Increase visibility and recognition',
    icon: Target,
    bgColor: 'bg-gradient-to-r from-pink-400 to-pink-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-pink-500/20',
  },
  {
    id: 'build-community',
    title: 'Build Community',
    description: 'Foster relationships with followers',
    icon: Users,
    bgColor: 'bg-gradient-to-r from-amber-400 to-amber-500',
    hoverBgColor: 'hover:shadow-lg hover:shadow-amber-500/20',
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
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {CONTENT_GOALS.map((goal) => (
          <button
            key={goal.id}
            onClick={() => onGoalChange(goal.id)}
            className={cn(
              goal.bgColor,
              goal.hoverBgColor,
              "relative rounded-xl p-5 text-white transition-all duration-300 transform hover:scale-[1.02]",
              "flex items-start",
              selectedGoal === goal.id 
                ? "ring-4 ring-white/30 shadow-xl scale-[1.02]" 
                : "ring-0"
            )}
          >
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex justify-between items-center">
                <div className="bg-white/20 rounded-lg p-2">
                  <goal.icon className="w-6 h-6" />
                </div>
                
                {selectedGoal === goal.id && (
                  <div className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    Selected
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                <h3 className="text-xl font-semibold">{goal.title}</h3>
                <p className="text-sm text-white/80 mt-1">{goal.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
        <div className="text-center text-sm text-gray-700 dark:text-gray-300 mt-6">
        Select the primary goal for your content
      </div>
    </div>
  );
};

export default GoalSelector;
