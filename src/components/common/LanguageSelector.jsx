import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const { isDarkMode } = useTheme();

  const languages = [
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    // Update document direction and language
    document.dir = languageCode === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = languageCode;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-2 ${
            isDarkMode 
              ? 'text-gray-200 hover:text-white hover:bg-gray-800/60' 
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>{currentLanguage?.flag}</span>
          <span className="hidden sm:inline">{currentLanguage?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className={isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center gap-2 ${
              isDarkMode
                ? `text-gray-200 hover:bg-gray-700 hover:text-white ${
                    i18n.language === language.code ? 'bg-blue-900/50' : ''
                  }`
                : `text-gray-700 hover:bg-gray-100 ${
                    i18n.language === language.code ? 'bg-blue-50' : ''
                  }`
            }`}
          >
            <span>{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;