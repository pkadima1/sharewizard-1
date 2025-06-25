import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GlobeIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageFlag } from '@/utils/languageUtils';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { supportedLanguages, changeLanguage, currentLanguage } = useLanguage();

  // Function to handle language change
  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };  // Use utility function for flag images

  // Get the current language object
  const currentLangObj = supportedLanguages.find(lang => lang.code === currentLanguage);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-1 px-2">
          <img 
            src={getLanguageFlag(currentLanguage)} 
            alt={currentLangObj?.name || currentLanguage} 
            className="h-4 w-6 rounded-sm object-cover"
            onError={(e) => {
              // If image fails to load, hide the image element
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <span className="ml-1 text-sm font-medium uppercase hidden sm:inline">{currentLanguage}</span>
          <GlobeIcon className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((language) => (          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center gap-2 ${currentLanguage === language.code ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <img 
              src={getLanguageFlag(language.code)} 
              alt={language.name} 
              className="h-4 w-6 rounded-sm object-cover"
              onError={(e) => {
                // If image fails to load, hide the image element
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
