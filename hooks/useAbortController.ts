"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook to manage AbortController for fetch requests
 * Automatically aborts pending requests on component unmount
 * @returns AbortController instance
 */
export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return abortControllerRef.current!;
}
