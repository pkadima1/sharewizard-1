/**
 * Utility functions for language-prefixed routing
 */

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Custom hook to generate language-prefixed URLs
 */
export const useLocalizedPath = () => {
  const { currentLanguage } = useLanguage();
  
  const getLocalizedPath = (path: string): string => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Handle special case for home page
    if (cleanPath === '' || cleanPath === '/') {
      return `/${currentLanguage}/home`;
    }
    
    return `/${currentLanguage}/${cleanPath}`;
  };
  
  return { getLocalizedPath };
};

/**
 * Custom hook for navigation with language prefixes
 */
export const useLocalizedNavigate = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  
  const navigateLocalized = (path: string, options?: any) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Handle special case for home page
    if (cleanPath === '' || cleanPath === '/') {
      navigate(`/${currentLanguage}/home`, options);
    } else {
      navigate(`/${currentLanguage}/${cleanPath}`, options);
    }
  };
  
  return navigateLocalized;
};

/**
 * Generate a language-prefixed path for a given language and path
 */
export const getPathForLanguage = (language: string, path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Handle special case for home page
  if (cleanPath === '' || cleanPath === '/') {
    return `/${language}/home`;
  }
  
  return `/${language}/${cleanPath}`;
};

/**
 * Extract the language from a URL path
 */
export const getLanguageFromPath = (path: string): string | null => {
  const parts = path.split('/');
  const potentialLang = parts[1];
  
  // Check if it's a valid language code (you might want to make this more robust)
  if (potentialLang && ['en', 'fr'].includes(potentialLang)) {
    return potentialLang;
  }
  
  return null;
};

/**
 * Remove language prefix from path
 */
export const getPathWithoutLanguage = (path: string): string => {
  const parts = path.split('/');
  const potentialLang = parts[1];
  
  if (potentialLang && ['en', 'fr'].includes(potentialLang)) {
    // Remove the language part and rejoin
    parts.splice(1, 1);
    return parts.join('/') || '/';
  }
  
  return path;
};
