// MediaUploader.tsx - IMPROVED VERSION WITH EMBEDDED TEXT EDITOR AND EMOJI PICKER
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

  // Apply all edits and save to canvas
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
                className="flex-1 flex items-center justify-center gap-2 py-5 rounded-xl text-base"
              >
                <Upload className="h-4 w-4" />
                Upload Media
              </Button>
              <Button 
                variant={streamActive ? "default" : "secondary"}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-5 rounded-xl text-base
                  ${isCapturing ? 'opacity-80 cursor-wait' : ''}
                  ${streamActive ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
                `}
                onClick={handleCameraClick}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin mr-1"></div>
                    Starting Camera...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    {streamActive ? 'Camera Active' : 'Use Camera'}
                  </>
                )}
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
            
            {/* Camera feed with improved UI */}
            {streamActive && (
              <div className="mt-5 border rounded-xl overflow-hidden shadow-md animate-fadeIn">
                <div className="relative bg-black">
                  {cameraError ? (
                    <div className="p-8 text-center text-white">
                      <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-500" />
                      <p className="text-red-400 font-medium">Camera Error</p>
                      <p className="text-sm text-gray-400 mt-1">{cameraError}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4 bg-gray-800 text-white border-gray-700"
                        onClick={() => {
                          setCameraError(null);
                          setStreamActive(false);
                        }}
                      >
                        Dismiss
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
                      Camera active - click the button to capture
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
                      Close
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
                      
                      {/* Draggable text overlay */}
                      {textOverlay && (
                        <div 
                          ref={textDivRef}
                          className={`absolute cursor-move whitespace-pre-wrap break-words text-center transition-all duration-100
                            ${isTextDragging ? 'opacity-90 scale-105 shadow-xl ring-2 ring-primary/40' : ''}`}
                          style={{
                            top: `${textPosition.y}%`,
                            left: `${textPosition.x}%`,
                            transform: `translate(-50%, -50%) rotate(${textRotation}deg)`,
                            color: textColor,
                            fontSize: `${textSize}px`,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            maxWidth: '90%',
                            padding: '8px',
                            borderRadius: '4px',
                            zIndex: 10,
                            backgroundColor: isTextDragging ? 'rgba(0,0,0,0.1)' : 'transparent',
                            touchAction: 'none', // Prevent default touch actions
                          }}
                          onPointerDown={handleTextPointerDown}
                          onPointerMove={handleTextPointerMove}
                          onPointerUp={handleTextPointerUp}
                        >
                          {textOverlay}
                          {isTextDragging && (
                            <>
                              <div className="absolute inset-0 bg-blue-500/10 border border-blue-500/40 rounded pointer-events-none"></div>
                              {/* Drag handles for visual feedback */}
                              <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Crop overlay */}
                      {isCropMode && (
                        <div className="absolute inset-0 border-2 border-dashed border-primary bg-black bg-opacity-50 rounded-md">
                          <div className="absolute inset-10 border-2 border-white rounded"></div>
                          <div className="absolute bottom-2 right-2 bg-white/90 text-xs text-gray-800 px-2 py-1 rounded shadow-sm">
                            Crop mode active
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Media editing controls */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  {/* Embedded text editor - appears when text button is clicked */}
                  {showTextEditor && !isVideo && (
                    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium flex items-center">
                          <Type className="h-4 w-4 mr-1.5 text-primary" />
                          Add Text Overlay
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
                            placeholder="Enter text to display on your image..."
                            rows={2}
                            style={{ minHeight: '48px', maxHeight: '120px', resize: 'vertical' }}
                          />
                          <button
                            className="absolute right-2 bottom-2 text-gray-500 hover:text-primary"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">
                            Text Color
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
                              title="Set text color to black"
                            >
                              Black
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">
                            Text Size: {textSize}px
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
                          Text Rotation: {textRotation}&deg;
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
                      
                      {/* Add draggable indicator */}
                      <div className="flex items-center text-xs text-primary-500 mt-2 bg-primary-50 dark:bg-primary-900/20 p-2 rounded-md">
                        <Move className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        <span>Click and drag the text on the image to position it</span>
                      </div>
                    </div>
                  )}

                  {!isVideo && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium flex items-center">
                        <Sliders className="h-3.5 w-3.5 mr-1.5" />
                        Apply Filters:
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
                          <span className="text-xs mt-1">Rotate</span>
                        </button>
                        <button 
                          className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                          onClick={handleCounterRotate}
                        >
                          <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                            <RotateCcw className="h-5 w-5" />
                          </div>
                          <span className="text-xs mt-1">Counter</span>
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
                          <span className="text-xs mt-1">Crop</span>
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
                      <span className="text-xs mt-1">Text</span>
                    </button>
                    <button 
                      className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                      onClick={handleRemoveMedia}
                    >
                      <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        <RefreshCw className="h-5 w-5" />
                      </div>
                      <span className="text-xs mt-1">Reset</span>
                    </button>
                    <button 
                      className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                      onClick={handleSaveEdits}
                    >
                      <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Check className="h-5 w-5" />
                      </div>
                      <span className="text-xs mt-1">Save</span>
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
                  <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-2">Media Preview</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Upload an image or video, or use your camera to capture a photo.
                    Your media will appear here for editing.
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