/**
 * Helper functions for handling text overlays on media
 */

/**
 * Draws custom text overlay based on stored metadata
 */
export function drawCustomTextOverlay(
  ctx: CanvasRenderingContext2D,
  textOverlayData: any,
  width: number,
  height: number
): void {
  if (!textOverlayData || (!textOverlayData.text && typeof textOverlayData !== 'string')) {
    console.warn('Invalid text overlay data:', textOverlayData);
    return; // No valid text overlay data
  }
  
  // Save the current context state
  ctx.save();
  
  // Handle both string-only overlay data and full object data
  let text, position, color, size, rotation;
  
  if (typeof textOverlayData === 'string') {
    // Simple string overlay (backwards compatibility)
    text = textOverlayData;
    position = { x: 50, y: 50 }; // Default center
    color = '#ffffff';
    size = 24;
    rotation = 0;
    console.log('Drawing simple text overlay:', text);
  } else {
    // Get text properties from overlay data
    text = textOverlayData.text;
    
    // Ensure we have a valid position object
    if (textOverlayData.position && 
        typeof textOverlayData.position.x === 'number' && 
        typeof textOverlayData.position.y === 'number') {
      position = textOverlayData.position;
    } else {
      position = { x: 50, y: 50 }; // Default center
      console.log('Using default position for text overlay, invalid position provided:', textOverlayData.position);
    }
    
    color = textOverlayData.color || '#ffffff';
    size = textOverlayData.size || 24;
    rotation = textOverlayData.rotation || 0;
    
    // Log the overlay data for debugging
    console.log('Drawing text overlay with properties:', { text, position, color, size, rotation });
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
    // @ts-ignore - we're adding this to the window object
    window.mediaFileCache = {};
  }
}

/**
 * Stores a file reference in the media file cache
 */
export function storeMediaFileReference(url: string, file: File): void {
  if (typeof window !== 'undefined' && window.mediaFileCache) {
    // @ts-ignore - accessing our custom property
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
    // @ts-ignore - adding custom property
    window.mediaFileCache = {};
  }
  
  try {
    // @ts-ignore - accessing our custom property
    const file = window.mediaFileCache[url];
    if (file) {
      console.log('Found file in cache for URL:', url);
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
    textOverlayData?: any;
  }
}

/**
 * Debug function to log the state of the media file cache
 * This can be called from the browser console for debugging
 */
export function debugMediaFileCache(): void {
  if (typeof window === 'undefined' || !window.mediaFileCache) {
    console.log('Media file cache is not initialized');
    return;
  }
  
  const cacheKeys = Object.keys(window.mediaFileCache);
  console.log(`Media file cache contains ${cacheKeys.length} entries:`);
  
  cacheKeys.forEach(key => {
    // @ts-ignore - accessing custom properties
    const file = window.mediaFileCache[key];
    const hasTextOverlay = !!(file && file.textOverlayData);
    
    console.log(`- ${key.substring(0, 30)}... : ${file?.name || 'unnamed'} (${hasTextOverlay ? 'has text overlay' : 'no text overlay'})`);
    
    if (hasTextOverlay) {
      // @ts-ignore - accessing custom property
      console.log('  Text overlay data:', file.textOverlayData);
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
export function getTextOverlayDataFromElement(element: HTMLVideoElement | HTMLImageElement): any {
  if (!element) return null;
  
  console.log('Searching for text overlay data for element:', element);
  
  // @ts-ignore - check for direct property first
  let textOverlayData = element.textOverlayData;
  if (textOverlayData) {
    console.log('Found text overlay data directly on element:', textOverlayData);
    return textOverlayData;
  }
  
  // For video elements, see if we have a data attribute 
  if (element instanceof HTMLVideoElement) {
    const textDataAttribute = element.getAttribute('data-text-overlay');
    if (textDataAttribute) {
      try {
        const parsedData = JSON.parse(textDataAttribute);
        console.log('Found text overlay data in data attribute:', parsedData);
        return parsedData;
      } catch (err) {
        console.warn('Failed to parse text overlay data from attribute:', textDataAttribute);
      }
    }
    
    // Check for mediaFile property, which might be added by the MediaUploader component
    // @ts-ignore - custom property for storing references
    if (element.mediaFile && element.mediaFile.textOverlayData) {
      // @ts-ignore - custom property
      console.log('Found text overlay data in mediaFile property:', element.mediaFile.textOverlayData);
      // @ts-ignore - custom property
      return element.mediaFile.textOverlayData;
    }
  }
  
  // Check if there's a src attribute and it's a blob URL
  if (element.src && element.src.startsWith('blob:')) {
    // Try to get the cached file
    const cachedFile = getMediaFileFromCache(element.src);
    if (cachedFile) {
      // @ts-ignore - get text overlay data from the cached file
      textOverlayData = cachedFile.textOverlayData;
      if (textOverlayData) {
        console.log('Found text overlay data in media file cache:', textOverlayData);
        return textOverlayData;
      }
    }
    
    // Try with window.mediaFileCache directly
    if (typeof window !== 'undefined' && window.mediaFileCache) {
      // Try the exact URL
      // @ts-ignore
      const exactMatch = window.mediaFileCache[element.src];
      if (exactMatch) {
        // @ts-ignore
        textOverlayData = exactMatch.textOverlayData;
        if (textOverlayData) {
          console.log('Found text overlay data with exact URL match:', textOverlayData);
          return textOverlayData;
        }
      }
      
      // If not found, try searching through all entries for a partial match
      // @ts-ignore
      const cacheKeys = Object.keys(window.mediaFileCache);
      for (const key of cacheKeys) {
        if (key.includes(element.src.substring(5, 20))) { // Match on part of the blob URL
          // @ts-ignore
          const file = window.mediaFileCache[key];
          // @ts-ignore
          if (file && file.textOverlayData) {
            console.log('Found text overlay data with partial URL match:', file.textOverlayData);
            // @ts-ignore
            return file.textOverlayData;
          }
        }
      }
    }
  }
  
  console.log('No text overlay data found for element:', element);
  return null;
}


// Initialize cache on module load
if (typeof window !== 'undefined') {
  initializeMediaFileCache();
  
  // Add debug function to window for console debugging
  // @ts-ignore - adding to window
  window.debugMediaFileCache = debugMediaFileCache;
  // @ts-ignore - adding helper function for debugging
  window.getTextOverlayDataFromElement = getTextOverlayDataFromElement;
}
