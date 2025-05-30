// Test utility for diagnosing text overlay issues
// Run this in the browser console to identify and fix text overlay problems

/**
 * Comprehensive test suite for text overlay functionality
 * This will check all aspects of text overlay persistence and rendering
 */
function diagnoseTextOverlayIssues() {
  console.group('📝 TEXT OVERLAY DIAGNOSTIC TOOL');
  console.log('Running comprehensive tests to diagnose text overlay issues...');
  
  // 1. Check if mediaFileCache exists and is properly initialized
  console.group('1. Media File Cache Status');
  if (typeof window.mediaFileCache === 'undefined') {
    console.warn('❌ Media file cache is NOT initialized!');
    window.mediaFileCache = {};
    console.log('👉 Created empty media file cache');
  } else {
    const cacheEntries = Object.keys(window.mediaFileCache).length;
    console.log(`✓ Media file cache exists with ${cacheEntries} entries`);
    
    // Display cache entries with text overlay data
    let entriesWithOverlay = 0;
    Object.keys(window.mediaFileCache).forEach(key => {
      const file = window.mediaFileCache[key];
      if (file && file.textOverlayData) {
        entriesWithOverlay++;
        console.log(`  - Entry ${key.substring(0, 30)}... has overlay:`, file.textOverlayData);
      }
    });
    
    console.log(`  - ${entriesWithOverlay} entries have text overlay data`);
  }
  console.groupEnd();
  
  // 2. Check for media elements on the page
  console.group('2. Media Elements Check');
  const images = document.querySelectorAll('img');
  const videos = document.querySelectorAll('video');
  
  console.log(`Found ${images.length} image elements and ${videos.length} video elements`);
  
  // Check images
  if (images.length > 0) {
    console.group('Image Elements');
    images.forEach((img, i) => {
      console.log(`Image #${i+1} - src: ${img.src.substring(0, 30)}...`);
      checkElementForTextOverlay(img);
    });
    console.groupEnd();
  }
  
  // Check videos
  if (videos.length > 0) {
    console.group('Video Elements');
    videos.forEach((video, i) => {
      console.log(`Video #${i+1} - src: ${video.src.substring(0, 30)}...`);
      checkElementForTextOverlay(video);
      
      // Special handling for video - check data attribute
      const dataAttr = video.getAttribute('data-text-overlay');
      if (dataAttr) {
        try {
          const parsedData = JSON.parse(dataAttr);
          console.log('  ✓ Has data-text-overlay attribute:', parsedData);
        } catch (e) {
          console.warn('  ❌ Has data-text-overlay attribute but failed to parse:', dataAttr);
        }
      } else {
        console.log('  - No data-text-overlay attribute');
      }
      
      // Check for mediaFile property
      if (video.mediaFile) {
        console.log('  ✓ Has mediaFile property');
        if (video.mediaFile.textOverlayData) {
          console.log('  ✓ mediaFile has textOverlayData:', video.mediaFile.textOverlayData);
        } else {
          console.log('  - mediaFile does not have textOverlayData');
        }
      } else {
        console.log('  - No mediaFile property');
      }
    });
    console.groupEnd();
  }
  console.groupEnd();
  
  // 3. Check utility functions
  console.group('3. Utility Function Check');
  if (typeof window.drawCustomTextOverlay === 'function') {
    console.log('✓ drawCustomTextOverlay function is available globally');
  } else {
    console.warn('❌ drawCustomTextOverlay function is NOT available globally');
  }
  
  if (typeof window.getTextOverlayDataFromElement === 'function') {
    console.log('✓ getTextOverlayDataFromElement function is available globally');
  } else {
    console.warn('❌ getTextOverlayDataFromElement function is NOT available globally');
  }
  console.groupEnd();
  
  // 4. Check state in PreviewRepost component if we're on that page
  console.group('4. PreviewRepost Component Check');
  if (window.location.pathname.includes('preview-repost')) {
    console.log('✓ Currently on PreviewRepost page, checking component state...');
    
    // Look for React instance
    if (document.querySelector('#preview-video, #preview-image')) {
      console.log('✓ Preview media element found');
    } else {
      console.warn('❌ Preview media element NOT found');
    }
    
    // Check for DraggableTextOverlay component
    const textOverlayElement = document.querySelector('[style*="translate(-50%, -50%)"]');
    if (textOverlayElement) {
      console.log('✓ DraggableTextOverlay component found with text:', textOverlayElement.textContent);
    } else {
      console.log('- No visible DraggableTextOverlay component found');
    }
  } else {
    console.log('- Not currently on PreviewRepost page');
  }
  console.groupEnd();
  
  // 5. Provide repair recommendations
  console.group('5. Repair Recommendations');
  let issuesFound = false;
  
  // Check for common issues and provide solutions
  if (typeof window.mediaFileCache === 'undefined' || Object.keys(window.mediaFileCache).length === 0) {
    issuesFound = true;
    console.log('👉 Issue: Media file cache is missing or empty');
    console.log('   Solution: Initialize the cache by adding: window.mediaFileCache = {}');
  }
  
  if (typeof window.drawCustomTextOverlay !== 'function') {
    issuesFound = true;
    console.log('👉 Issue: Text overlay drawing function is not globally available');
    console.log('   Solution: Import and expose the function in App.tsx');
  }
  
  if (!issuesFound) {
    console.log('✓ No common issues detected that require repair');
  }
  
  console.log('\nAdditional Troubleshooting:');
  console.log('1. Clear browser cache and reload the page');
  console.log('2. Check browser console for errors during text overlay operations');
  console.log('3. Verify text overlay data is correctly attached to media files');
  console.log('4. Ensure text overlay rendering functions are called during sharing/downloading');
  console.groupEnd();
  
  console.groupEnd();
  return 'Diagnostic complete! Check the console for results.';
}

/**
 * Helper function to check a media element for text overlay data
 */
function checkElementForTextOverlay(element) {
  // Direct property check
  if (element.textOverlayData) {
    console.log('  ✓ Has direct textOverlayData property:', element.textOverlayData);
  } else {
    console.log('  - No direct textOverlayData property');
  }
  
  // Try getting with utility function if available
  if (typeof window.getTextOverlayDataFromElement === 'function') {
    const overlayData = window.getTextOverlayDataFromElement(element);
    if (overlayData) {
      console.log('  ✓ Text overlay data retrieved with utility function:', overlayData);
    } else {
      console.log('  - No text overlay data found with utility function');
    }
  }
  
  // Check if the element's src is in the media file cache
  if (element.src && element.src.startsWith('blob:') && window.mediaFileCache) {
    const cachedFile = window.mediaFileCache[element.src];
    if (cachedFile) {
      console.log('  ✓ Found in media file cache');
      if (cachedFile.textOverlayData) {
        console.log('  ✓ Cached file has textOverlayData:', cachedFile.textOverlayData);
      } else {
        console.log('  - Cached file does not have textOverlayData');
      }
    } else {
      // Try partial matching
      let found = false;
      Object.keys(window.mediaFileCache).forEach(key => {
        if (key.includes(element.src.substring(5, 20))) {
          found = true;
          const file = window.mediaFileCache[key];
          console.log(`  ✓ Found in media file cache with partial match (key: ${key.substring(0, 30)}...)`);
          if (file.textOverlayData) {
            console.log('  ✓ Matched file has textOverlayData:', file.textOverlayData);
          } else {
            console.log('  - Matched file does not have textOverlayData');
          }
        }
      });
      
      if (!found) {
        console.log('  - Not found in media file cache (checked exact and partial matches)');
      }
    }
  }
}

// Expose the diagnostic function globally
window.diagnoseTextOverlayIssues = diagnoseTextOverlayIssues;

// Print help message to console
console.log(`
===============================================
📝 TEXT OVERLAY DIAGNOSTIC TOOLS LOADED
===============================================

Run these commands in the browser console:

✅ diagnoseTextOverlayIssues()
   - Run a comprehensive diagnostic check on text overlay functionality

✅ debugMediaFileCache()
   - Display the current contents of the media file cache

✅ testVideoTextOverlayPreservation()
   - Test if text overlays are properly preserved in videos
   
These tools will help diagnose and fix issues with text overlays
in the ShareWizard application.
`);
