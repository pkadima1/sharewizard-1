// PlatformSelector.tsx - IMPROVED VERSION
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Instagram, Twitter, Linkedin, Facebook, Youtube, Music, AlertTriangle, Info, X, Download, Copy, Rocket } from 'lucide-react';
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

// Platform sharing message type
interface PlatformSharingMessage {
  title: string;
  iconComponent: React.ComponentType<any>;
  iconColor: string;
  message: string;
  buttonText: string;
  footer?: string;
}

// Define platform-specific sharing messages
const PLATFORM_SHARING_MESSAGES: Record<string, PlatformSharingMessage> = {
  instagram: {
    title: "🚀 Let's Get This Caption Live!",
    iconComponent: Instagram,
    iconColor: "text-pink-500",
    message: "Instagram prefers a different sharing flow. We've made it easy: simply download your post or copy and paste your caption directly in the Instagram app. Sharing made simple — in just one tap.",
    buttonText: "Create with Instagram",
    footer: "Instagram doesn't support direct in-app sharing — but you're in control with these quick options!"
  },
  tiktok: {
    title: "📱 Ready for TikTok Magic!",
    iconComponent: Music,
    iconColor: "text-black",
    message: "TikTok loves your fresh content! Simply download your optimized caption, then upload it with your video in the TikTok app. Your trending moment awaits—let's make it happen!",
    buttonText: "Create with TikTok",
    footer: "Download your caption when it's ready, to go viral on TikTok!"
  },
  youtube: {
    title: "🎬 YouTube Content Creator Mode",
    iconComponent: Youtube,
    iconColor: "text-red-500",
    message: "Perfect for YouTube! Copy your SEO-optimized caption and description to use in YouTube Studio. Upload directly to your channel and maximize your video's discovery potential.",
    buttonText: "Create for YouTube",
    footer: "Boost your YouTube presence with our professionally crafted, SEO-friendly captions!"
  }
};

interface PlatformSelectorProps {
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ 
  selectedPlatform, 
  onPlatformChange 
}) => {
  const { t, ready } = useTranslation('caption-generator');
  
  // Fallback function to prevent showing translation keys
  const translate = (key: string, options?: any): string => {
    const translation = t(key, options);
    // Ensure we always return a string
    const translationStr = typeof translation === 'string' ? translation : String(translation);
    
    // Add debug logging if in development
    if (import.meta.env.DEV) {
      console.log(`Translation key: ${key}, result: ${translationStr}, ready: ${ready}`);
    }
    
    // If translation returns the key (meaning it failed), return a fallback
    if (translationStr === key) {
      const fallbacks: Record<string, string> = {
        'steps.platform.heading': 'Select Social Media Platform',
        'steps.platform.subheading': '🎯 Get ready to go viral — one platform at a time.',
        'steps.platform.platformDescription': "We'll tailor every caption to match the voice, format, and rhythm of your selected platform. Just pick your favorite!",
        'steps.platform.smartTipsTitle': '💡 Smart Captions, Perfectly Tuned',
        'steps.platform.smartTipsDescription': "We've studied the best practices of each platform — from tone to timing to text limits. Choose your channel, and we'll do the rest. 🙌",
        'steps.platform.selected': 'Selected',
        'steps.platform.quickExport': 'Quick post export',
        'steps.platform.back': 'Back',
        'steps.platform.continue': 'Continue',
        'steps.platform.fallbackTitle': 'Alternative Sharing Options'
      };
      return fallbacks[key] || translationStr;
    }
    return translationStr;
  };
  
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
          {translate('steps.platform.heading')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          {translate('steps.platform.subheading')}
          <br />
          {translate('steps.platform.platformDescription')}
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
              {/* Alternative sharing badge */}
            {platform.limitedSharing && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center">
                <Download className="w-3 h-3 mr-1" />
                {translate('steps.platform.quickExport')}
              </div>
            )}
            
            {/* Selected indicator */}
            {selectedPlatform === platform.id && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                {translate('steps.platform.selected')}
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Platform tips section */}
      <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/30 flex space-x-3 mt-6">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h3 className="text-blue-400 font-medium">{translate('steps.platform.smartTipsTitle')}</h3>
          <p className="text-sm text-gray-300">
            {translate('steps.platform.smartTipsDescription')}
          </p>
          
          {/* Show selected platform details */}
          {selectedPlatformDetails && (
            <div className="mt-3 bg-blue-950/50 p-3 rounded-lg">
              <p className="text-sm font-medium text-white">{t('steps.platform.detailsLabel', { platform: selectedPlatformDetails.name })}</p>
              <ul className="text-xs text-gray-300 mt-1 space-y-1">
                <li>• {t('steps.platform.characterLimit', { limit: selectedPlatformDetails.characterLimit })}</li>
                <li>• {t('steps.platform.bestFor', { purpose: selectedPlatformDetails.recommendedFor })}</li>
                {selectedPlatformDetails.limitedSharing && (
                  <li className="text-blue-300 flex items-center">
                    <Download className="w-3 h-3 mr-1" />
                    {t('steps.platform.exportOptions')}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>      {/* Platform-specific sharing modal */}
      {showWarningModal && platformForWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 border border-gray-700 shadow-2xl">
            {platformForWarning && PLATFORM_SHARING_MESSAGES[platformForWarning] ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    {/* Use dynamic Icon component */}
                    {(() => {
                      const IconComponent = PLATFORM_SHARING_MESSAGES[platformForWarning].iconComponent;
                      return <IconComponent className={`w-6 h-6 mr-2 ${PLATFORM_SHARING_MESSAGES[platformForWarning].iconColor}`} />;
                    })()}
                    <h3 className="text-lg font-bold text-white">{t(`steps.platform.${platformForWarning}Title`)}</h3>
                  </div>
                  <button 
                    onClick={() => setShowWarningModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-gray-300 mb-5 space-y-4">
                  <p>{t(`steps.platform.${platformForWarning}Message`)}</p>
                  
                  {/* Action buttons that are contextual to the platform */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-5">
                    {platformForWarning === 'instagram' }
                    {/*&& (
                      <>
                        <Button variant="outline" className="flex-1 gap-2">
                          <Copy className="w-4 h-4" />
                          Copy Caption
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2">
                          <Download className="w-4 h-4" />
                          Download Assets
                        </Button>
                      </>
                    )}*/}
                    {platformForWarning === 'tiktok'}
                    {platformForWarning === 'youtube'}
                    {/*} && (
                      <>
                        <Button variant="outline" className="flex-1 gap-2">
                          <Copy className="w-4 h-4" />
                          Copy for YouTube
                        </Button>
                      </>
                    )} */}
                  </div>
                  
                  {/* Footer note */}
                  {PLATFORM_SHARING_MESSAGES[platformForWarning].footer && (
                    <p className="text-xs text-gray-400 italic mt-4">
                      {t(`steps.platform.${platformForWarning}Footer`)}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800 text-gray-300"
                    onClick={() => setShowWarningModal(false)}
                  >
                    {translate('steps.platform.back')}
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    onClick={() => {
                      onPlatformChange(platformForWarning);
                      setShowWarningModal(false);
                    }}
                  >
                    {t(`steps.platform.${platformForWarning}Button`)}
                  </Button>
                </div>
              </>
            ) : (
              // Fallback for any platform not specifically configured
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center text-blue-400">
                    <Rocket className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-bold">{translate('steps.platform.fallbackTitle')}</h3>
                  </div>
                  <button 
                    onClick={() => setShowWarningModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-gray-300 mb-5">
                  {t('steps.platform.fallbackMessage', { 
                    platform: PLATFORMS.find(p => p.id === platformForWarning)?.name 
                  })}
                </p>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800 text-gray-300"
                    onClick={() => setShowWarningModal(false)}
                  >
                    {translate('steps.platform.back')}
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      onPlatformChange(platformForWarning);
                      setShowWarningModal(false);
                    }}
                  >
                    {translate('steps.platform.continue')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformSelector;