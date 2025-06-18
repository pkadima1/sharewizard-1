
import React from 'react';
import { Button } from "@/components/ui/button";
import { Share, Instagram, Facebook, Twitter, Linkedin, Youtube, Music } from 'lucide-react';
import { toast } from "sonner";
import { shareToPlatform } from '@/utils/socialMediaUtils';
import { MediaType } from '@/types/mediaTypes';
import { useTranslation } from 'react-i18next';

interface SocialSharingProps {
  isEditing: boolean;
  isSharing: boolean;
  onShareClick: () => void;  // Simplified - no event needed with new approach
  selectedPlatform?: string;
  caption?: any;
  mediaType?: MediaType;
  previewUrl?: string | null;
}

const SocialSharing: React.FC<SocialSharingProps> = ({
  isEditing,
  isSharing,
  onShareClick,
  selectedPlatform = '',
  caption,
  mediaType = 'text-only', // Default to text-only to satisfy TypeScript
  previewUrl
}) => {
  if (isEditing) return null;
  const handleDirectShare = async (platform: string) => {
    try {
      toast.info(`Preparing to share on ${platform}...`);
      
      // If we're trying to share directly to a social platform
      if (platform.toLowerCase() !== 'browser') {
        // First try the direct API sharing
        const result = await shareToPlatform(platform.toLowerCase(), {
          caption,
          mediaType,
          mediaUrl: previewUrl
        });
        
        if (result.success) {
          toast.success(result.message || `Shared to ${platform} successfully!`);
          console.log(`Shared to ${platform} via API`);
          return;
        } else if (result.error) {
          // If direct API sharing fails, fall back to browser sharing
          console.warn(`Direct ${platform} sharing failed: ${result.error}`);
          toast.warning(`Direct ${platform} sharing unavailable. Falling back to browser sharing.`);
        }
      }
      
      // With new approach, just trigger the dialog flow without event
      onShareClick();
      console.log(`Initiated two-step share process via dialog`);
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      toast.error(`Failed to share to ${platform}. Trying browser sharing instead.`);
      onShareClick();
    }
  };

  // Define platform icons and details
  const platforms = {
    instagram: { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' },
    twitter: { name: 'Twitter', icon: Twitter, color: 'bg-blue-500 hover:bg-blue-600' },
    facebook: { name: 'Facebook', icon: Facebook, color: 'bg-blue-600 hover:bg-blue-700' },
    linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700 hover:bg-blue-800' },
    tiktok: { name: 'TikTok', icon: Music, color: 'bg-black hover:bg-gray-900' },
    youtube: { name: 'YouTube', icon: Youtube, color: 'bg-red-600 hover:bg-red-700' }
  };

  // Get currently selected platform details, fallback to default
  const selectedPlatformDetails = selectedPlatform && platforms[selectedPlatform as keyof typeof platforms] 
    ? platforms[selectedPlatform as keyof typeof platforms] 
    : null;
  const { t } = useTranslation(['common', 'wizard']);
  
  return (
    <div className="space-y-3">
      <h2 className="font-medium dark:text-white">{t('wizard:captions.downloadToShare', 'Download to Share to preferred Social Media Platform')}</h2>
        {/* Selected platform share button - prominently displayed if a platform is selected */}      {selectedPlatformDetails && (
        <Button
          className={`w-full text-white ${selectedPlatformDetails.color} mb-2`}
          onClick={() => handleDirectShare(selectedPlatformDetails.name)}
          disabled={isSharing}
        >
          {isSharing ? (
            <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
          ) : (
            <selectedPlatformDetails.icon className="h-4 w-4 mr-2" />
          )}
          {t('common:share', 'Share')} {t('common:general.to', 'to')} {selectedPlatformDetails.name}
        </Button>
      )}
      
      {/* Fallback browser sharing option */}
      <Button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        onClick={() => handleDirectShare('Browser')}
        disabled={isSharing}
      >
        {isSharing ? (
          <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
        ) : (
          <Share className="h-4 w-4 mr-2" />
        )}
        {t('wizard:captions.directShareBrowser', 'Direct Share via Browser (WhatsApp, Telegram, etc.)')}
      </Button>
      
      {/* ====================commented out for now until full SM platforms integration============*/}

       {/*<div className="text-sm text-gray-500 dark:text-gray-400">
        Or share directly to:
      </div>
      
     <div className="grid grid-cols-3 gap-2">
        {Object.entries(platforms).map(([key, platform]) => {
          // Skip the platform that's already selected for the main button
          if (key === selectedPlatform) return null;
          
          return (            <Button 
              key={key}
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => handleDirectShare(platform.name)}
            >
              <platform.icon className="h-4 w-4 mr-1" />
              {platform.name}
            </Button>
          );
        })}
      </div>*/}
    </div>
  );
};

export default SocialSharing;
