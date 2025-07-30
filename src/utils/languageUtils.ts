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
  
  // Let i18n handle language detection automatically
  // It will check localStorage first, then fall back to browser language
  const currentLang = i18n.language;
  const supportedLang = supportedLanguages.find(lang => lang.code === currentLang);
  
  // If current language is not supported, fall back to English
  if (!supportedLang) {
    return i18n.changeLanguage('en');
  }
  
  // Language is already set correctly
  return Promise.resolve(currentLang);
};

/**
 * Force reset language to English and clear any stored preferences
 * Useful for users who are stuck with the wrong language
 */
export const forceResetToEnglish = () => {
  // Clear localStorage
  localStorage.removeItem('i18nextLng');
  
  // Force change to English
  return i18n.changeLanguage('en');
};

/**
 * Debug utility to diagnose language detection issues
 */
export const debugLanguageDetection = () => {
  const browserLang = navigator.language;
  const storedLang = localStorage.getItem('i18nextLng');
  const currentLang = i18n.language;
  
  console.log('Language Debug Info:', {
    browserLanguage: browserLang,
    storedLanguage: storedLang,
    currentLanguage: currentLang,
    supportedLanguages: supportedLanguages.map(l => l.code),
    isCurrentLangSupported: supportedLanguages.some(l => l.code === currentLang)
  });
  
  return {
    browserLanguage: browserLang,
    storedLanguage: storedLang,
    currentLanguage: currentLang,
    isCurrentLangSupported: supportedLanguages.some(l => l.code === currentLang)
  };
};

/**
 * Returns the flag image path for a language code
 */
export const getLanguageFlag = (code: string) => {
  // Use centralized flags directory for consistency
  return `/img/flags/${code}.png`;
};
