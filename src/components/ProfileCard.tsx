import React from 'react';
import { UserProfile, SubscriptionTier } from '@/types';
import { formatDate, getDaysRemaining, getSubscriptionBadgeClass } from '@/lib/constants';
import { Calendar, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  user: UserProfile;
  onEditProfile: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onEditProfile }) => {
  const daysRemaining = user.planExpiryDate ? getDaysRemaining(user.planExpiryDate) : null;
  
  // Helper function to map backend subscription types to display names
  const getDisplayTier = (tier: SubscriptionTier): string => {
    switch(tier) {
      case 'basicMonth': return 'Basic Monthly';
      case 'basicYear': return 'Basic Yearly';
      case 'flexy': return 'Flex';
      case 'trial': return 'Trial';
      case 'free':
      default: return 'Free';
    }
  };
  
  return (
    <div className="overflow-hidden rounded-xl shadow-md bg-card border border-border">
      <div className="relative h-36 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="absolute top-20 left-40 sm:left-44">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {user.fullName || "User"}
          </h1>
          <div className="flex items-center space-x-1.5 text-white/80">
            <Mail size={16} />
            <span className="text-sm sm:text-base">{user.email}</span>
          </div>
        </div>
        <button 
          onClick={onEditProfile}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white/30 focus:ring-2 focus:ring-white/50 focus:outline-none"
        >
          Edit Profile
        </button>
      </div>
      
      <div className="px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start -mt-16 mb-6">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background shadow-lg overflow-hidden">
            <img 
              src={user.profilePictureUrl} 
              alt={user.fullName} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Subscription Plan</div>
            <div className="flex items-center mt-2">
              <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm", getSubscriptionBadgeClass(user.subscriptionTier))}>
                {getDisplayTier(user.subscriptionTier)}
              </span>
              
              {daysRemaining !== null && (
                <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  ({daysRemaining} days remaining)
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Member Since</div>
            <div className="flex items-center mt-2 text-gray-900 dark:text-white">
              <Calendar size={16} className="mr-1.5 text-gray-600 dark:text-gray-300" />
              <span>{formatDate(user.dateJoined)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
