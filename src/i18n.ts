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
    // Default language - English as primary fallback for international users
    fallbackLng: 'en',
    // Available languages
    supportedLngs: ['en', 'fr'],
    // Debug mode for development
    debug: import.meta.env.DEV,
    // Language detector options
    detection: {
      // Order of detection methods - prioritize URL path first for explicit language selection
      order: ['path', 'localStorage', 'navigator'],
      // Where to look in the URL path (index 1 means /:lang/...)
      lookupFromPathIndex: 1,
      // Enable localStorage caching for language detection
      caches: ['localStorage'],
      // localStorage key name
      lookupLocalStorage: 'i18nextLng',
    },
    // Namespace configuration
    ns: ['common', 'auth', 'dashboard', 'home', 'preview', 'profile', 'repost', 'ui', 'wizard', 'pricing', 'caption-generator', 'longform', 'partners', 'foundry'],
    defaultNS: 'common',
    // Backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Add request options for better error handling
      requestOptions: {
        cache: 'no-cache'
      },
      // Add cache busting for development
      reloadInterval: import.meta.env.DEV ? 1000 : false,
      // Add custom request function to try alternative paths
      request: (options, url, payload, callback) => {
        const originalUrl = url;
        
        // Try the original URL first
        fetch(url, { cache: 'no-cache' })
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            // If original fails, try alternative paths
            const alternativePaths = [
              `/public${url}`,
              `${url.replace('/locales/', '/public/locales/')}`,
              `${url.replace('/locales/', '/src/locales/')}`
            ];
            
            console.log('Trying alternative paths for:', url);
            
            // Try each alternative path
            return Promise.race(
              alternativePaths.map(path => 
                fetch(path, { cache: 'no-cache' })
                  .then(response => {
                    if (response.ok) {
                      console.log('✅ Found translation file at:', path);
                      return response.json();
                    }
                    throw new Error(`Failed to load from ${path}`);
                  })
              )
            );
          })
          .then(data => {
            callback(null, {
              data: data,
              status: 200
            });
          })
          .catch(error => {
            console.error('❌ Failed to load translation file:', originalUrl, error);
            callback(error, {
              data: {},
              status: 404
            });
          });
      }
    },
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    // React specific options
    react: {
      useSuspense: true,
    },
    // Enable returnObjects to fix object access warnings
    returnObjects: true,
    // Key separator for nested keys
    keySeparator: '.',
    // Namespace separator
    nsSeparator: ':',
  });

export default i18n;
