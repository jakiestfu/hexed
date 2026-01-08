"use client";

import * as React from "react";

const STORAGE_KEY = "hexed:show-checksums";

/**
 * Hook for managing checksum visibility preference in localStorage
 */
export function useChecksumVisibility() {
  const [showChecksums, setShowChecksumsState] = React.useState<boolean>(true);

  // Load preference from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as boolean;
        setShowChecksumsState(parsed);
      }
    } catch (error) {
      console.error("Failed to load checksum visibility preference from localStorage:", error);
    }
  }, []);

  const setShowChecksums = React.useCallback((value: boolean) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      setShowChecksumsState(value);
    } catch (error) {
      console.error("Failed to save checksum visibility preference to localStorage:", error);
    }
  }, []);

  return {
    showChecksums,
    setShowChecksums,
  };
}

