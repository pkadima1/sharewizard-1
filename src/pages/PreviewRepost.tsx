import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/contexts/AuthContext';
import { Card } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Copy, Edit, Save, X } from 'lucide-react';
import { sharePreview, downloadPreview, createCaptionedVideo } from '../utils/sharingUtils';
import { MediaType } from '@/types/mediaTypes';
import { DraggableTextOverlay } from '@/components/DraggableTextOverlay';
import { TextOverlayEditor } from '@/components/TextOverlayEditor';

const PreviewRepost = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { caption: initialCaption, gen, mediaFile } = location.state || {};
    const [currentCaption, setCurrentCaption] = useState(initialCaption);

  const { currentUser } = useAuth();

  // Initialize showCaptionOverlay to true if mediaFile is an image or video
  const [showCaptionOverlay, setShowCaptionOverlay] = useState(mediaFile && (mediaFile.type.startsWith('image') || mediaFile.type.startsWith('video')));
  const [isEditingText, setIsEditingText] = useState(false);

  // States for custom text overlay
  const [customTextOverlay, setCustomTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 25 }); // Default position
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(36);
  const [textRotation, setTextRotation] = useState(0);
  const [showTextOverlayEditor, setShowTextOverlayEditor] = useState(false);
    // Extract text overlay data from file if it exists
  useEffect(() => {
    if (mediaFile) {
      console.log('Checking for text overlay data in mediaFile:', mediaFile);
      
      // Try to get text overlay data directly from the file
      // @ts-expect-error - custom property for text overlays
      const textOverlayData = mediaFile.textOverlayData;
      
      if (textOverlayData) {
        console.log('Found text overlay data directly on file:', textOverlayData);
        setCustomTextOverlay(textOverlayData.text || '');
        setTextPosition(textOverlayData.position || { x: 50, y: 25 });
        setTextColor(textOverlayData.color || '#ffffff');
        setTextSize(textOverlayData.size || 36);
        setTextRotation(textOverlayData.rotation || 0);
      } else {
        console.log('No direct text overlay data found on file, checking cache...');
        
        // Check if the file is in the mediaFileCache
        if (typeof window !== 'undefined' && window.mediaFileCache) {
          // Try to find a matching file in the cache
          const cacheKeys = Object.keys(window.mediaFileCache || {});
          for (const key of cacheKeys) {
            // @ts-expect-error - custom property
            const cachedFile = window.mediaFileCache[key];
            
            if (cachedFile && 
                cachedFile.name === mediaFile.name && 
                cachedFile.size === mediaFile.size) {
              // Found a matching file in the cache
              // @ts-expect-error - custom property
              const cachedOverlay = cachedFile.textOverlayData;
              if (cachedOverlay) {
                console.log('Found text overlay data in cache:', cachedOverlay);
                setCustomTextOverlay(cachedOverlay.text || '');
                setTextPosition(cachedOverlay.position || { x: 50, y: 25 });
                setTextColor(cachedOverlay.color || '#ffffff');
                setTextSize(cachedOverlay.size || 36);
                setTextRotation(cachedOverlay.rotation || 0);
                break;
              }
            }
          }
        }
      }
    }
  }, [mediaFile]);

  const previewRef = useRef<HTMLDivElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  const [processedVideoFile, setProcessedVideoFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);  // Auto-process video with caption when video is added or caption changes
  useEffect(() => {
    if (mediaFile && mediaFile.type.startsWith('video')) {
      setProcessing(true);
      setProcessedVideoFile(null);
      setTimeout(async () => {
        const video = document.querySelector('#preview-video');
        if (video) {
          try {
            // Add text overlay data to the video element
            if (customTextOverlay) {
              // Add text overlay data to the video element for processing
              // @ts-expect-error - custom property for text overlay
              (video as HTMLVideoElement).textOverlayData = {
                text: customTextOverlay,
                position: textPosition,
                color: textColor,
                size: textSize,
                rotation: textRotation
              };
              
              // Also add the original mediaFile as a reference to enable fallback retrieval
              // @ts-expect-error - custom property for reference
              (video as HTMLVideoElement).mediaFile = mediaFile;
              
              console.log('Added text overlay data to video element:', (video as HTMLVideoElement & { textOverlayData?: any }).textOverlayData);
              
              // Set data attribute as an additional backup for text overlay data
              try {
                const textOverlayJson = JSON.stringify({
                  text: customTextOverlay,
                  position: textPosition,
                  color: textColor,
                  size: textSize,
                  rotation: textRotation
                });
                (video as HTMLVideoElement).setAttribute('data-text-overlay', textOverlayJson);
              } catch (e) {
                console.warn('Failed to set data-text-overlay attribute:', e);
              }
            }
            
            const captionedBlob = await createCaptionedVideo(video as HTMLVideoElement, currentCaption, 'modern');
            const file = new File([captionedBlob], `video-${Date.now()}.mp4`, { type: 'video/mp4' });
            
            // Store text overlay data in the processed file as well
            if (customTextOverlay) {
              // @ts-expect-error - custom property for text overlay
              file.textOverlayData = {
                text: customTextOverlay,
                position: textPosition,
                color: textColor,
                size: textSize,
                rotation: textRotation
              };
              
              // Store processed file in mediaFileCache for better retrieval
              if (typeof window !== 'undefined' && window.mediaFileCache) {
                const blobUrl = URL.createObjectURL(file);
                // @ts-ignore - accessing our custom property
                window.mediaFileCache[blobUrl] = file;
                console.log('Stored processed video in mediaFileCache:', blobUrl);
              }
            }
            
            setProcessedVideoFile(file);
          } catch (err) {
            console.error('Failed to process video:', err);
            toast.error('Failed to process video with caption.');
          } finally {
            setProcessing(false);
          }
        } else {
          setProcessing(false);
        }
      }, 500); // Give time for video to render
    }
  }, [mediaFile, currentCaption, customTextOverlay, textPosition, textColor, textSize, textRotation]);

  if (!currentCaption || !gen) {
    return <div className="p-4">Invalid preview data.</div>;
  }
  // Helper to render caption text on image for download/sharing
  const renderImageWithOverlay = async () => {
    return new Promise<Blob | null>((resolve) => {
      if (!mediaFile || !mediaFile.type.startsWith('image')) return resolve(mediaFile);
      
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        
        // Draw the base image
        ctx.drawImage(img, 0, 0);
        
        // Draw custom text overlay if present
        if (customTextOverlay) {
          try {
            const textData = {
              text: customTextOverlay,
              position: textPosition,
              color: textColor,
              size: textSize,
              rotation: textRotation
            };
            
            // Import the function from our utilities
            // @ts-ignore - function might be imported dynamically
            if (typeof window.drawCustomTextOverlay === 'function') {
              // @ts-ignore - using global function
              window.drawCustomTextOverlay(ctx, textData, canvas.width, canvas.height);
            } else {
              // Fallback if the function isn't available globally
              // Basic implementation
              ctx.save();
              const x = (textPosition.x / 100) * canvas.width;
              const y = (textPosition.y / 100) * canvas.height;
              ctx.translate(x, y);
              ctx.rotate((textRotation * Math.PI) / 180);
              ctx.font = `${textSize}px Arial`;
              ctx.fillStyle = textColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.shadowColor = 'rgba(0,0,0,0.7)';
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 2;
              ctx.shadowOffsetY = 2;
              ctx.fillText(customTextOverlay, 0, 0);
              ctx.restore();
            }
          } catch (err) {
            console.error('Error drawing custom text overlay:', err);
          }
        }
        
        // Draw caption if showCaptionOverlay is true
        if (showCaptionOverlay) {
          const text = currentCaption.caption;
          
          const maxWidth = canvas.width * 0.8;
          const lineHeight = Math.floor(canvas.height / 20);
          let y = canvas.height * 0.85;

          ctx.font = `${lineHeight * 1.2}px sans-serif`;
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 8;

          const words = text.split(' ');
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
              const word = words[i];
              const width = ctx.measureText(currentLine + ' ' + word).width;
              if (width < maxWidth) {
                  currentLine += ' ' + word;
              } else {
                  ctx.fillText(currentLine, canvas.width / 2, y);
                  currentLine = word;
                  y += lineHeight;
              }
          }
          ctx.fillText(currentLine, canvas.width / 2, y);
        }

        canvas.toBlob(blob => {
          if (blob) {
            // Create a File object from the blob to preserve text overlay data
            const processedFile = new File([blob], mediaFile.name, { 
              type: mediaFile.type, 
              lastModified: Date.now() 
            });
            
            // Store text overlay data in the processed file for future reference
            if (customTextOverlay) {
              // @ts-ignore - custom property for text overlay
              processedFile.textOverlayData = {
                text: customTextOverlay,
                position: textPosition,
                color: textColor,
                size: textSize,
                rotation: textRotation
              };
              
              // Store in mediaFileCache for better retrieval
              if (typeof window !== 'undefined' && window.mediaFileCache) {
                const blobUrl = URL.createObjectURL(processedFile);
                // @ts-ignore - accessing our custom property
                window.mediaFileCache[blobUrl] = processedFile;
              }
            }
            
            resolve(blob);
          } else {
            resolve(null);
          }
        }, mediaFile.type);
      };
      img.src = URL.createObjectURL(mediaFile);
    });
  };

  const handleShareOrDownload = async (action: 'share' | 'download', userEvent?: React.MouseEvent) => {
    const targetUserId = currentUser?.uid || gen.userId;
    if (!targetUserId) {
      toast.error("User ID is not available for operation.");
      console.error("User ID is not available for operation.");
      return;
    }

    try {
      const genRef = doc(db, 'users', targetUserId, 'generations', gen.id);
      const isVideo = mediaFile && mediaFile.type.startsWith('video');
      if (action === 'share') {
        const mediaType: MediaType = isVideo ? 'video' : (mediaFile ? 'image' : 'text-only');
        if (isVideo) {
          if (processing) {
            toast.info('Video is still processing. Please wait.');
            return;
          }
          if (!processedVideoFile) {
            toast.error('Processed video not available.');
            return;
          }
          // Use Web Share API directly with processed video file
          try {
            await navigator.share({
              files: [processedVideoFile],
              title: currentCaption.title,
              text: currentCaption.caption,
            });
            const updateData: any = {
              share_count: (gen.share_count || 0) + 1,
              posted: true,
            };
            await updateDoc(genRef, updateData);
            toast.success('Video shared successfully!');
          } catch (error) {
            toast.error('Sharing failed.');
          }
          return;
        }
        const result = await sharePreview(
          previewRef,
          currentCaption,
          mediaType,
          userEvent
        );
        if (result.status === 'shared') {
          const updateData: any = {
            share_count: (gen.share_count || 0) + 1,
            posted: true, // Mark as posted if shared
          };
          await updateDoc(genRef, updateData);
        } else if (result.status === 'cancelled') {
          toast.info('Sharing cancelled.');
        } else if (result.status === 'fallback') {
          const updateData: any = {
            share_count: (gen.share_count || 0) + 1,
            posted: true, // Mark as posted if shared
          };
          await updateDoc(genRef, updateData);
        }
      } else if (action === 'download') {
        const mediaType: MediaType = isVideo ? 'video' : (mediaFile ? 'image' : 'text-only');
        if (isVideo) {
          if (processing) {
            toast.info('Video is still processing. Please wait.');
            return;
          }
          if (!processedVideoFile) {
            toast.error('Processed video not available.');
            return;
          }
          // Download the processed video file
          const url = URL.createObjectURL(processedVideoFile);
          const a = document.createElement('a');
          a.href = url;
          a.download = processedVideoFile.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Downloaded successfully!');
          const updateData: any = {
            download_count: (gen.download_count || 0) + 1,
            posted: true,
          };
          await updateDoc(genRef, updateData);
          return;
        }
        await downloadPreview(
          previewRef,
          mediaType,
          currentCaption,
          mediaFile?.name // Pass original filename hint
        );
        const updateData: any = {
          download_count: (gen.download_count || 0) + 1,
          posted: true, // Mark as posted if downloaded
        };
        await updateDoc(genRef, updateData);
      }
    } catch (error: any) {
      console.error('Operation error:', error);
      toast.error(`Operation failed: ${error.message}`);
    }
  };

  // For download, trigger browser download
  const handleDownload = async () => {
    let fileToDownload = mediaFile;
    if (mediaFile && mediaFile.type.startsWith('image')) {
      fileToDownload = await renderImageWithOverlay();
    }
    if (fileToDownload) {
      const url = URL.createObjectURL(fileToDownload);
      const a = document.createElement('a');
      a.href = url;
      a.download = mediaFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded successfully!');
    }
  };
  // Handle saving edited text
  const handleSaveEdit = () => {
    setIsEditingText(false);
    toast.success('Caption saved!');
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setCurrentCaption(initialCaption);
    setIsEditingText(false);
    toast.info('Edit canceled.');
  };
  
  // Handlers for text overlay
  const handleToggleTextOverlayEditor = () => {
    setShowTextOverlayEditor(!showTextOverlayEditor);
  };
  const handleTextOverlaySave = () => {
    // If we have a custom text and mediaFile, we should update the mediaFile
    if (mediaFile && customTextOverlay) {
      // Create a new file with the same content but with text overlay metadata
      const updatedFile = new File([mediaFile], mediaFile.name, {
        type: mediaFile.type,
        lastModified: Date.now()
      });
      
      // Prepare text overlay data
      const textOverlayData = {
        text: customTextOverlay,
        position: textPosition,
        color: textColor,
        size: textSize,
        rotation: textRotation
      };
      
      // Add text overlay data to the file
      // @ts-ignore - custom property for text overlay
      updatedFile.textOverlayData = textOverlayData;
      
      // Replace the mediaFile in location.state
      if (location.state) {
        location.state.mediaFile = updatedFile;
      }
      
      // Store in the media file cache for better retrieval
      if (typeof window !== 'undefined') {
        // Initialize cache if needed
        // @ts-ignore - custom property
        if (!window.mediaFileCache) window.mediaFileCache = {};
        
        // Create a blob URL for this file to use as a key
        const blobUrl = URL.createObjectURL(updatedFile);
        
        // Store in the cache with multiple keys for better retrieval chances
        // @ts-ignore - custom property
        window.mediaFileCache[blobUrl] = updatedFile;
        
        // Also store with a timestamp to ensure uniqueness
        const timeKey = `${blobUrl}#${Date.now()}`;
        // @ts-ignore - custom property
        window.mediaFileCache[timeKey] = updatedFile;
        
        console.log('Stored file with text overlay in cache:', blobUrl);
      }
      
      // If it's a video, update the video element with the text overlay data
      if (mediaFile.type.startsWith('video')) {
        const videoElement = document.querySelector('#preview-video') as HTMLVideoElement;
        if (videoElement) {
          // @ts-ignore - custom property
          videoElement.textOverlayData = textOverlayData;
          
          // Set data attribute as an additional backup for text overlay data
          try {
            videoElement.setAttribute('data-text-overlay', JSON.stringify(textOverlayData));
          } catch (e) {
            console.warn('Failed to set data-text-overlay attribute:', e);
          }
          
          // Also store the reference to the media file
          // @ts-ignore - custom property
          videoElement.mediaFile = updatedFile;
          
          console.log('Updated video element with text overlay data');
        }
        
        // Trigger video reprocessing
        // This will trigger the useEffect for video processing
        setProcessedVideoFile(null);
      }
      
      // Make the text overlay visible immediately
      toast.success('Text overlay saved!');
      setShowTextOverlayEditor(false);
    }
  };
  
  const handleTextOverlayCancel = () => {
    // Reset to original text overlay data from the file
    if (mediaFile) {
      // @ts-ignore - custom property for text overlay
      const textOverlayData = mediaFile.textOverlayData;
      if (textOverlayData) {
        setCustomTextOverlay(textOverlayData.text || '');
        setTextPosition(textOverlayData.position || { x: 50, y: 25 });
        setTextColor(textOverlayData.color || '#ffffff');
        setTextSize(textOverlayData.size || 36);
        setTextRotation(textOverlayData.rotation || 0);
      } else {
        // No previous text overlay data, reset to defaults
        setCustomTextOverlay('');
        setTextPosition({ x: 50, y: 25 });
        setTextColor('#ffffff');
        setTextSize(36);
        setTextRotation(0);
      }
    }
    
    setShowTextOverlayEditor(false);
    toast.info('Text overlay editing canceled');
  };

  // Handler to toggle edit mode
  const handleEditClick = () => {
    setIsEditingText(true);
  };

  // Handler to save edited text (basic for now, will need actual saving logic)
  const handleSaveClick = () => {
    setIsEditingText(false);
    // Add logic here to actually save the edited text if needed
  };

  // Handler to cancel editing
  const handleCancelClick = () => {
    setCurrentCaption(initialCaption);
    setIsEditingText(false);
    toast.info('Edit canceled.');
  };

  return (
    <div className="container mx-auto p-4 mt-20">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => navigate(-1)} variant="outline">Back</Button>
        <h1 className="text-2xl font-bold">Preview Post</h1>
        <div></div> {/* Placeholder for alignment */}
      </div>

      {/* Sharable content area */}
      <div ref={previewRef} id="sharable-content" className="relative w-full max-w-md mx-auto bg-background rounded-4xl overflow-hidden shadow-lg">        {/* Media Preview (Image or Video) */}
        {mediaFile && mediaFile.type.startsWith('image') && (
          <div className="w-full max-w-md mx-auto">
            <div className="relative w-full" ref={mediaContainerRef}>
              <img
                src={URL.createObjectURL(mediaFile)}
                alt="Preview"
                className="w-full h-auto"
                id="preview-image"
              />
              
              {/* Custom Text Overlay */}
              {customTextOverlay && !isEditingText && !showTextOverlayEditor && (
                <DraggableTextOverlay
                  text={customTextOverlay}
                  position={textPosition}
                  color={textColor}
                  size={textSize}
                  rotation={textRotation}
                  onPositionChange={setTextPosition}
                  containerRef={mediaContainerRef}
                />
              )}
              
              {/* Caption Overlay */}
              {showCaptionOverlay && !isEditingText ? (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/[.7] to-transparent text-white p-4 rounded-b-lg"
                  style={{ width: '100%' }}
                >
                  <h2 className="font-bold text-2xl mb-2" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.title}</h2>
                  <div className="text-lg mb-2" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.caption}</div>
                  <div className="text-base text-gray-300 font-medium" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.hashtags.map(tag => `#${tag}`).join(' ')}</div>
                </div>
              ) : null}
              
              {/* Caption shown below image when overlay is disabled */}
              {!showCaptionOverlay && !isEditingText ? (
                <div className="w-full bg-card text-card-foreground p-4 rounded-lg shadow-md mt-2">
                  {currentCaption.title && <h2 className="text-xl font-bold mb-2">{currentCaption.title}</h2>}
                  <p className="whitespace-pre-wrap text-base mb-2">
                    {currentCaption.caption}
                  </p>
                  {currentCaption.cta && <p className="text-sm text-muted-foreground mb-2">{currentCaption.cta}</p>}
                  {currentCaption.hashtags && currentCaption.hashtags.length > 0 && (
                    <p className="text-sm text-blue-400 font-medium">
                      {currentCaption.hashtags.map(tag => `#${tag}`).join(' ')}
                    </p>
                  )}
                </div>
              ) : null}
              
              {/* Text Overlay Editor */}
              {showTextOverlayEditor && (
                <div className="absolute top-0 left-0 right-0 bg-background/90 backdrop-blur-sm z-30 p-3 rounded-lg border border-border shadow-lg">
                  <TextOverlayEditor
                    onTextChange={setCustomTextOverlay}
                    onColorChange={setTextColor}
                    onSizeChange={setTextSize}
                    onRotationChange={setTextRotation}
                    onClose={handleTextOverlayCancel}
                    initialText={customTextOverlay}
                    initialColor={textColor}
                    initialSize={textSize}
                    initialRotation={textRotation}
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={handleTextOverlayCancel}>
                      <X className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleTextOverlaySave}>
                      <Save className="mr-1 h-4 w-4" /> Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}        {mediaFile && mediaFile.type.startsWith('video') && (
          <div className="relative w-full" ref={mediaContainerRef}>
            <video
              id="preview-video"
              src={URL.createObjectURL(mediaFile)}
              controls
              className="w-full h-auto"
            />
            
            {/* Custom Text Overlay for Video */}
            {customTextOverlay && !isEditingText && !showTextOverlayEditor && !processing && (
              <DraggableTextOverlay
                text={customTextOverlay}
                position={textPosition}
                color={textColor}
                size={textSize}
                rotation={textRotation}
                onPositionChange={setTextPosition}
                containerRef={mediaContainerRef}
              />
            )}
            
            {/* Always show caption overlay for video */}
            {!isEditingText && !processing && (
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/[.7] to-transparent text-white p-4 rounded-b-lg">
                <h2 className="font-bold text-2xl mb-2" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.title}</h2>
                <div className="text-lg mb-2" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.caption}</div>
                <div className="text-base text-gray-300 font-medium" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.hashtags.map(tag => `#${tag}`).join(' ')}</div>
              </div>
            )}
            
            {/* Text Overlay Editor */}
            {showTextOverlayEditor && (
              <div className="absolute top-0 left-0 right-0 bg-background/90 backdrop-blur-sm z-30 p-3 rounded-lg border border-border shadow-lg">
                <TextOverlayEditor
                  onTextChange={setCustomTextOverlay}
                  onColorChange={setTextColor}
                  onSizeChange={setTextSize}
                  onRotationChange={setTextRotation}
                  onClose={handleTextOverlayCancel}
                  initialText={customTextOverlay}
                  initialColor={textColor}
                  initialSize={textSize}
                  initialRotation={textRotation}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={handleTextOverlayCancel}>
                    <X className="mr-1 h-4 w-4" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleTextOverlaySave}>
                    <Save className="mr-1 h-4 w-4" /> Save
                  </Button>
                </div>
              </div>
            )}
            
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-20">
                <span className="text-white text-lg font-semibold">Processing video...</span>
              </div>
            )}
          </div>
        )}

        {/* Text-only post display or Edit mode */}
        {!mediaFile && (
          <div className={`mx-auto my-8 max-w-lg p-6 rounded-2xl shadow-lg bg-card text-card-foreground preview-caption-card ${isEditingText ? '' : ''}`}>
            {isEditingText ? (
              // Edit mode UI for text-only
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    id="edit-title"
                    value={currentCaption.title}
                    onChange={e => setCurrentCaption({ ...currentCaption, title: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="edit-caption" className="block text-sm font-medium mb-1">Caption</label>
                  <Textarea
                    id="edit-caption"
                    value={currentCaption.caption}
                    onChange={e => setCurrentCaption({ ...currentCaption, caption: e.target.value })}
                    rows={6}
                  />
                </div>
                <div>
                  <label htmlFor="edit-cta" className="block text-sm font-medium mb-1">Call to Action</label>
                  <Input
                    id="edit-cta"
                    value={currentCaption.cta}
                    onChange={e => setCurrentCaption({ ...currentCaption, cta: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="edit-hashtags" className="block text-sm font-medium mb-1">Hashtags (space separated)</label>
                  <Input
                    id="edit-hashtags"
                    value={currentCaption.hashtags.join(' ')}
                    onChange={e => setCurrentCaption({ ...currentCaption, hashtags: e.target.value.split(' ').filter(tag => tag.trim() !== '') })}
                    placeholder="Enter hashtags space separated"
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-2">
                  <Button variant="outline" size="sm" onClick={handleCancelClick}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveClick}>Save</Button>
                </div>
              </div>
            ) : (
              // View mode UI for text-only
              <div>
                {currentCaption.title && <h2 className="text-xl font-bold mb-2">{currentCaption.title}</h2>}
                <p className="whitespace-pre-wrap text-base mb-2">
                  {currentCaption.caption}
                </p>
                {currentCaption.cta && <p className="text-sm text-muted-foreground mb-2">{currentCaption.cta}</p>}
                {currentCaption.hashtags && currentCaption.hashtags.length > 0 && (
                  <p className="text-sm text-blue-400 font-medium">
                    {currentCaption.hashtags.map(tag => `#${tag}`).join(' ')}
                  </p>
                )}
                {/* Action buttons only in preview, not in processed card */}
                {!processing && (
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const textParts = [
                          currentCaption.title,
                          currentCaption.caption,
                          currentCaption.cta,
                          currentCaption.hashtags && currentCaption.hashtags.length > 0
                            ? currentCaption.hashtags.map(tag => `#${tag}`).join(' ')
                            : ''
                        ].filter(Boolean);
                        const textContent = textParts.join('\n\n').trim();
                        navigator.clipboard.writeText(textContent)
                          .then(() => toast.success('Caption copied!'))
                          .catch(err => toast.error('Failed to copy caption.', err));
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleEditClick}>Edit</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 sticky bottom-0 bg-background py-2 z-10">
        <Button className="flex-1" disabled={processing || (mediaFile && mediaFile.type.startsWith('video') && !processedVideoFile)} onClick={(e) => handleShareOrDownload('share', e)}>Share</Button>
        <Button className="flex-1" disabled={processing || (mediaFile && mediaFile.type.startsWith('video') && !processedVideoFile)} onClick={() => handleShareOrDownload('download')}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
        <Button className="flex-1" variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>       {/* Controls for media editing */}
       {mediaFile && (
         <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 mb-8">
           {/* Caption Overlay Toggle (only for images) */}
           {mediaFile.type.startsWith('image') && (
             <div className="flex items-center space-x-2">
               <Switch checked={showCaptionOverlay} onCheckedChange={setShowCaptionOverlay} id="caption-overlay-toggle" />
               <label htmlFor="caption-overlay-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                 Show Caption Over Media
               </label>
             </div>
           )}
           
           {/* Text Overlay Editor Toggle */}
           <div className="flex items-center">
             <Button 
               variant={customTextOverlay ? "default" : "outline"} 
               size="sm" 
               onClick={handleToggleTextOverlayEditor}
               disabled={processing}
               className="gap-1"
             >
               <Edit className="h-4 w-4" /> 
               {customTextOverlay ? "Edit Text Overlay" : "Add Text Overlay"}
             </Button>
           </div>
         </div>
       )}

    </div>
  );
};

export default PreviewRepost;

