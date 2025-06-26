import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import { HomeCarousel } from '@/components/HomeCarousel';

const Index = () => {
  const { t } = useTranslation('home');
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      {/* Added spacing between navbar and hero section */}
      <div className="h-28"></div>
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 pt-8 pb-24 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              {t('hero.title')}
            </h1>
            
            <p className="text-lg text-gray-300 max-w-lg">
              {t('hero.subtitle')}
            </p>
            
            <div className="pt-4">
              <Link 
                to="/caption-generator" 
                className="inline-block px-8 py-3.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                {t('hero.cta')}
              </Link>
            </div>
          </div>
          
          {/* Right Column - Feature Card */}
          <div className="bg-gray-900 rounded-xl p-10 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
                <path d="M9.5 16.5L14.5 11.5L9.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-semibold text-sm text-blue-500">EngagePerfect</span>
            </div>
              <p className="text-gray-300 mb-4">
              {t('testimonial.quote')}
            </p>
            
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-blue-600 rounded-full h-8 w-8 flex items-center justify-center text-white text-xs">
                RH
              </div>              <div className="text-sm text-gray-400">
                {t('testimonial.name')}<br />
                {t('testimonial.title')}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Centered Carousel Title Section */}
      <section className="w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center pt-8 sm:pt-12 lg:pt-16 pb-6 sm:pb-8 lg:pb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            {t('carousel.title', 'See What You Can Create')}
          </h2>
          <div className="w-16 sm:w-20 lg:w-24 h-1 sm:h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 mx-auto rounded-full mt-3 sm:mt-4 animate-pulse"></div>
        </div>
      </section>
      
      {/* 3D Image Carousel Section - Main Visual Feature (Full Width) */}
      <section className="w-full">
        <HomeCarousel />
        
        {/* Custom animation styles for carousel effects */}
        <style>{`
          @keyframes pulse-slow {
            0%, 100% {
              opacity: 0.2;
            }
            50% {
              opacity: 0.5;
            }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-xs font-medium mb-4">
            {t('features.title')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            {t('features.subtitle')}
          </h2>          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            {t('features.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">          {/* Feature 1 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">
            <h3 className="text-lg font-semibold mb-3">{t('features.humanLikeContent.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('features.humanLikeContent.description')}
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">            <h3 className="text-lg font-semibold mb-3">{t('features.contextAware.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('features.contextAware.description')}
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">            <h3 className="text-lg font-semibold mb-3">{t('features.multipleFormats.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('features.multipleFormats.description')}
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
          
          {/* Feature 4 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">            <h3 className="text-lg font-semibold mb-3">{t('features.seoOptimization.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('features.seoOptimization.description')}
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
          
          {/* Feature 5 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">            <h3 className="text-lg font-semibold mb-3">{t('features.instantGeneration.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('features.instantGeneration.description')}
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
          
          {/* Feature 6 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">            <h3 className="text-lg font-semibold mb-3">{t('features.crossPlatform.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('features.crossPlatform.description')}
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 max-w-6xl">
        <div className="text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {t('cta.title')}
            <br />{t('cta.subtitle')}
          </h2>          <p className="text-gray-400 max-w-2xl mx-auto">
            {t('cta.description')}
          </p>
          <div className="pt-4">
            <Link 
              to="/caption-generator" 
              className="inline-block px-8 py-3.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
            >
              {t('cta.button')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;