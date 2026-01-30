"use client"

import { useEffect, useState } from "react"

import { Theme } from "../providers/theme-provider"
import { useLocalStorage } from "./use-local-storage"

export const STORAGE_KEYS = {
  ASCII: "hexed:show-ascii",
  CHECKSUMS: "hexed:show-checksums",
  SIDEBAR: "hexed:sidebar",
  TOOLBAR: "hexed:toolbar",
  SIDEBAR_POSITION: "hexed:sidebar-position",
  MEMORY_PROFILER: "hexed:show-memory-profiler",
  THEME: "hexed:theme",
  VISIBLE_LABELS: "hexed:visible-labels",
  VIEW: "hexed:view"
}

export type HexedSettings = {
  theme: Theme
  showAscii: boolean
  showChecksums: boolean
  sidebar: string | null
  sidebarPosition: SidebarPosition
  showMemoryProfiler: boolean
  toolbar: string | null
  view: "edit" | "visualize" | null
  visibleLabels: string[]
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
  const [theme, setTheme] = useLocalStorage(
    STORAGE_KEYS.THEME,
    "system",
    overrides.theme
  )
  const [showAscii, setShowAscii] = useLocalStorage(
    STORAGE_KEYS.ASCII,
    true,
    overrides.showAscii
  )
  const [showChecksums, setShowChecksums] = useLocalStorage(
    STORAGE_KEYS.CHECKSUMS,
    true,
    overrides.showChecksums
  )

  // TOOLBARS ARE NOT STORED IN LOCAL STORED BY DESIGN
  const [toolbar, setToolbar] = useState<string | null>(
    overrides.toolbar ?? null
  )
  useEffect(() => {
    setToolbar(overrides.toolbar ?? null)
  }, [overrides.toolbar])

  const [view, setView] = useState<"edit" | "visualize">("edit")
  useEffect(() => {
    setView(overrides.view ?? "edit")
  }, [overrides.view])

  const [sidebar, setSidebar] = useLocalStorage<string | null>(
    STORAGE_KEYS.SIDEBAR,
    null,
    overrides.sidebar
  )
  const [sidebarPosition, setSidebarPosition] =
    useLocalStorage<SidebarPosition>(
      STORAGE_KEYS.SIDEBAR_POSITION,
      "right",
      overrides.sidebarPosition
    )

  const [visibleLabels, setVisibleLabels] = useLocalStorage<string[]>(
    STORAGE_KEYS.VISIBLE_LABELS,
    ["file-size"],
    overrides.visibleLabels
  )
  // useEffect(() => {
  //   console.log("TODO THIS MIGHT RENDER A LOT")
  //   setVisibleLabels(overrides.visibleLabels ?? [])
  // }, [overrides.visibleLabels])

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
    setShowMemoryProfiler,

    toolbar,
    setToolbar,

    visibleLabels,
    setVisibleLabels,

    view,
    setView
  }
}
