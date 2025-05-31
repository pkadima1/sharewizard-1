import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  key: string; // localStorage key
  debounceMs?: number; // debounce delay for form changes (default: 2000ms)
  autoSaveIntervalMs?: number; // auto-save interval (default: 30000ms)
  showToast?: boolean; // whether to show toast notifications (default: true)
}

interface AutoSaveResult<T> {
  hasSavedDraft: boolean;
  lastSaved: Date | null;
  lastSavedFormatted: string | null; // Formatted string for display
  restoreDraft: () => T | null;
  clearDraft: () => void;
  saveNow: () => void;
}

/**
 * Custom hook for auto-saving form data to localStorage
 * @param data - The form data to save
 * @param options - Configuration options for auto-save behavior
 * @returns Auto-save functions and state
 */
export function useAutoSave<T = any>(
  data: T,
  options: AutoSaveOptions
): AutoSaveResult<T> {
  const {
    key,
    debounceMs = 2000,
    autoSaveIntervalMs = 30000,
    showToast = true
  } = options;

  const { toast } = useToast();
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedFormatted, setLastSavedFormatted] = useState<string | null>(null);
  
  // Refs for managing timers
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T>(data);

  // Check for existing draft on mount
  useEffect(() => {
    const existingDraft = localStorage.getItem(key);
    if (existingDraft) {
      try {
        const parsed = JSON.parse(existingDraft);
        if (parsed.data && parsed.timestamp) {
          setHasSavedDraft(true);
          setLastSaved(new Date(parsed.timestamp));
        }
      } catch (error) {
        console.warn('Failed to parse existing draft:', error);
        localStorage.removeItem(key);
      }
    }
  }, [key]);

  // Save data to localStorage
  const saveToLocalStorage = useCallback((dataToSave: T, showNotification = true) => {
    try {
      const draftData = {
        data: dataToSave,
        timestamp: new Date().toISOString(),
        version: '1.0' // For future compatibility
      };
      
      localStorage.setItem(key, JSON.stringify(draftData));
      setHasSavedDraft(true);
      setLastSaved(new Date());
      
      if (showNotification && showToast) {
        toast({
          title: "Draft Saved",
          description: "Your progress has been automatically saved.",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      if (showToast) {
        toast({
          title: "Save Failed",
          description: "Unable to save draft. Please check your storage settings.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  }, [key, showToast, toast]);

  // Check if data has actually changed
  const hasDataChanged = useCallback((newData: T, oldData: T): boolean => {
    try {
      return JSON.stringify(newData) !== JSON.stringify(oldData);
    } catch (error) {
      console.warn('Failed to compare data, assuming changed:', error);
      return true;
    }
  }, []);

  // Manual save function
  const saveNow = useCallback(() => {
    saveToLocalStorage(data, true);
  }, [data, saveToLocalStorage]);

  // Restore draft from localStorage
  const restoreDraft = useCallback((): T | null => {
    try {
      const existingDraft = localStorage.getItem(key);
      if (existingDraft) {
        const parsed = JSON.parse(existingDraft);
        if (parsed.data) {
          if (showToast) {
            toast({
              title: "Draft Restored",
              description: `Draft from ${new Date(parsed.timestamp).toLocaleString()} has been restored.`,
              duration: 3000,
            });
          }
          return parsed.data;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to restore draft:', error);
      if (showToast) {
        toast({
          title: "Restore Failed",
          description: "Unable to restore draft. The saved data may be corrupted.",
          variant: "destructive",
          duration: 3000,
        });
      }
      return null;
    }
  }, [key, showToast, toast]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setHasSavedDraft(false);
      setLastSaved(null);
      
      if (showToast) {
        toast({
          title: "Draft Cleared",
          description: "Saved draft has been removed.",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key, showToast, toast]);

  // Set up auto-save interval
  useEffect(() => {
    if (autoSaveIntervalMs > 0) {
      autoSaveTimerRef.current = setInterval(() => {
        // Only save if there's actual data and it has changed
        if (data && hasDataChanged(data, previousDataRef.current)) {
          saveToLocalStorage(data, false); // Don't show toast for interval saves
          previousDataRef.current = data;
        }
      }, autoSaveIntervalMs);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [data, autoSaveIntervalMs, saveToLocalStorage, hasDataChanged]);

  // Set up debounced save on data change
  useEffect(() => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only set up debounce if data has actually changed
    if (data && hasDataChanged(data, previousDataRef.current)) {
      debounceTimerRef.current = setTimeout(() => {
        saveToLocalStorage(data, true);
        previousDataRef.current = data;
      }, debounceMs);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, debounceMs, saveToLocalStorage, hasDataChanged]);

  // Update the formatted string whenever lastSaved changes
  useEffect(() => {
    if (lastSaved) {
      setLastSavedFormatted(lastSaved.toLocaleString());
    } else {
      setLastSavedFormatted(null);
    }
  }, [lastSaved]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    hasSavedDraft,
    lastSaved,
    lastSavedFormatted,
    restoreDraft,
    clearDraft,
    saveNow
  };
}

// Helper function to get draft info without loading the full hook
export function getDraftInfo(key: string): { exists: boolean; timestamp: Date | null } {
  try {
    const existingDraft = localStorage.getItem(key);
    if (existingDraft) {
      const parsed = JSON.parse(existingDraft);
      if (parsed.data && parsed.timestamp) {
        return {
          exists: true,
          timestamp: new Date(parsed.timestamp)
        };
      }
    }
  } catch (error) {
    console.warn('Failed to get draft info:', error);
  }
  
  return {
    exists: false,
    timestamp: null
  };
}

// Helper function to format last saved time
export function formatLastSaved(lastSaved: Date | null): string {
  if (!lastSaved) return 'Never';
  
  const now = new Date();
  const diffMs = now.getTime() - lastSaved.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return lastSaved.toLocaleDateString();
  }
}
