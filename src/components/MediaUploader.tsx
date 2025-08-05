// MediaUploader.tsx - FIXED VERSION WITH EMBEDDED TEXT EDITOR AND EMOJI PICKER
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  Upload, Camera, X, RotateCw, Crop, Type, RefreshCw, Check,
  Sliders, FileEdit, RotateCcw, Image, FileText, AlertCircle,
  VideoIcon, Info, Sparkles, SmilePlus, Move, AlignLeft,
  AlignCenter, AlignRight
} from 'lucide-react';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from '@/lib/utils';
// Import emoji picker (new dependency)
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MediaUploaderProps {
  onMediaSelect: (file: File | null) => void;
  selectedMedia: File | null;
  previewUrl: string | null;
  onTextOnlySelect: () => void;
}

interface ImageFilter {
  name: string;
  class: string;
  icon: React.ReactNode;
  description: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  onMediaSelect, 
  selectedMedia, 
  previewUrl,
  onTextOnlySelect
}) => {
  const { currentUser, userProfile } = useAuth();
  const { t, i18n } = useTranslation('caption-generator');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textDivRef = useRef<HTMLDivElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [textOverlay, setTextOverlay] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 }); // percentage position
  const [isTextDragging, setIsTextDragging] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [textBackgroundColor, setTextBackgroundColor] = useState('rgba(0,0,0,0.6)');
  const [isCropMode, setIsCropMode] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [streamActive, setStreamActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPopupTips, setShowPopupTips] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [textRotation, setTextRotation] = useState(0);
  const [isLoading, setIsLoading] = useState<{
    [key: string]: boolean;
  }>({
    saving: false,
    camera: false,
  });
  
  // Drag offset for text positioning
  const dragOffset = useRef({ x: 0, y: 0 });

  // Enhanced image filters with icons and descriptions
  const imageFilters: ImageFilter[] = [
    { name: t('mediaUploader.filters.original'), class: '', icon: <Image className="h-3 w-3" />, description: t('mediaUploader.filters.originalDesc') },
    { name: t('mediaUploader.filters.grayscale'), class: 'grayscale', icon: <Sliders className="h-3 w-3" />, description: t('mediaUploader.filters.grayscaleDesc') },
    { name: t('mediaUploader.filters.sepia'), class: 'sepia', icon: <Sliders className="h-3 w-3" />, description: t('mediaUploader.filters.sepiaDesc') },
    { name: t('mediaUploader.filters.invert'), class: 'invert', icon: <RefreshCw className="h-3 w-3" />, description: t('mediaUploader.filters.invertDesc') },
    { name: t('mediaUploader.filters.blur'), class: 'blur-sm', icon: <Sliders className="h-3 w-3" />, description: t('mediaUploader.filters.blurDesc') },
    { name: t('mediaUploader.filters.brightness'), class: 'brightness-125', icon: <Sparkles className="h-3 w-3" />, description: t('mediaUploader.filters.brightnessDesc') },
    { name: t('mediaUploader.filters.contrast'), class: 'contrast-125', icon: <Sliders className="h-3 w-3" />, description: t('mediaUploader.filters.contrastDesc') },
  ];

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // File validation and handling
  const handleFiles = useCallback((files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    const fileType = file.type;
    const fileSize = file.size / (1024 * 1024); // Convert to MB

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const isValidType = [...validImageTypes, ...validVideoTypes].includes(fileType);

    if (!isValidType) {
      toast.error(t('mediaUploader.toasts.invalidFileType'));
      return;
    }

    // Validate file size
    if (fileSize > 50) {
      toast.error(t('mediaUploader.toasts.fileTooLarge'));
      return;
    }

    // Reset editing states
    setRotationAngle(0);
    setSelectedFilter('');
    setTextOverlay('');
    setTextPosition({ x: 50, y: 50 });
    setTextAlignment('center');
    setTextBackgroundColor('rgba(0,0,0,0.6)');
    setIsCropMode(false);
    setCameraError(null);
    setProcessedImageUrl(null);
    setShowTextEditor(false);

    onMediaSelect(file);
    toast.success(t('mediaUploader.toasts.uploadSuccess'));
  }, [onMediaSelect, t]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleBoxClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveMedia = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onMediaSelect(null);
    
    // If camera is active, stop it
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStreamActive(false);
    }
    
    // Reset states
    setCameraError(null);
    setSelectedFilter('');
    setRotationAngle(0);
    setTextOverlay('');
    setTextPosition({ x: 50, y: 50 });
    setTextAlignment('center');
    setTextBackgroundColor('rgba(0,0,0,0.6)');
    setIsCropMode(false);
    setProcessedImageUrl(null);
    setShowTextEditor(false);
    
    toast.success(t('mediaUploader.toasts.mediaRemoved'));
  };

  // Improved camera functions
  const handleCameraClick = async () => {
    try {
      setCameraError(null);
      setIsCapturing(true);
      
      // If stream is already active, stop it first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(t('mediaUploader.errors.cameraNotSupported'));
      }

      // Request user media with explicit constraints
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user" // front camera
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Store the stream reference
      streamRef.current = stream;
      setStreamActive(true);
      
      // Ensure the video element exists
      if (!videoRef.current) {
        throw new Error(t('mediaUploader.errors.videoElementNotAvailable'));
      }
      
      // Assign the stream to the video element
      videoRef.current.srcObject = stream;
      
      // Wait for video metadata to load
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              setIsCapturing(false);
              toast.success(t('mediaUploader.toasts.cameraActivated'));
            })
            .catch(err => {
              console.error("Error playing video:", err);
              setCameraError(t('mediaUploader.errors.videoPlaybackError'));
              setIsCapturing(false);
            });
        }
      };
      
      videoRef.current.onerror = () => {
        setCameraError(t('mediaUploader.errors.videoStreamError'));
        setIsCapturing(false);
      };
      
    } catch (err: unknown) {
      console.error('Error accessing camera:', err);
      const errorMessage = err instanceof Error ? err.message : t('mediaUploader.errors.cameraNotSupported');
      setCameraError(errorMessage);
      setStreamActive(false);
      setIsCapturing(false);
      
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast.error(t('mediaUploader.toasts.cameraDenied'));
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        toast.error(t('mediaUploader.toasts.cameraNotFound'));
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        toast.error(t('mediaUploader.toasts.cameraError', { error: errorMessage }));
      }
    }
  };

  // FIXED CAPTURE FUNCTION
  const handleCapturePhoto = () => {
    if (!streamActive || !streamRef.current || !videoRef.current || !canvasRef.current) {
      toast.error(t('mediaUploader.toasts.cameraNotActive'));
      return;
    }
    
    try {
      setIsCapturing(true);
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error(t('mediaUploader.errors.canvasContextError'));
      }
      
      // Set canvas dimensions to match video dimensions
      canvas.width = video.videoWidth || 640; // Fallback width
      canvas.height = video.videoHeight || 480; // Fallback height
      
      // Check if video dimensions are valid
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error(t('mediaUploader.errors.invalidVideoDimensions'));
      }
      
      // Draw the current video frame to the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob with explicit image type and quality
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a File object from the blob
          const capturedFile = new File([blob], `capture_${Date.now()}.jpg`, { 
            type: "image/jpeg" 
          });
          
          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          setStreamActive(false);
          
          // Set the captured image as the selected media
          onMediaSelect(capturedFile);
          toast.success(t('mediaUploader.toasts.photoCaptured'));
        } else {
          throw new Error(t('mediaUploader.errors.imageBlobError'));
        }
        setIsCapturing(false);
      }, 'image/jpeg', 0.95);
      
    } catch (err: unknown) {
      console.error('Error capturing photo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(t('mediaUploader.toasts.captureError', { error: errorMessage }));
      setIsCapturing(false);
    }
  };

  // Image editing functions
  const handleRotate = () => {
    if (!selectedMedia) {
      toast(t('mediaUploader.toasts.uploadFirst'));
      return;
    }
    
    // Only allow rotation for images
    if (!selectedMedia.type.startsWith('image/')) {
      toast(t('mediaUploader.toasts.rotationImageOnly'));
      return;
    }
    
    setRotationAngle((prevAngle) => (prevAngle + 90) % 360);
    toast.success(t('mediaUploader.toasts.rotatedClockwise'));
  };

  const handleCounterRotate = () => {
    if (!selectedMedia) {
      toast(t('mediaUploader.toasts.uploadFirst'));
      return;
    }
    
    // Only allow rotation for images
    if (!selectedMedia.type.startsWith('image/')) {
      toast(t('mediaUploader.toasts.rotationImageOnly'));
      return;
    }
    
    setRotationAngle((prevAngle) => (prevAngle - 90 + 360) % 360);
    toast.success(t('mediaUploader.toasts.rotatedCounterClockwise'));
  };

  const handleCrop = () => {
    if (!selectedMedia) {
      toast(t('mediaUploader.toasts.uploadFirst'));
      return;
    }
    
    // Only allow crop for images for now
    if (!selectedMedia.type.startsWith('image/')) {
      toast(t('mediaUploader.toasts.cropImageOnly'));
      return;
    }
    
    setIsCropMode(!isCropMode);
    if (!isCropMode) {
      toast.success(t('mediaUploader.toasts.cropEnabled'));
    } else {
      toast.success(t('mediaUploader.toasts.cropDisabled'));
    }
  };

  const handleAddText = () => {
    if (!selectedMedia) {
      toast(t('mediaUploader.toasts.uploadFirst'));
      return;
    }
    setShowTextEditor(!showTextEditor);
    if (!showTextEditor) {
      toast.success(t('mediaUploader.toasts.textEditorActivated'));
    }
  };

  const handleFilterChange = (filterClass: string) => {
    setSelectedFilter(filterClass);
    const filterName = filterClass ? filterClass : t('mediaUploader.filters.original');
    toast.success(t('mediaUploader.toasts.filterApplied', { filter: filterName }));
  };

  // Emoji picker handler
  const handleEmojiSelect = (emoji: { native: string }) => {
    setTextOverlay(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  // Unified pointer event handlers for text positioning
  const handleTextPointerDown = (e: React.PointerEvent) => {
    if (!textDivRef.current) return;
    // Use videoRef for video, imageRef for image
    const ref = isVideo ? videoRef : imageRef;
    if (!ref.current) return;
    textDivRef.current.setPointerCapture(e.pointerId);
    setIsTextDragging(true);
    const textRect = textDivRef.current.getBoundingClientRect();
    const mediaRect = ref.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - (textRect.left + textRect.width / 2),
      y: e.clientY - (textRect.top + textRect.height / 2)
    };
  };

  const handleTextPointerMove = (e: React.PointerEvent) => {
    if (!isTextDragging || !textDivRef.current) return;
    // Use videoRef for video, imageRef for image
    const ref = isVideo ? videoRef : imageRef;
    if (!ref.current) return;
    
    const mediaRect = ref.current.getBoundingClientRect();
    const textRect = textDivRef.current.getBoundingClientRect();
    
    // Simple percentage calculation relative to the image itself
    const newX = ((e.clientX - dragOffset.current.x - mediaRect.left) / mediaRect.width) * 100;
    const newY = ((e.clientY - dragOffset.current.y - mediaRect.top) / mediaRect.height) * 100;
    
    const textWidthPercent = (textRect.width / mediaRect.width) * 100;
    const textHeightPercent = (textRect.height / mediaRect.height) * 100;
    const paddingPercent = 2;
    
    const clampedX = Math.max(
      (textWidthPercent / 2) + paddingPercent,
      Math.min(100 - (textWidthPercent / 2) - paddingPercent, newX)
    );
    const clampedY = Math.max(
      (textHeightPercent / 2) + paddingPercent,
      Math.min(100 - (textHeightPercent / 2) - paddingPercent, newY)
    );
    
    setTextPosition({
      x: clampedX,
      y: clampedY
    });
  };

  const handleTextPointerUp = (e: React.PointerEvent) => {
    if (!textDivRef.current) return;
    textDivRef.current.releasePointerCapture(e.pointerId);
    setIsTextDragging(false);
  };
  // Helper function to calculate preview text size that matches canvas scaling
  const getPreviewTextSize = () => {
    if (!imageRef.current) return textSize;
    
    const img = imageRef.current;
    const containerRect = img.getBoundingClientRect();
    const naturalWidth = img.naturalWidth || 1;
    const naturalHeight = img.naturalHeight || 1;
    
    // Calculate the scale factor between displayed size and natural size
    const displayScale = Math.min(containerRect.width / naturalWidth, containerRect.height / naturalHeight);
    
    // Apply the same scaling logic as in the canvas
    const scaleFactor = Math.min(naturalWidth, naturalHeight) / 500;
    const scaledTextSize = Math.max(textSize * scaleFactor, 12);
    
    // Scale it down for the preview
    return scaledTextSize * displayScale;
  };

  // Apply all edits and save to canvas
  const handleSaveEdits = () => {
    if (!selectedMedia) {
      toast.error(t('mediaUploader.toasts.noMediaSelected'));
      return;
    }
    
    setIsLoading(prev => ({ ...prev, saving: true })); // Add loading state
    
    try {
      // Handle video files differently than images
      const isVideoFile = selectedMedia.type.startsWith('video/');
      
      if (isVideoFile) {
        // For videos, we don't modify the video file itself
        // Instead, we store the text overlay data to display on top of the video during playback
        
        // Create a new File object with the same content but with text overlay metadata
        const videoWithOverlay = new File([selectedMedia], selectedMedia.name, {
          type: selectedMedia.type,
          lastModified: Date.now()
        });
          // Store text overlay data as a custom property
        (videoWithOverlay as unknown as Record<string, unknown>).textOverlayData = {
          text: textOverlay,
          position: textPosition,
          color: textColor, 
          size: textSize,
          rotation: textRotation,
          alignment: textAlignment,
          backgroundColor: textBackgroundColor
        };
        
        // Store the file in window.mediaFileCache if it exists
        if (typeof window !== 'undefined') {
          const previewBlobUrl = displayUrl || previewUrl;
          if (previewBlobUrl && previewBlobUrl.startsWith('blob:')) {
            if (!(window as unknown as Record<string, unknown>).mediaFileCache) {
              (window as unknown as Record<string, unknown>).mediaFileCache = {};
            }
            
            // Log the text overlay data being stored
            console.log('Storing video with text overlay in cache:', {
              url: previewBlobUrl,
              textData: (videoWithOverlay as unknown as Record<string, unknown>).textOverlayData
            });
            
            (window as unknown as Record<string, unknown>).mediaFileCache[previewBlobUrl] = videoWithOverlay;
            
            // Also store with the current time to ensure we have a unique reference
            // This helps in case the same URL is reused for different edits
            const timeKey = `${previewBlobUrl}#${Date.now()}`;
            (window as unknown as Record<string, unknown>).mediaFileCache[timeKey] = videoWithOverlay;
          }
        }          // Update the selected media with our enhanced version
          onMediaSelect(videoWithOverlay);
          
          console.log('Video with text overlay saved:', {
            fileName: videoWithOverlay.name,
            textOverlay: textOverlay,
            hasOverlayData: !!((videoWithOverlay as unknown as Record<string, unknown>).textOverlayData)
          });
          
          toast.success(
            <div className="flex flex-col">
              <span className="font-medium">{t('mediaUploader.toasts.videoOverlaySaved')}</span>
              <span className="text-xs mt-1">{t('mediaUploader.toasts.videoOverlayNote')}</span>
            </div>,
            { duration: 4000 }
          );
        
        // Reset text editor state
        setShowTextEditor(false);
        setIsLoading(prev => ({ ...prev, saving: false }));
        return;
      }
      
      // For images, use canvas to apply text overlay
      if (!imageRef.current) {
        toast.error(t('mediaUploader.errors.canvasContextError'));
        setIsLoading(prev => ({ ...prev, saving: false }));
        return;
      }
      
      // Create a canvas to combine image + edits
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error(t('mediaUploader.errors.canvasContextCreateError'));
      }
      
      // Set canvas dimensions to match image
      const img = imageRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Draw the image with applied rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotationAngle * Math.PI) / 180);
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      ctx.restore();
      
      // Apply filter effects if needed
      if (selectedFilter) {
        // Apply filter simulation to canvas
        applyFilterToCanvas(ctx, canvas.width, canvas.height, selectedFilter);
      }
      
      // Draw the text overlay if present
      if (textOverlay) {
        ctx.save();
        
        // Calculate pixel positions from percentages - ensuring exact match with preview
        const x = (textPosition.x / 100) * canvas.width;
        const y = (textPosition.y / 100) * canvas.height;
        
        // Move to the text position
        ctx.translate(x, y);
        
        // Apply text rotation
        ctx.rotate((textRotation * Math.PI) / 180);
        
        // Calculate font size using the same logic as preview
        const scaleFactor = Math.min(canvas.width, canvas.height) / 500;
        const scaledTextSize = Math.max(textSize * scaleFactor, 12);
        
        // Set font properties
        ctx.font = `${scaledTextSize}px Arial`;
        ctx.textBaseline = 'middle';
        
        // Handle multi-line text
        const lines = textOverlay.split('\n');
        const lineHeight = scaledTextSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;
        
        // Calculate text metrics for proper alignment
        const textMetrics = lines.map(line => ctx.measureText(line));
        const maxLineWidth = Math.max(...textMetrics.map(m => m.width));
        const padding = 8 * scaleFactor;
        
        // Draw background if not transparent
        if (textBackgroundColor !== 'transparent') {
          ctx.save();
          ctx.fillStyle = textBackgroundColor;
          
          // Calculate background rectangle position based on text alignment
          let bgX, bgWidth;
          switch (textAlignment) {
            case 'left':
              bgX = -padding;
              bgWidth = maxLineWidth + padding * 2;
              break;
            case 'right':
              bgX = -maxLineWidth - padding;
              bgWidth = maxLineWidth + padding * 2;
              break;
            case 'center':
            default:
              bgX = -maxLineWidth / 2 - padding;
              bgWidth = maxLineWidth + padding * 2;
              break;
          }
          
          const bgY = -totalTextHeight / 2 - padding;
          const bgHeight = totalTextHeight + padding * 2;
          
          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
          ctx.restore();
        }
        
        // Set text color and shadow
        ctx.fillStyle = textColor;
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 4 * scaleFactor;
        ctx.shadowOffsetX = 2 * scaleFactor;
        ctx.shadowOffsetY = 2 * scaleFactor;
        
        // Draw each line of text with proper alignment
        lines.forEach((line, i) => {
          const yOffset = i * lineHeight - (totalTextHeight - lineHeight) / 2;
          
          // Calculate x offset based on alignment (since we're not using ctx.textAlign)
          let xOffset = 0;
          const lineWidth = textMetrics[i].width;
          
          switch (textAlignment) {
            case 'left':
              xOffset = 0;
              break;
            case 'right':
              xOffset = -lineWidth;
              break;
            case 'center':
            default:
              xOffset = -lineWidth / 2;
              break;
          }
          
          ctx.fillText(line, xOffset, yOffset);
        });
        
        ctx.restore();
      }
      
      // Convert canvas to blob and create a new URL
      canvas.toBlob((blob) => {
        if (blob) {
          // Clean up previous URL if it exists
          if (processedImageUrl) {
            URL.revokeObjectURL(processedImageUrl);
          }
          
          // Create a new object URL for the processed image
          const processedUrl = URL.createObjectURL(blob);
          setProcessedImageUrl(processedUrl);
            // Create a File object from the blob that will be used for sharing
          const processedFile = new File([blob], `edited_${selectedMedia.name}`, { 
            type: "image/jpeg",
            lastModified: Date.now()
          });
          
          // Store text overlay data in a data attribute on the file object for retrieval during sharing
          if (textOverlay) {
            (processedFile as unknown as Record<string, unknown>).textOverlayData = {
              text: textOverlay,
              position: textPosition,
              color: textColor,
              size: textSize,
              rotation: textRotation,
              alignment: textAlignment,
              backgroundColor: textBackgroundColor
            };
            
            console.log('Storing image with text overlay data:', {
              text: textOverlay,
              position: textPosition,
              color: textColor,
              size: textSize,
              rotation: textRotation,
              alignment: textAlignment,
              backgroundColor: textBackgroundColor
            });
          }
          
          // Store the file in window.mediaFileCache if it exists
          if (typeof window !== 'undefined') {
            // Create the cache if it doesn't exist
            if (!(window as unknown as Record<string, unknown>).mediaFileCache) {
              (window as unknown as Record<string, unknown>).mediaFileCache = {};
            }
            
            // Store the file with its blob URL as the key
            (window as unknown as Record<string, unknown>).mediaFileCache[processedUrl] = processedFile;
            
            // Also store with a timestamp to ensure uniqueness
            const timeKey = `${processedUrl}#${Date.now()}`;
            (window as unknown as Record<string, unknown>).mediaFileCache[timeKey] = processedFile;
          }
          
          // Update the selected media with the edited version
          onMediaSelect(processedFile);
          
          // Clear the text overlay after saving to prevent duplication
          setTextOverlay('');
          setTextPosition({ x: 50, y: 50 });
          setTextRotation(0);
          setTextAlignment('center');
          setTextBackgroundColor('rgba(0,0,0,0.6)');
          
          if (textOverlay) {
            toast.success(
              <div className="flex flex-col">
                <span className="font-medium">{t('mediaUploader.toasts.editsSavedWithText')}</span>
                <span className="text-xs mt-1">{t('mediaUploader.toasts.editsSavedWithTextNote')}</span>
              </div>,
              { duration: 4000 }
            );
          } else {
            toast.success(t('mediaUploader.toasts.editsSaved'));
          }
          
          // Reset editing state but keep current text for further edits if needed
          setShowTextEditor(false);
        }
      }, 'image/jpeg', 0.95);
      
    } catch (err: unknown) {
      console.error('Error saving edits:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(t('mediaUploader.toasts.saveError', { error: errorMessage }));
    } finally {
      setIsLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleTextOnlyClick = () => {
    onTextOnlySelect();
    toast.success(t('mediaUploader.toasts.textOnlyActivated'));
  };

  // Helper function to apply filters to canvas
  const applyFilterToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number, filter: string) => {
    // Simple filter simulation - in production you'd use more sophisticated filter algorithms
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    switch(filter) {
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i+1] + data[i+2]) / 3;
          data[i] = avg;     // red
          data[i+1] = avg;   // green
          data[i+2] = avg;   // blue
        }
        break;
      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));     // red
          data[i+1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));   // green
          data[i+2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));   // blue
        }
        break;
      case 'invert':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];         // red
          data[i+1] = 255 - data[i+1];     // green
          data[i+2] = 255 - data[i+2];     // blue
        }
        break;
      case 'brightness-125':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.25);         // red
          data[i+1] = Math.min(255, data[i+1] * 1.25);     // green
          data[i+2] = Math.min(255, data[i+2] * 1.25);     // blue
        }
        break;
      case 'contrast-125': {
        const factor = (259 * (125 + 255)) / (255 * (259 - 125));
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));         // red
          data[i+1] = Math.min(255, Math.max(0, factor * (data[i+1] - 128) + 128));     // green
          data[i+2] = Math.min(255, Math.max(0, factor * (data[i+2] - 128) + 128));     // blue
        }
        break;
      }
      case 'blur-sm': {
        // Simple blur - in production you'd use a proper convolution kernel
        const tempData = new Uint8ClampedArray(data);
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            for (let c = 0; c < 3; c++) {
              let sum = 0;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
                  sum += tempData[neighborIdx + c];
                }
              }
              data[idx + c] = sum / 9;
            }
          }
        }
        break;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  // Determine if the selected file is a video
  const isVideo = selectedMedia?.type.startsWith('video/');

  // Prepare CSS transformations
  const imageStyle: React.CSSProperties = {
    transform: `rotate(${rotationAngle}deg)`,
    maxHeight: '300px',
    maxWidth: '100%',
    objectFit: 'contain',
    transition: 'transform 0.3s ease',
  };

  // Display URL to use - processed image takes priority if available
  const displayUrl = processedImageUrl || previewUrl;

  return (
    <div className="w-full p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Welcome header section */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-1 text-gray-800 dark:text-white flex items-center">
            <span>{t('mediaUploader.welcome.title', { name: userProfile?.displayName || currentUser?.displayName || 'User' })}</span>
            <button 
              onClick={() => setShowPopupTips(!showPopupTips)}
              className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              aria-label={t('mediaUploader.welcome.tipsToggle')}
            >
              <Info className="h-4 w-4" />
            </button>
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('mediaUploader.welcome.subtitle')}
          </p>
          
          {/* Tips popup */}
          {showPopupTips && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-sm animate-fadeIn">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">{t('mediaUploader.tips.title')}</p>
                  <ul className="text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• <span className="font-medium">{t('mediaUploader.tips.upload')}</span></li>
                    <li>• <span className="font-medium">{t('mediaUploader.tips.capture')}</span></li>
                    <li>• <span className="font-medium">{t('mediaUploader.tips.edit')}</span></li>
                    <li>• <span className="font-medium">{t('mediaUploader.tips.drag')}</span></li>
                    <li>• <span className="font-medium">{t('mediaUploader.tips.save')}</span></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area */}
          <div className="flex flex-col">
            <div 
              ref={dropAreaRef}
              className={`
                relative border-2 border-dashed rounded-xl p-8
                flex flex-col items-center justify-center
                min-h-[250px] transition-all duration-300
                ${isDragging 
                  ? 'border-primary bg-primary/5 shadow-lg scale-[1.01]' 
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50 dark:border-gray-600 dark:hover:border-primary dark:hover:bg-gray-800/20 cursor-pointer'}
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleBoxClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                className="hidden"
                aria-label="Upload media file"
              />
              
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-400 mb-2 font-medium">
                  {t('mediaUploader.upload.dragDrop')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-500">
                  {t('mediaUploader.upload.supportedFormats')}
                </p>
              </div>
            </div>

            {/* Action buttons with improved appearance */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button 
                onClick={handleUploadClick}
                className="flex-1 flex items-center justify-center gap-2 py-5 rounded-xl text-base text-gray-500 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Upload className="h-4 w-4" />
                {t('mediaUploader.upload.buttonText')}
              </Button>
              <Button 
                onClick={handleCameraClick}
                disabled={isLoading.camera || isCapturing}
                className="flex-1 flex items-center justify-center gap-2 py-5 rounded-xl text-base text-gray-500 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                {isLoading.camera || isCapturing ? (
                  <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {t('mediaUploader.camera.activate')}
              </Button>
            </div>

            {/* Text-only option */}
            <div className="text-center mt-4">
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-sm">{t('mediaUploader.upload.or')}</span>
                <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <button 
                className="mt-3 px-4 py-2 text-primary hover:text-primary-dark hover:underline flex items-center justify-center gap-2 mx-auto"
                onClick={handleTextOnlyClick}
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium">{t('mediaUploader.upload.textOnlyOption')}</span>
              </button>
            </div>
            
            {/* Camera feed with improved UI */}
            {streamActive && (
              <div className="mt-5 border rounded-xl overflow-hidden shadow-md animate-fadeIn">
                <div className="relative bg-black">
                  {cameraError ? (
                    <div className="p-8 text-center text-white">
                      <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-500" />
                      <p className="text-red-400 font-medium">{t('mediaUploader.camera.error')}</p>
                      <p className="text-sm text-gray-400 mt-1">{cameraError}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4 bg-gray-800 text-white border-gray-700"
                        onClick={() => {
                          setCameraError(null);
                          setStreamActive(false);
                        }}
                      >
                        {t('mediaUploader.camera.dismiss')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <video 
                        ref={videoRef} 
                        className="w-full h-auto object-cover"
                        autoPlay 
                        playsInline
                        muted
                      />
                      <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center bg-gradient-to-t from-black/70 to-transparent">
                        <Button
                          onClick={handleCapturePhoto}
                          disabled={isCapturing}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transform transition hover:scale-105"
                        >
                          {isCapturing ? (
                            <div className="h-6 w-6 border-2 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Camera className="h-6 w-6" />
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Camera controls */}
                {streamActive && !cameraError && (
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 flex justify-between items-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                      {t('mediaUploader.camera.active')}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-600 dark:text-gray-400"
                      onClick={() => {
                        if (streamRef.current) {
                          streamRef.current.getTracks().forEach(track => track.stop());
                          streamRef.current = null;
                        }
                        setStreamActive(false);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('mediaUploader.camera.close')}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Preview Area with integrated text editor */}
          <div className={`
            border rounded-xl overflow-hidden transition-all duration-300 shadow-sm
            ${!displayUrl && !streamActive 
              ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700' 
              : 'border-gray-300 dark:border-gray-600 shadow-md'}
          `}>
            {displayUrl ? (
              <div className="relative h-full flex flex-col">
                <div className="absolute top-3 right-3 z-10">
                  <button 
                    className="bg-gray-900/70 hover:bg-gray-900/90 text-white rounded-full p-1.5 shadow-md"
                    onClick={handleRemoveMedia}
                    aria-label={t('mediaUploader.preview.removeMedia')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Media preview with integrated text editor */}
                <div className="relative flex-grow bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden p-4">
                  {isVideo ? (
                    <div className="relative max-w-full">
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center shadow-sm z-10">
                        <VideoIcon className="h-3 w-3 mr-1" />
                        {t('mediaUploader.preview.video')}
                      </div>
                      <div className="relative">
                        <video 
                          src={displayUrl} 
                          controls
                          className="max-h-[350px] max-w-full object-contain rounded-md shadow-sm"
                          ref={videoRef}
                        />
                        {/* Draggable text overlay for video */}
                        {textOverlay && (
                          <div 
                            ref={textDivRef}
                            className={`absolute cursor-move whitespace-pre-wrap break-words transition-all duration-100
                              ${isTextDragging ? 'opacity-90 scale-105 shadow-xl ring-2 ring-primary/40' : ''}`}
                            style={{
                              top: `${textPosition.y}%`,
                              left: `${textPosition.x}%`,
                              transform: `translate(-50%, -50%) rotate(${textRotation}deg)`,
                              color: textColor,
                              fontSize: `${getPreviewTextSize()}px`,
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                              textAlign: textAlignment,
                              maxWidth: '90%',
                              padding: textBackgroundColor !== 'transparent' ? '8px 12px' : '8px',
                              borderRadius: '6px',
                              backgroundColor: textBackgroundColor,
                              zIndex: 20,
                              touchAction: 'none',
                              pointerEvents: 'auto',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                            }}
                            onPointerDown={handleTextPointerDown}
                            onPointerMove={handleTextPointerMove}
                            onPointerUp={handleTextPointerUp}
                          >
                            {textOverlay}
                            {isTextDragging && (
                              <>
                                <div className="absolute inset-0 bg-blue-500/10 border border-blue-500/40 rounded pointer-events-none"></div>
                                <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="relative">
                        <img 
                          ref={imageRef}
                          src={displayUrl}
                          alt="Preview" 
                          className={`${selectedFilter} transition-all rounded-md shadow-sm max-h-[350px] relative`}
                          style={imageStyle}
                        />
                        {/* Draggable text overlay for image */}
                        {textOverlay && (
                          <div 
                            ref={textDivRef}
                            className={`absolute cursor-move whitespace-pre-wrap break-words transition-all duration-100
                  ${isTextDragging ? 'opacity-90 scale-105 shadow-xl ring-2 ring-primary/40' : ''}`}
                            style={{
                              top: `${textPosition.y}%`,
                              left: `${textPosition.x}%`,
                              transform: `translate(-50%, -50%) rotate(${textRotation}deg)`,
                              color: textColor,
                              fontSize: `${getPreviewTextSize()}px`,
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                              textAlign: textAlignment,
                              maxWidth: '90%',
                              padding: textBackgroundColor !== 'transparent' ? '8px 12px' : '8px',
                              borderRadius: '6px',
                              backgroundColor: textBackgroundColor,
                              zIndex: 10,
                              touchAction: 'none',
                            }}
                            onPointerDown={handleTextPointerDown}
                            onPointerMove={handleTextPointerMove}
                            onPointerUp={handleTextPointerUp}
                          >
                            {textOverlay}
                            {isTextDragging && (
                              <>
                                <div className="absolute inset-0 bg-blue-500/10 border border-blue-500/40 rounded pointer-events-none"></div>
                                <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Crop overlay */}
                      {isCropMode && (
                        <div className="absolute inset-0 border-2 border-dashed border-primary bg-black bg-opacity-50 rounded-md">
                          <div className="absolute inset-10 border-2 border-white rounded"></div>
                          <div className="absolute bottom-2 right-2 bg-white/90 text-xs text-gray-800 px-2 py-1 rounded shadow-sm">
                            {t('mediaUploader.preview.cropMode')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Media editing controls */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  {/* Text overlay indicator - shows when text is applied but editor is closed */}
                  {textOverlay && !showTextEditor && (
                    <div className="mb-4 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-md flex items-center text-xs">
                      <Type className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-primary" />
                      <span className="text-primary">{t('mediaUploader.textEditor.overlayApplied', { text: textOverlay.substring(0, 20) + (textOverlay.length > 20 ? '...' : '') })}</span>
                      <button 
                        className="ml-auto bg-primary/10 hover:bg-primary/20 rounded px-1.5 py-0.5 text-primary"
                        onClick={() => setShowTextEditor(true)}
                      >
                        {t('mediaUploader.textEditor.edit')}
                      </button>
                    </div>
                  )}
                  
                  {/* Video-specific text overlay message */}
                  {isVideo && textOverlay && (
                    <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start">
                        <Info className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                        <span>{t('mediaUploader.textEditor.videoOverlayNote')}</span>
                      </p>
                    </div>
                  )}
                  
                  {/* Embedded text editor - appears when text button is clicked (now for both images and videos) */}
                  {showTextEditor && (
                    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium flex items-center">
                          <Type className="h-4 w-4 mr-1.5 text-primary" />
                          {t('mediaUploader.textEditor.title')}
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => setShowTextEditor(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex relative">
                          <textarea
                            value={textOverlay}
                            onChange={(e) => setTextOverlay(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-300 bg-white text-black text-base sm:text-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder-gray-400 shadow-sm"
                            placeholder={t('mediaUploader.textEditor.placeholder')}
                            rows={2}
                            style={{ minHeight: '48px', maxHeight: '120px', resize: 'vertical' }}
                          />
                          <button
                            className="absolute right-2 bottom-2 text-gray-500 hover:text-primary"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title={t('mediaUploader.textEditor.emojiPicker.buttonTooltip')}
                          >
                            <SmilePlus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Emoji picker - appears inline */}
                        {showEmojiPicker && (
                          <div className="relative z-10">
                            <div className="absolute right-0 top-0 w-[320px] border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
                              <div className="absolute top-2 right-2 z-10">
                                <button 
                                  className="bg-gray-300/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 rounded-full p-1"
                                  onClick={() => setShowEmojiPicker(false)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <Picker
                                data={data}
                                onEmojiSelect={handleEmojiSelect}
                                theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                                set="native"
                                previewPosition="none"
                                skinTonePosition="none"
                                searchPosition="top"
                                locale={i18n.language}
                                i18n={{
                                  search: t('mediaUploader.textEditor.emojiPicker.searchPlaceholder'),
                                  categories: {
                                    frequent: t('mediaUploader.textEditor.emojiPicker.categories.frequentlyUsed'),
                                    people: t('mediaUploader.textEditor.emojiPicker.categories.smileysAndPeople'),
                                    nature: t('mediaUploader.textEditor.emojiPicker.categories.animalsAndNature'),
                                    foods: t('mediaUploader.textEditor.emojiPicker.categories.foodAndDrink'),
                                    activity: t('mediaUploader.textEditor.emojiPicker.categories.activities'),
                                    places: t('mediaUploader.textEditor.emojiPicker.categories.travelAndPlaces'),
                                    objects: t('mediaUploader.textEditor.emojiPicker.categories.objects'),
                                    symbols: t('mediaUploader.textEditor.emojiPicker.categories.symbols'),
                                    flags: t('mediaUploader.textEditor.emojiPicker.categories.flags')
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">
                            {t('mediaUploader.textEditor.textColor')}
                          </label>
                          <div className="flex gap-2 mt-1 items-center">
                            <input
                              type="color"
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="w-8 h-8 p-0 border rounded"
                            />
                            <button
                              type="button"
                              className="ml-2 px-2 py-1 rounded border text-xs bg-black text-white border-gray-300 hover:bg-gray-800"
                              onClick={() => setTextColor('#000000')}
                              title={t('mediaUploader.textEditor.blackButton')}
                            >
                              {t('mediaUploader.textEditor.blackButton')}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">
                            {t('mediaUploader.textEditor.textSize', { size: textSize })}
                          </label>
                          <Slider
                            value={[textSize]}
                            min={12}
                            max={72}
                            step={1}
                            onValueChange={(value) => setTextSize(value[0])}
                            className="py-1.5"
                          />
                        </div>
                      </div>
                      
                      {/* Text rotation slider */}
                      <div className="mt-2">
                        <label className="text-xs text-gray-600 dark:text-gray-400">
                          {t('mediaUploader.textEditor.textRotation', { rotation: textRotation })}
                        </label>
                        <Slider
                          value={[textRotation]}
                          min={-180}
                          max={180}
                          step={1}
                          onValueChange={(value) => setTextRotation(value[0])}
                          className="py-1.5"
                        />
                      </div>
                      
                      {/* Text alignment and background controls */}
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
                            {t('mediaUploader.textEditor.textAlignment')}
                          </label>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setTextAlignment('left')}
                              className={cn(
                                "flex-1 px-2 py-1.5 rounded text-xs border transition-all flex items-center justify-center",
                                textAlignment === 'left' 
                                  ? 'border-primary bg-primary/10 text-primary-600' 
                                  : 'border-gray-300 hover:border-gray-400'
                              )}
                              title="Align left"
                            >
                              <AlignLeft className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTextAlignment('center')}
                              className={cn(
                                "flex-1 px-2 py-1.5 rounded text-xs border transition-all flex items-center justify-center",
                                textAlignment === 'center' 
                                  ? 'border-primary bg-primary/10 text-primary-600' 
                                  : 'border-gray-300 hover:border-gray-400'
                              )}
                              title="Align center"
                            >
                              <AlignCenter className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTextAlignment('right')}
                              className={cn(
                                "flex-1 px-2 py-1.5 rounded text-xs border transition-all flex items-center justify-center",
                                textAlignment === 'right' 
                                  ? 'border-primary bg-primary/10 text-primary-600' 
                                  : 'border-gray-300 hover:border-gray-400'
                              )}
                              title="Align right"
                            >
                              <AlignRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
                            {t('mediaUploader.textEditor.backgroundColor')}
                          </label>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setTextBackgroundColor('transparent')}
                              className={cn(
                                "flex-1 px-2 py-1.5 rounded text-xs border transition-all",
                                textBackgroundColor === 'transparent' 
                                  ? 'border-primary bg-primary/10 text-primary-600' 
                                  : 'border-gray-300 hover:border-gray-400'
                              )}
                              title="No background"
                            >
                              None
                            </button>
                            <input
                              type="color"
                              value={textBackgroundColor === 'transparent' ? '#ffffff' : textBackgroundColor}
                              onChange={(e) => setTextBackgroundColor(e.target.value)}
                              className="w-8 h-8 p-0 border rounded cursor-pointer"
                              title="Pick background color"
                            />
                            <button
                              type="button"
                              onClick={() => setTextBackgroundColor('rgba(255,255,255,0.8)')}
                              className={cn(
                                "px-2 py-1.5 rounded text-xs border transition-all bg-white/80 text-gray-800",
                                textBackgroundColor === 'rgba(255,255,255,0.8)' 
                                  ? 'border-primary' 
                                  : 'border-gray-300 hover:border-gray-400'
                              )}
                              title="Semi-transparent white"
                            >
                              White
                            </button>
                            <button
                              type="button"
                              onClick={() => setTextBackgroundColor('rgba(0,0,0,0.6)')}
                              className={cn(
                                "px-2 py-1.5 rounded text-xs border transition-all bg-black/60 text-white",
                                textBackgroundColor === 'rgba(0,0,0,0.6)' 
                                  ? 'border-primary' 
                                  : 'border-gray-300 hover:border-gray-400'
                              )}
                              title="Semi-transparent black"
                            >
                              Black
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Add draggable indicator */}
                      <div className="flex items-center text-xs text-primary-500 mt-2 bg-primary-50 dark:bg-primary-900/20 p-2 rounded-md">
                        <Move className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        <span>{t('mediaUploader.textEditor.positionHint')}</span>
                      </div>
                    </div>
                  )}

                  {!isVideo && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium flex items-center">
                        <Sliders className="h-3.5 w-3.5 mr-1.5" />
                        {t('mediaUploader.filters.title')}
                      </p>
                      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
                        {imageFilters.map((filter) => (
                          <button
                            key={filter.name}
                            onClick={() => handleFilterChange(filter.class)}
                            className={cn(
                              "min-w-[70px] flex-shrink-0 text-xs p-2 rounded-lg border transition-all",
                              selectedFilter === filter.class 
                                ? 'border-primary bg-primary/10 text-primary-600 dark:bg-primary/20 shadow-sm' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                              "flex flex-col items-center gap-1"
                            )}
                            title={filter.description}
                          >
                            {filter.icon}
                            <span>{filter.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edit buttons with improved layout */}
                  <div className="flex justify-around gap-2">
                    {!isVideo && (
                      <>
                        <button 
                          className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                          onClick={handleRotate}
                        >
                          <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                            <RotateCw className="h-5 w-5" />
                          </div>
                          <span className="text-xs mt-1">{t('mediaUploader.controls.rotate')}</span>
                        </button>
                        <button 
                          className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                          onClick={handleCounterRotate}
                        >
                          <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                            <RotateCcw className="h-5 w-5" />
                          </div>
                          <span className="text-xs mt-1">{t('mediaUploader.controls.counter')}</span>
                        </button>
                        <button 
                          className={cn(
                            "text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center",
                            isCropMode ? 'text-primary dark:text-primary' : ''
                          )}
                          onClick={handleCrop}
                        >
                          <div className={cn(
                            "p-2 rounded-full", 
                            isCropMode ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          )}>
                            <Crop className="h-5 w-5" />
                          </div>
                          <span className="text-xs mt-1">{t('mediaUploader.controls.crop')}</span>
                        </button>
                      </>
                    )}
                    <button 
                      className={cn(
                        "text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center",
                        showTextEditor ? 'text-primary dark:text-primary' : ''
                      )}
                      onClick={handleAddText}
                    >
                      <div className={cn(
                        "p-2 rounded-full", 
                        showTextEditor ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}>
                        <Type className="h-5 w-5" />
                      </div>
                      <span className="text-xs mt-1">{t('mediaUploader.controls.text')}</span>
                    </button>
                    <button 
                      className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                      onClick={handleRemoveMedia}
                    >
                      <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        <RefreshCw className="h-5 w-5" />
                      </div>
                      <span className="text-xs mt-1">{t('mediaUploader.controls.reset')}</span>
                    </button>
                    <button 
                      className={`text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center ${isLoading.saving ? 'opacity-70' : ''}`}
                      onClick={handleSaveEdits}
                      disabled={isLoading.saving}
                    >
                      <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        {isLoading.saving ? (
                          <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Check className="h-5 w-5" />
                        )}
                      </div>
                      <span className="text-xs mt-1">{isLoading.saving ? t('mediaUploader.controls.saving') : t('mediaUploader.controls.save')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8 text-center min-h-[350px]">
                <div className="text-gray-400 dark:text-gray-600 max-w-xs">
                  <div className="mx-auto w-24 h-24 mb-4 opacity-30">
                    <img src="/placeholder.svg" alt="No media selected" className="w-full h-full" />
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-2">{t('mediaUploader.preview.noMediaTitle')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {t('mediaUploader.preview.noMediaDescription')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add a simple fade-in animation
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  /* Custom scrollbar for filter section */
  .scrollbar-thin::-webkit-scrollbar {
    height: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  
  .dark .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }
`;

// Add the styles to the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}

export default MediaUploader;