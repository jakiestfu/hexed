"use client"

import { useLocalStorage } from "./use-local-storage"

const STORAGE_KEY = "hexed:show-checksums"

/**
 * Hook for managing checksum visibility preference in localStorage
 */
export function useChecksumVisibility() {
  const [showChecksums, setShowChecksums] = useLocalStorage<boolean>(
    STORAGE_KEY,
    true
  )

  return {
    showChecksums,
    setShowChecksums
  }
}
