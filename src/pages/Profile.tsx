import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { UserProfile, SubscriptionTier } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import ProfileCard from '@/components/ProfileCard';
import UsageStats from '@/components/UsageStats';
import RecentPosts from '@/components/RecentPosts';
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
import { Switch } from '@/components/ui/switch';
import { Heart, Share2, Download, Eye, Edit, Copy, Trash2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";

// Define a type for generation objects to improve type safety
interface Generation {
  id: string;
  userId: string;
  input: {
    platform: string;
    niche: string;
    goal: string;
    tone: string;
    [key: string]: any;
  };
  output: Array<{
    title: string;
    caption: string;
    cta: string;
    hashtags: string[];
  }>;
  posted?: boolean;
  isFavorite?: boolean;
  downloaded_count?: number;
  shared_count?: number;
  createdAt: {
    seconds: number;
    toDate?: () => Date;
  };
  [key: string]: any;
}

const defaultUserProfile: UserProfile = {
  id: '',
  fullName: '',
  email: '',
  profilePictureUrl: '/placeholder.svg',
  subscriptionTier: 'free', // Changed from 'Free' to lowercase 'free' to match the SubscriptionTier type
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
  // This is the only place where currentUser should be declared
  const { currentUser, refreshUserProfile } = useAuth();
  
  const { generations, loading: generationsLoading } = useUserGenerations(currentUser?.uid);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter state
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [postedFilter, setPostedFilter] = useState<string>('all');
  const [favoriteFilter, setFavoriteFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

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
  const { totalGenerated, totalPosted, totalFavorites } = useMemo(() => ({
    totalGenerated: generations.length,
    totalPosted: generations.filter(g => g.posted).length,
    totalFavorites: generations.filter(g => g.isFavorite).length
  }), [generations]);

  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState<{gen: Generation, caption: any} | null>(null);
  const [mediaChoice, setMediaChoice] = useState<'media' | 'text' | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState('');
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const navigate = useNavigate();

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
    setOverlayText('');
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
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const userDoc = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDoc);        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          // Map Firebase plan_type to SubscriptionTier type
          let subscriptionTier: SubscriptionTier = 'free'; // Changed from 'Free' to lowercase 'free'
          if (userData.plan_type === 'basic' || userData.plan_type === 'basicMonth' || userData.plan_type === 'basicYear') subscriptionTier = 'basicMonth'; // Changed from 'Lite' to 'basicMonth' as per the type
          else if (userData.plan_type === 'flexy') subscriptionTier = 'flexy'; // Changed from 'Flex' to 'flexy'
          
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
              postsGenerated: userData.posts_created || 0,
              postsDrafted: userData.posts_drafted || 0,
              postsShared: {
                total: userData.posts_shared || 0,
                byPlatform: {
                  twitter: userData.posts_shared_twitter || 0,
                  linkedin: userData.posts_shared_linkedin || 0,
                  facebook: userData.posts_shared_facebook || 0,
                  other: userData.posts_shared_other || 0
                }
              }
            },
            recentPosts: userData.recent_posts || []
          };
          
          setUser(profileData);
          setLoading(false);
        } else {
          // Create default profile with user auth data
          const defaultProfile = {
            ...defaultUserProfile,
            fullName: currentUser.displayName || '',
            email: currentUser.email || '',
            profilePictureUrl: currentUser.photoURL || '/placeholder.svg',
          };
          setUser(defaultProfile);
          setLoading(false);
          
          // Show error toast
          showErrorToast(
            "Warning", 
            "Using default profile data. Some features may be limited."
          );
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        // Create default profile with user auth data
        const defaultProfile = {
          ...defaultUserProfile,
          fullName: currentUser.displayName || '',
          email: currentUser.email || '',
          profilePictureUrl: currentUser.photoURL || '/placeholder.svg',
        };
        setUser(defaultProfile);
        setLoading(false);
        
        // Show error toast
        showErrorToast(
          "Error", 
          "Failed to load profile data. Using default profile."
        );
      }
    };
    
    fetchUserData();
  }, [currentUser]);

  // IMPORTANT: handleSaveProfile function is already outside of the useEffect
  // Confirmed its proper placement after the useEffect hook and before other handlers
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

  if (loading || generationsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-primary border-primary/30 rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
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
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground">
              Unable to load your profile data. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Profile Card and Usage Stats */}
        <div className="mb-6">
          <ProfileCard user={user} onEditProfile={() => setIsEditModalOpen(true)} />
          <UsageStats stats={user.stats} subscriptionTier={user.subscriptionTier} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="text-center py-4">
            <div className="text-2xl font-bold">{totalGenerated}</div>
            <div className="text-xs text-muted-foreground">Generated</div>
          </Card>
          <Card className="text-center py-4">
            <div className="text-2xl font-bold">{totalPosted}</div>
            <div className="text-xs text-muted-foreground">Posted</div>
          </Card>
          <Card className="text-center py-4">
            <div className="text-2xl font-bold">{totalFavorites}</div>
            <div className="text-xs text-muted-foreground">Favorites</div>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-label="Grid view"
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-label="List view"
            >
              List
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px]" aria-label="Filter by platform">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {allPlatforms.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={goalFilter} onValueChange={setGoalFilter}>
            <SelectTrigger className="w-[140px]" aria-label="Filter by goal">
              <SelectValue placeholder="Goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              {allGoals.map(goal => (
                <SelectItem key={goal} value={goal}>{goal}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="rounded border px-2 py-1"
            aria-label="Filter by date"
          />
          <Select value={postedFilter} onValueChange={setPostedFilter}>
            <SelectTrigger className="w-[140px]" aria-label="Filter by posted status">
              <SelectValue placeholder="Posted Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="not_posted">Not Posted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
            <SelectTrigger className="w-[140px]" aria-label="Filter by favorite status">
              <SelectValue placeholder="Favorite Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="favorite">Favorite</SelectItem>
              <SelectItem value="not_favorite">Not Favorite</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={v => setSortOrder(v as 'desc' | 'asc')}>
            <SelectTrigger className="w-[140px]" aria-label="Sort order">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Generated Posts List */}
        <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3' : 'space-y-4'}>
          {filteredGenerations.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">No posts found.</div>
          )}
          {filteredGenerations.map(gen => (
            <Card key={gen.id} className={`p-4 flex flex-col gap-2 ${viewMode === 'list' ? 'flex-row items-center' : ''}`}>
              <div className={`flex items-center justify-between ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <span className="font-semibold">{gen.input.platform}</span>
                <span className="text-xs">{gen.isFavorite ? '★' : '☆'} {gen.posted ? 'Posted' : ''}</span>
              </div>
              <div className={`text-xs text-muted-foreground mb-1 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                {gen.input.goal} | {gen.input.niche} | {gen.input.tone}
              </div>
              <div className={`flex-1 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                {gen.output.map((out, idx) => (
                  <div key={idx} className={`mb-2 ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
                    <div className="font-bold">{out.title}</div>
                    <div className="line-clamp-2">{out.caption}</div>
                    <div className="text-xs text-muted-foreground">{out.cta}</div>
                    <div className="text-xs text-muted-foreground">{out.hashtags.join(', ')}</div>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => handleRepostClick(gen, out)}
                      aria-label="Repost this caption"
                    >
                      Repost
                    </Button>
                  </div>
                ))}
              </div>
              {/* Actions: Favorite */}
              <div className={`flex gap-2 mt-2 ${viewMode === 'list' ? 'ml-auto' : ''}`}>
                <Button 
                  size="sm" 
                  variant={gen.isFavorite ? 'default' : 'outline'} 
                  onClick={() => handleFavoriteToggle(gen)}
                  aria-label={gen.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`mr-1 h-4 w-4 ${gen.isFavorite ? 'fill-yellow-400' : ''}`} />
                  {gen.isFavorite ? 'Unfavorite' : 'Favorite'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          onSave={handleSaveProfile}
        />

        <Dialog open={repostModalOpen} onOpenChange={setRepostModalOpen}>
          <DialogContent className="max-w-3xl w-full">
            <DialogTitle>Repost Caption</DialogTitle>
            {!mediaChoice && (
              <>
                <DialogDescription>
                  Would you like to repost this caption?
                </DialogDescription>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => setMediaChoice('media')}>Add Media</Button>
                  <Button onClick={() => setMediaChoice('text')}>Text Only</Button>
                </div>
              </>
            )}
            {mediaChoice === 'media' && (
              <>
                <DialogDescription>
                  Upload an image or video to go with your caption.
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
                {mediaFile && (
                  <div className="mt-4 flex items-center gap-2">
                    {(mediaFile.type.startsWith('image')) && (
                      <>
                       {/*} <Switch checked={overlayEnabled} onCheckedChange={setOverlayEnabled} />
                        <span className="text-sm">Add Text Overlay</span>*/}
                      </>
                    )}
                    {/*{(mediaFile.type.startsWith('video')) && (
                      <span className="text-sm font-medium">Caption will be shown over video</span>
                    )}*/}
                  </div>
                )}
              </>
            )}
            {mediaChoice === 'text' && (
              <>
                <DialogDescription>
                  Continue with caption text only.
                </DialogDescription>
                {/* Removed Continue to Preview button from here */}
                 {/*
                 <div className="flex gap-2 mt-4 sticky bottom-0 bg-background py-2 z-10">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (selectedCaption) goToPreview(selectedCaption, null);
                    }}
                  >
                    <span className="text-base font-semibold">Continue to Preview</span>
                  </Button>
                </div>
                 */}
              </>
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
                    <span className="text-base font-semibold">Continue to Preview</span>
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