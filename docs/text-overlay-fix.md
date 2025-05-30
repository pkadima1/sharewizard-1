# Text Overlay Fix for ShareWizard

This document outlines the fix for the issues with text overlays in the ShareWizard application.

## Problems Fixed

1. **Text Overlay Persistence**: Text overlays added in the first step weren't being preserved for videos during processing and sharing/downloading.
2. **Text Overlay Editing**: Text overlays weren't editable in the final preview stage (PreviewRepost page).
3. **Inconsistent Behavior**: Different behavior between image and video media types for text overlays.

## Solution

We've implemented several fixes to ensure text overlay data is properly preserved throughout the workflow:

1. Enhanced the `textOverlayHelpers.ts` utilities with:
   - Improved error handling and logging in the `drawCustomTextOverlay` function
   - Enhanced `getTextOverlayDataFromElement` to retrieve data from multiple sources
   - Better initialization of the global media file cache

2. Fixed the `PreviewRepost.tsx` component to:
   - Support text overlay editing for both images and videos
   - Preserve text overlay data during processing and sharing
   - Draw text overlays correctly on the canvas for images
   - Add text overlay data to processed video files

3. Updated the `sharingUtils.ts` file to:
   - Check multiple sources for text overlay data
   - Handle text overlay rendering consistently for both images and videos
   - Store text overlay data in multiple locations for redundancy

4. Created advanced diagnostic tools:
   - Added comprehensive testing utility `textOverlayDiagnostics.js`
   - Made core text overlay functions globally available
   - Added detailed logging throughout the process

5. Made text overlay utilities globally available in `App.tsx` to ensure they're accessible from anywhere in the application.

## Key Technical Improvements

### Text Overlay Data Storage

Text overlay data is now stored in multiple locations to ensure persistence:

1. **File Object**: The text overlay data is attached directly to the File object using a custom property.
2. **Media File Cache**: A global cache (`window.mediaFileCache`) stores references to media files with their associated text overlay data.
3. **Data Attributes**: For video elements, text overlay data is also stored in a `data-text-overlay` attribute as a JSON string.
4. **Direct Element Properties**: Text overlay data is attached directly to video/image elements as a custom property.

### Text Overlay Retrieval

The `getTextOverlayDataFromElement` function has been enhanced to retrieve text overlay data from multiple sources in the following order:

1. Direct property on the element
2. Data attribute (for videos)
3. Associated mediaFile property
4. Media file cache using exact URL match
5. Media file cache using partial URL match

## Testing the Fix

To verify the fix is working, follow these steps:

1. Upload a video or image in the MediaUploader component
2. Add text overlay to the media and save it
3. Continue to the preview stage
4. Verify the text overlay is visible and editable
5. Try to share or download the media
6. Verify the text overlay appears in the processed media

## Debugging Tools

Advanced diagnostic tools are now available in the browser console:

1. `diagnoseTextOverlayIssues()` - Run a comprehensive diagnostic check on text overlay functionality
2. `debugMediaFileCache()` - Display the current contents of the media file cache
3. `testVideoTextOverlayPreservation()` - Test if text overlays are properly preserved in videos

If issues persist, run these tools and check the browser console for detailed diagnostics and recommended solutions.

## Future Improvements

1. **Server-side Storage**: Consider storing text overlay data on the server for more reliable persistence.
2. **Improved Cache Management**: Implement better garbage collection for the media file cache.
3. **Native Format Support**: Use native formats like WebVTT for text overlays in videos.
4. **Performance Optimization**: Optimize text overlay rendering for large videos.
