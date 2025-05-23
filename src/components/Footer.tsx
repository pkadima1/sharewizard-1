import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';
import MobileFooterNav from './MobileFooterNav';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();  return (
    <>
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8 md:py-12 mb-16 md:mb-0">
          {/* Top section with logo and tagline */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/23327aae-0892-407a-a483-66a3aff1f9e7.png" 
                alt="EngagePerfect Logo" 
                className="h-8 w-auto mr-2"
              />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">EngagePerfect</span>
            </Link>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
              Create engaging social media content in seconds with our AI-powered platform
            </p>
          </div>
          
          {/* Social media links */}
          <div className="flex space-x-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="Twitter">
              <Twitter size={20} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="Facebook">
              <Facebook size={20} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="GitHub">
              <Github size={20} />
            </a>
          </div>
        </div>
        
        {/* Middle section with link groups */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link to="/caption-generator" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Caption Generator</Link></li>
              <li><Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Pricing</Link></li>
             {/*} <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Features</Link></li>
              <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Roadmap</Link></li>
              */} </ul>
          </div>
          
          {/*<div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Help Center</Link></li>
              <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Contact Us</Link></li>
              <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">API Documentation</Link></li>
              <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Status</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">About Us</Link></li>
              <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Blog</Link></li>
              <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Careers</Link></li>
              <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Customers</Link></li>
            </ul>
          </div>*/}
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
              {/*<li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">Cookie Policy</Link></li>
            <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm">GDPR</Link></li>
              */}</ul>
          </div>
        </div>
        
        {/* Newsletter subscription - optional but adds value */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Subscribe to our newsletter</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get the latest news and updates</p>
            </div>
            <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
              <input 
                type="email" 
                placeholder="Your email" 
                className="px-4 py-2 w-full md:w-64 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button 
                type="button"
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom section with copyright and additional links */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
            &copy; {currentYear} EngagePerfect. All rights reserved.
          </p>
          {/* ================================================================================================= */}
          {/*<div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
              Accessibility
            </Link>
            <Link to="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
              Sitemap
            </Link>
            <Link to="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
              Do Not Sell My Info
            </Link>
          </div>*/}
        </div>     
         </div>
    </footer>
    
    {/* Mobile Navigation Footer - Only visible on small screens */}
    <MobileFooterNav />
    </>
  );
};

export default Footer;
