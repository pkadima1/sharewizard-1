
import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Simple toggle between light and dark mode
  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="relative" ref={dropdownRef}>      <button
        onClick={handleToggleTheme}
        className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                  border border-gray-300 dark:border-gray-700 transition-colors shadow-sm"
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? 
          <Moon size={18} className="text-gray-800" /> : 
          <Sun size={18} className="text-amber-400" />
        }
      </button>
    </div>
  );
};

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get the current theme icon
  const getCurrentThemeIcon = () => {
    switch(theme) {
      case 'light': return <Sun size={18} className="text-amber-500" />;
      case 'dark': return <Moon size={18} className="text-indigo-400" />;
      case 'system': return <Laptop size={18} className="text-blue-500 dark:text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mobile-friendly toggle button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                  border border-gray-200 dark:border-gray-700 transition-colors shadow-sm flex items-center"
        aria-expanded={isDropdownOpen}
        aria-label="Toggle theme"
      >
        {getCurrentThemeIcon()}
        <ChevronDown size={14} className="ml-1 text-gray-500 dark:text-gray-400" />
      </button>
        {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-1 p-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <div className="flex flex-col gap-1 min-w-[120px]">
            <button
              onClick={() => {setTheme('light'); setIsDropdownOpen(false);}}
              className={`flex items-center gap-2 p-2 rounded-md ${
                theme === 'light' ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
              aria-label="Light theme"
            >
              <Sun size={16} className="text-amber-500" />
              <span className="text-sm text-gray-800 dark:text-gray-200">Light</span>
            </button>
              <button
              onClick={() => {setTheme('dark'); setIsDropdownOpen(false);}}
              className={`flex items-center gap-2 p-2 rounded-md ${
                theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
              aria-label="Dark theme"
            >
              <Moon size={16} className="text-indigo-400" />
              <span className="text-sm text-gray-800 dark:text-gray-200">Dark</span>
            </button>
            
            <button
              onClick={() => {setTheme('system'); setIsDropdownOpen(false);}}
              className={`flex items-center gap-2 p-2 rounded-md ${
                theme === 'system' ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
              aria-label="System theme"
            >
              <Laptop size={16} className="text-blue-500 dark:text-blue-400" />
              <span className="text-sm text-gray-800 dark:text-gray-200">System</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
