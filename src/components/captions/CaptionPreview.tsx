import React, { forwardRef } from 'react';
import { GeneratedCaption } from '@/services/openaiService';
import { MediaType } from '@/types/mediaTypes';
import { stripMarkdownFormatting } from '@/utils/textFormatters';

interface CaptionPreviewProps {
  selectedMedia: File | null;
  previewUrl: string | null;
  caption: GeneratedCaption | null;
  captionOverlayMode: 'overlay' | 'below';
  mediaType: MediaType;
}

const CaptionPreview = forwardRef<HTMLDivElement, CaptionPreviewProps>(({
  selectedMedia,
  previewUrl,
  caption,
  captionOverlayMode,
  mediaType
}, ref) => {
  return (
    <div ref={ref} className="caption-preview-container">
      <div id="sharable-content" className={mediaType === 'text-only' ? 'p-6' : ''}>
        {mediaType !== 'text-only' && previewUrl && (
          <div className="relative">            {mediaType === 'image' ? (
              <div className="w-full relative">
                <div className="image-container max-h-[600px] overflow-hidden flex justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-[600px] w-auto h-auto object-contain" 
                    crossOrigin="anonymous"
                    style={{ objectFit: 'contain' }}
                  />
                </div>                {captionOverlayMode === 'overlay' && caption && (                  <div className="absolute bottom-0 left-0 right-0 p-5 pt-12 backdrop-blur-[2px]" style={{ 
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.7) 30%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0.0) 100%)'
                  }}>
                    <p className="text-white text-xl font-bold mb-2 drop-shadow-md">{stripMarkdownFormatting(caption.title)}</p>
                    <p className="text-white text-base mb-2 drop-shadow-md">{stripMarkdownFormatting(caption.caption)}</p>
                    {caption.cta && (
                      <p className="text-gray-200 text-sm italic mb-2 drop-shadow-md">{stripMarkdownFormatting(caption.cta)}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {caption.hashtags.map((hashtag, idx) => (
                        <span key={idx} className="text-blue-300 dark:text-blue-400 text-sm font-medium drop-shadow-md">
                          #{stripMarkdownFormatting(hashtag)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>            ) : (              <div className="aspect-video w-full relative rounded-md overflow-hidden shadow-md">
                <video 
                  src={previewUrl} 
                  className="w-full h-full object-cover bg-gray-900" 
                  controls
                  crossOrigin="anonymous"
                  playsInline
                  preload="auto"
                />{/* For videos, always show modern caption overlay with left-aligned text */}
                {caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-5 pt-12 backdrop-blur-[2px]" style={{ 
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.6) 30%, transparent 100%)'
                  }}>
                    <p className="text-white text-xl font-bold mb-2 drop-shadow-md">{stripMarkdownFormatting(caption.title)}</p>
                    <p className="text-white text-base mb-2 drop-shadow-md">{stripMarkdownFormatting(caption.caption)}</p>
                    {caption.cta && (
                      <p className="text-gray-200 text-sm italic mb-2 drop-shadow-md">{stripMarkdownFormatting(caption.cta)}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {caption.hashtags.map((hashtag, idx) => (
                        <span key={idx} className="text-blue-400 text-sm font-medium drop-shadow-md">
                          #{stripMarkdownFormatting(hashtag)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {caption && (captionOverlayMode === 'below' || mediaType === 'text-only') && (              <div className={`space-y-3 p-6 ${mediaType !== 'text-only' && captionOverlayMode === 'below' ? 'bg-white dark:bg-blue-950 text-gray-900 dark:text-white' : ''}`}>
            <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-50">{stripMarkdownFormatting(caption.title)}</h3>
            <p className="whitespace-pre-line text-gray-800 dark:text-gray-100">{stripMarkdownFormatting(caption.caption)}</p>
            <p className="italic text-gray-600 dark:text-gray-300 mt-3">{stripMarkdownFormatting(caption.cta)}</p>
            <div className="flex flex-wrap gap-1 pt-2">
              {caption.hashtags.map((hashtag, idx) => (
                <span key={idx} className="text-blue-600 dark:text-blue-400">
                  #{stripMarkdownFormatting(hashtag)}
                </span>
              ))}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-3 mt-3 border-t border-gray-200 dark:border-gray-800">
              Created with EngagePerfect • https://engageperfect.com
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CaptionPreview.displayName = 'CaptionPreview';

export default CaptionPreview;
