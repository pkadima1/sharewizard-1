import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * usePartnerTranslation Hook
 * 
 * Custom hook that fixes translation key paths for the partner registration page.
 * Specifically handles the issue where keys like 'registration.title' need to be 
 * transformed to 'admin.registration.title' to match the actual structure in the JSON files.
 */
export const usePartnerTranslation = () => {
  const { t, i18n } = useTranslation('partners');
  
  // Wrapper function to fix key paths with explicit return type to ensure string compatibility
  const fixedT = (key: string, options?: any): string => {
    // If the key starts with 'registration.' and doesn't start with 'admin.registration.'
    if (key.startsWith('registration.') && !key.startsWith('admin.registration.')) {
      // Fix the key by prepending 'admin.'
      const fixedKey = `admin.${key}`;
      return String(t(fixedKey, options));
    }
    
    // No fix needed, use the key as is
    return String(t(key, options));
  };
  
  return { t: fixedT, i18n };
};
