import { useTranslation } from 'react-i18next';

type Namespace = 
  | 'common' 
  | 'auth' 
  | 'dashboard' 
  | 'home' 
  | 'preview' 
  | 'profile' 
  | 'repost' 
  | 'ui' 
  | 'wizard' 
  | 'pricing';

/**
 * Custom hook to use translations with type safety for namespaces
 * 
 * @param ns - The namespace to use for translations (optional, defaults to 'common')
 * @returns The translation function and i18n instance
 * 
 * @example
 * // Use with default namespace 'common'
 * const { t } = useAppTranslation();
 * t('key'); // translates from common namespace
 * 
 * // Use with specific namespace
 * const { t } = useAppTranslation('auth');
 * t('login.title'); // translates from auth namespace
 * 
 * // Use with specific namespace and key prefix
 * const { tns } = useAppTranslation('auth');
 * tns('login.title'); // translates from auth namespace
 */
export function useAppTranslation(ns: Namespace = 'common') {
  const { t, i18n } = useTranslation(ns);
  
  // Function that always uses the specified namespace
  const tns = (key: string, options?: object) => t(key, { ...options, ns });

  return {
    t,    // Use for default namespace or specify ns in options
    tns,  // Always uses the specified namespace
    i18n
  };
}
