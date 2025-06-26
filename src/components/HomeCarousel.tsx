import React, { useEffect, useState, useRef } from "react";
// import { Link } from 'react-router-dom'; // Uncomment when using with React Router
import { useTranslation } from 'react-i18next';
import { fetchGalleryImages } from "../utils/fetchGalleryImages";

const AUTO_ROTATE_INTERVAL = 4000;

export function HomeCarousel() {
  const { t } = useTranslation('common');
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState<{ [key: number]: { width: number; height: number; aspectRatio: number } }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        console.log('Loading carousel images...');
        const galleryImages = await fetchGalleryImages(true); // Pass true to get homepage-specific images
        console.log(`Loaded ${galleryImages.length} carousel images`);
        
        // Debug log URLs to check validity
        galleryImages.forEach((url, i) => {
          console.log(`Image ${i+1} URL:`, url);
          
          // Validate URL
          const img = new Image();
          img.onload = () => console.log(`✅ Image ${i+1} is valid`);
          img.onerror = () => console.error(`❌ Image ${i+1} failed to load`);
          img.src = url;
        });
        
        if (galleryImages.length === 0) {
          console.warn('No carousel images were returned');
          // Add fallback images if needed
          setImages([
            '/placeholder.svg',
            '/EngagePerfectAI.png'
          ]);
        } else {
          setImages(galleryImages);
        }
      } catch (error) {
        console.error('Error loading carousel images:', error);
        // Set fallback images on error
        setImages(['/placeholder.svg']);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  useEffect(() => {
    if (images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrent(c => (c + 1) % images.length);
      }, AUTO_ROTATE_INTERVAL);
      return () => intervalRef.current && clearInterval(intervalRef.current);
    }
  }, [images]);

  // Handle window resize for responsive dynamic sizing
  useEffect(() => {
    const handleResize = () => {
      // Force re-render to update dynamic dimensions
      setImageDimensions(prev => ({ ...prev }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goTo = (idx: number) => {
    setCurrent(idx);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const prev = () => goTo((current - 1 + images.length) % images.length);
  const next = () => goTo((current + 1) % images.length);

  /**
   * Handle image load to capture dimensions
   */
  const handleImageLoad = (index: number, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    
    setImageDimensions(prev => ({
      ...prev,
      [index]: {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio
      }
    }));
  };

  /**
   * Calculate dynamic container dimensions based on image aspect ratio
   */
  const getDynamicDimensions = (index: number, isActive: boolean) => {
    const dimensions = imageDimensions[index];
    if (!dimensions) {
      // Fallback to default dimensions
      return isActive 
        ? { width: 420, height: 315 }
        : { width: 340, height: 255 };
    }

    const { aspectRatio } = dimensions;
    
    // Responsive base dimensions
    const getBaseWidth = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        return isActive ? 520 : 420;
      } else if (window.innerWidth >= 640) { // sm breakpoint  
        return isActive ? 420 : 340;
      } else {
        return isActive ? 300 : 260;
      }
    };
    
    const baseWidth = getBaseWidth();
    const baseHeight = baseWidth / aspectRatio;
    
    // Ensure reasonable bounds based on screen size
    const getMaxHeight = () => {
      if (window.innerWidth >= 1024) {
        return isActive ? 600 : 480;
      } else if (window.innerWidth >= 640) {
        return isActive ? 500 : 400;
      } else {
        return isActive ? 350 : 280;
      }
    };
    
    const getMinHeight = () => {
      if (window.innerWidth >= 1024) {
        return isActive ? 300 : 240;
      } else if (window.innerWidth >= 640) {
        return isActive ? 250 : 200;
      } else {
        return isActive ? 200 : 160;
      }
    };
    
    const maxHeight = getMaxHeight();
    const minHeight = getMinHeight();
    
    const finalHeight = Math.max(minHeight, Math.min(maxHeight, baseHeight));
    const finalWidth = finalHeight * aspectRatio;
    
    return {
      width: Math.round(finalWidth),
      height: Math.round(finalHeight)
    };
  };

  /**
   * Calculate 3D positioning for carousel items
   * @param index - Index of the image in the array
   * @returns Object with transform, zIndex, and opacity values
   */
  const getItemStyle = (index: number) => {
    const isActive = index === current;
    const isNext = index === (current + 1) % images.length;
    const isPrev = index === (current - 1 + images.length) % images.length;
    const isSecondNext = index === (current + 2) % images.length;
    const isSecondPrev = index === (current - 2 + images.length) % images.length;
    
    let transform = '';
    let zIndex = 0;
    let opacity = 0;
    let scale = 0.5;
    
    if (isActive) {
      // Center position - fully visible and prominent
      transform = 'translateX(0%) translateZ(0px) rotateY(0deg)';
      zIndex = 30;
      opacity = 1;
      scale = 1;
    } else if (isNext) {
      // Right side preview
      transform = 'translateX(85%) translateZ(-100px) rotateY(-25deg)';
      zIndex = 20;
      opacity = 0.8;
      scale = 0.75;
    } else if (isPrev) {
      // Left side preview
      transform = 'translateX(-85%) translateZ(-100px) rotateY(25deg)';
      zIndex = 20;
      opacity = 0.8;
      scale = 0.75;
    } else if (isSecondNext) {
      // Further right
      transform = 'translateX(160%) translateZ(-200px) rotateY(-40deg)';
      zIndex = 10;
      opacity = 0.4;
      scale = 0.6;
    } else if (isSecondPrev) {
      // Further left
      transform = 'translateX(-160%) translateZ(-200px) rotateY(40deg)';
      zIndex = 10;
      opacity = 0.4;
      scale = 0.6;
    } else {
      // Hidden positions
      const diff = index - current;
      transform = diff > 0 
        ? 'translateX(250%) translateZ(-300px) rotateY(-60deg)' 
        : 'translateX(-250%) translateZ(-300px) rotateY(60deg)';
      zIndex = 0;
      opacity = 0;
      scale = 0.4;
    }
    
    return {
      transform,
      zIndex,
      opacity,
      scale,
    };
  };

  // Loading state with improved mobile design
  if (loading) {
    return (
      <div className="relative w-full bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-sm border-y border-blue-900/20">
        <div className="flex justify-center items-center h-[400px] sm:h-[500px] lg:h-[550px]">
          <div className="flex flex-col items-center px-4">
            <div className="relative mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-slate-800/60 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-400 animate-pulse text-sm sm:text-base text-center">
              {t('carousel.loading', 'Loading amazing content...')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state with improved mobile design
  if (!images.length) {
    return (
      <div className="relative w-full bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-sm border-y border-blue-900/20">
        <div className="flex flex-col justify-center items-center h-[400px] sm:h-[500px] lg:h-[550px] px-4">
          <div className="max-w-md text-center">
            <div className="mb-4 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-xl sm:text-2xl font-medium text-white mb-3">
              {t('carousel.noMedia', 'No images found in the gallery.')}
            </div>
            <p className="text-slate-400 mb-6 sm:mb-8 text-sm sm:text-base">
              Add images to your gallery to showcase your amazing content here.
            </p>
            <a 
              href="/gallery"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-800/30 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
              {t('carousel.viewAll', 'View Gallery')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-sm border-y border-blue-900/20 overflow-hidden">
      {/* Main Carousel Container - Aligned with title */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 lg:pt-12">
        {/* 3D Carousel Stage - Explicit centering */}
        <div 
          className="relative h-[300px] sm:h-[400px] lg:h-[450px] xl:h-[500px] mx-auto"
          style={{ 
            perspective: "1200px",
            perspectiveOrigin: "center center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {/* Carousel Items Container - Centered positioning */}
          <div 
            className="relative"
            style={{ 
              transformStyle: "preserve-3d",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {images.map((image, index) => {
              const itemStyle = getItemStyle(index);
              const isActive = index === current;
              const isVisible = itemStyle.opacity > 0;
              
              return (
                <div
                  key={index}
                  className="absolute transition-all duration-700 ease-out"
                  style={{
                    zIndex: itemStyle.zIndex,
                    opacity: itemStyle.opacity,
                    transformOrigin: 'center center',
                    willChange: 'transform, opacity',
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) ${itemStyle.transform} scale(${itemStyle.scale})`,
                    cursor: !isActive && isVisible ? 'pointer' : 'default'
                  }}
                  onClick={() => !isActive && isVisible && goTo(index)}
                  role={isVisible ? "button" : undefined}
                  tabIndex={isVisible && !isActive ? 0 : -1}
                  aria-label={isVisible && !isActive ? `View image ${index + 1}` : undefined}
                >
                  {/* Dynamic Card Container - Adjusts to image aspect ratio */}
                  <div 
                    className="relative rounded-xl sm:rounded-2xl border border-slate-600/30 shadow-2xl overflow-hidden transition-all duration-300 group"
                    style={{
                      width: `${getDynamicDimensions(index, isActive).width}px`,
                      height: `${getDynamicDimensions(index, isActive).height}px`,
                      ...(isVisible && { boxShadow: 'var(--tw-shadow-blue-500-20)' })
                    }}
                  >
                    
                    {/* Main Image Container - Clean and clear */}
                    <div className="absolute inset-0 rounded-lg sm:rounded-xl overflow-hidden">
                      <img
                        src={image}
                        alt={`Gallery showcase ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                        onError={(e) => {
                          console.error(`Failed to load image: ${image}`);
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                        loading={Math.abs(index - current) <= 2 ? "eager" : "lazy"}
                        onLoad={(e) => handleImageLoad(index, e)}
                      />
                    </div>
                    
                  </div>
                  
                  {/* Image Number Badge - Only on Active */}
                  {isActive && (
                    <div className="absolute -top-2 sm:-top-3 -left-2 sm:-left-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-900/50 text-xs sm:text-sm z-50 border-2 border-white/20">
                      {index + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Controls - Positioned within the centered container */}
        <div className="absolute top-1/2 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center z-30 -mt-3 sm:-mt-4 pointer-events-none">
          {/* Previous Button */}
          <button
            onClick={prev}
            className="p-3 sm:p-4 lg:p-5 rounded-full bg-black/60 hover:bg-blue-800/70 border border-blue-500/30 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 shadow-xl shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md group pointer-events-auto"
            aria-label={t('carousel.previousButton', 'Previous image')}
            disabled={images.length < 2}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:-translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={next}
            className="p-3 sm:p-4 lg:p-5 rounded-full bg-black/60 hover:bg-blue-800/70 border border-blue-500/30 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 shadow-xl shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md group pointer-events-auto"
            aria-label={t('carousel.nextButton', 'Next image')}
            disabled={images.length < 2}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Controls Section - Aligned with title and carousel */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 lg:pt-12 pb-8 sm:pb-12 lg:pb-16">
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          
          {/* Dot Indicators */}
          <div className="flex gap-2 sm:gap-3">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`relative transition-all duration-500 ${
                  idx === current 
                    ? 'w-8 sm:w-10 lg:w-12 h-2.5 sm:h-3' 
                    : 'w-2.5 sm:w-3 h-2.5 sm:h-3 hover:scale-125'
                }`}
                aria-label={t('carousel.goToImage', `Go to image ${idx + 1}`, { number: idx + 1 })}
              >
                <div className={`w-full h-full rounded-full transition-all duration-500 ${
                  idx === current 
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 shadow-lg shadow-blue-500/50' 
                    : 'bg-slate-600/70 hover:bg-blue-400/70'
                }`}></div>
              </button>
            ))}
          </div>

          {/* Image Counter */}
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-slate-700/50 shadow-xl">
            <span className="text-blue-400 font-medium text-sm sm:text-base">{current + 1}</span>
            <span className="text-slate-500 text-sm sm:text-base">/</span>
            <span className="text-slate-400 text-sm sm:text-base">{images.length}</span>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @media (max-width: 640px) {
          .line-clamp-3 {
            -webkit-line-clamp: 2;
            line-clamp: 2;
          }
        }
      `}</style>
    </div>
  );
}