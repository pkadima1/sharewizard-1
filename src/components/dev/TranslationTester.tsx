import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * A component to test translations across different namespaces
 * This can be used during development to quickly verify translations are working
 */
const TranslationTester: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  // List of keys to test across namespaces
  const testKeys = [
    { ns: 'common', key: 'nav.home' },
    { ns: 'common', key: 'buttons.getStarted' },
    { ns: 'auth', key: 'login.title' },
    { ns: 'dashboard', key: 'overview.title' },
    { ns: 'wizard', key: 'caption.title' },
    { ns: 'pricing', key: 'title' },
    { ns: 'home', key: 'hero.title' },
    { ns: 'ui', key: 'errors.connectionError' }
  ];

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('engageperfect-language', lang);
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Translation Tester</h2>
      <div className="mb-4">
        <p>Current Language: <strong>{currentLanguage}</strong></p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => handleLanguageChange('en')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            English
          </button>
          <button 
            onClick={() => handleLanguageChange('fr')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            French
          </button>
          <button 
            onClick={() => handleLanguageChange('es')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Spanish
          </button>
        </div>
      </div>
      
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 border">Namespace</th>
            <th className="text-left p-2 border">Key</th>
            <th className="text-left p-2 border">Translation</th>
          </tr>
        </thead>
        <tbody>
          {testKeys.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''}>
              <td className="p-2 border">{item.ns}</td>
              <td className="p-2 border">{item.key}</td>
              <td className="p-2 border">{t(item.key, { ns: item.ns })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TranslationTester;
