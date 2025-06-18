import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DesktopLanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', label: 'US', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', label: 'FR', flag: '🇫🇷' },
    { code: 'es', name: 'Español', label: 'ES', flag: '🇪🇸' }
  ];

  // Find current language
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  // Filter out current language for the dropdown
  const otherLanguages = languages.filter(lang => lang.code !== i18n.language);

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="rounded-full bg-gray-800 dark:bg-gray-900 text-white hover:bg-gray-700"
          >
            <span className="mr-1">{currentLanguage.flag}</span>
            <span className="mr-1">{currentLanguage.label}</span>
            <Globe className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
          {otherLanguages.map((lang) => (            <DropdownMenuItem 
              key={lang.code} 
              onClick={() => {
                i18n.changeLanguage(lang.code);
                localStorage.setItem('engageperfect-language', lang.code);
                window.location.reload();
              }}
              className="flex items-center gap-2 cursor-pointer text-gray-200 hover:text-white focus:text-white focus:bg-gray-700"
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              <span className="text-gray-400 text-xs ml-1">{lang.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DesktopLanguageSwitcher;
