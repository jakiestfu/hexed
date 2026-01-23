"use client"

import { Theme, useTheme } from "../providers/theme-provider"
import { useLocalStorage } from "./use-local-storage"


export const STORAGE_KEYS = {
  ASCII: "hexed:show-ascii",
  CHECKSUMS: "hexed:show-checksums",
  SIDEBAR: "hexed:sidebar",
  SIDEBAR_POSITION: "hexed:sidebar-position",
  MEMORY_PROFILER: "hexed:show-memory-profiler",
  THEME: "hexed:theme",
}

export type HexedSettings = {
  theme: Theme
  showAscii: boolean
  showChecksums: boolean
  sidebar: Sidebar
  sidebarPosition: SidebarPosition
  showMemoryProfiler: boolean
}

export type SidebarPosition = "left" | "right"
export type Sidebar = "templates" | "strings" | "interpreter" | null

export type UseHexedSettings = ReturnType<typeof useHexedSettings>
/**
 * Consolidated hook for managing all application settings in localStorage
 *
 * @returns An object containing all settings and their setters
 */
export function useHexedSettings(overrides: Partial<HexedSettings> = {}) {
  // const [theme, setTheme] = useTheme()
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, "system", overrides.theme)
  const [showAscii, setShowAscii] = useLocalStorage(STORAGE_KEYS.ASCII, true, overrides.showAscii)
  const [showChecksums, setShowChecksums] = useLocalStorage(STORAGE_KEYS.CHECKSUMS, true, overrides.showChecksums)
  const [sidebar, setSidebar] = useLocalStorage<Sidebar>(STORAGE_KEYS.SIDEBAR, null, overrides.sidebar)
  const [sidebarPosition, setSidebarPosition] =
    useLocalStorage<SidebarPosition>(STORAGE_KEYS.SIDEBAR_POSITION, "right", overrides.sidebarPosition)
  const [showMemoryProfiler, setShowMemoryProfiler] = useLocalStorage(
    STORAGE_KEYS.MEMORY_PROFILER,
    false,
    overrides.showMemoryProfiler
  )

  const toggleSidebarPosition = () => {
    setSidebarPosition((prev) => (prev === "left" ? "right" : "left"))
  }
  // console.log('theme', theme, setTheme)
  return {
    theme,
    setTheme,
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
