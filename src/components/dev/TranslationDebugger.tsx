import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

/**
 * A development component that shows the current translation state
 * Helps debug translation issues by displaying loaded namespaces and example translations
 */
const TranslationDebugger = () => {
  const { t } = useTranslation();
  const [debugInfo, setDebugInfo] = useState<any>({
    currentLanguage: '',
    loadedNamespaces: [],
    exampleTranslations: {},
    storageLanguage: '',
    urlLanguage: '',
    i18nReady: false
  });
  useEffect(() => {
    // Update debug info whenever language changes
    const updateDebugInfo = () => {
      try {
        const currentLanguage = i18n.language;
        const loadedNamespaces = i18n.reportNamespaces?.getUsedNamespaces?.() || [];
        const storageLanguage = localStorage.getItem('engageperfect-language') || 'none';
        const urlLanguage = window.location.pathname.split('/').filter(Boolean)[0] || 'none';
        
        // Get example translations from each namespace
        const exampleTranslations: Record<string, any> = {};
        
        // Common namespace examples
        try { exampleTranslations.common_nav_home = i18n.t('nav.home', { ns: 'common' }); } catch (e) {}
        try { exampleTranslations.common_buttons_getStarted = i18n.t('buttons.getStarted', { ns: 'common' }); } catch (e) {}
        try { exampleTranslations.common_wizard_next = i18n.t('wizard.next', { ns: 'common' }); } catch (e) {}
        
        // Auth namespace examples
        try { exampleTranslations.auth_login_title = i18n.t('login.title', { ns: 'auth' }); } catch (e) {}
        
        // Home namespace examples
        try { exampleTranslations.home_hero_title = i18n.t('hero.title', { ns: 'home' }); } catch (e) {}
        
        // Dashboard namespace examples
        try { exampleTranslations.dashboard_welcome = i18n.t('welcome', { ns: 'dashboard' }); } catch (e) {}
        
        // Wizard namespace examples
        try { exampleTranslations.wizard_pageDescription = i18n.t('pageDescription', { ns: 'wizard' }); } catch (e) {}
        
        setDebugInfo({
          currentLanguage,
          loadedNamespaces,
          exampleTranslations,
          storageLanguage,
          urlLanguage,
          i18nReady: i18n.isInitialized
        });
      } catch (error) {
        console.error('Error in translation debugger:', error);
      }
    };
    
    // Update immediately and also when language changes
    updateDebugInfo();
    i18n.on('languageChanged', updateDebugInfo);
    
    return () => {
      i18n.off('languageChanged', updateDebugInfo);
    };
  }, []);

  // Add some manual language change buttons for testing
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('engageperfect-language', lang);
  };

  return (
    <div className="fixed bottom-0 right-0 bg-gray-900 text-white p-4 max-w-md max-h-96 overflow-auto z-50 text-xs opacity-80 hover:opacity-100 transition-opacity">
      <h3 className="font-bold mb-2">Translation Debugger</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div>Current Language:</div>
        <div className="font-mono">{debugInfo.currentLanguage}</div>
          <div>localStorage Language:</div>
        <div className="font-mono">{debugInfo.storageLanguage}</div>
        
        <div>URL Path Language:</div>
        <div className="font-mono">{debugInfo.urlLanguage}</div>
        
        <div>i18n Initialized:</div>
        <div className="font-mono">{debugInfo.i18nReady ? 'Yes' : 'No'}</div>
        
        <div className="col-span-2 mt-2 mb-1 font-bold">Loaded Namespaces:</div>
        <div className="col-span-2 font-mono">{debugInfo.loadedNamespaces.join(', ')}</div>
        
        <div className="col-span-2 mt-2 mb-1 font-bold">Example Translations:</div>
        {Object.entries(debugInfo.exampleTranslations).map(([key, value]) => (
          <React.Fragment key={key}>
            <div className="text-gray-400">{key}:</div>
            <div className="font-mono truncate">{value as string}</div>
          </React.Fragment>
        ))}
      </div>
      
      <div className="mt-4 flex gap-2">
        <button 
          onClick={() => changeLanguage('en')}
          className="px-2 py-1 bg-blue-700 rounded text-xs"
        >
          Set EN
        </button>
        <button 
          onClick={() => changeLanguage('fr')}
          className="px-2 py-1 bg-blue-700 rounded text-xs"
        >
          Set FR
        </button>
        <button 
          onClick={() => changeLanguage('es')}
          className="px-2 py-1 bg-blue-700 rounded text-xs"
        >
          Set ES
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="px-2 py-1 bg-red-700 rounded text-xs ml-auto"
        >
          Reload
        </button>
      </div>
    </div>
  );
};

export default TranslationDebugger;
