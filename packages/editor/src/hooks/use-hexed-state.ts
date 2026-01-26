"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import type React from "react"

import type { DiffViewMode } from "@hexed/types"

import type { SelectionRange } from "../types"

export type HexedState = {
  // State values
  activeTab: string
  diffMode: DiffViewMode
  dataType: string
  endianness: string
  numberFormat: string
  scrollToOffset: number | null
  selectedOffsetRange: SelectionRange
  showHistogram: boolean
  // showSearch: boolean
  dimensions: { width: number; height: number }
  // Derived values
  selectedOffset: number | null
  // Callbacks
  // handleToggleSearch: () => void
  handleDeselectBytes: () => void
  handleToggleHistogram: () => void
  // handleCloseSearch: () => void
  handleScrollToOffset: (offset: number) => void
  handleMatchFound: (offset: number, length: number) => void
  // Setters
  setActiveTab: (tab: string) => void
  setDataType: (value: string) => void
  setEndianness: (value: string) => void
  setNumberFormat: (value: string) => void
  setSelectedOffsetRange: (range: SelectionRange) => void
  setDimensions: (dimensions: { width: number; height: number }) => void
  // Refs (exposed so Editor component can set them)
  canvasRef: React.RefObject<{
    scrollToOffset: (offset: number) => void
    getSelectedRange: () => { start: number; end: number } | null
    getScrollTop: () => number
    setSelectedRange: (range: { start: number; end: number } | null) => void
  } | null>
}

/**
 * Hook for managing editor state
 * Returns a tuple of [state, setState] where state contains all state values and callbacks
 */
export const useHexedState = () => {
  const [activeTab, setActiveTab] = useState<string>("0")
  const [diffMode] = useState<DiffViewMode>("inline")
  const [dataType, setDataType] = useState<string>("Signed Int")
  const [endianness, setEndianness] = useState<string>("le")
  const [numberFormat, setNumberFormat] = useState<string>("dec")
  const [scrollToOffset, setScrollToOffset] = useState<number | null>(null)
  const [selectedOffsetRange, setSelectedOffsetRange] =
    useState<SelectionRange>(null)
  const [showHistogram, setShowHistogram] = useState(false)
  // const [showSearch, setShowSearch] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Refs that need to be accessible from Editor component
  const canvasRef = useRef<{
    scrollToOffset: (offset: number) => void
    getSelectedRange: () => { start: number; end: number } | null
    getScrollTop: () => number
    setSelectedRange: (range: { start: number; end: number } | null) => void
  } | null>(null)

  // Calculate earliest byte for interpreter - memoized to avoid recalculation
  const selectedOffset = useMemo(() => {
    return selectedOffsetRange
      ? Math.min(selectedOffsetRange.start, selectedOffsetRange.end)
      : null
  }, [selectedOffsetRange])

  // Callbacks for keyboard shortcuts
  // const handleToggleSearch = useCallback(() => {
  //   setShowSearch((prev) => !prev)
  // }, [])

  const handleDeselectBytes = useCallback(() => {
    setSelectedOffsetRange(null)
  }, [])

  const handleToggleHistogram = useCallback(() => {
    setShowHistogram((prev) => !prev)
  }, [])


  const handleScrollToOffset = useCallback((offset: number) => {
    setScrollToOffset(offset)
    canvasRef.current?.scrollToOffset(offset)
  }, [])

  const handleMatchFound = useCallback((offset: number, length: number) => {
    setScrollToOffset(offset)
    setSelectedOffsetRange({
      start: offset,
      end: offset + length - 1
    })
    canvasRef.current?.scrollToOffset(offset)
  }, [])

  const state: HexedState = {
    // State values
    activeTab,
    diffMode,
    dataType,
    endianness,
    numberFormat,
    scrollToOffset,
    selectedOffsetRange,
    showHistogram,
    dimensions,
    selectedOffset,
    handleDeselectBytes,
    handleToggleHistogram,
    handleScrollToOffset,
    handleMatchFound,
    setActiveTab,
    setDataType,
    setEndianness,
    setNumberFormat,
    setSelectedOffsetRange,
    setDimensions,
    // Refs
    canvasRef
  }

  return state
}
