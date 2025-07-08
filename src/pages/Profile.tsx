import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { UserProfile, SubscriptionTier } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import ProfileCard from '@/components/ProfileCard';
import UsageStats from '@/components/UsageStats';
import EditProfileModal from '@/components/EditProfileModal';
import { toast } from "@/hooks/use-toast";
import { useUserGenerations } from '@/hooks/useUserGenerations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { addDoc, collection as fsCollection } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import MediaUploader from '@/components/MediaUploader';
import { useNavigate } from 'react-router-dom';
import { Heart, Share2, Download, Eye, Edit, Copy, Trash2, Star, Calendar, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppTranslation } from '@/hooks/useAppTranslation';

// Import the Generation type from the hook
import { Generation } from '@/hooks/useUserGenerations';

const defaultUserProfile: UserProfile = {
  id: '',
  fullName: '',
  email: '',
  profilePictureUrl: '/placeholder.svg',
  subscriptionTier: 'free', 
  dateJoined: new Date(),
  planExpiryDate: null,
  stats: {
    aiRequestsUsed: 0,
    aiRequestsLimit: 5,
    postsGenerated: 0,
    postsDrafted: 0,
    postsShared: {
      total: 0,
      byPlatform: {
        twitter: 0,
        linkedin: 0,
        facebook: 0,
        other: 0
      }
    }
  },
  recentPosts: []
};

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // IMPORTANT: Single declaration of currentUser at component level
  const { currentUser, refreshUserProfile } = useAuth();
  
  const { generations, loading: generationsLoading } = useUserGenerations(currentUser?.uid);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter states
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [postedFilter, setPostedFilter] = useState<string>('all');
  const [favoriteFilter, setFavoriteFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Repost modal states
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState<{gen: Generation, caption: any} | null>(null);
  const [mediaChoice, setMediaChoice] = useState<'media' | 'text' | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const navigate = useNavigate();

  const { t } = useAppTranslation('profile');

  // Add translation helpers for goal and tone
  const goalLabel = (goal: string) => {
    // Map backend value to translation key
    const goalMap: Record<string, string> = {
      'boost-engagement': 'boostEngagement',
      'grow-audience': 'growAudience',
      'share-knowledge': 'shareKnowledge',
      'drive-sales': 'driveSales',
      'brand-awareness': 'brandAwareness',
      'build-community': 'buildCommunity',
    };
    const key = goalMap[goal] || goal;
    return t(`goal.goals.${key}.title`, undefined, { ns: 'caption-generator' }) || goal;
  };
  const toneLabel = (tone: string) => {
    // Map backend value to translation key
    const toneMap: Record<string, string> = {
      'friendly': 'friendly',
      'professional': 'professional',
      'thought-provoking': 'thoughtProvoking',
      'expert': 'expert',
      'persuasive': 'persuasive',
      'informative': 'informative',
      'casual': 'casual',
      'authoritative': 'authoritative',
      'inspirational': 'inspirational',
      'humorous': 'humorous',
      'empathetic': 'empathetic',
    };
    const key = toneMap[tone] || tone;
    return t(`tone.tones.${key}.title`, undefined, { ns: 'caption-generator' }) || tone;
  };

  // Memoize expensive calculations for better performance
  const allPlatforms = useMemo(() => 
    Array.from(new Set(generations.map(g => g.input.platform))),
    [generations]
  );
  
  const allGoals = useMemo(() => 
    Array.from(new Set(generations.map(g => g.input.goal))),
    [generations]
  );

  // Memoize filtered generations to prevent recalculations on every render
  const filteredGenerations = useMemo(() => 
    generations
      .filter(g => {
        if (platformFilter !== 'all' && g.input.platform !== platformFilter) return false;
        if (goalFilter !== 'all' && g.input.goal !== goalFilter) return false;
        if (dateFilter && g.createdAt && g.createdAt.toDate) {
          const postDate = g.createdAt.toDate().toISOString().slice(0, 10);
          if (postDate !== dateFilter) return false;
        }
        if (postedFilter === 'posted' && !g.posted) return false;
        if (postedFilter === 'not_posted' && g.posted) return false;
        if (favoriteFilter === 'favorite' && !g.isFavorite) return false;
        if (favoriteFilter === 'not_favorite' && g.isFavorite) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') return b.createdAt.seconds - a.createdAt.seconds;
        return a.createdAt.seconds - b.createdAt.seconds;
      }),
    [generations, platformFilter, goalFilter, dateFilter, postedFilter, favoriteFilter, sortOrder]
  );

  // Memoize summary counts to prevent recalculations
  const { totalGenerated, totalPosted, totalFavorites, totalShared, totalDrafts } = useMemo(() => ({
    totalGenerated: generations.length,
    totalPosted: generations.filter(g => g.posted).length,
    totalFavorites: generations.filter(g => g.isFavorite).length,
    totalShared: generations.reduce((sum, gen) => sum + (gen.shared_count || 0) + (gen.downloaded_count || 0), 0),
    totalDrafts: generations.filter(gen => !(gen.shared_count > 0 || gen.downloaded_count > 0)).length
  }), [generations]);

  // Helper function for showing error toasts (DRY principle)
  const showErrorToast = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  };

  function handleRepostClick(gen: Generation, caption: any) {
    setSelectedCaption({ gen, caption });
    setMediaChoice(null);
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setOverlayEnabled(false);
    setRepostModalOpen(true);
  }

  function goToPreview(selectedCaption: {gen: Generation, caption: any}, mediaFile: File | null) {
    setRepostModalOpen(false);
    navigate('/preview-repost', {
      state: {
        caption: selectedCaption.caption,
        gen: selectedCaption.gen,
        mediaFile,
      },
    });
  }

  useEffect(() => {
    if (!currentUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', currentUser.uid);

    const unsubscribe = onSnapshot(userRef, (userSnapshot) => {
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();        // Map Firebase plan_type to SubscriptionTier type
        let subscriptionTier: SubscriptionTier = 'free';
        if (userData.plan_type === 'basic' || userData.plan_type === 'basicMonth' || userData.plan_type === 'basicYear') subscriptionTier = 'basicMonth';
        else if (userData.plan_type === 'premiumMonth' || userData.plan_type === 'premiumYear') subscriptionTier = userData.plan_type;
        else if (userData.plan_type === 'flexy') subscriptionTier = 'flexy';

        // Create a properly formatted UserProfile object
        const profileData: UserProfile = {
          id: userSnapshot.id,
          fullName: userData.displayName || currentUser.displayName || '',
          email: userData.email || currentUser.email || '',
          profilePictureUrl: userData.photoURL || currentUser.photoURL || '/placeholder.svg',
          subscriptionTier: subscriptionTier,
          dateJoined: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : new Date(),
          planExpiryDate: userData.reset_date ? new Date(userData.reset_date.seconds * 1000) : null,
          stats: {
            aiRequestsUsed: userData.requests_used || 0,
            aiRequestsLimit: userData.requests_limit || 5,
            // Sync postsGenerated with the number of generations fetched
            postsGenerated: generations.length,
            postsDrafted: totalDrafts,
            postsShared: {
              total: totalShared,
              // Note: platform specific counts are updated directly in handleShare
              byPlatform: userData.posts_shared?.byPlatform || {
                twitter: 0,
                linkedin: 0,
                facebook: 0,
                other: 0
              }
            }
          },
          recentPosts: userData.recent_posts || []
        };

        setUser(profileData);
        setLoading(false);
      } else {
        // User document doesn't exist, create a default profile
        const defaultProfile = {
          ...defaultUserProfile,
          fullName: currentUser.displayName || '',
          email: currentUser.email || '',
          profilePictureUrl: currentUser.photoURL || '/placeholder.svg',
        };
        setUser(defaultProfile);
        setLoading(false);

        showErrorToast(
          "Warning",
          "Using default profile data. Some features may be limited."
        );
      }
    }, (error) => {
      console.error('Error fetching user data:', error);
      // Handle error: maybe set user to null or a default error state
      setUser(null);
      setLoading(false);
      showErrorToast(
        "Error",
        "Failed to load profile data. Using default profile."
      );
    });

    // Clean up the listener when the component unmounts or currentUser changes
    return () => unsubscribe();

  }, [currentUser, generations]); // Add generations to the dependency array

  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !currentUser) return;
    
    try {
      // Update Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      const updateData: any = {};
      
      if (updates.fullName) {
        updateData.displayName = updates.fullName;
        
        // Also update the Auth user's displayName
        await updateProfile(currentUser, {
          displayName: updates.fullName
        });
      }
      
      if (updates.profilePictureUrl) {
        updateData.photoURL = updates.profilePictureUrl;
      }
      
      await updateDoc(userRef, updateData);
      // Update local state
      setUser({
        ...user,
        ...updates
      });
      
      // Refresh the user profile in the auth context to ensure consistency
      await refreshUserProfile();
      
      // Show success toast
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Show error toast
      showErrorToast(
        "Error", 
        "Failed to update profile. Please try again."
      );
    }
  };

  // Download/Share handlers
  const handleDownload = async (gen: Generation) => {
    if (!currentUser) {
      showErrorToast("Error", "You must be logged in to download.");
      return;
    }

    try {
      // Placeholder: replace with actual file/blob
      const file = new Blob([JSON.stringify(gen)], { type: 'application/json' });
      
      // Use consistent storage path pattern with proper user ID
      const sRef = storageRef(storage, `shared-media/${currentUser.uid}/${gen.id}/download.json`);
      
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      const genRef = doc(db, 'users', currentUser.uid, 'generations', gen.id);
      await updateDoc(genRef, {
        posted: true,
        downloaded_count: (gen.downloaded_count || 0) + 1,
        downloadUrl: url,
      });

      toast({
        title: "Download Success",
        description: "Your content has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading content:', error);
      showErrorToast(
        "Download Failed", 
        "There was an error downloading your content. Please try again."
      );
    }
  };

  const handleShare = async (gen: Generation) => {
    if (!currentUser) {
      showErrorToast("Error", "You must be logged in to share.");
      return;
    }

    try {
      // Placeholder: replace with actual file/blob
      const file = new Blob([JSON.stringify(gen)], { type: 'application/json' });
      
      // Use consistent storage path pattern with proper user ID
      const sRef = storageRef(storage, `shared-media/${currentUser.uid}/${gen.id}/share.json`);
      
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      // Optionally add to subcollection for tracking
      await addDoc(fsCollection(db, 'users', currentUser.uid, 'generations', gen.id, 'shares'), {
        url,
        timestamp: new Date(),
      });
      const genRef = doc(db, 'users', currentUser.uid, 'generations', gen.id);
      await updateDoc(genRef, {
        posted: true,
        shared_count: (gen.shared_count || 0) + 1,
        shareUrl: url,
      });

      // **Add this section to update platform-specific share count**
      const userRef = doc(db, 'users', currentUser.uid);
      const platformKey = gen.input.platform.toLowerCase() as keyof UserProfile['stats']['postsShared']['byPlatform'];
      const updateData: any = { // Use any for dynamic key update
        'stats.postsShared.total': increment(1),
      };
      // Safely update platform specific count, defaulting to 'other' if platform is unknown
      if (['twitter', 'linkedin', 'facebook'].includes(gen.input.platform.toLowerCase())) {
         updateData[`stats.postsShared.byPlatform.${platformKey}`] = increment(1);
      } else {
         updateData['stats.postsShared.byPlatform.other'] = increment(1);
      }
      await updateDoc(userRef, updateData);

      toast({
        title: "Shared Successfully",
        description: "Your content has been shared successfully.",
      });
    } catch (error) {
      console.error('Error sharing content:', error);
      showErrorToast(
        "Share Failed", 
        "There was an error sharing your content. Please try again."
      );
    }
  };

  // Handle favoriting/unfavoriting
  const handleFavoriteToggle = async (gen: Generation) => {
    if (!currentUser) {
      showErrorToast(
        "Login Required", 
        "You must be logged in to favorite."
      );
      return;
    }

    try {
      const genRef = doc(db, 'users', currentUser.uid, 'generations', gen.id);
      const newFavoriteStatus = !gen.isFavorite;
      await updateDoc(genRef, {
        isFavorite: newFavoriteStatus
      });

      // Update local state immediately for responsiveness
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          stats: {
            ...prevUser.stats,
            postsShared: {
              ...prevUser.stats.postsShared,
              total: prevUser.stats.postsShared.total + (newFavoriteStatus ? 1 : -1)
            }
          },
          isFavorite: newFavoriteStatus
        };
      });

      toast({
        title: newFavoriteStatus ? 'Favorited!' : 'Unfavorited',
        description: newFavoriteStatus ? 'Added to favorites!' : 'Removed from favorites.',
      });

    } catch (error) {
      console.error("Error toggling favorite:", error);
      showErrorToast(
        "Error", 
        "Failed to update favorite status."
      );
    }
  };

  // Loading skeleton
  if (loading || generationsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <Skeleton className="h-36 w-full rounded-xl mb-4" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1,2,3,4,5,6].map(i => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="bg-card text-card-foreground rounded-2xl shadow-subtle p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">{t('notFoundTitle')}</h2>
            <p className="text-muted-foreground">
              {t('notFoundDescription')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-6 md:pb-8">
        {/* Profile Card and Usage Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <ProfileCard user={user} onEditProfile={() => setIsEditModalOpen(true)} />
          <UsageStats stats={user.stats} subscriptionTier={user.subscriptionTier} />
        </motion.div>

        {/* Summary Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-3 gap-2 mb-6"
        >
        {}  <Card className="text-center py-4 shadow-sm hover:shadow-md transition-all">
            <div className="text-2xl font-bold">{totalGenerated}</div>
            <div className="text-xs text-muted-foreground">{t('summary.generated')}</div>
          </Card>
          <Card className="text-center py-4 shadow-sm hover:shadow-md transition-all">
            <div className="text-2xl font-bold">{totalPosted}</div>
            <div className="text-xs text-muted-foreground">{t('summary.posted')}</div>
          </Card>
          <Card className="text-center py-4 shadow-sm hover:shadow-md transition-all">
            <div className="text-2xl font-bold">{totalFavorites}</div>
            <div className="text-xs text-muted-foreground">{t('summary.favorites')}</div>
          </Card>
        </motion.div>

        {/* View Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-wrap justify-between items-center gap-2 mb-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? t('filters.hide') : t('filters.show')}
          </Button>
          
          <Tabs defaultValue={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
            <TabsList className="bg-muted">
              <TabsTrigger value="grid" className="data-[state=active]:bg-background">{t('filters.grid')}</TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-background">{t('filters.list')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-4"
            >
              <Card className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium">{t('filters.filterSort')}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-full" aria-label="Filter by platform">
                      <SelectValue placeholder={t('filters.platform')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.allPlatforms')}</SelectItem>
                      {allPlatforms.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={goalFilter} onValueChange={setGoalFilter}>
                    <SelectTrigger className="w-full" aria-label="Filter by goal">
                      <SelectValue placeholder={t('filters.goal')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.allGoals')}</SelectItem>
                      {allGoals.map(goal => (
                        <SelectItem key={goal} value={goal}>{goalLabel(goal)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2 w-full">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label="Filter by date"
                    />
                  </div>
                  
                  <Select value={postedFilter} onValueChange={setPostedFilter}>
                    <SelectTrigger className="w-full" aria-label="Filter by posted status">
                      <SelectValue placeholder={t('filters.postedStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.all')}</SelectItem>
                      <SelectItem value="posted">{t('filters.posted')}</SelectItem>
                      <SelectItem value="not_posted">{t('filters.notPosted')}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
                    <SelectTrigger className="w-full" aria-label="Filter by favorite status">
                      <SelectValue placeholder={t('filters.favoriteStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.all')}</SelectItem>
                      <SelectItem value="favorite">{t('filters.favorite')}</SelectItem>
                      <SelectItem value="not_favorite">{t('filters.notFavorite')}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortOrder} onValueChange={v => setSortOrder(v as 'desc' | 'asc')}>
                    <SelectTrigger className="w-full" aria-label="Sort order">
                      <SelectValue placeholder={t('filters.sort')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">{t('filters.newest')}</SelectItem>
                      <SelectItem value="asc">{t('filters.oldest')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Posts List */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}
        >
          {filteredGenerations.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium mb-2">{t('empty.noPosts')}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('empty.tryAdjust')}
              </p>
            </div>
          )}
          
          {filteredGenerations.map(gen => (
            <motion.div
              key={gen.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ y: -2 }}
              className="h-full"
            >
              <Card className={`h-full overflow-hidden transition-all hover:shadow-md ${viewMode === 'list' ? 'flex' : ''}`}>
                <div className={`p-4 flex flex-col ${viewMode === 'list' ? 'flex-row items-center' : 'h-full'}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                        {gen.input.platform}
                      </span>
                      {gen.posted && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-500">
                          Posted
                        </span>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant={gen.isFavorite ? "default" : "ghost"}
                      onClick={() => handleFavoriteToggle(gen)}
                      className="h-8 w-8"
                      aria-label={gen.isFavorite ? t('actions.removeFavorite') : t('actions.addFavorite')}
                    >
                      <Star className={`h-4 w-4 ${gen.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                  </div>
                  
                  {/* Metadata */}
                  <div className="text-xs text-muted-foreground mb-3 space-x-2">
                    <span>{gen.input.niche}</span>
                    <span>•</span>
                    <span>{goalLabel(gen.input.goal)}</span>
                    <span>•</span>
                    <span>{toneLabel(gen.input.tone)}</span>
                  </div>
                  
                  {/* Content */}
                  <div className={`flex-1 ${viewMode === 'list' ? 'flex-1 min-w-0' : ''}`}>
                    {gen.output.map((out, idx) => (
                      <div 
                        key={idx} 
                        className={`mb-4 ${idx !== gen.output.length - 1 ? 'border-b pb-4' : ''}`}
                      >
                        <div className="font-bold mb-1 line-clamp-1">{out.title}</div>
                        <div className="text-sm line-clamp-2 mb-2">{out.caption}</div>
                        <div className="text-xs text-muted-foreground mb-1 line-clamp-1">{out.cta}</div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {out.hashtags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-secondary/50 text-secondary-foreground">
                              #{tag}
                            </span>
                          ))}
                          {out.hashtags.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-secondary/50 text-secondary-foreground">
                              +{out.hashtags.length - 3}
                            </span>
                          )}
                        </div>
                        <Button 
                         size="sm" 
                         variant="secondary" 
                         onClick={() => handleRepostClick(gen, out)}
                         className="w-full"
                         aria-label="Repost this caption"
                       >
                         <Share2 className="mr-2 h-4 w-4" /> {t('actions.repost')}
                       </Button>
                     </div>
                   ))}
                 </div>
               </div>
             </Card>
           </motion.div>
         ))}
       </motion.div>

       {/* Edit Profile Modal */}
       <EditProfileModal
         isOpen={isEditModalOpen}
         onClose={() => setIsEditModalOpen(false)}
         user={user}
         onSave={handleSaveProfile}
       />

       {/* Repost Dialog */}
       <Dialog open={repostModalOpen} onOpenChange={setRepostModalOpen}>
         <DialogContent className="max-w-3xl w-full">
           <DialogTitle className="text-xl">{t('repostDialog.title')}</DialogTitle>
           {!mediaChoice && (
             <motion.div
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2 }}
             >
               <DialogDescription className="mb-4">
                 {t('repostDialog.howRepost')}
               </DialogDescription>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <Button 
                   onClick={() => setMediaChoice('media')} 
                   variant="outline" 
                   className="h-32 flex flex-col gap-2 hover:bg-primary/5 transition-colors"
                 >
                   <div className="rounded-full p-3 bg-primary/10">
                     <Download className="h-6 w-6 text-primary" />
                   </div>
                   <span className="font-medium">{t('repostDialog.addMedia')}</span>
                   <span className="text-xs text-muted-foreground">{t('repostDialog.uploadMedia')}</span>
                 </Button>
                 
                 <Button 
                   onClick={() => setMediaChoice('text')} 
                   variant="outline" 
                   className="h-32 flex flex-col gap-2 hover:bg-primary/5 transition-colors"
                 >
                   <div className="rounded-full p-3 bg-primary/10">
                     <Edit className="h-6 w-6 text-primary" />
                   </div>
                   <span className="font-medium">{t('repostDialog.textOnly')}</span>
                   <span className="text-xs text-muted-foreground">{t('repostDialog.textOnlyDesc')}</span>
                 </Button>
               </div>
             </motion.div>
           )}
           
           {mediaChoice === 'media' && (
             <motion.div
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2 }}
             >
               <DialogDescription className="mb-4">
                 {t('repostDialog.uploadPrompt')}
               </DialogDescription>
               <MediaUploader
                 onMediaSelect={file => {
                   setMediaFile(file);
                   setMediaPreviewUrl(file ? URL.createObjectURL(file) : null);
                   // For video, always enable overlay
                   if (file && file.type.startsWith('video')) setOverlayEnabled(true);
                   else setOverlayEnabled(false);
                 }}
                 selectedMedia={mediaFile}
                 previewUrl={mediaPreviewUrl}
                 onTextOnlySelect={() => {
                   setMediaChoice('text');
                   setMediaFile(null);
                   setMediaPreviewUrl(null);
                   setOverlayEnabled(false);
                 }}
               />
             </motion.div>
           )}
           
           {mediaChoice === 'text' && (
             <motion.div
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2 }}
             >
               <DialogDescription className="mb-4">
                 {t('repostDialog.textOnlyPrompt')}
               </DialogDescription>
               
               {selectedCaption && (
                 <div className="mt-4 p-4 rounded-lg border bg-muted/50">
                   <div className="font-bold mb-2">{selectedCaption.caption.title}</div>
                   <div className="mb-2">{selectedCaption.caption.caption}</div>
                   <div className="text-sm mb-2">{selectedCaption.caption.cta}</div>
                   <div className="flex flex-wrap gap-1">
                     {selectedCaption.caption.hashtags.map((tag: string, i: number) => (
                       <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-secondary/50">
                         #{tag}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
             </motion.div>
           )}

           {/* Continue to Preview button moved to the very bottom, visible when a choice is made */}
           {(mediaChoice === 'media' || mediaChoice === 'text') && (
             <div className="flex gap-2 mt-4">
               <Button
                 className="flex-1"
                 onClick={() => {
                   // Determine parameters based on mediaChoice
                   if (selectedCaption) {
                     if (mediaChoice === 'media') {
                        goToPreview(selectedCaption, mediaFile);
                     } else if (mediaChoice === 'text') {
                        goToPreview(selectedCaption, null);
                     }
                   }
                 }}
                 // Disable if mediaChoice is 'media' but no mediaFile is selected
                 disabled={mediaChoice === 'media' && !mediaFile}
               >
                 <span className="text-base font-semibold">{t('actions.continuePreview')}</span>
               </Button>
             </div>
           )}
         </DialogContent>
       </Dialog>
     </div>
   </div>
 );
};

export default Profile;