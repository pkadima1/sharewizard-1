import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Type } from 'lucide-react';
import { useCaptionGeneration } from '@/hooks/useCaptionGeneration';
import useMediaType from '@/hooks/useMediaType';
import CaptionsList from './captions/CaptionsList';
import CaptionEditor from './captions/CaptionEditor';
import CaptionSharingActions from './captions/CaptionSharingActions';
import CaptionPreview from './captions/CaptionPreview';
import ErrorDisplay from './captions/ErrorDisplay';
import GenerationLoading from './captions/GenerationLoading';
import EmptyState from './captions/EmptyState';
import { TextOverlayEditor } from './TextOverlayEditor';
import { DraggableTextOverlay } from './DraggableTextOverlay';

interface GeneratedCaptionsProps {
  selectedMedia: File | null;
  previewUrl: string | null;
  selectedNiche: string;
  selectedPlatform: string;
  selectedGoal: string;
  selectedTone: string;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  isTextOnly?: boolean;
  captionOverlayMode?: 'overlay' | 'below';
  onCaptionOverlayModeChange?: (mode: 'overlay' | 'below') => void;
  postIdea?: string;
}

const GeneratedCaptions: React.FC<GeneratedCaptionsProps> = ({
  selectedMedia,
  previewUrl,
  selectedNiche,
  selectedPlatform,
  selectedGoal,
  selectedTone,
  isGenerating,
  setIsGenerating,
  isTextOnly = false,
  captionOverlayMode = 'below',
  onCaptionOverlayModeChange,
  postIdea
}) => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Custom text overlay state
  const [showCustomTextEditor, setShowCustomTextEditor] = useState(false);
  const [customTextOverlay, setCustomTextOverlay] = useState({
    text: '',
    position: { x: 50, y: 50 },
    color: '#ffffff',
    size: 24,
    rotation: 0
  });
  const [showCaptionWithCustomText, setShowCaptionWithCustomText] = useState(true);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  
  const mediaType = useMediaType(isTextOnly, selectedMedia);
  
  // Use our custom hook for caption generation
  const {
    captions,
    setCaptions,
    selectedCaption,
    setSelectedCaption,
    error,
    requestsRemaining
  } = useCaptionGeneration({
    selectedNiche,
    selectedPlatform,
    selectedGoal,
    selectedTone,
    isGenerating,
    setIsGenerating,
    postIdea
  });

  const handleRegenerateClick = () => {
    setCaptions([]);
    setIsGenerating(true);
  };

  // Custom text overlay handlers
  const handleCustomTextChange = (text: string) => {
    setCustomTextOverlay(prev => ({ ...prev, text }));
  };

  const handleCustomTextColorChange = (color: string) => {
    setCustomTextOverlay(prev => ({ ...prev, color }));
  };

  const handleCustomTextSizeChange = (size: number) => {
    setCustomTextOverlay(prev => ({ ...prev, size }));
  };

  const handleCustomTextRotationChange = (rotation: number) => {
    setCustomTextOverlay(prev => ({ ...prev, rotation }));
  };

  const handleCustomTextPositionChange = (position: { x: number; y: number }) => {
    setCustomTextOverlay(prev => ({ ...prev, position }));
  };

  const handleAddCustomText = () => {
    setShowCustomTextEditor(true);
  };

  const handleCloseCustomTextEditor = () => {
    setShowCustomTextEditor(false);
  };

  // Handle error state
  if (error) {
    return <ErrorDisplay error={error} onTryAgainClick={handleRegenerateClick} />;
  }

  // Handle loading state
  if (isGenerating) {
    return (
      <GenerationLoading 
        selectedMedia={selectedMedia}
        previewUrl={previewUrl}
        isTextOnly={isTextOnly}
        selectedPlatform={selectedPlatform}
        selectedTone={selectedTone}
        selectedNiche={selectedNiche}
      />
    );
  }

  // Handle empty state
  if (captions.length === 0 && !isGenerating) {
    return <EmptyState onGenerateClick={handleRegenerateClick} />;
  }
  
  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-adaptive-primary">Choose Your Caption</h2>
        <div className="flex items-center gap-4">
          {requestsRemaining !== null && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {requestsRemaining} requests remaining
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRegenerateClick}
          >
            Regenerate
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/5">
          <CaptionsList 
            captions={captions}
            selectedCaption={selectedCaption}
            setSelectedCaption={setSelectedCaption}
          />
          
          {/* Custom Text Button - Fixed to work with both media and text-only modes */}
          {(selectedMedia || isTextOnly) && (
            <div className="mt-4">
              <Button
                onClick={handleAddCustomText}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-3"
              >
                <Type className="h-4 w-4" />
                Add Custom Text
              </Button>
            </div>
          )}
        </div>
        
        <div className="lg:w-3/5">
          <div className="sticky top-6 space-y-4">
            {/* Preview section with custom text overlay */}
            {captions.length > 0 && selectedCaption >= 0 && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">Preview</h3>
                </div>
                <div ref={mediaContainerRef} className="relative">
                  <CaptionPreview 
                    ref={previewRef}
                    selectedMedia={selectedMedia}
                    previewUrl={previewUrl}
                    caption={showCaptionWithCustomText ? captions[selectedCaption] : null}
                    captionOverlayMode={captionOverlayMode}
                    mediaType={mediaType}
                  />
                  
                  {/* Custom text overlay - Fixed to work with text-only mode */}
                  {customTextOverlay.text && (
                    <DraggableTextOverlay
                      text={customTextOverlay.text}
                      position={customTextOverlay.position}
                      color={customTextOverlay.color}
                      size={customTextOverlay.size}
                      rotation={customTextOverlay.rotation}
                      onPositionChange={handleCustomTextPositionChange}
                      containerRef={mediaContainerRef}
                    />
                  )}
                </div>
              </div>
            )}
            
            <CaptionEditor
              selectedMedia={selectedMedia}
              previewUrl={previewUrl}
              captions={captions}
              selectedCaption={selectedCaption}
              setCaptions={setCaptions}
              isTextOnly={isTextOnly}
              captionOverlayMode={captionOverlayMode}
              onCaptionOverlayModeChange={onCaptionOverlayModeChange}
              onShareClick={() => {
                if (previewRef.current) {
                  setIsSharing(true);
                } else {
                  console.error("Preview ref is null");
                }
              }}
              onDownloadClick={() => {
                if (previewRef.current) {
                  setIsDownloading(true);
                } else {
                  console.error("Preview ref is null");
                }
              }}
              isSharing={isSharing}
              isDownloading={isDownloading}
              mediaType={mediaType}
            />

            {/* Custom Text Editor - Fixed to work with text-only mode */}
            {showCustomTextEditor && (
              <div className="bg-gray-50 dark:bg-gray-800/90 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <TextOverlayEditor
                  onTextChange={handleCustomTextChange}
                  onColorChange={handleCustomTextColorChange}
                  onSizeChange={handleCustomTextSizeChange}
                  onRotationChange={handleCustomTextRotationChange}
                  onClose={handleCloseCustomTextEditor}
                  initialText={customTextOverlay.text}
                  initialColor={customTextOverlay.color}
                  initialSize={customTextOverlay.size}
                  initialRotation={customTextOverlay.rotation}
                />
                
                {/* Caption visibility toggle when custom text is active */}
                {customTextOverlay.text && !isTextOnly && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show generated caption with custom text
                    </span>
                    <Switch
                      checked={showCaptionWithCustomText}
                      onCheckedChange={setShowCaptionWithCustomText}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                )}
              </div>
            )}
            
            <CaptionSharingActions
              previewRef={previewRef}
              captions={captions}
              selectedCaption={selectedCaption}
              isEditing={isEditing}
              isSharing={isSharing}
              setIsSharing={setIsSharing}
              isDownloading={isDownloading}
              setIsDownloading={setIsDownloading}
              selectedPlatform={selectedPlatform}
              previewUrl={previewUrl}
              mediaType={mediaType}
              captionOverlayMode={captionOverlayMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedCaptions;
