// PlatformSelector.tsx - IMPROVED VERSION
import React, { useState } from 'react';
import { Instagram, Twitter, Linkedin, Facebook, Youtube, Music, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Define the platforms with their properties
const PLATFORMS = [
  { 
    id: 'linkedin',
    name: 'LinkedIn', 
    icon: Linkedin, 
    bgColor: 'bg-blue-700',
    hoverBgColor: 'hover:bg-blue-800',
    limitedSharing: false,
    recommendedFor: 'Professional content and business updates',
    characterLimit: '3,000 characters',
    priority: 1, // Higher priority platforms first
  },
  { 
    id: 'twitter',
    name: 'Twitter', 
    icon: Twitter, 
    bgColor: 'bg-blue-500',
    hoverBgColor: 'hover:bg-blue-600',
    limitedSharing: false,
    recommendedFor: 'Short updates, news, and trending topics',
    characterLimit: '280 characters',
    priority: 2,
  },
  { 
    id: 'facebook',
    name: 'Facebook', 
    icon: Facebook, 
    bgColor: 'bg-blue-600',
    hoverBgColor: 'hover:bg-blue-700',
    limitedSharing: false,
    recommendedFor: 'Community engagement and general content',
    characterLimit: '63,206 characters',
    priority: 3,
  },
  { 
    id: 'instagram',
    name: 'Instagram', 
    icon: Instagram,
    bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    hoverBgColor: 'hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600',
    limitedSharing: true,
    recommendedFor: 'Visual content with brief captions',
    characterLimit: '2,200 characters',
    priority: 4,
  },
  { 
    id: 'tiktok',
    name: 'TikTok', 
    icon: Music, 
    bgColor: 'bg-black',
    hoverBgColor: 'hover:bg-gray-900',
    limitedSharing: true,
    recommendedFor: 'Short-form video content',
    characterLimit: '150 characters',
    priority: 5,
  },
  { 
    id: 'youtube',
    name: 'YouTube', 
    icon: Youtube, 
    bgColor: 'bg-red-600',
    hoverBgColor: 'hover:bg-red-700',
    limitedSharing: true,
    recommendedFor: 'Long-form video content',
    characterLimit: '5,000 characters',
    priority: 6,
  }
];

interface PlatformSelectorProps {
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ 
  selectedPlatform, 
  onPlatformChange 
}) => {
  // State for showing warning modal when selecting platforms with limited sharing
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [platformForWarning, setPlatformForWarning] = useState<string | null>(null);
  
  // Function to handle platform selection with warning check
  const handlePlatformSelect = (platform: string, hasLimitedSharing: boolean) => {
    if (hasLimitedSharing) {
      setPlatformForWarning(platform);
      setShowWarningModal(true);
    } else {
      // Directly change platform if no warning needed
      onPlatformChange(platform);
    }
  };

  // Get selected platform details for UI display
  const selectedPlatformDetails = PLATFORMS.find(p => p.id === selectedPlatform);

  // Sort platforms by priority
  const sortedPlatforms = [...PLATFORMS].sort((a, b) => a.priority - b.priority);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Heading and description */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Select Social Media Platform
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          Choose where you want to share your content. Your captions will be optimized for the selected platform.
        </p>
      </div>

      {/* Platform grid - Improved with hover effects and better visual hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {sortedPlatforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => handlePlatformSelect(platform.id, platform.limitedSharing)}
            className={cn(
              platform.bgColor,
              platform.hoverBgColor,
              "relative rounded-xl p-5 text-white transition-all duration-300 transform",
              "flex flex-col items-center justify-center text-center h-full min-h-[120px]",
              "hover:shadow-lg hover:-translate-y-1",
              selectedPlatform === platform.id 
                ? "ring-4 ring-white/30 shadow-xl scale-[1.02]" 
                : "ring-0 hover:ring-2 hover:ring-white/20"
            )}
            aria-label={`Select ${platform.name}`}
          >
            {/* Platform Icon and Name */}
            <div className="flex flex-col items-center space-y-3">
              <platform.icon className="w-8 h-8" />
              <span className="text-lg font-semibold">{platform.name}</span>
            </div>
            
            {/* Limited sharing badge */}
            {platform.limitedSharing && (
              <div className="absolute top-2 right-2 bg-amber-500/90 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Limited sharing
              </div>
            )}
            
            {/* Selected indicator */}
            {selectedPlatform === platform.id && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                Selected
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Platform tips section */}
      <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/30 flex space-x-3 mt-6">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h3 className="text-blue-400 font-medium">Platform Tips</h3>
          <p className="text-sm text-gray-300">
            Choose the platform where you want to share your content. The caption generator will optimize your content based on the platform's best practices and character limits.
          </p>
          
          {/* Show selected platform details */}
          {selectedPlatformDetails && (
            <div className="mt-3 bg-blue-950/50 p-3 rounded-lg">
              <p className="text-sm font-medium text-white">{selectedPlatformDetails.name} Details:</p>
              <ul className="text-xs text-gray-300 mt-1 space-y-1">
                <li>• Character Limit: <span className="text-blue-300">{selectedPlatformDetails.characterLimit}</span></li>
                <li>• Best For: <span className="text-blue-300">{selectedPlatformDetails.recommendedFor}</span></li>
                {selectedPlatformDetails.limitedSharing && (
                  <li className="text-amber-300 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Limited direct sharing capability
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Warning modal for limited sharing platforms */}
      {showWarningModal && platformForWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center text-amber-400">
                <AlertTriangle className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-bold">Limited Sharing Capability</h3>
              </div>
              <button 
                onClick={() => setShowWarningModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-300 mb-5">
              The selected social media platform <span className="text-white font-semibold">{
                PLATFORMS.find(p => p.id === platformForWarning)?.name
              }</span> doesn't allow direct sharing. You'll need to share using the Web API, or download the post to share on your favorite social media platform.
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                className="border-gray-700 hover:bg-gray-800 text-gray-300"
                onClick={() => setShowWarningModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  onPlatformChange(platformForWarning);
                  setShowWarningModal(false);
                }}
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformSelector;