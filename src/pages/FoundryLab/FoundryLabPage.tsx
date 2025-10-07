/**
 * Foundry Lab Page - Visual AI Tools Hub
 * 
 * A production-ready surface for visual AI tools:
 * - Edit: Multi-prompt image editing (Gemini 2.5 Flash Image)
 * - Image: AI image generation (Imagen 4)
 * - Motion: AI video generation (Veo 3)
 * 
 * Model names are abstracted and only shown in tooltips
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Edit3, Image as ImageIcon, Film, Info } from 'lucide-react';
import { FoundryEditTab } from './FoundryEditTab';
import { FoundryImageTab } from './FoundryImageTab';
import { FoundryMotionTab } from './FoundryMotionTab';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalizedPath } from '@/utils/routeUtils';
import { usePageAnalytics } from '@/components/analytics/PageAnalytics';
import { trackEvent } from '@/utils/analytics';
import Navbar from '@/components/Navbar';

export const FoundryLabPage: React.FC = () => {
  const { t } = useTranslation('foundry');
  const { currentUser } = useAuth();
  const { getLocalizedPath } = useLocalizedPath();
  const [activeTab, setActiveTab] = useState('edit');

  // Analytics
  usePageAnalytics('Foundry Lab - EngagePerfect');

  // Track tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    trackEvent('foundry_tab_change', { tab });
  };

  return (
    <>
      <Helmet>
        <title>{t('title')} - EngagePerfect</title>
        <meta name="description" content={t('description')} />
        <meta name="keywords" content="AI image editing, AI image generation, AI video generation, Gemini, Imagen, Veo" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Back Button */}
          <div className="mb-6">
            <Link to={getLocalizedPath('dashboard')}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('nav.backToDashboard')}
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-3">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground">{t('tagline')}</p>
          </div>

          {/* Tabs */}
          <TooltipProvider>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                {/* Edit Tab */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="edit" className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('tabs.edit')}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5" />
                      <p className="text-xs max-w-xs">{t('tooltips.editPoweredBy')}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Image Tab */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('tabs.image')}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5" />
                      <p className="text-xs max-w-xs">{t('tooltips.imagePoweredBy')}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Motion Tab */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="motion" className="flex items-center gap-2">
                      <Film className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('tabs.motion')}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5" />
                      <p className="text-xs max-w-xs">{t('tooltips.motionPoweredBy')}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TabsList>

              {/* Tab Content */}
              <TabsContent value="edit" className="mt-0">
                <FoundryEditTab />
              </TabsContent>

              <TabsContent value="image" className="mt-0">
                <FoundryImageTab />
              </TabsContent>

              <TabsContent value="motion" className="mt-0">
                <FoundryMotionTab />
              </TabsContent>
            </Tabs>
          </TooltipProvider>
        </div>
      </div>
    </>
  );
};

export default FoundryLabPage;
