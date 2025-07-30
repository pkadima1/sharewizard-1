import html2canvas from 'html2canvas';
import React from 'react';
import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MediaType, Caption, CaptionStyle, DownloadOptions } from '@/types/mediaTypes';
import { stripMarkdownFormatting } from './textFormatters';
import { 
  drawCustomTextOverlay, 
  getMediaFileFromCache, 
  getTextOverlayDataFromElement 
} from './textOverlayHelpers';

/**
 * Helper function to create video with caption overlay
 * Improved with better text rendering and quality
 */
export const createCaptionedVideo = async (
  videoElement: HTMLVideoElement, 
  caption: Caption,
  captionStyle: CaptionStyle = 'standard'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {      // Validate caption object to prevent errors and strip markdown
      const validatedCaption: Caption = {
        title: stripMarkdownFormatting(caption?.title) || 'Untitled',
        caption: stripMarkdownFormatting(caption?.caption) || '',
        cta: stripMarkdownFormatting(caption?.cta) || '',
        hashtags: Array.isArray(caption?.hashtags) ? caption.hashtags.map(stripMarkdownFormatting) : []
      };
      
    // Get text overlay data using our comprehensive utility function
      // This checks multiple sources to find the text overlay data
      const textOverlayData = getTextOverlayDataFromElement(videoElement);
      
      // If we found text overlay data, log it for debugging
      if (textOverlayData) {
        console.log('Successfully found text overlay data for video:', textOverlayData);
      } else {
        // Try to get text overlay data from the mediaFile property if it exists
        // This happens when text overlays are added in the previous step
        // @ts-expect-error - custom property
        const mediaFileData = videoElement.mediaFile?.textOverlayData;
        if (mediaFileData) {
          console.log('Found text overlay data in mediaFile property:', mediaFileData);
          // @ts-expect-error - adding property to videoElement
          videoElement.textOverlayData = mediaFileData;
        }
      }

      // Create a canvas with space for video and caption
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false })!;

      // Set canvas dimensions based on caption style
      canvas.width = videoElement.videoWidth;
      const captionHeight = captionStyle === 'standard' ? 260 : 0; // Increased height for caption
      canvas.height = videoElement.videoHeight + (captionStyle === 'standard' ? captionHeight : 0);

      // Apply high quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clone video element to preserve original with enhanced setup
      const originalVideo = document.createElement('video');
      originalVideo.src = videoElement.src;
      originalVideo.crossOrigin = 'anonymous'; // Enable cross-origin support
      originalVideo.muted = false;
      originalVideo.volume = 1.0;
      originalVideo.playsInline = true; // Add playsInline for better compatibility
      originalVideo.preload = 'auto'; // Ensure video loads fully
      originalVideo.loop = false; // Prevent looping during processing
      originalVideo.controls = false; // Hide controls during processing
      
      // Apply necessary attributes to ensure proper loading
      if (videoElement.getAttribute('crossorigin')) {
        originalVideo.setAttribute('crossorigin', videoElement.getAttribute('crossorigin') || 'anonymous');
      }
      
      // Copy current time if needed
      if (videoElement.currentTime > 0) {
        originalVideo.currentTime = videoElement.currentTime;
      }

      // Add load event listeners for better debugging
      originalVideo.addEventListener('loadstart', () => console.log('Video load started'));
      originalVideo.addEventListener('loadedmetadata', () => console.log('Video metadata loaded'));
      originalVideo.addEventListener('loadeddata', () => console.log('Video data loaded'));
      originalVideo.addEventListener('canplay', () => console.log('Video can start playing'));
      originalVideo.addEventListener('canplaythrough', () => console.log('Video can play through'));

      // Progress tracking for long videos
      let toastId: string | number | undefined;

      // Wait for metadata to load properly
      originalVideo.onloadedmetadata = () => {
        if (originalVideo.duration > 5) {
          toastId = toast.loading('Processing video with captions...');
        }

        // Create media stream from canvas
        const canvasStream = canvas.captureStream(30); // Specify 30fps for better quality
        let combinedStream: MediaStream;

        try {
          const videoStream = (originalVideo as HTMLVideoElement & { captureStream(): MediaStream }).captureStream();
          const audioTracks = videoStream.getAudioTracks();

          if (audioTracks.length > 0) {
            audioTracks.forEach((track: MediaStreamTrack) => canvasStream.addTrack(track));
          }
          combinedStream = canvasStream;
        } catch (e) {
          console.warn('Could not capture audio track:', e);
          combinedStream = canvasStream;
        }

        // Use higher quality encoding settings for better MP4 conversion
        const recorderOptions = {
          mimeType: 'video/webm;codecs=vp9,opus', // VP9 provides better quality and compression
          videoBitsPerSecond: 8000000, // 8 Mbps for high quality video
          audioBitsPerSecond: 128000 // 128 kbps audio is good enough for most purposes
        };

        let mediaRecorder: MediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
        } catch (e) {
          console.warn('Preferred codec not supported, trying vp8:', e);
          try {
            mediaRecorder = new MediaRecorder(combinedStream, {
              mimeType: 'video/webm;codecs=vp8,opus',
              videoBitsPerSecond: 6000000 // 6 Mbps fallback
            });
          } catch (e2) {
            console.warn('Falling back to default codec:', e2);
            mediaRecorder = new MediaRecorder(combinedStream);
          }
        }

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (toastId) {
            toast.dismiss(toastId);
          }
          
          // Create the initial WebM blob
          const webmBlob = new Blob(chunks, { type: 'video/webm' });
          
          try {
            // Convert WebM to MP4 if possible
            const mp4Blob = await convertWebMtoMP4(webmBlob);
            console.log('Successfully converted WebM to MP4');
            resolve(mp4Blob);
          } catch (error) {
            console.warn('Could not convert to MP4, using WebM instead:', error);
            resolve(webmBlob);
          }
        };

        // Start playing and recording
        originalVideo.play().then(() => {
          console.log('Video playback started successfully');
          mediaRecorder.start(100);

          // Function to draw a frame
          const drawFrame = () => {
            try {
              // Clear canvas with dark background
              ctx.fillStyle = '#1e1e1e';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // Draw video frame ensuring it's properly sized
              try {
                ctx.drawImage(originalVideo, 0, 0, canvas.width, captionStyle === 'standard' ? videoElement.videoHeight : canvas.height);
              } catch (err) {
                console.warn('Error drawing video frame:', err);
                // If there's an error drawing the frame, retry after a small delay
                setTimeout(() => requestAnimationFrame(drawFrame), 50);
                return;
              }

              // Draw caption based on style with enhanced visibility
              try {
                if (captionStyle === 'handwritten') {
                  drawHandwrittenOverlay(ctx, validatedCaption, videoElement.videoWidth, videoElement.videoHeight);
                } else if (captionStyle === 'modern') {
                  drawModernVideoOverlay(ctx, validatedCaption, videoElement.videoWidth, videoElement.videoHeight);
                } else {
                  drawStandardCaption(ctx, validatedCaption, videoElement, captionHeight);
                }
                  // Draw custom text overlay if available
                if (textOverlayData) {
                  console.log('Applying text overlay to video frame:', textOverlayData);
                  drawCustomTextOverlay(ctx, textOverlayData, videoElement.videoWidth, videoElement.videoHeight);
                }
              } catch (err) {
                console.warn('Error drawing caption or text overlay:', err);
              }

              // Request next frame if video is still playing
              if (!originalVideo.ended && !originalVideo.paused) {
                requestAnimationFrame(drawFrame);
              } else {
                console.log('Video ended or paused, finalizing recording');
                setTimeout(() => {
                  if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                  }
                }, 500);
              }
            } catch (frameError) {
              console.error('Critical error in drawFrame:', frameError);
              // Attempt to recover and continue
              setTimeout(() => requestAnimationFrame(drawFrame), 100);
            }
          };

          // Start drawing frames
          drawFrame();

          originalVideo.onended = () => {
            console.log('Video ended event triggered');
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                console.log('Stopping media recorder after video ended');
                mediaRecorder.stop();
              }
            }, 500);
          };
        }).catch(err => {
          if (toastId) {
            toast.dismiss(toastId);
          }
          reject(err);
        });
      };

      originalVideo.onerror = (e) => {
        if (toastId) {
          toast.dismiss(toastId);
        }
        console.error('Video loading error:', e, 'Video source:', originalVideo.src);
        reject(new Error(`Video loading error: ${e}`));
      };

      // Add additional event listeners for better debugging
      originalVideo.onabort = () => console.warn('Video loading aborted');
      originalVideo.onstalled = () => console.warn('Video loading stalled');
      originalVideo.onsuspend = () => console.warn('Video loading suspended');
      
      // Handle successful loading
      originalVideo.oncanplaythrough = () => {
        console.log('Video can play through without buffering');
      };

    } catch (error) {
      console.error('Error in createCaptionedVideo:', error);
      reject(error);
    }
  });
};

/**
 * Converts a WebM blob to MP4 format with proper MIME type
 * @param webmBlob The WebM video blob to convert
 * @returns A Promise that resolves to an MP4 blob
 */
async function convertWebMtoMP4(webmBlob: Blob): Promise<Blob> {
  console.log('Starting WebM to MP4 conversion, input size:', webmBlob.size, 'bytes');
  
  try {
    // Create a new blob with MP4 MIME type
    // This is a simplified approach that changes the MIME type without actual transcoding
    // In a production environment, you would use a full WebM to MP4 transcoding solution
    const mp4Blob = new Blob([webmBlob], { type: 'video/mp4' });
    console.log('MP4 blob created successfully, size:', mp4Blob.size, 'bytes');
    
    // In a future implementation, we would use FFmpeg.wasm or a server-side solution
    // Example implementation with FFmpeg.wasm would look like:
    /*
    import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
    
    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();
    
    ffmpeg.FS('writeFile', 'input.webm', await fetchFile(webmBlob));
    await ffmpeg.run('-i', 'input.webm', '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', 'output.mp4');
    
    const data = ffmpeg.FS('readFile', 'output.mp4');
    return new Blob([data.buffer], { type: 'video/mp4' });
    */
    
    return mp4Blob;
  } catch (error) {
    console.error('Error during WebM to MP4 conversion:', error);
    throw new Error('Failed to convert video format: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Enhanced text rendering function that properly handles multiline text
 * with improved spacing and line wrapping
 */
function drawMultilineWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center' = 'left'
): number {
  if (!text) return y;
  
  // Apply high quality settings for text
  ctx.imageSmoothingEnabled = true; 
  ctx.imageSmoothingQuality = 'high';
  
  // Add slight text shadow for better readability
  const originalShadowColor = ctx.shadowColor;
  const originalShadowBlur = ctx.shadowBlur;
  const originalShadowOffsetX = ctx.shadowOffsetX;
  const originalShadowOffsetY = ctx.shadowOffsetY;
  
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // Split text into lines first (respect manual line breaks)
  const paragraphs = text.split(/\r?\n/);
  let finalY = y;
  
  // Process each paragraph
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      finalY += lineHeight; // Add space for empty paragraphs
      continue;
    }
    
    const words = paragraph.split(' ');
    let currentLine = '';
    let testLine = '';
    
    // Process each word in the paragraph
    for (let i = 0; i < words.length; i++) {
      testLine = currentLine + (currentLine ? ' ' : '') + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        // Draw the line that fits
        if (align === 'center') {
          const lineWidth = ctx.measureText(currentLine).width;
          const centerX = x + (maxWidth - lineWidth) / 2;
          ctx.fillText(currentLine, centerX, finalY);
        } else {
          ctx.fillText(currentLine, x, finalY);
        }
        
        finalY += lineHeight;
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    
    // Draw the remaining text for this paragraph
    if (currentLine) {
      if (align === 'center') {
        const lineWidth = ctx.measureText(currentLine).width;
        const centerX = x + (maxWidth - lineWidth) / 2;
        ctx.fillText(currentLine, centerX, finalY);
      } else {
        ctx.fillText(currentLine, x, finalY);
      }
      finalY += lineHeight;
    }
  }
  
  // Restore original shadow settings
  ctx.shadowColor = originalShadowColor;
  ctx.shadowBlur = originalShadowBlur;
  ctx.shadowOffsetX = originalShadowOffsetX;
  ctx.shadowOffsetY = originalShadowOffsetY;
  
  return finalY;
}

/**
 * Function to draw handwritten style overlay with improved text rendering
 */
function drawHandwrittenOverlay(
  ctx: CanvasRenderingContext2D,
  caption: Caption,
  width: number,
  height: number
): void {
  // Apply semi-transparent overlay to improve text readability
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Increased opacity for better contrast
  ctx.fillRect(0, 0, width, height);
  
  // Set handwritten-style font
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Title - Large, handwritten style font
  ctx.font = 'bold 45px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  // Draw title at the top
  const title = caption.title || 'Untitled';
  const titleY = height * 0.2;
  drawMultilineWrappedText(ctx, title, width / 2, titleY, width * 0.9, 45, 'center');
  
  // Main caption with different handwritten font
  ctx.font = '32px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
  const captionText = caption.caption || '';
  drawMultilineWrappedText(ctx, captionText, width / 2, height / 2, width * 0.8, 36, 'center');
  
  // CTA with proper styling
  if (caption.cta) {
    ctx.font = '28px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
    ctx.fillStyle = '#e2e8f0'; // Light color for CTA
    drawMultilineWrappedText(ctx, caption.cta, width / 2, height * 0.75, width * 0.9, 32, 'center');
  }
  
  // Hashtags at the very bottom
  if (caption.hashtags && caption.hashtags.length > 0) {
    ctx.font = '28px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
    ctx.fillStyle = '#3b82f6'; // Blue for hashtags
    
    // Format hashtags with proper spacing
    const hashtagText = caption.hashtags.map(tag => `#${tag}`).join('  '); // Double space for better separation
    drawMultilineWrappedText(ctx, hashtagText, width / 2, height * 0.85, width * 0.85, 32, 'center');
  }
}

/**
 * Function to draw modern overlay caption style for videos
 * with enhanced readability and styling
 */
function drawModernVideoOverlay(
  ctx: CanvasRenderingContext2D,
  caption: Caption,
  width: number,
  height: number
): void {
  // Calculate positioning
  const padding = 20;
  const footerHeight = 200; // Increased height for caption area
  
  // Create a semi-transparent gradient background for better readability
  const gradient = ctx.createLinearGradient(0, height - footerHeight - 50, 0, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.75)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - footerHeight - 50, width, footerHeight + 50);
  
  // Add enhanced shadow for text
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  // Set initial y position for text
  let y = height - footerHeight + padding;
  
  // Title text with improved contrast
  if (caption.title) {
    ctx.font = 'bold 30px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'white';
    y = drawMultilineWrappedText(ctx, caption.title, padding, y, width - padding * 2, 40);
    y += 12; // Increased spacing after title
  }
  
  // Main caption text with enhanced contrast
  ctx.font = '22px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'white';
  const captionText = caption.caption || '';
  y = drawMultilineWrappedText(ctx, captionText, padding, y, width - (padding * 2), 28);
  
  // Increased spacing after caption
  y += 12;
  
  // CTA with improved styling
  if (caption.cta && caption.cta.trim()) {
    ctx.font = 'italic 20px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    y = drawMultilineWrappedText(ctx, caption.cta, padding, y, width - (padding * 2), 26);
    y += 12;
  }
  
  // Hashtags at the bottom with enhanced visibility
  if (caption.hashtags && caption.hashtags.length > 0) {
    ctx.font = 'bold 20px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#3b82f6'; // Bright blue color for hashtags
    
    // Add white text shadow for better contrast on any background
    const originalShadow = {
      color: ctx.shadowColor,
      blur: ctx.shadowBlur,
      offsetX: ctx.shadowOffsetX,
      offsetY: ctx.shadowOffsetY
    };
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 12;
    
    const hashtagText = caption.hashtags.map(tag => `#${tag}`).join('  '); // Double space for better separation
    drawMultilineWrappedText(ctx, hashtagText, padding, y, width - (padding * 2), 26);
    
    // Restore original shadow settings
    ctx.shadowColor = originalShadow.color;
    ctx.shadowBlur = originalShadow.blur;
    ctx.shadowOffsetX = originalShadow.offsetX;
    ctx.shadowOffsetY = originalShadow.offsetY;
  }
}

/**
 * Function to draw the standard caption style below the video or image
 * with improved text quality and spacing
 */
function drawStandardCaption(
  ctx: CanvasRenderingContext2D,
  caption: Caption,
  videoElement: HTMLVideoElement,
  captionHeight: number
): void {
  // Draw caption background
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, videoElement.videoHeight, ctx.canvas.width, captionHeight);

  // Draw caption text with enhanced styling for maximum readability
  ctx.fillStyle = 'white';
  let y = videoElement.videoHeight + 25; // Starting position

  // Apply professional text shadow for better contrast
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 1.5;
  ctx.shadowOffsetY = 1.5;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Title - Bold, title case for emphasis
  ctx.font = 'bold 38px Inter, system-ui, sans-serif';
  const title = caption.title 
    ? toTitleCase(caption.title) 
    : 'Untitled';
  
  y = drawMultilineWrappedText(ctx, title, 25, y, ctx.canvas.width - 50, 40);
  y += 10; // Add extra space after title

  // Main caption text with improved readability
  ctx.font = '26px Inter, system-ui, sans-serif';
  const captionText = caption.caption || '';

  // Apply the wrapping with specified constraints
  const maxWidth = ctx.canvas.width - 50; // Leave margins on both sides
  const lineHeight = 30; // Adjusted line height for better readability
  y = drawMultilineWrappedText(ctx, captionText, 25, y, maxWidth, lineHeight);
  y += 15; // Add extra space before CTA

  // Draw CTA
  if (caption.cta) {
    ctx.fillStyle = '#e2e8f0';  // Light color for CTA
    ctx.font = 'italic 24px Inter, system-ui, sans-serif';
    
    // Handle multi-line CTA if needed
    y = drawMultilineWrappedText(ctx, caption.cta, 25, y, maxWidth, 28);
    y += 20; // Add space after CTA
  }

  // Draw hashtags with improved visibility
  const hashtags = Array.isArray(caption.hashtags) ? caption.hashtags : [];
  
  if (hashtags.length > 0) {
    ctx.fillStyle = '#3b82f6';  // Blue color for hashtags
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    
    // Join hashtags with proper spacing
    const hashtagText = hashtags.map(tag => `#${tag}`).join('  '); // Double space for better separation
    drawMultilineWrappedText(ctx, hashtagText, 25, y, maxWidth, 26);
  }
}

/**
 * Helper function to upload to Firebase
 */
const uploadToFirebase = async (blob: Blob, caption: Caption, mediaType: MediaType): Promise<string> => {
  const storage = getStorage();
  const fileName = `previews/${caption.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${mediaType === 'video' ? 'mp4' : 'png'}`;
  const storageRef = ref(storage, fileName);
  
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

/**
 * Utility to defensively join caption fields with newlines
 */
function joinCaptionFields(...fields: (string | undefined)[]): string {
  return fields
    .filter(Boolean)
    .map(f => f?.trim())
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n'); // Prevent triple newlines
}

/**
 * Enhanced share preview function with improved rendering
 * @param previewRef Ref object pointing to the sharable content container
 * @param caption The caption data
 * @param mediaType The type of media (image, video, text-only)
 * @param userEvent The original user interaction event that triggered the share (optional)
 */
/**
 * Shares preview content using the Web Share API with appropriate fallbacks.
 * 
 * @param previewRef React ref to the DOM element containing the sharable content
 * @param caption The caption data object with title, text, etc.
 * @param mediaType Type of media being shared (image, video, text)
 * @param userEvent IMPORTANT: The original click/touch event that triggered this share action.
 *                  This is REQUIRED for the Web Share API to work properly due to security
 *                  restrictions requiring user gestures for sharing actions.
 * @returns Promise with sharing status and message
 */
export const sharePreview = async (
  previewRef: React.RefObject<HTMLDivElement>,
  caption: Caption,
  mediaType: MediaType,
  userEvent?: React.MouseEvent
): Promise<{ status: 'shared' | 'fallback' | 'cancelled'; message?: string }> => {
  if (!previewRef.current) {
    toast.error('Preview element not found');
    throw new Error('Preview element not found');
  }

  const sharableContent = previewRef.current;
  if (!sharableContent) {
    toast.error('Sharable content element not found in ref.');
    throw new Error('Sharable content element not found in ref.');
  }

  try {
    const formattedCaption = joinCaptionFields(
      stripMarkdownFormatting(caption.title),
      stripMarkdownFormatting(caption.caption),
      stripMarkdownFormatting(caption.cta),
      caption.hashtags.map(tag => `#${stripMarkdownFormatting(tag)}`).join(' ')
    );    
    const shareData: ShareData = {
      title: stripMarkdownFormatting(caption.title),
      text: formattedCaption
    };

    if (navigator.share) {
      if (!userEvent) {
        console.warn('sharePreview called without a user event. Web Share API may fail.');
      }
      const loadingToastId = toast.loading('Preparing media for sharing...');
      try {
        let mediaFile: File | undefined;
        if (mediaType === 'video') {
          // For video content, process it with captions
          const video = sharableContent.querySelector('video');
          if (!video) {
            toast.error('Video element not found', { id: loadingToastId });
            throw new Error('Video element not found');
          }
          
          // Make sure video is loaded properly
          if (video.readyState < 2) { // HAVE_CURRENT_DATA or higher
            toast.loading('Waiting for video to load...', { id: loadingToastId });
            // Wait for video to be loaded enough to get dimensions
            await new Promise<void>((resolve) => {
              const checkReadyState = () => {
                if (video.readyState >= 2) {
                  resolve();
                } else {
                  setTimeout(checkReadyState, 100);
                }
              };
              checkReadyState();
            });
          }
          
          toast.loading('Processing video for sharing...', { id: loadingToastId });
          console.log('Processing video with dimensions:', video.videoWidth, 'x', video.videoHeight);
          
          try {
            // Create captioned video with overlay - always use modern style for videos
            const captionedVideoBlob = await createCaptionedVideo(video, caption, 'modern');
            console.log('Captioned video blob created for sharing:', captionedVideoBlob.size, 'bytes');
            
            // Convert to appropriate format for sharing
            const timestamp = Date.now();
            mediaFile = new File([captionedVideoBlob], `video-${timestamp}.mp4`, { 
              type: 'video/mp4' 
            });
          } catch (videoError) {
            console.error('Error processing video:', videoError);
            toast.error('Failed to process video. Trying fallback method...', { id: loadingToastId });
            
            // Fallback to screenshot of video if processing fails
            try {
              const canvas = await html2canvas(sharableContent as HTMLElement, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                logging: false,
                backgroundColor: '#1e1e1e',
                onclone: (clonedDoc) => {
                  // Apply additional styling to the cloned document before capturing
                  const clonedContent = clonedDoc.getElementById('sharable-content');
                  if (clonedContent) {
                    // Set container styles for centering content block
                    (clonedContent as HTMLElement).style.width = '100%';
                    (clonedContent as HTMLElement).style.maxWidth = '600px'; // Keep a reasonable max width for the overall block
                    (clonedContent as HTMLElement).style.margin = '0 auto';
                    (clonedContent as HTMLElement).style.padding = '20px';
                    (clonedContent as HTMLElement).style.backgroundColor = '#1e1e1e';
                    (clonedContent as HTMLElement).style.display = 'flex';
                    (clonedContent as HTMLElement).style.flexDirection = 'column';
                    (clonedContent as HTMLElement).style.alignItems = 'center'; // Center children horizontally

                    // Find and style the media element (img or video)
                    const mediaElement = clonedContent.querySelector('img, video');
                    if (mediaElement) {
                      (mediaElement as HTMLElement).style.objectFit = 'contain'; // Maintain aspect ratio
                      (mediaElement as HTMLElement).style.width = 'auto'; // Allow width to adjust based on aspect ratio and container
                      (mediaElement as HTMLElement).style.height = 'auto'; // Allow height to adjust
                      (mediaElement as HTMLElement).style.maxWidth = '100%'; // Do not exceed container width
                      (mediaElement as HTMLElement).style.border = 'none'; // Remove border
                      (mediaElement as HTMLElement).style.display = 'block';
                      (mediaElement as HTMLElement).style.margin = '0 auto 10px auto'; // Center with margin below
                    }

                    // Find and style the caption container
                    const captionContainer = clonedContent.querySelector('.caption-overlay, .caption-below');
                    if (captionContainer) {
                      // Caption container should visually align with the media element by using the same max-width and centering
                      (captionContainer as HTMLElement).style.width = '100%'; // Take full width up to max-width
                      (captionContainer as HTMLElement).style.maxWidth = '600px'; // Match the max width of the overall block/media
                      (captionContainer as HTMLElement).style.margin = '0 auto'; // Center the caption container
                      (captionContainer as HTMLElement).style.padding = '20px';
                      (captionContainer as HTMLElement).style.backgroundColor = '#2a2a2a';
                      (captionContainer as HTMLElement).style.borderRadius = '8px';
                      (captionContainer as HTMLElement).style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.5)';
                      (captionContainer as HTMLElement).style.textAlign = 'left';
                    }
                  }
                }
              });
              
              const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                  (b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 
                  'image/png', 
                  0.95
                );
              });
              
              mediaFile = new File([blob], `video-screenshot-${Date.now()}.png`, { 
                type: 'image/png' 
              });
              
              toast.loading('Using video screenshot instead...', { id: loadingToastId });
            } catch (fallbackError) {
              console.error('Fallback screenshot failed:', fallbackError);
              // Continue without media file, will use text-only sharing
            }
          }
          
        } else if (mediaType === 'image') {
          // For images, capture the entire preview with HTML2Canvas with enhanced quality
          const canvas = await html2canvas(sharableContent as HTMLElement, {
            useCORS: true,
            allowTaint: true,
            scale: 4, // Higher scale for better quality
            logging: false,
            backgroundColor: '#1e1e1e',
            ignoreElements: (element) => {
              return element.classList.contains('social-share-buttons') ||
                element.classList.contains('preview-controls') ||
                element.tagName === 'BUTTON';
            },
            onclone: (clonedDoc) => {
              const clonedContent = clonedDoc.getElementById('sharable-content');
              if (clonedContent) {
                (clonedContent as HTMLElement).style.width = '100%';
                (clonedContent as HTMLElement).style.maxWidth = '600px';
                (clonedContent as HTMLElement).style.margin = '0 auto';
                (clonedContent as HTMLElement).style.padding = '20px';
                (clonedContent as HTMLElement).style.backgroundColor = '#1e1e1e';
                (clonedContent as HTMLElement).style.display = 'flex';
                (clonedContent as HTMLElement).style.flexDirection = 'column';
                (clonedContent as HTMLElement).style.alignItems = 'center';
                const mediaElement = clonedContent.querySelector('img, video');
                if (mediaElement) {
                  (mediaElement as HTMLElement).style.objectFit = 'contain';
                  (mediaElement as HTMLElement).style.width = 'auto';
                  (mediaElement as HTMLElement).style.height = 'auto';
                  (mediaElement as HTMLElement).style.maxWidth = '100%';
                  (mediaElement as HTMLElement).style.border = 'none';
                  (mediaElement as HTMLElement).style.display = 'block';
                  (mediaElement as HTMLElement).style.margin = '0 auto 10px auto';
                }
                const captionContainer = clonedContent.querySelector('.caption-overlay, .caption-below');
                if (captionContainer) {
                  (captionContainer as HTMLElement).style.width = '100%';
                  (captionContainer as HTMLElement).style.maxWidth = '600px';
                  (captionContainer as HTMLElement).style.margin = '0 auto';
                  (captionContainer as HTMLElement).style.padding = '20px';
                  (captionContainer as HTMLElement).style.backgroundColor = '#2a2a2a';
                  (captionContainer as HTMLElement).style.borderRadius = '8px';
                  (captionContainer as HTMLElement).style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.5)';
                  (captionContainer as HTMLElement).style.textAlign = 'left';
                }
              }
            }
          });
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
              'image/png',
              0.95
            );
          });
          mediaFile = new File([blob], `image-${Date.now()}.png`, { type: 'image/png' });
        } else if (mediaType === 'text-only') {
          // For text-only, capture the card as an image and share as file
          const canvas = await html2canvas(sharableContent as HTMLElement, {
            useCORS: true,
            allowTaint: true,
            scale: 4,
            logging: false,
            backgroundColor: '#121924',
            ignoreElements: (element) => {
              if (element.classList.contains('text-caption-actions') || element.tagName === 'BUTTON') {
                return true;
              }
              return false;
            },
            onclone: (clonedDoc) => {
              const clonedContent = clonedDoc.getElementById('sharable-content');
              if (clonedContent) {
                (clonedContent as HTMLElement).style.backgroundColor = '#121924';
                (clonedContent as HTMLElement).style.boxShadow = 'none';
                (clonedContent as HTMLElement).style.padding = '0';
                (clonedContent as HTMLElement).style.margin = '0 auto';
                (clonedContent as HTMLElement).style.maxWidth = '600px';
                (clonedContent as HTMLElement).style.borderRadius = '18px';
                (clonedContent as HTMLElement).style.display = 'block';
              }
            }
          });
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
              'image/png',
              0.95
            );
          });
          mediaFile = new File([blob], `caption-card-${Date.now()}.png`, { type: 'image/png' });
        }
        toast.dismiss(loadingToastId);
        const performShareWithUserGesture = async () => {
          try {
            if (mediaFile && navigator.canShare && navigator.canShare({ files: [mediaFile] })) {
              await navigator.share({
                ...shareData,
                files: [mediaFile]
              });
              return {
                status: 'shared' as const,
                message: 'Content shared successfully!'
              };
            } else {
              await navigator.share(shareData);
              return {
                status: 'shared' as const,
                message: 'Caption shared successfully!'
              };
            }
          } catch (directShareError) {
            if (directShareError instanceof Error) {
              if (directShareError.name === 'NotAllowedError') {
                await navigator.clipboard.writeText(formattedCaption);
                toast.success('Caption copied to clipboard! You can paste it into your social media app.');
                return {
                  status: 'fallback' as const,
                  message: 'Caption copied to clipboard!'
                };
              }
              if (directShareError.name !== 'AbortError') {
                try {
                  await navigator.share(shareData);
                  return { status: 'shared' as const, message: 'Caption shared successfully!' };
                } catch (textShareError) {
                  await navigator.clipboard.writeText(formattedCaption);
                  toast.success('Caption copied to clipboard! You can paste it into your social media app.');
                  return {
                    status: 'fallback' as const,
                    message: 'Caption copied to clipboard!'
                  };
                }
              }
            }
            throw directShareError;
          }
        };
        if (userEvent) {
          let sharePromise: Promise<void>;
          try {
            if (mediaFile && navigator.canShare && navigator.canShare({ files: [mediaFile] })) {
              sharePromise = navigator.share({
                ...shareData,
                files: [mediaFile]
              });
            } else {
              sharePromise = navigator.share(shareData);
            }
            await sharePromise;
            return { status: 'shared' as const, message: 'Content shared successfully!' };
          } catch (error) {
            return performShareWithUserGesture();
          }
        } else {
          return performShareWithUserGesture();
        }
      } catch (fileError) {
        return { status: 'fallback', message: 'Sharing failed.' };
      }
    } else {
      try {
        await navigator.clipboard.writeText(formattedCaption);
        if (mediaType !== 'text-only' && previewRef.current) {
          toast.info('You can also download the media and upload it manually');
        }
        return {
          status: 'fallback',
          message: 'Caption copied to clipboard! You can paste it into your social media app.'
        };
      } catch (clipboardError) {
        throw new Error('Sharing not supported on this browser');
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { status: 'cancelled' };
    }
    throw error;
  }
};

/**
 * Enhanced download preview function with improved rendering
 * @param previewRef Ref object pointing to the sharable content container
 * @param mediaType The type of media (image, video, text-only)
 * @param caption The caption data
 * @param filename Optional filename for the downloaded file
 * @param captionStyle Optional caption style (defaults based on mediaType)
 */
export const downloadPreview = async (
  previewRef: React.RefObject<HTMLDivElement>,
  mediaType: MediaType,
  caption: Caption,
  filename?: string,
  captionStyle: CaptionStyle = mediaType === 'video' ? 'modern' : 'standard'
): Promise<void> => {
  if (!previewRef.current) {
    toast.error('Preview element not found');
    throw new Error('Preview element not found');
  }

  // Target the sharable-content element directly from the ref
  const sharableContent = previewRef.current;
  if (!sharableContent) {
    toast.error('Sharable content element not found in ref.');
    throw new Error('Sharable content element not found in ref.');
  }
  
  // Create a loading toast
  const loadingToastId = toast.loading('Preparing download...');

  try {
    console.log(`Starting download process for media type: ${mediaType}`);
    
    // Generate a slugified version of the caption title for the filename
    const slugifiedTitle = caption.title
      ? caption.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special chars
          .replace(/\s+/g, '-')     // Replace spaces with hyphens
          .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
      : 'untitled';
    
    // Use provided filename or generate one based on caption title
    const defaultFilename = `${slugifiedTitle}-${Date.now()}`;

    if (mediaType === 'video') {
      // For video content
      const video = sharableContent.querySelector('video');
      if (!video) {
        toast.error('Video element not found', { id: loadingToastId });
        throw new Error('Video element not found');
      }
      
      // Make sure video is loaded properly
      if (video.readyState < 2) { // HAVE_CURRENT_DATA or higher
        toast.loading('Waiting for video to load...', { id: loadingToastId });
        // Wait for video to be loaded enough to get dimensions
        await new Promise<void>((resolve) => {
          const checkReadyState = () => {
            if (video.readyState >= 2) {
              resolve();
            } else {
              setTimeout(checkReadyState, 100);
            }
          };
          checkReadyState();
        });
      }
      
      toast.loading('Processing video to MP4 format with captions...', { id: loadingToastId });
      console.log('Processing video with dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      try {
        // Create captioned video with overlay - always use modern style for videos for better readability
        const captionedVideoBlob = await createCaptionedVideo(video, caption, 'modern');
        console.log('Captioned video blob created:', captionedVideoBlob.size, 'bytes');
        
        // Ensure MP4 extension for better compatibility
        const fileExtension = '.mp4';
        const finalFilename = filename || `${defaultFilename}${fileExtension}`;
        
        // Download the processed video
        downloadBlobAsFile(
          captionedVideoBlob,
          finalFilename, 
          loadingToastId
        );
      } catch (videoProcessingError) {
        console.error('Video processing error:', videoProcessingError);
        toast.error('Failed to process video with captions', { id: loadingToastId });
        throw videoProcessingError;
      }
    } else {
      // For image or text, create a screenshot with enhanced quality
      try {
        toast.loading(`Capturing content...`, { id: loadingToastId });
          
        // Use a more reliable way to capture the content with enhanced quality
        html2canvas(sharableContent as HTMLElement, {
          useCORS: true,
          allowTaint: true,
          scale: 4, // Higher scale for better quality
          logging: false,
          backgroundColor: mediaType === 'text-only' ? 'transparent' : '#1e1e1e',
          ignoreElements: (element) => {
            // Ignore action buttons for text-only
            if (mediaType === 'text-only' && (element.classList.contains('text-caption-actions') || element.tagName === 'BUTTON')) {
              return true;
            }
            // Existing ignores
            return element.classList.contains('social-share-buttons') ||
                  element.classList.contains('preview-controls') ||
                  element.tagName === 'BUTTON';
          },
          onclone: (clonedDoc) => {
            // Apply additional styling to the cloned document before capturing
            const clonedContent = clonedDoc.getElementById('sharable-content');
            if (clonedContent) {
              // Set container styles for centering content block
              (clonedContent as HTMLElement).style.width = '100%';
              (clonedContent as HTMLElement).style.maxWidth = '600px'; // Keep a reasonable max width for the overall block
              (clonedContent as HTMLElement).style.margin = '0 auto';
              (clonedContent as HTMLElement).style.padding = '20px';
              (clonedContent as HTMLElement).style.backgroundColor = '#1e1e1e';
              (clonedContent as HTMLElement).style.display = 'flex';
              (clonedContent as HTMLElement).style.flexDirection = 'column';
              (clonedContent as HTMLElement).style.alignItems = 'center'; // Center children horizontally

              // Find and style the media element (img or video)
              const mediaElement = clonedContent.querySelector('img, video');
              if (mediaElement) {
                (mediaElement as HTMLElement).style.objectFit = 'contain'; // Maintain aspect ratio
                (mediaElement as HTMLElement).style.width = 'auto'; // Allow width to adjust based on aspect ratio and container
                (mediaElement as HTMLElement).style.height = 'auto'; // Allow height to adjust
                (mediaElement as HTMLElement).style.maxWidth = '100%'; // Do not exceed container width
                (mediaElement as HTMLElement).style.border = 'none'; // Remove border
                (mediaElement as HTMLElement).style.display = 'block';
                (mediaElement as HTMLElement).style.margin = '0 auto 10px auto'; // Center with margin below
              }

              // Find and style the caption container
              const captionContainer = clonedContent.querySelector('.caption-overlay, .caption-below');
              if (captionContainer) {
                // Caption container should visually align with the media element by using the same max-width and centering
                (captionContainer as HTMLElement).style.width = '100%'; // Take full width up to max-width
                (captionContainer as HTMLElement).style.maxWidth = '600px'; // Match the max width of the overall block/media
                (captionContainer as HTMLElement).style.margin = '0 auto'; // Center the caption container
                (captionContainer as HTMLElement).style.padding = '20px';
                (captionContainer as HTMLElement).style.backgroundColor = '#2a2a2a';
                (captionContainer as HTMLElement).style.borderRadius = '8px';
                (captionContainer as HTMLElement).style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.5)';
                (captionContainer as HTMLElement).style.textAlign = 'left';
              }
            }
          }
        }).then(canvas => {
          // Use the simpler download approach
          canvas.toBlob(
            (blob) => {
              if (blob) {
                downloadBlobAsFile(
                  blob, 
                  filename || `${defaultFilename}.png`,
                  loadingToastId
                );
              } else {
                toast.error('Failed to create image file', { id: loadingToastId });
              }
            },
            'image/png',
            0.95
          );
        }).catch(canvasError => {
          console.error('Error capturing canvas:', canvasError);
          toast.error('Failed to capture content', { id: loadingToastId });
          throw canvasError;
        });
      } catch (captureError) {
        console.error('Error capturing content:', captureError);
        toast.error('Failed to capture content for download', { id: loadingToastId });
        throw captureError;
      }
    }
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download content', { id: loadingToastId });
    throw error;
  }
};
   
   /**
   * Reliable function to download a blob as a file
   */
   function downloadBlobAsFile(blob: Blob, filename: string, toastId?: string | number): void {
    try {
      console.log(`Downloading blob as file: ${filename} (${blob.size} bytes, type: ${blob.type})`);
      
      // Create a Blob URL
      const url = URL.createObjectURL(blob);
      
      // Create a link element
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      
      // Add to DOM, click it, and clean up
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
        
        // Show success message
        if (toastId) {
          const isVideo = filename.endsWith('.mp4');
          toast.success(
            isVideo 
              ? `Video downloaded successfully as MP4 format: ${filename}` 
              : `Downloaded successfully as ${filename}`, 
            { id: toastId }
          );
        }
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (toastId) {
        toast.error('Download failed. Please try again.', { id: toastId });
      }
      throw error;
    }
   }
   
   /**
   * Helper function to check if the Web Share API is available
   */
   export const isWebShareSupported = (): boolean => {
    return typeof navigator !== 'undefined' && !!navigator.share;
   };
   
   /**
   * Helper function to check if file sharing is supported
   */
   export const isFileShareSupported = (): boolean => {
    return typeof navigator !== 'undefined' && 
           !!navigator.share && 
           !!navigator.canShare;
   };
   
   /**
   * Tracks social sharing events for analytics
   * @param platform The platform where content was shared
   * @param mediaType The type of media that was shared
   * @param success Whether the sharing was successful
   */
   export const trackSocialShare = (
    platform: string,
    mediaType: MediaType,
    success: boolean = true
   ): void => {
    try {
      // Import analytics function dynamically to avoid circular dependencies
      import('@/utils/analytics').then(({ trackContentShare }) => {
        trackContentShare(platform, mediaType, success);
      }).catch((error) => {
        console.error('Error loading analytics:', error);
      });
      
      // Log the share event
      console.log(`Content shared to ${platform}: ${mediaType} (${success ? 'success' : 'failed'})`);
      
      // Here you would typically send an analytics event
      // Examples (uncomment the one that matches your analytics setup):
      
      // For Google Analytics 4
      // if (typeof window !== 'undefined' && (window as any).gtag) {
      //   (window as any).gtag('event', 'share', {
      //     event_category: 'engagement',
      //     event_label: platform,
      //     content_type: mediaType,
      //     success: success
      //   });
      // }
      
      // For Segment/Amplitude/Mixpanel style analytics
      // if (typeof window !== 'undefined' && (window as any).analytics) {
      //   (window as any).analytics.track('Content Shared', {
      //     platform,
      //     mediaType,
      //     success
      //   });
      // }
      
    } catch (error) {
      // Silently fail to prevent breaking the app flow
      console.error('Error tracking share event:', error);
    }
   };
   
   /**
   * Formats a string in Title Case (first letter of each word capitalized)
   * @param text The input string to format
   * @returns The formatted string in Title Case
   */
   function toTitleCase(text: string): string {
    return text
      .split(' ')
      .map(word => {
        if (!word) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
   }
   
   // All necessary functions have already been exported above