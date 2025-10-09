/**
 * InsufficientCreditsDialog.tsx
 * 
 * A promotional dialog shown when users don't have enough credits
 * for image generation/editing operations.
 * 
 * Features:
 * - Shows current vs required credits
 * - Promotes 5-day free trial
 * - Offers 50% discount with code "PERFECTSTART"
 * - Direct link to Monthly pricing page
 * - Fully localized (EN/FR)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Gift, Clock, CreditCard, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InsufficientCreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  creditsNeeded: number;
  creditsAvailable: number;
  featureName: string; // e.g., "Image Editing" or "Image Generation"
}

export const InsufficientCreditsDialog: React.FC<InsufficientCreditsDialogProps> = ({
  isOpen,
  onClose,
  creditsNeeded,
  creditsAvailable,
  featureName,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [codeCopied, setCodeCopied] = React.useState(false);
  const discountCode = t('insufficientCreditsDialog.discountCode');

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCodeCopied(true);
      toast({
        title: t('insufficientCreditsDialog.toast.codeCopied'),
        description: t('insufficientCreditsDialog.toast.codeCopiedDescription'),
      });
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleStartTrial = () => {
    onClose();
    // Navigate to pricing page with Monthly tab selected and scroll to Basic plan
    navigate('/pricing?billing=monthly&highlight=basic');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col gap-0 p-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-purple-500/20">
        {/* Fixed Header */}
        <DialogHeader className="px-4 pt-6 pb-2 sm:px-6 flex-shrink-0">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-purple-500/10">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl text-center text-white px-2">
            {t('insufficientCreditsDialog.title', { featureName })}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-300 text-sm sm:text-base px-2">
            {t('insufficientCreditsDialog.description', { creditsNeeded, creditsAvailable })
              .split('<strong>')
              .map((part, i) => {
                if (i === 0) return part;
                const [bolded, ...rest] = part.split('</strong>');
                return (
                  <React.Fragment key={i}>
                    <span className={i === 1 ? "font-bold text-purple-400" : "font-bold text-red-400"}>
                      {bolded}
                    </span>
                    {rest.join('</strong>')}
                  </React.Fragment>
                );
              })}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div 
          className="overflow-y-auto flex-1 px-4 sm:px-6 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-slate-800/30"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(168, 85, 247, 0.5) rgba(30, 41, 59, 0.3)'
          }}
        >
          {/* Special Offer Section */}
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          {/* Free Trial Badge */}
          <div className="flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-purple-300">
              {t('insufficientCreditsDialog.specialOffer')}
            </span>
          </div>

          {/* Offer Details */}
          <div className="space-y-2.5 sm:space-y-3">
            {/* Free Trial */}
            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-slate-800/50">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-white">{t('insufficientCreditsDialog.freeTrial.title')}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                  {t('insufficientCreditsDialog.freeTrial.description')}
                </p>
              </div>
            </div>

            {/* 50% Discount */}
            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-slate-800/50">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-white">{t('insufficientCreditsDialog.discount.title')}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                  {t('insufficientCreditsDialog.discount.description')}
                </p>
              </div>
            </div>

            {/* Discount Code */}
            <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-2 text-center">{t('insufficientCreditsDialog.codePrompt')}</p>
              <div className="flex items-center justify-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="text-base sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2 font-mono font-bold bg-white/10 text-purple-300 border-purple-400/50"
                >
                  {discountCode}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyCode}
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-8 w-8 p-0"
                >
                  {codeCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* What You Get */}
          <div className="pt-2 pb-3 sm:pb-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">{t('insufficientCreditsDialog.planIncludes')}</p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-green-400 text-sm">✓</span>
                <span className="flex-1">{t('insufficientCreditsDialog.features.credits')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400 text-sm">✓</span>
                <span className="flex-1">{t('insufficientCreditsDialog.features.imageGeneration')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400 text-sm">✓</span>
                <span className="flex-1">{t('insufficientCreditsDialog.features.blogCaption')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400 text-sm">✓</span>
                <span className="flex-1">{t('insufficientCreditsDialog.features.seo')}</span>
              </li>
            </ul>
          </div>
        </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4 border-t border-slate-700/50 bg-gradient-to-t from-slate-900 to-transparent">
          <Button
            onClick={handleStartTrial}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50 h-12 sm:h-14 text-base sm:text-lg"
            size="lg"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {t('insufficientCreditsDialog.buttons.startTrial')}
          </Button>

          {/* Fine Print */}
          <p className="text-[10px] sm:text-xs text-center text-gray-400 mt-3 sm:mt-4 leading-relaxed">
            {t('insufficientCreditsDialog.finePrint')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
