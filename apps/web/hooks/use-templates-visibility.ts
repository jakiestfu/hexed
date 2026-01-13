"use client";

import { useLocalStorage } from "./use-local-storage";

const STORAGE_KEY = "hexed:show-templates";

/**
 * Hook for managing templates visibility preference in localStorage
 */
export function useTemplatesVisibility() {
  const [showTemplates, setShowTemplates] = useLocalStorage<boolean>(
    STORAGE_KEY,
    false
  );

  return {
    showTemplates,
    setShowTemplates,
  };
}
