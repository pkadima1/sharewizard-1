import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import i18n from '../i18n';

/**
 * Component to handle automatic language redirection
 * This will redirect to the appropriate language path if necessary
 */
const LanguageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
    useEffect(() => {
    // Skip redirection if we're loading the site for the first time
    // Let normal navigation handle the initial load
    if (sessionStorage.getItem('visited')) {
      // Don't redirect if already at a language path
      const pathParts = location.pathname.split('/').filter(Boolean);
      if (['en', 'fr', 'es'].includes(pathParts[0])) {
        return;
      }
      
      // Get current language and redirect
      const currentLang = i18n.language || 'en';
      const newPath = `/${currentLang}${location.pathname}${location.search}`;
      
      // Only redirect on language change
      navigate(newPath, { replace: true });
    } else {
      // Mark as visited for future redirects
      sessionStorage.setItem('visited', 'true');
    }
  }, [navigate, location.pathname, i18n.language]);
  
  return null; // This component doesn't render anything
};

export default LanguageRedirect;
