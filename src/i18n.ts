import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // Load translations from the /public/locales folder
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize the i18n configuration
  .init({
    // Default language
    fallbackLng: 'en',
    // Available languages
    supportedLngs: ['en', 'fr'],
    // Debug mode for development
    debug: import.meta.env.DEV,
    // Language detector options
    detection: {
      // Order of detection methods
      order: ['path', 'localStorage', 'navigator'],
      // Where to look in the URL path (index 1 means /:lang/...)
      lookupFromPathIndex: 1,
      // Don't cache the detected language in localStorage (we handle this manually)
      caches: [],
    },
    // Namespace configuration
    ns: ['common', 'auth', 'dashboard', 'home', 'preview', 'profile', 'repost', 'ui', 'wizard', 'pricing', 'caption-generator', 'longform'],
    defaultNS: 'common',
    // Backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    // React specific options
    react: {
      useSuspense: true,
    },
  });

export default i18n;
