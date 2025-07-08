import React from 'react';
import { useImageData } from '@/hooks/useImageData';

export function StorageImageDebug() {
  const { images, featuredImages, loading, error } = useImageData();

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 bg-black/90 text-white p-4 rounded-lg w-96 max-h-96 overflow-auto text-xs">
      <h3 className="text-sm font-bold mb-2">useImageData Debug</h3>
      
      <div className="mb-2">
        <strong>Status:</strong> {loading ? 'Loading...' : error ? 'Error' : 'Loaded'}
      </div>
      
      {error && (
        <div className="mb-2 text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="mb-2">
        <strong>Total Images:</strong> {images.length}
      </div>

      <div className="mb-2">
        <strong>Featured Images:</strong> {featuredImages.length}
      </div>
      
      {featuredImages.length > 0 ? (
        <div className="mb-2">
          <strong>First Featured Image:</strong>
          <pre className="mt-1 overflow-x-auto">
            {JSON.stringify(featuredImages[0], null, 2)}
          </pre>
        </div>
      ) : (
        <div className="mb-2 text-yellow-400">No featured images found</div>
      )}
      
      <div className="flex space-x-2">
        <button 
          className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
          onClick={() => console.log('All images:', images)}
        >
          Log all images
        </button>
        
        <button 
          className="bg-red-600 text-white text-xs px-2 py-1 rounded"
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }}
        >
          Clear Cache & Reload
        </button>
      </div>
    </div>
  );
}
