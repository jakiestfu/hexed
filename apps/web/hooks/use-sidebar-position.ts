"use client"

import { useLocalStorage } from "./use-local-storage"

const STORAGE_KEY = "hexed:sidebar-position"

export type SidebarPosition = "left" | "right"

/**
 * Hook for managing sidebar position preference in localStorage
 */
export function useSidebarPosition() {
  const [sidebarPosition, setSidebarPosition] =
    useLocalStorage<SidebarPosition>(STORAGE_KEY, "right")

  const toggleSidebarPosition = () => {
    setSidebarPosition((prev) => (prev === "left" ? "right" : "left"))
  }

  return {
    sidebarPosition,
    setSidebarPosition,
    toggleSidebarPosition
  }
}
