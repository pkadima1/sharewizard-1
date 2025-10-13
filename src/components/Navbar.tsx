import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Menu, X, Bell, User, ChevronDown, Shield, Sparkles, LayoutDashboard } from 'lucide-react';
import { ThemeSwitcher } from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useLocalizedPath, useLocalizedNavigate } from '@/utils/routeUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const Navbar: React.FC = () => {
  const { currentUser, userProfile, isPartner, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();
  const { getLocalizedPath } = useLocalizedPath();
  const navigateLocalized = useLocalizedNavigate();
  // Check if user is admin
  const isAdmin = currentUser?.email?.toLowerCase() === 'engageperfect@gmail.com';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: t('auth.logout.success'),
        description: t('auth.logout.description'),
      });
      navigateLocalized('/login');
    } catch (error) {
      toast({
        title: t('auth.logout.error'),
        description: t('auth.logout.errorDescription'),
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => {
    // Extract path without language prefix
    const pathParts = location.pathname.split('/');
    const potentialLang = pathParts[1];
    const supportedLangCodes = ['en', 'fr'];
    
    if (potentialLang && supportedLangCodes.includes(potentialLang)) {
      // Remove language prefix and compare
      const pathWithoutLang = '/' + pathParts.slice(2).join('/');
      return pathWithoutLang === path || (path === '/' && pathWithoutLang === '/home');
    }
    
    // Fallback for non-prefixed URLs
    return location.pathname === path;
  };
  return (
    <header 
      className={`w-full border-b border-gray-200 dark:border-gray-800 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm' 
          : 'bg-white dark:bg-gray-900'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to={getLocalizedPath('')} className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/23327aae-0892-407a-a483-66a3aff1f9e7.png" 
                alt="AI Star" 
                className="w-8 h-8"
              />
              <span className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                EngagePerfect
              </span>
            </Link>
          </div>
            {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              to={getLocalizedPath('pricing')} 
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive('/pricing') 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t('nav.pricing')}
            </Link>

            {/* Generators Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-1 ${
                  isActive('/caption-generator') || isActive('/longform')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}>
                  <Sparkles className="h-4 w-4" />
                  <span>Generators</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={getLocalizedPath('caption-generator')} className="cursor-pointer">
                    {t('nav.caption_generator')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={getLocalizedPath('longform')} className="cursor-pointer">
                    {t('nav.blog_wizard')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Media Generator (formerly Foundry Lab) link - visible to everyone */}
            <Link 
              to={getLocalizedPath('foundry-lab')} 
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-1 ${
                isActive('/foundry-lab') 
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{t('nav.mediaGenerator')}</span>
            </Link>

            <Link 
              to={getLocalizedPath('gallery')} 
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive('/gallery') 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t('nav.gallery')}
            </Link>

            <Link 
              to={getLocalizedPath('contact')} 
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive('/contact') 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t('nav.contact')}
            </Link>
          </nav>
            <div className="flex items-center space-x-4">
            
            {/* Auth Actions */}
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {/* Language Switcher for authenticated users */}
                <div className="hidden md:flex items-center">
                  <LanguageSwitcher />
                </div>

                {/* Partner Dashboard link - only visible to partners */}
                {isPartner && (
                  <Link 
                    to="/partner/dashboard" 
                    className={`hidden sm:block px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive('/partner/dashboard') 
                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                        : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20'
                    }`}
                  >
                    {t('nav.partner.dashboard')}
                  </Link>
                )} 

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="group relative flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden transition-transform duration-200 hover:scale-110">
                        {userProfile?.photoURL ? (
                          <img 
                            src={userProfile.photoURL} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white">
                            {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                      <ChevronDown className="hidden md:block ml-1 h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium">{currentUser.displayName || t('common.user')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{currentUser.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Dashboard menu item */}
                    <DropdownMenuItem asChild>
                      <Link to={getLocalizedPath('dashboard')} className="cursor-pointer flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>{t('nav.dashboard')}</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to={getLocalizedPath('profile')} className="cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('nav.profile')}</span>
                      </Link>
                    </DropdownMenuItem>

                    {/* Partner Dashboard menu item - only visible to partners */}
                    {isPartner && (
                      <DropdownMenuItem asChild>
                        <Link to={getLocalizedPath('partner/dashboard')} className="cursor-pointer flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>{t('nav.partner.dashboard')}</span>
                        </Link>
                      </DropdownMenuItem>
                    )} 

                    {/* Admin Dashboard link - only visible to admins */}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to={getLocalizedPath('admin')} className="cursor-pointer flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>{t('nav.adminDashboard')}</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 focus:text-red-700">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('nav.logOut')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>            ) : (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <LanguageSwitcher />
                <Link 
                  to={getLocalizedPath('login')}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                >
                  {t('nav.login')}
                </Link>
                <Link to={getLocalizedPath('signup')}>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-md transition-colors duration-200"
                  >
                    {t('nav.signup')}
                  </Button>
                </Link>
              </div>            )}
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-md p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
          {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 border-t border-gray-200 dark:border-gray-800 animate-fade-in bg-white dark:bg-gray-900">
            <nav className="flex flex-col space-y-1 px-2 pb-3 pt-2">
              <Link 
                to={getLocalizedPath('pricing')} 
                className={`px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  isActive('/pricing') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.pricing')}
              </Link>

              {/* Generators Section */}
              <div className="px-3 py-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>GENERATORS</span>
                </div>
                <div className="ml-4 space-y-1">
                  <Link 
                    to={getLocalizedPath('caption-generator')} 
                    className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive('/caption-generator') 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.caption_generator')}
                  </Link>
                  <Link 
                    to={getLocalizedPath('longform')} 
                    className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive('/longform') 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.blog_wizard')}
                  </Link>
                </div>
              </div>

              {/* Media Generator mobile link - visible to everyone */}
              <Link 
                to={getLocalizedPath('foundry-lab')} 
                className={`px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 flex items-center gap-1 ${
                  isActive('/foundry-lab') 
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Sparkles className="h-4 w-4" />
                <span>{t('nav.mediaGenerator')}</span>
              </Link>

              <Link 
                to={getLocalizedPath('gallery')} 
                className={`px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  isActive('/gallery') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.gallery')}
              </Link>

              <Link 
                to={getLocalizedPath('contact')} 
                className={`px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  isActive('/contact') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.contact')}
              </Link>

              {currentUser && (
                <>
                  {/* Dashboard mobile link */}
                  <Link 
                    to={getLocalizedPath('dashboard')} 
                    className={`px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                      isActive('/dashboard') 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.dashboard')}
                  </Link>

                  {/* Partner Dashboard mobile link - only visible to partners */}
                  {isPartner && (
                    <Link 
                      to={getLocalizedPath('partner/dashboard')} 
                      className={`px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                        isActive('/partner/dashboard') 
                          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                          : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.partner.dashboard')}
                    </Link>
                  )} 

                  <Link 
                    to={getLocalizedPath('profile')} 
                    className={`px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                      isActive('/profile') 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.profile')}
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-2 text-base font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <LogOut size={18} className="mr-2" />
                      {t('nav.logOut')}
                    </div>
                  </button>
                </>
              )}

              {/* Language switcher in mobile menu */}
              <div className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Language:</span>
                  <div className="ml-2">
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
