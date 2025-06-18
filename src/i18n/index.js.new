import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
// Common namespace
import enCommon from '../locales/en/common.json';
import frCommon from '../locales/fr/common.json';
import esCommon from '../locales/es/common.json';

// Auth namespace
import enAuth from '../locales/en/auth.json';
import frAuth from '../locales/fr/auth.json';
import esAuth from '../locales/es/auth.json';

// Dashboard namespace
import enDashboard from '../locales/en/dashboard.json';
import frDashboard from '../locales/fr/dashboard.json';
import esDashboard from '../locales/es/dashboard.json';

// Wizard namespace
import enWizard from '../locales/en/wizard.json';
import frWizard from '../locales/fr/wizard.json';
import esWizard from '../locales/es/wizard.json';

// Pricing namespace
import enPricing from '../locales/en/pricing.json';
import frPricing from '../locales/fr/pricing.json';

// Home namespace
import enHome from '../locales/en/home.json';
import frHome from '../locales/fr/home.json';

// UI namespace
import enUI from '../locales/en/ui.json';
import frUI from '../locales/fr/ui.json';

const getPathLanguage = () => {
  if (typeof window !== 'undefined') {
    const pathSegments = window.location.pathname.split('/');
    // Check if the first path segment is a language code
    const pathLang = pathSegments[1];
    if (['en', 'fr', 'es'].includes(pathLang)) {
      return pathLang;
    }
  }
  return null;
};

// Configure i18n
const i18nConfig = {
  resources: {
    en: { 
      common: enCommon,
      auth: enAuth,
      dashboard: enDashboard,
      wizard: enWizard,
      pricing: enPricing,
      home: enHome,
      ui: enUI
    },
    fr: { 
      common: frCommon,
      auth: frAuth,
      dashboard: frDashboard,
      wizard: frWizard,
      pricing: frPricing,
      home: frHome,
      ui: frUI
    },
    es: { 
      common: esCommon,
      auth: esAuth,
      dashboard: esDashboard,
      wizard: esWizard
      // Note: Spanish is missing pricing, home, and UI namespaces
    }
  },
  defaultNS: 'common',
  fallbackLng: 'en',
  detection: {
    order: ['path', 'localStorage', 'navigator', 'htmlTag'],
    lookupFromPathIndex: 1,
    caches: ['localStorage'],
    lookupLocalStorage: 'engageperfect-language',
    convertDetectedLanguage: (lng) => {
      return lng.split('-')[0];
    }
  },
  interpolation: {
    escapeValue: false
  },
  supportedLngs: ['en', 'fr', 'es'],
  react: {
    useSuspense: false
  },
  load: 'languageOnly', // Only load the specific language, not the regional variants
  preload: ['en', 'fr', 'es'], // Preload all supported languages
  debug: process.env.NODE_ENV === 'development',
  initImmediate: false // This ensures i18n is initialized before rendering the app
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(i18nConfig)
  .then(() => {
    // Log successful initialization in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('i18n initialized successfully');
    }
    
    // Check URL path for language and set it if found
    const urlLanguage = getPathLanguage();
    if (urlLanguage) {
      i18n.changeLanguage(urlLanguage);
    }
  })
  .catch(error => {
    console.error('Failed to initialize i18n:', error);
  });

export default i18n;
