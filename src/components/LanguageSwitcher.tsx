import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';
import Image from '@/components/ui/image';
import { useNavigate, useLocation } from 'react-router-dom';

const LanguageSwitcher = ({ isMobile = false }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const languages = [
    { code: 'en', name: 'English', label: 'GB', flagSrc: '/images/flags/gb.svg' },
    { code: 'fr', name: 'Français', label: 'FR', flagSrc: '/images/flags/fr.svg' },
    { code: 'es', name: 'Español', label: 'ES', flagSrc: '/images/flags/es.svg' }
  ];

  // Find current language
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
    // Filter out current language for the dropdown
  const otherLanguages = languages.filter(lang => lang.code !== i18n.language);
    // Function to handle language change with URL update
  const handleLanguageChange = (langCode: string) => {
    // Change the i18n language and store in localStorage
    i18n.changeLanguage(langCode);
    localStorage.setItem('engageperfect-language', langCode);
      // Update the URL to include the language code
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    // Check if first part is a language code
    if (['en', 'fr', 'es'].includes(pathParts[0])) {
      // Replace existing language code
      pathParts[0] = langCode;
    } else {
      // Add language code at the beginning
      pathParts.unshift(langCode);
    }
    
    // Construct new path with language code
    const newPath = `/${pathParts.join('/')}${location.search}`;
    
    // Navigate to the new path without a full page reload
    navigate(newPath);
  };
  return (
    <div className="flex items-center">
      {isMobile ? (
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={i18n.language === lang.code ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange(lang.code)}
              className="gap-1"
            >
              <Image 
                src={lang.flagSrc} 
                alt={`${lang.name} flag`}
                className="w-5 h-3 mr-1 object-cover" 
              />
              <span>{lang.label}</span>
            </Button>
          ))}
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="rounded-full bg-gray-800 dark:bg-gray-900 text-white hover:bg-gray-700"
            >
              <Image 
                src={currentLanguage.flagSrc} 
                alt={`${currentLanguage.name} flag`}
                className="w-5 h-3 mr-1.5 object-cover" 
              />
              <span className="mr-1">{currentLanguage.label}</span>
              <Globe className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
            {otherLanguages.map((lang) => (
              <DropdownMenuItem 
                key={lang.code} 
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center gap-2 cursor-pointer text-gray-200 hover:text-white focus:text-white focus:bg-gray-700"
              >
                <Image 
                  src={lang.flagSrc} 
                  alt={`${lang.name} flag`}
                  className="w-5 h-3 object-cover" 
                />
                <span>{lang.label}</span>
                <span className="text-gray-400 text-xs ml-1">{lang.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default LanguageSwitcher;
