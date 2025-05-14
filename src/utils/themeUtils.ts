/**
 * Helper functions for theme management
 */

/**
 * Detect if we should use dark mode based on system preference
 * @returns boolean indicating if dark mode should be used
 */
export function shouldUseDarkMode(): boolean {
  // Check if we're running in a browser environment
  if (typeof window === 'undefined') return false;
  
  // First check for explicit theme setting
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  
  // Then fallback to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Add theme-specific class to an element based on condition
 * @param isDark condition that determines whether to use dark variant
 * @param baseClass the base class name
 * @param lightVariant the light theme variant suffix
 * @param darkVariant the dark theme variant suffix
 * @returns string with appropriate class names
 */
export function adaptiveClass(
  isDark: boolean,
  baseClass: string,
  lightVariant: string,
  darkVariant: string
): string {
  return `${baseClass}${isDark ? darkVariant : lightVariant}`;
}

/**
 * Generate theme-adaptive classes
 * @param lightClasses classes to apply in light mode
 * @param darkClasses classes to apply in dark mode
 * @param commonClasses classes always applied
 * @returns combined class string
 */
export function themeClasses(
  lightClasses: string,
  darkClasses: string,
  commonClasses: string = ''
): string {
  // We rely on CSS to apply dark: variants
  return `${lightClasses} dark:${darkClasses} ${commonClasses}`.trim();
}

/**
 * Helper to toggle between light and dark mode
 */
export function toggleDarkMode(): void {
  const isDark = document.documentElement.classList.contains('dark');
  
  if (isDark) {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}
