/**
 * Helper functions for handling text overlays on media
 */

// Production logging utility - logs only in development
const debugLog = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(message, ...args);
  }
};

/**
 * Draws custom text overlay based on stored metadata
 */
interface TextOverlayData {
  text: string;
  position?: { x: number; y: number };
  color?: string;
  size?: number;
  rotation?: number;
}

export function drawCustomTextOverlay(
  ctx: CanvasRenderingContext2D,
  textOverlayData: TextOverlayData | string | unknown,
  width: number,
  height: number
): void {
  if (!textOverlayData || (typeof textOverlayData === 'object' && textOverlayData !== null && !('text' in textOverlayData) && typeof textOverlayData !== 'string')) {
    console.warn('Invalid text overlay data:', textOverlayData);
    return; // No valid text overlay data
  }
  
  // Save the current context state
  ctx.save();
  
  // Handle both string-only overlay data and full object data
  let text: string, position: { x: number; y: number }, color: string, size: number, rotation: number;
  
  if (typeof textOverlayData === 'string') {
    // Simple string overlay (backwards compatibility)
    text = textOverlayData;
    position = { x: 50, y: 50 }; // Default center
    color = '#ffffff';
    size = 24;
    rotation = 0;
  } else if (typeof textOverlayData === 'object' && textOverlayData !== null) {
    // Get text properties from overlay data
    const overlayData = textOverlayData as TextOverlayData;
    text = overlayData.text;
    
    // Ensure we have a valid position object
    if (overlayData.position && 
        typeof overlayData.position.x === 'number' && 
        typeof overlayData.position.y === 'number') {
      position = overlayData.position;
    } else {
      position = { x: 50, y: 50 }; // Default center
    }
    
    color = overlayData.color || '#ffffff';
    size = overlayData.size || 24;
    rotation = overlayData.rotation || 0;
  } else {
    console.warn('Invalid text overlay data type:', typeof textOverlayData);
    ctx.restore();
    return;
  }
  
  if (!text) {
    ctx.restore();
    return;
  }
  
  try {
    // Calculate position based on percentages
    const x = (position.x / 100) * width;
    const y = (position.y / 100) * height;
    
    // Apply translation and rotation
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Set text styles
    ctx.font = `${size}px Arial`;
    ctx.fillStyle = color || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Handle multi-line text by splitting on newlines
    const lines = text.split('\n');
    const lineHeight = size * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    
    lines.forEach((line, i) => {
      const yOffset = i * lineHeight - (totalTextHeight - lineHeight) / 2;
      ctx.fillText(line, 0, yOffset);
    });
  } catch (error) {
    console.error('Error drawing text overlay:', error);
  } finally {
    // Restore the context to its original state
    ctx.restore();
  }
}

/**
 * Creates a global mediaFileCache object if it doesn't exist
 * This helps us store references to media files with text overlays
 */
export function initializeMediaFileCache(): void {
  if (typeof window !== 'undefined' && !window.mediaFileCache) {
    window.mediaFileCache = {};
  }
}

/**
 * Stores a file reference in the media file cache
 */
export function storeMediaFileReference(url: string, file: File): void {
  if (typeof window !== 'undefined' && window.mediaFileCache) {
    window.mediaFileCache[url] = file;
  }
}

/**
 * Gets a file reference from the media file cache
 */
export function getMediaFileFromCache(url: string): File | null {
  if (typeof window === 'undefined' || !url || !url.startsWith('blob:')) {
    return null;
  }
  
  // Initialize cache if it doesn't exist
  if (!window.mediaFileCache) {
    window.mediaFileCache = {};
  }
  
  try {
    const file = window.mediaFileCache[url];
    if (file) {
      debugLog('Found file in cache for URL:', url);
      return file;
    }
  } catch (error) {
    console.warn('Error accessing media file cache:', error);
  }
  
  return null;
}

// Add this to window.d.ts or a similar type declaration file
declare global {
  interface Window {
    mediaFileCache?: Record<string, File>;
  }
  
  interface File {
    textOverlayData?: unknown;
  }
}

/**
 * Debug function to log the state of the media file cache
 * This can be called from the browser console for debugging
 */
export function debugMediaFileCache(): void {
  if (typeof window === 'undefined' || !window.mediaFileCache) {
    debugLog('Media file cache is not initialized');
    return;
  }
  
  const cacheKeys = Object.keys(window.mediaFileCache);
  debugLog(`Media file cache contains ${cacheKeys.length} entries:`);
  
  cacheKeys.forEach(key => {
    const file = window.mediaFileCache![key];
    const hasTextOverlay = !!(file && (file as File & { textOverlayData?: unknown }).textOverlayData);
    
    debugLog(`- ${key.substring(0, 30)}... : ${file?.name || 'unnamed'} (${hasTextOverlay ? 'has text overlay' : 'no text overlay'})`);
    
    if (hasTextOverlay) {
      debugLog('  Text overlay data:', (file as File & { textOverlayData?: unknown }).textOverlayData);
    }
  });
}

/**
 * Extracts text overlay data from a media element (video or image)
 * This function tries multiple ways to get the text overlay data:
 * 1. Directly from the element if it has textOverlayData property
 * 2. From the media file cache using the src attribute
 * 3. From the mediaFileCache using the src attribute with various transformations
 */
export function getTextOverlayDataFromElement(element: HTMLVideoElement | HTMLImageElement): unknown {
  if (!element) return null;
  
  debugLog('Searching for text overlay data for element:', element);
  
  // Check for direct property first
  const elementWithOverlay = element as (HTMLVideoElement | HTMLImageElement) & { textOverlayData?: unknown };
  let textOverlayData = elementWithOverlay.textOverlayData;
  if (textOverlayData) {
    debugLog('Found text overlay data directly on element:', textOverlayData);
    return textOverlayData;
  }
  
  // For video elements, see if we have a data attribute 
  if (element instanceof HTMLVideoElement) {
    const textDataAttribute = element.getAttribute('data-text-overlay');
    if (textDataAttribute) {
      try {
        const parsedData = JSON.parse(textDataAttribute);
        debugLog('Found text overlay data in data attribute:', parsedData);
        return parsedData;
      } catch (err) {
        console.warn('Failed to parse text overlay data from attribute:', textDataAttribute);
      }
    }
    
    // Check for mediaFile property, which might be added by the MediaUploader component
    const videoWithMediaFile = element as HTMLVideoElement & { mediaFile?: File & { textOverlayData?: unknown } };
    if (videoWithMediaFile.mediaFile && videoWithMediaFile.mediaFile.textOverlayData) {
      debugLog('Found text overlay data in mediaFile property:', videoWithMediaFile.mediaFile.textOverlayData);
      return videoWithMediaFile.mediaFile.textOverlayData;
    }
  }
  
  // Check if there's a src attribute and it's a blob URL
  if (element.src && element.src.startsWith('blob:')) {
    // Try to get the cached file
    const cachedFile = getMediaFileFromCache(element.src);
    if (cachedFile) {
      const fileWithOverlay = cachedFile as File & { textOverlayData?: unknown };
      textOverlayData = fileWithOverlay.textOverlayData;
      if (textOverlayData) {
        debugLog('Found text overlay data in media file cache:', textOverlayData);
        return textOverlayData;
      }
    }
    
    // Try with window.mediaFileCache directly
    if (typeof window !== 'undefined' && window.mediaFileCache) {
      // Try the exact URL
      const exactMatch = window.mediaFileCache[element.src];
      if (exactMatch) {
        const fileWithOverlay = exactMatch as File & { textOverlayData?: unknown };
        textOverlayData = fileWithOverlay.textOverlayData;
        if (textOverlayData) {
          debugLog('Found text overlay data with exact URL match:', textOverlayData);
          return textOverlayData;
        }
      }
      
      // If not found, try searching through all entries for a partial match
      const cacheKeys = Object.keys(window.mediaFileCache);
      for (const key of cacheKeys) {
        if (key.includes(element.src.substring(5, 20))) { // Match on part of the blob URL
          const file = window.mediaFileCache[key];
          const fileWithOverlay = file as File & { textOverlayData?: unknown };
          if (file && fileWithOverlay.textOverlayData) {
            debugLog('Found text overlay data with partial URL match:', fileWithOverlay.textOverlayData);
            return fileWithOverlay.textOverlayData;
          }
        }
      }
    }
  }
  
  debugLog('No text overlay data found for element:', element);
  return null;
}

// Initialize cache on module load
if (typeof window !== 'undefined') {
  initializeMediaFileCache();
  
  // Add debug function to window for console debugging
  (window as Window & { debugMediaFileCache?: typeof debugMediaFileCache }).debugMediaFileCache = debugMediaFileCache;
  (window as Window & { getTextOverlayDataFromElement?: typeof getTextOverlayDataFromElement }).getTextOverlayDataFromElement = getTextOverlayDataFromElement;
}
