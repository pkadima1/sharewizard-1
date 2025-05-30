// Test script for text overlay functionality
// Run this in the browser console to test text overlay preservation

/**
 * Function to test text overlay preservation in videos
 */
function testVideoTextOverlayPreservation() {
  console.log('Running test for video text overlay preservation...');
  
  // Check if mediaFileCache exists
  if (typeof window.mediaFileCache === 'undefined') {
    console.warn('Media file cache is not initialized');
    window.mediaFileCache = {};
  }
  
  // Display current cache state
  console.log('Current media file cache:', window.mediaFileCache);
  
  // Get all video elements on the page
  const videoElements = document.querySelectorAll('video');
  console.log(`Found ${videoElements.length} video elements on the page`);
  
  // Check each video for text overlay data
  videoElements.forEach((video, index) => {
    console.log(`Testing video #${index + 1}:`);
    
    // Check if the video has a src attribute
    if (video.src) {
      console.log(`- Video source: ${video.src}`);
      
      // Check for direct text overlay data
      // @ts-ignore - custom property
      const directOverlay = video.textOverlayData;
      if (directOverlay) {
        console.log('- Found direct text overlay data:', directOverlay);
      } else {
        console.log('- No direct text overlay data');
      }
      
      // Try to get overlay data using our utility function
      // @ts-ignore - global function
      const overlayData = window.getTextOverlayDataFromElement(video);
      if (overlayData) {
        console.log('- Found text overlay data with utility function:', overlayData);
      } else {
        console.log('- No text overlay data found with utility function');
      }
      
      // Check if the video src is in the cache
      if (video.src.startsWith('blob:')) {
        // @ts-ignore - custom property
        const cachedFile = window.mediaFileCache[video.src];
        if (cachedFile) {
          console.log('- Found cached file for this video');
          // @ts-ignore - custom property
          if (cachedFile.textOverlayData) {
            console.log('- Cached file has text overlay data:', cachedFile.textOverlayData);
          } else {
            console.log('- Cached file does not have text overlay data');
          }
        } else {
          console.log('- No cached file found for this video');
        }
      }
    } else {
      console.log('- Video does not have a source');
    }
    
    console.log('---');
  });
  
  console.log('Text overlay test complete');
}

// Expose the test function globally
// @ts-ignore - adding to window
window.testVideoTextOverlayPreservation = testVideoTextOverlayPreservation;

// Display help message
console.log(`
Text Overlay Testing Utilities

Available functions:
- testVideoTextOverlayPreservation() - Test text overlay preservation for videos
- debugMediaFileCache() - Display the current media file cache

Usage:
1. Open the browser console
2. Run window.testVideoTextOverlayPreservation() to test video text overlays
3. Run window.debugMediaFileCache() to check the cache

Example:
> window.testVideoTextOverlayPreservation()
`);
