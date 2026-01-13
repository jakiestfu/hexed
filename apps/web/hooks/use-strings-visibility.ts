"use client"

import { useLocalStorage } from "./use-local-storage"

const STORAGE_KEY = "hexed:show-strings"

/**
 * Hook for managing strings visibility preference in localStorage
 */
export function useStringsVisibility() {
  const [showStrings, setShowStrings] = useLocalStorage<boolean>(
    STORAGE_KEY,
    false
  )

  return {
    showStrings,
    setShowStrings
  }
}
