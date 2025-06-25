import React, { useEffect, useState } from "react";
import { fetchGalleryImages } from "../utils/fetchGalleryImages";

const SkeletonCard = () => (
  <div className="animate-pulse bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl backdrop-blur-sm border border-white/5 relative overflow-hidden mb-4" style={{ minHeight: 180 }}>
    <div className="w-full" style={{ paddingBottom: '150%' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
    </div>
  </div>
);

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalImg, setModalImg] = useState(null);

  useEffect(() => {
    fetchGalleryImages()
      .then(setImages)
      .catch(() => setError("Failed to load gallery images."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent mb-3">
            Visual Stories
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Discover a curated collection of moments, memories, and inspirations captured through the lens
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-4 rounded-full"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading Skeletons */}
        {loading && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 max-w-md mx-auto backdrop-blur-sm">
              <div className="text-red-300 text-lg font-medium">{error}</div>
            </div>
          </div>
        )}

        {/* Gallery Masonry Columns */}
        {!loading && !error && (
          <>
            {images.length === 0 ? (
              <div className="text-center text-slate-400 py-16">
                <div className="text-lg">No images found in the gallery.</div>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="mb-6 break-inside-avoid rounded-xl overflow-hidden bg-slate-800/30 backdrop-blur-sm border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer group"
                    onClick={() => setModalImg(url)}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <img
                      src={url}
                      alt={`Gallery image ${idx + 1}`}
                      className="w-full h-auto block transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      style={{ display: "block" }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    {/* Hover Content */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                      <div className="bg-white/10 backdrop-blur-md rounded-full p-4 border border-white/20 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          strokeWidth={2} 
                          stroke="currentColor" 
                          className="w-6 h-6 text-white"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                      </div>
                    </div>
                    {/* Image Number Badge */}
                    <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal Lightbox */}
      {modalImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl transition-all duration-300 animate-in fade-in"
          onClick={() => setModalImg(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] p-4" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button
              className="absolute -top-2 -right-2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 text-white transition-all duration-200 hover:scale-110 border border-white/20"
              onClick={() => setModalImg(null)}
              aria-label="Close image preview"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Modal Image */}
            <img
              src={modalImg}
              alt="Preview"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-50 duration-300"
            />
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-in { animation-fill-mode: both; }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        .zoom-in-50 { animation: zoomIn 0.3s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .break-inside-avoid { break-inside: avoid; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.3); }
        ::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.5); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.7); }
      `}</style>
    </div>
  );
};

export default Gallery;