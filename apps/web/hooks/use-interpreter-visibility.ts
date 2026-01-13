"use client"

import { useLocalStorage } from "./use-local-storage"

const STORAGE_KEY = "hexed:show-interpreter"

/**
 * Hook for managing interpreter visibility preference in localStorage
 */
export function useInterpreterVisibility() {
  const [showInterpreter, setShowInterpreter] = useLocalStorage<boolean>(
    STORAGE_KEY,
    false
  )

  return {
    showInterpreter,
    setShowInterpreter
  }
}
