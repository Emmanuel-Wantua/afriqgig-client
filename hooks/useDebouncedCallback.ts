"use client";

import { useCallback, useRef } from "react";

/**
 * Custom hook for debounced state updates
 * Prevents rapid re-renders on form input changes
 * @param callback Function to call after debounce delay
 * @param delay Debounce delay in milliseconds (default 300ms)
 * @returns Debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<number | null>(null);

  const debouncedCallback = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
}
