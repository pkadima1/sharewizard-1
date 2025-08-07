import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Download, 
  Share2, 
  Heart, 
  MoreVertical,
  Calendar,
  Sparkles,
  FileText,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { Generation } from '@/hooks/useUserGenerations';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { stripMarkdownFormatting } from '@/utils/textFormatters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";

interface CaptionContentManagerProps {
  generations: Generation[];
  loading: boolean;
  error?: string | null;
}

const CaptionContentManager: React.FC<CaptionContentManagerProps> = ({
  generations,
  loading,
  error
}) => {
  const { toast } = useToast();
  const { t } = useAppTranslation('dashboard');
  const { currentLanguage } = useLanguage();
  const { trackEvent } = useAnalytics();
  const [selectedCaption, setSelectedCaption] = useState<{gen: Generation, captionIndex: number} | null>(null);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [toneFilter, setToneFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Variation state - tracks current variation index for each generation
  const [currentVariations, setCurrentVariations] = useState<Record<string, number>>({});

  // Helper function to get current variation index for a generation
  const getCurrentVariationIndex = (generationId: string) => {
    return currentVariations[generationId] || 0;
  };

  // Helper function to change variation
  const changeVariation = (generationId: string, direction: 'next' | 'prev', maxVariations: number) => {
    const currentIndex = getCurrentVariationIndex(generationId);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = currentIndex >= maxVariations - 1 ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex <= 0 ? maxVariations - 1 : currentIndex - 1;
    }
    
    setCurrentVariations(prev => ({
      ...prev,
      [generationId]: newIndex
    }));

    // Track variation browsing
    trackEvent('caption_variation_browse', {
      generation_id: generationId,
      variation_index: newIndex,
      direction,
      source: 'dashboard_captions_tab'
    });
  };

  // Filter generations to only show caption generations (they have output array with captions)
  const captionGenerations = generations.filter(gen => 
    gen.output && Array.isArray(gen.output) && gen.output.length > 0 &&
    gen.output[0].caption && gen.output[0].title // Ensure it's caption data structure
  );

  // Get unique platforms and tones for filter options
  const allPlatforms = useMemo(() => {
    const platforms = captionGenerations.map(gen => gen.input.platform);
    return [...new Set(platforms)];
  }, [captionGenerations]);

  const allTones = useMemo(() => {
    const tones = captionGenerations.map(gen => gen.input.tone);
    return [...new Set(tones)];
  }, [captionGenerations]);

  // Apply filters and sorting
  const filteredGenerations = useMemo(() => {
    let filtered = [...captionGenerations];

    // Apply platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(gen => gen.input.platform === platformFilter);
    }

    // Apply tone filter
    if (toneFilter !== 'all') {
      filtered = filtered.filter(gen => gen.input.tone === toneFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(gen => {
        if (!gen.createdAt) return false;
        const genDate = gen.createdAt.toDate ? gen.createdAt.toDate() : new Date(gen.createdAt);
        return genDate.toDateString() === filterDate.toDateString();
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      
      if (sortOrder === 'desc') {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });

    return filtered;
  }, [captionGenerations, platformFilter, toneFilter, dateFilter, sortOrder]);

  const copyToClipboard = async (generation: Generation, captionIndex?: number) => {
    const variationIndex = captionIndex !== undefined ? captionIndex : getCurrentVariationIndex(generation.id);
    if (!generation.output || !generation.output[variationIndex]) return;
    
    const caption = generation.output[variationIndex];
    const formattedCaption = `${stripMarkdownFormatting(caption.title)}

${stripMarkdownFormatting(caption.caption)}

${stripMarkdownFormatting(caption.cta)}

${caption.hashtags.map(tag => `#${stripMarkdownFormatting(tag)}`).join(' ')}`;

    try {
      await navigator.clipboard.writeText(formattedCaption);
      
      // Track successful copy
      trackEvent('caption_copy', {
        platform: generation.input.platform,
        tone: generation.input.tone,
        niche: generation.input.niche,
        caption_length: formattedCaption.length,
        variation_index: variationIndex,
        source: 'dashboard_captions_tab'
      });
      
      toast({
        title: t('captions.copied'),
        description: t('captions.copiedDesc'),
      });
    } catch (error) {
      console.error('Failed to copy caption:', error);
      
      // Track copy failure
      trackEvent('caption_copy_failed', {
        platform: generation.input.platform,
        error: 'clipboard_failed',
        variation_index: variationIndex,
        source: 'dashboard_captions_tab'
      });
      
      toast({
        title: t('captions.copyError'),
        description: t('captions.copyErrorDesc'),
        variant: "destructive",
      });
    }
  };

  const downloadCaption = (generation: Generation, captionIndex?: number) => {
    const variationIndex = captionIndex !== undefined ? captionIndex : getCurrentVariationIndex(generation.id);
    if (!generation.output || !generation.output[variationIndex]) return;
    
    const caption = generation.output[variationIndex];
    const formattedCaption = `${caption.title}

${caption.caption}

${caption.cta}

${caption.hashtags.map(tag => `#${tag}`).join(' ')}

Generated with EngagePerfect
Platform: ${generation.input.platform}
Tone: ${generation.input.tone}
Niche: ${generation.input.niche}
Variation: ${variationIndex + 1} of ${generation.output.length}`;

    const blob = new Blob([formattedCaption], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caption-${caption.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-v${variationIndex + 1}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Track successful download
    trackEvent('caption_download', {
      platform: generation.input.platform,
      tone: generation.input.tone,
      niche: generation.input.niche,
      caption_length: formattedCaption.length,
      variation_index: variationIndex,
      source: 'dashboard_captions_tab'
    });

    toast({
      title: t('captions.downloaded'),
      description: t('captions.downloadedDesc'),
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const locale = currentLanguage === 'fr' ? fr : enUS;
    
    return formatDistanceToNow(date, { 
      addSuffix: true,
      locale
    });
  };

  const getTranslatedPlatform = (platform: string) => {
    const platformKey = platform.toLowerCase();
    return t(`captions.platforms.${platformKey}`, platform);
  };

  const getTranslatedTone = (tone: string) => {
    const toneKey = tone.toLowerCase();
    return t(`captions.tones.${toneKey}`, tone);
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'instagram': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'twitter': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'linkedin': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'facebook': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'tiktok': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      'youtube': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[platform.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const getToneColor = (tone: string) => {
    const colors: Record<string, string> = {
      'professional': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'casual': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'humorous': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'inspirational': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'persuasive': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return colors[tone.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            {t('captions.loading')}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-red-500 opacity-50" />
        <h3 className="text-lg font-medium mb-2 text-red-600 dark:text-red-400">
          {t('captions.error')}
        </h3>
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (captionGenerations.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
        <h3 className="text-lg font-medium mb-2 text-gray-600 dark:text-gray-400">
          {t('captions.noCaptons')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {t('captions.noCaptionsDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? t('content.hideFilters') : t('content.filterOptions')}
          </Button>
          
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredGenerations.length} {t('captions.variations')}
          </span>
        </div>
      </div>

      {/* Filters Section */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">{t('content.filterOptions')}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('content.allPlatforms')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('content.allPlatforms')}</SelectItem>
                    {allPlatforms.map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {getTranslatedPlatform(platform)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={toneFilter} onValueChange={setToneFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('captions.allTones')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('captions.allTones')}</SelectItem>
                    {allTones.map(tone => (
                      <SelectItem key={tone} value={tone}>
                        {getTranslatedTone(tone)}
                      </SelectItem>
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
                
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'desc' | 'asc')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('content.sort')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">{t('content.newestFirst')}</SelectItem>
                    <SelectItem value="asc">{t('content.oldestFirst')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      {filteredGenerations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium mb-2 text-gray-600 dark:text-gray-400">
            {t('captions.noResults')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {t('captions.noResultsDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGenerations.map((generation) => (
          <Card key={generation.id} className="p-4 hover:shadow-md transition-all duration-200">
            <div className="space-y-4">
              {/* Header with platform and date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getPlatformColor(generation.input.platform)}>
                    {getTranslatedPlatform(generation.input.platform)}
                  </Badge>
                  <Badge className={getToneColor(generation.input.tone)}>
                    {getTranslatedTone(generation.input.tone)}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copyToClipboard(generation)}>
                      <Copy className="h-4 w-4 mr-2" />
                      {t('captions.copy')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadCaption(generation)}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('captions.download')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Niche/Topic */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{t('captions.niche')}: </span>
                {generation.input.niche}
              </div>

              {/* Caption preview with variation navigation */}
              {generation.output && generation.output.length > 0 && (() => {
                const currentIndex = getCurrentVariationIndex(generation.id);
                const currentCaption = generation.output[currentIndex];
                const hasMultipleVariations = generation.output.length > 1;
                
                return (
                  <div className="space-y-2">
                    {/* Variation navigation header */}
                    {hasMultipleVariations && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('captions.variation')} {currentIndex + 1} {t('captions.of')} {generation.output.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => changeVariation(generation.id, 'prev', generation.output.length)}
                            className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            disabled={generation.output.length <= 1}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => changeVariation(generation.id, 'next', generation.output.length)}
                            className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            disabled={generation.output.length <= 1}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Caption content */}
                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                      {stripMarkdownFormatting(currentCaption.title)}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {stripMarkdownFormatting(currentCaption.caption)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {currentCaption.hashtags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                      {currentCaption.hashtags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{currentCaption.hashtags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Footer with actions and metadata */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(generation.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generation)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {generation.output && generation.output.length > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {generation.output.length} {t('captions.variations')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
};

export default CaptionContentManager;
