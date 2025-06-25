// Language utility functions
import i18n from 'i18next';

export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' }
];

/**
 * Detects the browser language and sets i18n language accordingly
 * Note: This should be called after i18n is initialized
 */
export const detectAndSetLanguage = () => {
  // Only proceed if i18n is properly initialized
  if (!i18n || typeof i18n.changeLanguage !== 'function') {
    console.warn('i18n not properly initialized when calling detectAndSetLanguage');
    return;
  }
  
  // Check localStorage first
  const savedLanguage = localStorage.getItem('i18nextLng');
  
  if (savedLanguage) {
    // If language is already saved, use it
    return i18n.changeLanguage(savedLanguage);
  }
  
  // Otherwise detect from browser
  const browserLang = navigator.language.split('-')[0];
  const supportedLang = supportedLanguages.find(lang => lang.code === browserLang);
  
  // If browser language is supported, use it. Otherwise fall back to default (en)
  const langToUse = supportedLang ? browserLang : 'en';
  return i18n.changeLanguage(langToUse);
};

/**
 * Returns the flag image path for a language code
 */
export const getLanguageFlag = (code: string) => {
  // Use centralized flags directory for consistency
  return `/img/flags/${code}.png`;
};
