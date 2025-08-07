/**
 * useStableCallback Hook
 * Provides stable callback references to fix React hooks dependency issues
 */

import { useCallback, useRef } from 'react';

/**
 * Creates a stable callback that doesn't change on every render
 * This helps fix React hooks dependency warnings
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList = []
): T => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, dependencies) as T;
};

/**
 * Creates a stable callback with no dependencies
 * Use when you want to ensure the callback never changes
 */
export const useStableCallbackNoDeps = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
};

/**
 * Creates a stable callback that only depends on specific values
 * Useful when you want to control exactly what triggers re-creation
 */
export const useStableCallbackWithDeps = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, deps) as T;
};

/**
 * Creates a stable callback that memoizes the result
 * Useful for expensive operations that should be cached
 */
export const useStableMemoCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList = []
): T => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, dependencies) as T;
}; 