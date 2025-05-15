import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

// Enhanced theme types with additional themes
type BaseTheme = 'light' | 'dark';
type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'default';
type ThemeMode = BaseTheme | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  resolvedTheme: BaseTheme; // The actual theme being applied (resolves 'system')
  isSystemPreferenceDark: boolean; // Exposed for components that need to know
  toggleTheme: () => void; // Convenience method to toggle between light/dark
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  defaultColor?: ThemeColor;
  storageKey?: string;
  colorStorageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark',
  defaultColor = 'default',
  storageKey = 'theme',
  colorStorageKey = 'theme-color',
}) => {
  // Always use dark theme
  const theme = 'dark';
  const resolvedTheme: BaseTheme = 'dark';
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    const savedColor = localStorage.getItem(colorStorageKey) as ThemeColor;
    if (savedColor && ['blue', 'green', 'purple', 'orange', 'default'].includes(savedColor)) {
      return savedColor;
    }
    return defaultColor;
  });

  // Only allow setting theme color
  const handleSetThemeColor = (newColor: ThemeColor) => {
    setThemeColor(newColor);
    localStorage.setItem(colorStorageKey, newColor);
  };

  // Always add 'dark' class to html and body
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    root.classList.add('dark');
    body.classList.add('dark');
    root.classList.remove('light');
    body.classList.remove('light');
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#111827');
    }
  }, []);

  const contextValue = useMemo(() => ({
    theme,
    setTheme: () => {}, // no-op
    themeColor,
    setThemeColor: handleSetThemeColor,
    resolvedTheme,
    isSystemPreferenceDark: true,
    toggleTheme: () => {}, // no-op
  }), [themeColor]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to get the current theme color
export const useThemeColor = () => {
  const { themeColor, setThemeColor } = useTheme();
  return { themeColor, setThemeColor };
};

// Custom hook to automatically toggle themes based on preferred color scheme
export const useAutoTheme = (enabled = true) => {
  const { setTheme, isSystemPreferenceDark } = useTheme();
  
  useEffect(() => {
    if (!enabled) return;
    setTheme('system');
  }, [enabled, setTheme]);
  
  return isSystemPreferenceDark ? 'dark' : 'light';
};

// Utility hook for adjusting components based on dark/light mode
export const useIsDarkMode = () => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark';
};