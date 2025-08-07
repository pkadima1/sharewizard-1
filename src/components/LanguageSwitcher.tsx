import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { GlobeIcon, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageFlag, forceResetToEnglish } from '@/utils/languageUtils';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { supportedLanguages, changeLanguage, currentLanguage } = useLanguage();

  // Function to handle language change
  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  // Function to force reset to English
  const handleForceResetToEnglish = () => {
    forceResetToEnglish();
    // Also update the URL to reflect English
    changeLanguage('en');
  };

  // Get the current language object
  const currentLangObj = supportedLanguages.find(lang => lang.code === currentLanguage);
  
  // Flag image mapping for proper flag display
  const getFlagImage = (code: string) => {
    return `/img/flags/${code}.png`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3">
          <img 
            src={getFlagImage(currentLanguage)} 
            alt={`${currentLangObj?.name} flag`}
            className="w-4 h-3 object-cover rounded-sm"
          />
          <span className="text-sm font-medium hidden sm:inline">{currentLangObj?.name || currentLanguage.toUpperCase()}</span>
          <span className="text-sm font-medium sm:hidden">{currentLanguage.toUpperCase()}</span>
          <GlobeIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center gap-3 ${currentLanguage === language.code ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <img 
              src={getFlagImage(language.code)} 
              alt={`${language.name} flag`}
              className="w-4 h-3 object-cover rounded-sm"
            />
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleForceResetToEnglish}
          className="flex items-center gap-3 text-orange-600 dark:text-orange-400"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reset to English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
