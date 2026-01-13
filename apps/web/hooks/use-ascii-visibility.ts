"use client"

import { useLocalStorage } from "./use-local-storage"

const STORAGE_KEY = "hexed:show-ascii"

/**
 * Hook for managing ASCII visibility preference in localStorage
 */
export function useAsciiVisibility() {
  const [showAscii, setShowAscii] = useLocalStorage<boolean>(STORAGE_KEY, true)

  return {
    showAscii,
    setShowAscii
  }
}
