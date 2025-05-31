import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Custom hook for safe navigation in React Router
 * This hook provides a safe navigation function that handles potential errors
 */
export function useSafeNavigation() {
  const navigate = useNavigate();
  
  const safeNavigate = useCallback((path: string, options?: { replace?: boolean }) => {
    try {
      navigate(path, options);
    } catch (error) {
      console.error('Navigation error:', error);
      
      // Fallback to window.location if React Router navigation fails
      if (options?.replace) {
        window.location.replace(path);
      } else {
        window.location.href = path;
      }
    }
  }, [navigate]);
  
  return safeNavigate;
}
