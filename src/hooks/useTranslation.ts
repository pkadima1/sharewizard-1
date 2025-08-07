/**
 * useTranslation Hook
 * Provides stable translation function references to fix React hooks dependency issues
 */

import { useCallback } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Provides a stable translation function that doesn't change on every render
 * This helps fix React hooks dependency warnings when using translation functions
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const stableT = useCallback((key: string, params?: Record<string, unknown>) => {
    return t(key, params);
  }, [t]);
  
  const stableTWithNamespace = useCallback((namespace: string, key: string, params?: Record<string, unknown>) => {
    return t(key, { ns: namespace, ...params });
  }, [t]);
  
  const changeLanguage = useCallback((language: string) => {
    return i18n.changeLanguage(language);
  }, [i18n]);
  
  const getCurrentLanguage = useCallback(() => {
    return i18n.language;
  }, [i18n]);
  
  const isLanguageLoaded = useCallback((language: string) => {
    return i18n.hasResourceBundle(language, 'translation');
  }, [i18n]);
  
  return {
    t: stableT,
    tWithNamespace: stableTWithNamespace,
    changeLanguage,
    getCurrentLanguage,
    isLanguageLoaded,
    i18n,
    ready: i18n.isInitialized,
    language: i18n.language,
    languages: i18n.languages,
  };
};

/**
 * Hook for translation with specific namespace
 * Useful when working with specific translation namespaces
 */
export const useTranslationWithNamespace = (namespace: string) => {
  const { t } = useI18nTranslation(namespace);
  
  const stableT = useCallback((key: string, params?: Record<string, unknown>) => {
    return t(key, params);
  }, [t]);
  
  return {
    t: stableT,
    namespace,
  };
};

/**
 * Hook for translation with fallback
 * Provides fallback text when translation is not available
 */
export const useTranslationWithFallback = () => {
  const { t } = useI18nTranslation();
  
  const stableT = useCallback((key: string, fallback: string, params?: Record<string, unknown>) => {
    const translation = t(key, params);
    return translation === key ? fallback : translation;
  }, [t]);
  
  return {
    t: stableT,
  };
};

/**
 * Hook for plural translation
 * Handles plural forms automatically
 */
export const usePluralTranslation = () => {
  const { t } = useI18nTranslation();
  
  const stableT = useCallback((key: string, count: number, params?: Record<string, unknown>) => {
    return t(key, { count, ...params });
  }, [t]);
  
  return {
    t: stableT,
  };
};

/**
 * Hook for interpolation translation
 * Handles complex interpolation patterns
 */
export const useInterpolationTranslation = () => {
  const { t } = useI18nTranslation();
  
  const stableT = useCallback((key: string, interpolation: Record<string, unknown>) => {
    return t(key, { interpolation });
  }, [t]);
  
  return {
    t: stableT,
  };
};
