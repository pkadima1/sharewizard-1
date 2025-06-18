import i18n from '../i18n';

/**
 * Initializes and configures the language settings based on URL, localStorage, or browser settings.
 * This is called at app startup to ensure the correct language is loaded.
 */
export const initializeLanguage = () => {
  console.log('Initializing language settings...');
  
  let selectedLanguage = 'en'; // Default fallback
  
  // First, check URL path for language code
  const pathSegments = window.location.pathname.split('/');
  const pathLang = pathSegments[1];

  // Check if the first path segment is a supported language code
  if (['en', 'fr', 'es'].includes(pathLang)) {
    console.log('Found language in URL path:', pathLang);
    selectedLanguage = pathLang;
  }
  // Otherwise, check localStorage for saved preference
  else {
    const savedLanguage = localStorage.getItem('engageperfect-language');
    if (savedLanguage && ['en', 'fr', 'es'].includes(savedLanguage)) {
      console.log('Found language in localStorage:', savedLanguage);
      selectedLanguage = savedLanguage;
    }
    // If no saved language, try browser language
    else {
      const browserLang = navigator.language.split('-')[0];
      if (['en', 'fr', 'es'].includes(browserLang)) {
        console.log('Using browser language:', browserLang);
        selectedLanguage = browserLang;
      } else {
        console.log('Using default language: en');
      }
    }
  }
  
  console.log('Setting language to:', selectedLanguage);
  i18n.changeLanguage(selectedLanguage);
  
  // Save the language to localStorage for persistence
  localStorage.setItem('engageperfect-language', selectedLanguage);
};

/**
 * A helper function to get translation key even if it's not available,
 * returns a formatted string indicating the missing key.
 * Useful for debugging.
 */
export const getTranslationWithFallback = (key: string, ns?: string): string => {
  const options = ns ? { ns } : undefined;
  const translation = i18n.t(key, options);
  
  // If we got back the key, it means there's no translation
  if (translation === key) {
    console.warn(`Missing translation for key: ${key}${ns ? ` in namespace: ${ns}` : ''}`);
    return `[${key}]`; // Display key in brackets to make it obvious
  }
  
  return translation;
};

export default {
  initializeLanguage,
  getTranslationWithFallback
};
