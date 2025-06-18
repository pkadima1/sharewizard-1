import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useTranslation } from 'react-i18next';

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
          <div className="space-y-6">            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
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
                Go to Generator
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
            "EngagePerfect AI created content that resonates with our audience far better than any AI tool we've used before."
            </p>
            
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-blue-600 rounded-full h-8 w-8 flex items-center justify-center text-white text-xs">
                RH
              </div>
              <div className="text-sm text-gray-400">
              Robert Hodgson<br />

                Marketing Director
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Instagram Post Preview Mockup */}
      <section className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
        <div className="bg-gray-900/60 backdrop-blur-sm py-10 px-4 rounded-2xl border border-gray-800">
          <h3 className="text-center text-2xl font-semibold mb-8 text-white">See What You Can Create</h3>
          
          <div className="mx-auto max-w-sm shadow-2xl rounded-xl overflow-hidden border border-gray-800">
            {/* Instagram Post Header */}
            <div className="bg-gray-900 flex items-center p-3 border-b border-gray-800">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                  EP
                </div>
                <div className="font-medium text-sm">EngagePerfect</div>
                <div className="ml-1 text-blue-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H5.01M12 12H12.01M19 12H19.01M6 12C6 12.5523 5.55228 13 5 13C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11C5.55228 11 6 11.4477 6 12ZM13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12ZM20 12C20 12.5523 19.5523 13 19 13C18.4477 13 18 12.5523 18 12C18 11.4477 18.4477 11 19 11C19.5523 11 20 11.4477 20 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            {/* Instagram Post Image - Using the image from public folder */}
            <div className="relative">
              <img 
                src="/EngagePerfectAI.png" 
                alt="Woman by London Tower Bridge" 
                className="w-full object-cover h-[400px]" 
              />
              
              {/* Overlay Text 
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent text-white">
                <h2 className="text-2xl font-bold mb-2">Boost Your Influence with AI Magic!</h2>
                <p className="text-sm">Discover how AI-driven human-like content can elevate your brand's presence on Instagram, TikTok, and other social platforms—engaging audiences like never before.</p>
                <p className="mt-3 text-sm font-medium">Ready to revolutionize your content strategy? Try EngagePerfect now for free!</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-blue-400 text-sm">#AIGrowth</span>
                  <span className="text-blue-400 text-sm">#DigitalInfluence</span>
                  <span className="text-blue-400 text-sm">#ContentCreationMagic</span>
                  <span className="text-blue-400 text-sm">#HumanLikeContent</span>
                </div>
              </div>*/}
            </div>
            
            {/* Instagram Post Footer */}
            <div className="bg-gray-900 p-3">
              <div className="flex justify-between mb-2">
                <div className="flex gap-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                    <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-white text-sm">
                <span className="font-semibold">Created with EngagePerfect</span> • <span className="text-gray-400">https://engageperfect.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-xs font-medium mb-4">
            Key Features
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Content That Sounds Like You, Not AI
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Our advanced AI technology creates content with personality, tone, and style that feels genuine and engaging.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Feature 1 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">
            <h3 className="text-lg font-semibold mb-3">Human-Like Content</h3>
            <p className="text-gray-400 text-sm mb-4">
              Content that feels personalized and sounds like real people wrote it, not generic AI.
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">
            <h3 className="text-lg font-semibold mb-3">Consistent Brand Voice</h3>
            <p className="text-gray-400 text-sm mb-4">
              Maintain your brand's unique voice across various platforms for stronger brand identity.
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">
            <h3 className="text-lg font-semibold mb-3">Multiple Content!</h3>
            <p className="text-gray-400 text-sm mb-4">
              Generate captions, social posts, Blog Posts, Research Articles, and more, with ease.
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
          
          {/* Feature 4 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">
            <h3 className="text-lg font-semibold mb-3">SEO, EEAT, GEO Optimization</h3>
            <p className="text-gray-400 text-sm mb-4">
              Content optimized with search engines, EEAT principles, and GEO targeting in mind to help boost your visibility in the era of AI Search Engine.
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
          
          {/* Feature 5 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">
            <h3 className="text-lg font-semibold mb-3">Fast Generation</h3>
            <p className="text-gray-400 text-sm mb-4">
              Create high-quality content that emotionally connect with your brand, tone, style, industry  in seconds, not hours or days.
            </p>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">•</span>
            </div>
          </div>
          
          {/* Feature 6 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-800 transition-colors">
            <h3 className="text-lg font-semibold mb-3">Easy Customization</h3>
            <p className="text-gray-400 text-sm mb-4">
              Tailor output with simple controls to get exactly what you need.
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
            Ready to Create Perfect Content?
            <br />Start With our Caption, SM Posts  and Long Form Content Generator!
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join thousands of marketers and content creators using EngagePerfect AI.
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
      </section>
    </div>
  );
};

export default Index;