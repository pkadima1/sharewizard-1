
import React from 'react';
import { Instagram, Twitter, Linkedin, Facebook, Youtube, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the platforms with their properties
const PLATFORMS = [
  { 
    id: 'instagram',
    name: 'Instagram', 
    icon: Instagram,
    bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    hoverBgColor: 'hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600',
  },
  { 
    id: 'twitter',
    name: 'Twitter', 
    icon: Twitter, 
    bgColor: 'bg-blue-500',
    hoverBgColor: 'hover:bg-blue-600',
  },
  { 
    id: 'linkedin',
    name: 'LinkedIn', 
    icon: Linkedin, 
    bgColor: 'bg-blue-700',
    hoverBgColor: 'hover:bg-blue-800',
  },
  { 
    id: 'facebook',
    name: 'Facebook', 
    icon: Facebook, 
    bgColor: 'bg-blue-600',
    hoverBgColor: 'hover:bg-blue-700',
  },
  { 
    id: 'tiktok',
    name: 'TikTok', 
    icon: Music, 
    bgColor: 'bg-black',
    hoverBgColor: 'hover:bg-gray-900',
  },
  { 
    id: 'youtube',
    name: 'YouTube', 
    icon: Youtube, 
    bgColor: 'bg-red-600',
    hoverBgColor: 'hover:bg-red-700',
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
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            onClick={() => onPlatformChange(platform.id)}
            className={cn(
              platform.bgColor,
              platform.hoverBgColor,
              "relative rounded-xl p-6 text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg",
              "flex items-center space-x-4",
              selectedPlatform === platform.id 
                ? "ring-4 ring-white/30 shadow-xl scale-[1.02]" 
                : "ring-0"
            )}
          >
            <platform.icon className="w-8 h-8" />
            <span className="text-xl font-semibold">{platform.name}</span>
            
            {selectedPlatform === platform.id && (
              <div className="absolute top-2 right-2 bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                Selected
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Select the platform where you'll be posting your content
      </div>
    </div>
  );
};

export default PlatformSelector;
