"use client"

import { useLocalStorage } from "./use-local-storage"

const ASCII = "hexed:show-ascii"
const CHECKSUMS = "hexed:show-checksums"
const SIDEBAR = "hexed:sidebar"
const SIDEBAR_POSITION = "hexed:sidebar-position"
const MEMORY_PROFILER = "hexed:show-memory-profiler"

type WithoutSetters<T> = {
  [K in keyof T as K extends `set${string}` ? never : K]: T[K]
}

export type SidebarPosition = "left" | "right"
export type Sidebar = "templates" | "strings" | "interpreter" | null

export type UseHexedSettings = ReturnType<typeof useHexedSettings>
export type HexedSettings = Omit<WithoutSetters<UseHexedSettings>, "toggleSidebarPosition">

/**
 * Consolidated hook for managing all application settings in localStorage
 *
 * @returns An object containing all settings and their setters
 */
export function useHexedSettings() {
  const [showAscii, setShowAscii] = useLocalStorage(ASCII, true)
  const [showChecksums, setShowChecksums] = useLocalStorage(CHECKSUMS, true)
  const [sidebar, setSidebar] = useLocalStorage<Sidebar>(SIDEBAR, null)
  const [sidebarPosition, setSidebarPosition] =
    useLocalStorage<SidebarPosition>(SIDEBAR_POSITION, "right")
  const [showMemoryProfiler, setShowMemoryProfiler] = useLocalStorage(
    MEMORY_PROFILER,
    true
  )

  const toggleSidebarPosition = () => {
    setSidebarPosition((prev) => (prev === "left" ? "right" : "left"))
  }

  return {
    // ASCII visibility
    showAscii,
    setShowAscii,
    // Checksum visibility
    showChecksums,
    setShowChecksums,
    // Sidebar visibility
    sidebar,
    setSidebar,
    // Sidebar position
    sidebarPosition,
    setSidebarPosition,
    toggleSidebarPosition,
    // Memory profiler visibility
    showMemoryProfiler,
    setShowMemoryProfiler
  }
}
