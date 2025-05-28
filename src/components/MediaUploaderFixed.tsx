// MediaUploader.tsx - FIXED VERSION - Resolves text duplication issue
import React, { useState, useRef, useCallback, useEffect, MouseEvent, TouchEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Upload, Camera, X, RotateCw, Crop, Type, RefreshCw, Check,
  Sliders, FileEdit, RotateCcw, Image, FileText, AlertCircle,
  VideoIcon, Info, Sparkles, SmilePlus, Move
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
  const [hasTextBakedIn, setHasTextBakedIn] = useState(false); // NEW: Track if text is baked into image
  
  // Drag offset for text positioning
  const dragOffset = useRef({ x: 0, y: 0 });

  // Enhanced image filters with icons and descriptions
  const imageFilters: ImageFilter[] = [
    { name: 'Original', class: '', icon: <Image className="h-3 w-3" />, description: 'No filter applied' },
    { name: 'Grayscale', class: 'grayscale', icon: <Sliders className="h-3 w-3" />, description: 'Black and white effect' },
    { name: 'Sepia', class: 'sepia', icon: <Sliders className="h-3 w-3" />, description: 'Warm vintage look' },
    { name: 'Invert', class: 'invert', icon: <RefreshCw className="h-3 w-3" />, description: 'Negative effect' },
    { name: 'Blur', class: 'blur-sm', icon: <Sliders className="h-3 w-3" />, description: 'Soft focus effect' },
    { name: 'Brightness', class: 'brightness-125', icon: <Sparkles className="h-3 w-3" />, description: 'Brighter image' },
    { name: 'Contrast', class: 'contrast-125', icon: <Sliders className="h-3 w-3" />, description: 'Enhanced contrast' },
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

  // Handle drag events for file drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, []);

  // File validation and handling
  const handleFiles = (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    const fileType = file.type;
    const fileSize = file.size / (1024 * 1024); // Convert to MB

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const isValidType = [...validImageTypes, ...validVideoTypes].includes(fileType);

    if (!isValidType) {
      toast.error("Invalid file type. Please upload JPG, PNG, GIF, WebP, MP4, WebM, or MOV files.");
      return;
    }

    // Validate file size
    if (fileSize > 50) {
      toast.error("File is too large. Maximum size is 50MB.");
      return;
    }

    // Reset editing states
    setRotationAngle(0);
    setSelectedFilter('');
    setTextOverlay('');
    setTextPosition({ x: 50, y: 50 });
    setIsCropMode(false);
    setCameraError(null);
    setProcessedImageUrl(null);
    setShowTextEditor(false);
    setHasTextBakedIn(false); // Reset text baked in state

    onMediaSelect(file);
    toast.success("Media uploaded successfully!");
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
    setIsCropMode(false);
    setProcessedImageUrl(null);
    setShowTextEditor(false);
    setHasTextBakedIn(false); // Reset text baked in state
    
    toast.success("Media removed");
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
        throw new Error("Camera access not supported in this browser");
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
        throw new Error("Video element not available");
      }
      
      // Assign the stream to the video element
      videoRef.current.srcObject = stream;
      
      // Wait for video metadata to load
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              setIsCapturing(false);
              toast.success("Camera activated successfully");
            })
            .catch(err => {
              console.error("Error playing video:", err);
              setCameraError("Could not start video playback");
              setIsCapturing(false);
            });
        }
      };
      
      videoRef.current.onerror = () => {
        setCameraError("Error loading video stream");
        setIsCapturing(false);
      };
      
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setCameraError(err.message || "Could not access the camera");
      setStreamActive(false);
      setIsCapturing(false);
      
      if (err.name === 'NotAllowedError') {
        toast.error("Camera access denied. Please check your browser permissions.");
      } else if (err.name === 'NotFoundError') {
        toast.error("No camera detected on your device.");
      } else {
        toast.error(`Camera error: ${err.message}`);
      }
    }
  };

  // FIXED CAPTURE FUNCTION
  const handleCapturePhoto = () => {
    if (!streamActive || !streamRef.current || !videoRef.current || !canvasRef.current) {
      toast.error("Camera not active or couldn't access camera elements");
      return;
    }
    
    try {
      setIsCapturing(true);
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      // Set canvas dimensions to match video dimensions
      canvas.width = video.videoWidth || 640; // Fallback width
      canvas.height = video.videoHeight || 480; // Fallback height
      
      // Check if video dimensions are valid
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Invalid video dimensions");
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
          toast.success("Photo captured successfully!");
        } else {
          throw new Error("Failed to create image blob");
        }
        setIsCapturing(false);
      }, 'image/jpeg', 0.95);
      
    } catch (err: any) {
      console.error('Error capturing photo:', err);
      toast.error(`Failed to capture photo: ${err.message}`);
      setIsCapturing(false);
    }
  };

  // Image editing functions
  const handleRotate = () => {
    if (!selectedMedia) {
      toast("Upload an image or video first!");
      return;
    }
    
    // Only allow rotation for images
    if (!selectedMedia.type.startsWith('image/')) {
      toast("Rotation is only available for images");
      return;
    }
    
    setRotationAngle((prevAngle) => (prevAngle + 90) % 360);
    toast.success("Image rotated 90° clockwise");
  };

  const handleCounterRotate = () => {
    if (!selectedMedia) {
      toast("Upload an image or video first!");
      return;
    }
    
    // Only allow rotation for images
    if (!selectedMedia.type.startsWith('image/')) {
      toast("Rotation is only available for images");
      return;
    }
    
    setRotationAngle((prevAngle) => (prevAngle - 90 + 360) % 360);
    toast.success("Image rotated 90° counter-clockwise");
  };

  const handleCrop = () => {
    if (!selectedMedia) {
      toast("Upload an image or video first!");
      return;
    }
    
    // Only allow crop for images for now
    if (!selectedMedia.type.startsWith('image/')) {
      toast("Cropping is only available for images");
      return;
    }
    
    setIsCropMode(!isCropMode);
    if (!isCropMode) {
      toast.success("Crop mode enabled. Drag to adjust crop area.");
    } else {
      toast.success("Crop mode disabled");
    }
  };

  const handleAddText = () => {
    if (!selectedMedia) {
      toast("Upload an image or video first!");
      return;
    }
    
    setShowTextEditor(!showTextEditor);
    
    if (!showTextEditor) {
      toast.success("Text editor activated. Type your text and position it on the image.");
    }
  };

  const handleFilterChange = (filterClass: string) => {
    setSelectedFilter(filterClass);
    toast.success(`Filter applied: ${filterClass ? filterClass : 'Original'}`);
  };

  // Emoji picker handler
  const handleEmojiSelect = (emoji: any) => {
    setTextOverlay(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  // Unified pointer event handlers for text positioning
  const handleTextPointerDown = (e: React.PointerEvent) => {
    if (!textDivRef.current || !imageRef.current) return;
    
    // Capture pointer to ensure all events go to this element
    textDivRef.current.setPointerCapture(e.pointerId);
    setIsTextDragging(true);
    
    // Get element and image bounds
    const textRect = textDivRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    // Calculate offset from pointer position to text center
    dragOffset.current = {
      x: e.clientX - (textRect.left + textRect.width / 2),
      y: e.clientY - (textRect.top + textRect.height / 2)
    };
  };

  const handleTextPointerMove = (e: React.PointerEvent) => {
    if (!isTextDragging || !textDivRef.current || !imageRef.current) return;
    
    // Calculate new position based on image bounds
    const imageRect = imageRef.current.getBoundingClientRect();
    const textRect = textDivRef.current.getBoundingClientRect();
    
    // Convert to percentage coordinates relative to image
    const newX = ((e.clientX - dragOffset.current.x - imageRect.left) / imageRect.width) * 100;
    const newY = ((e.clientY - dragOffset.current.y - imageRect.top) / imageRect.height) * 100;
    
    // Calculate text dimensions as percentages of image
    const textWidthPercent = (textRect.width / imageRect.width) * 100;
    const textHeightPercent = (textRect.height / imageRect.height) * 100;
    
    // Add padding to prevent text from touching edges
    const paddingPercent = 2; // 2% padding from edges
    
    // Clamp values with padding and text size consideration
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
    
    // Release pointer capture
    textDivRef.current.releasePointerCapture(e.pointerId);
    setIsTextDragging(false);
  };

  // FIXED: Apply all edits and save to canvas - prevents text duplication
  const handleSaveEdits = () => {
    if (!selectedMedia || !selectedMedia.type.startsWith('image/') || !imageRef.current) {
      toast.error("Can't save edits. Valid image required.");
      return;
    }
    
    try {
      // Create a canvas to combine image + edits
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not create canvas context");
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
        // This is simplified - in a real app you'd need to implement
        // each filter effect manually on the canvas
        // For now, we'll just add a note
        console.log("Filter effects would be applied here:", selectedFilter);
      }
      
      // Draw the text overlay if present
      if (textOverlay) {
        ctx.save();
        ctx.font = `${textSize}px Arial`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Calculate pixel positions from percentages
        const x = (textPosition.x / 100) * canvas.width;
        const y = (textPosition.y / 100) * canvas.height;
        ctx.translate(x, y);
        ctx.rotate((textRotation * Math.PI) / 180);
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        // Handle multi-line text by splitting on newlines
        const lines = textOverlay.split('\n');
        const lineHeight = textSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;
        lines.forEach((line, i) => {
          const yOffset = i * lineHeight - (totalTextHeight - lineHeight) / 2;
          ctx.fillText(line, 0, yOffset);
        });
        ctx.restore();
      }
      
      // Convert canvas to blob and create a new URL
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a new object URL for the processed image
          const processedUrl = URL.createObjectURL(blob);
          setProcessedImageUrl(processedUrl);
          
          // Create a File object from the blob that could be used for sharing
          const processedFile = new File([blob], `edited_${selectedMedia.name}`, { 
            type: "image/jpeg" 
          });
          
          // Update the selected media with the edited version
          onMediaSelect(processedFile);
          
          // FIXED: Clear the text overlay and mark as baked in to prevent duplication
          setTextOverlay('');
          setHasTextBakedIn(true);
          
          toast.success("Edits saved to image!");
          
          // Reset editing state
          setShowTextEditor(false);
        }
      }, 'image/jpeg', 0.95);
      
    } catch (err: any) {
      console.error('Error saving edits:', err);
      toast.error(`Failed to save edits: ${err.message}`);
    }
  };

  const handleTextOnlyClick = () => {
    onTextOnlySelect();
    toast.success("Text-only mode activated");
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
        {/* Welcoming header section */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-1 text-gray-800 dark:text-white flex items-center">
            <span>Welcome, {userProfile?.displayName || currentUser?.displayName || 'User'}</span>
            <button 
              onClick={() => setShowPopupTips(!showPopupTips)}
              className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              aria-label="Show tips"
            >
              <Info className="h-4 w-4" />
            </button>
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Upload your media or capture directly to create engaging AI-powered captions.
          </p>
          
          {/* Tips popup */}
          {showPopupTips && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-sm animate-fadeIn">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Quick Tips:</p>
                  <ul className="text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• <span className="font-medium">Upload</span> images or videos up to 50MB</li>
                    <li>• <span className="font-medium">Capture</span> photos directly from your device camera</li>
                    <li>• <span className="font-medium">Edit</span> your images with filters, text and rotation</li>
                    <li>• <span className="font-medium">Drag</span> text overlays by clicking and moving them</li>
                    <li>• <span className="font-medium">Save</span> your edits to create a finished image</li>
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
                  Drag & drop your media here, or click to select
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-500">
                  Supports JPG, PNG, GIF, WebP, MP4, WebM (max 50MB)
                </p>
              </div>
            </div>

            {/* Action buttons with improved appearance */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button 
                onClick={handleUploadClick}
                className="flex-1 flex items-center justify-center gap-2 py-5 rounded-xl text-base text-color-500 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Upload className="h-4 w-4" />
                Upload Media: Image or Video
              </Button>
            </div>

            {/* Text-only option */}
            <div className="text-center mt-4">
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-sm">or</span>
                <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <button 
                className="mt-3 px-4 py-2 text-primary hover:text-primary-dark hover:underline flex items-center justify-center gap-2 mx-auto"
                onClick={handleTextOnlyClick}
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium">Create text-only caption</span>
              </button>
            </div>
            
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
                    aria-label="Remove media"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Media preview with integrated text editor */}
                <div className="relative flex-grow bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden p-4">
                  {isVideo ? (
                    <div className="relative max-w-full">
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center shadow-sm">
                        <VideoIcon className="h-3 w-3 mr-1" />
                        Video
                      </div>
                      <video 
                        src={displayUrl} 
                        controls
                        className="max-h-[350px] max-w-full object-contain rounded-md shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                                            <img 
                                              ref={imageRef}
                                              src={displayUrl}
                                              alt="Preview" 
                                              className={`${selectedFilter} transition-all rounded-md shadow-sm max-h-[350px] relative`}
                                              style={imageStyle}
                                            />
                                            
                                            {/* Text overlay */}
                                            {(textOverlay && !hasTextBakedIn) && (
                                              <div 
                                                ref={textDivRef}
                                                className={`absolute text-center ${isTextDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                                style={{
                                                  left: `${textPosition.x}%`,
                                                  top: `${textPosition.y}%`,
                                                  transform: `translate(-50%, -50%) rotate(${textRotation}deg)`,
                                                  color: textColor,
                                                  fontSize: `${textSize}px`,
                                                  maxWidth: '80%',
                                                  textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
                                                  userSelect: 'none',
                                                  pointerEvents: 'auto'
                                                }}
                                                onPointerDown={handleTextPointerDown}
                                                onPointerMove={handleTextPointerMove}
                                                onPointerUp={handleTextPointerUp}
                                              >
                                                {textOverlay}
                                                <button 
                                                  className="absolute -right-6 -top-6 bg-black/70 text-white p-1 rounded-full opacity-70 hover:opacity-100"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTextOverlay('');
                                                  }}
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                                <button 
                                                  className="absolute -left-6 -top-6 bg-black/70 text-white p-1 rounded-full opacity-70 hover:opacity-100"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTextRotation((prev) => (prev + 15) % 360);
                                                  }}
                                                >
                                                  <RotateCw className="h-3 w-3" />
                                                </button>
                                                <div className="absolute -translate-x-1/2 left-1/2 -bottom-6 flex gap-1">
                                                  <Move className="h-3 w-3 text-white drop-shadow-md" />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Controls toolbar for image editing */}
                                      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex flex-wrap gap-2 justify-center">
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={handleRotate}
                                            disabled={isVideo}
                                            className="flex items-center gap-1.5 text-xs"
                                          >
                                            <RotateCw className="h-3.5 w-3.5" />
                                            Rotate
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={handleCounterRotate}
                                            disabled={isVideo}
                                            className="flex items-center gap-1.5 text-xs"
                                          >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Counter
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={handleCrop}
                                            disabled={isVideo || true} /* Crop disabled for now */
                                            className="flex items-center gap-1.5 text-xs"
                                          >
                                            <Crop className="h-3.5 w-3.5" />
                                            Crop
                                          </Button>
                                          <Button 
                                            variant={showTextEditor ? "secondary" : "ghost"}
                                            size="sm" 
                                            onClick={handleAddText}
                                            disabled={isVideo}
                                            className="flex items-center gap-1.5 text-xs"
                                          >
                                            <Type className="h-3.5 w-3.5" />
                                            Text
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={handleSaveEdits}
                                            disabled={isVideo}
                                            className="flex items-center gap-1.5 text-xs"
                                          >
                                            <Check className="h-3.5 w-3.5" />
                                            Save Edits
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {/* Text editor panel */}
                                      {showTextEditor && !isVideo && (
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
                                          <div className="flex flex-col space-y-3">
                                            <div className="flex gap-2 items-center">
                                              <Input 
                                                type="text" 
                                                value={textOverlay} 
                                                onChange={(e) => setTextOverlay(e.target.value)}
                                                placeholder="Enter your text..."
                                                className="flex-1 text-sm"
                                              />
                                              <Button 
                                                size="icon" 
                                                variant="outline" 
                                                className="h-8 w-8" 
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                              >
                                                <SmilePlus className="h-4 w-4" />
                                              </Button>
                                            </div>
                                            
                                            {/* Emoji picker */}
                                            {showEmojiPicker && (
                                              <div className="relative z-10">
                                                <div className="absolute right-0">
                                                  <Picker 
                                                    data={data} 
                                                    onEmojiSelect={handleEmojiSelect}
                                                    theme="light"
                                                    set="native"
                                                  />
                                                </div>
                                              </div>
                                            )}
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Text Size</label>
                                                <Slider 
                                                  min={10} 
                                                  max={72} 
                                                  step={1}
                                                  value={[textSize]}
                                                  onValueChange={(value) => setTextSize(value[0])}
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Text Color</label>
                                                <div className="grid grid-cols-6 gap-1">
                                                  {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(color => (
                                                    <button
                                                      key={color}
                                                      className={`h-6 w-6 rounded-full border-2 ${textColor === color ? 'border-blue-500' : 'border-gray-300'}`}
                                                      style={{ backgroundColor: color }}
                                                      onClick={() => setTextColor(color)}
                                                      aria-label={`Select color ${color}`}
                                                    />
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : streamActive && videoRef.current ? (
                                    <div className="relative h-full flex flex-col">
                                      <div className="absolute top-3 right-3 z-10">
                                        <button 
                                          className="bg-gray-900/70 hover:bg-gray-900/90 text-white rounded-full p-1.5 shadow-md"
                                          onClick={handleRemoveMedia}
                                          aria-label="Stop camera"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                      
                                      {/* Camera feed */}
                                      <div className="flex-grow bg-black flex items-center justify-center overflow-hidden">
                                        <video 
                                          ref={videoRef}
                                          autoPlay
                                          playsInline
                                          muted
                                          className="max-h-[350px] max-w-full"
                                        />
                                      </div>
                                      
                                      {/* Camera controls */}
                                      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                        <Button 
                                          onClick={handleCapturePhoto}
                                          className="w-full py-5 rounded-xl text-base"
                                          disabled={isCapturing}
                                        >
                                          {isCapturing ? (
                                            <div className="flex items-center gap-2">
                                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                              Processing...
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <Camera className="h-4 w-4" />
                                              Capture Photo
                                            </div>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center p-8 h-full">
                                      <div className="text-gray-400 dark:text-gray-500 text-center">
                                        <FileEdit className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">
                                          {cameraError ? (
                                            <span className="flex items-center gap-1 justify-center text-red-500">
                                              <AlertCircle className="h-4 w-4" />
                                              {cameraError}
                                            </span>
                                          ) : (
                                            "Upload or capture media to preview it here"
                                          )}
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
                      
                      export default MediaUploader;
