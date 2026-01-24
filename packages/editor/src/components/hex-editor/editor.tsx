"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FunctionComponent } from "react"

import { HexCanvasReact } from "@hexed/canvas"
import type { DiffViewMode } from "@hexed/types"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tabs,
  TabsContent
} from "@hexed/ui"

import { useGlobalKeyboard } from "../../hooks/use-global-keyboard"
import { useHexedInputContext } from "../../providers/hex-input-provider"
import { useHexedSettingsContext } from "../../providers/hexed-settings-provider"
import type { EditorProps } from "../../types"
import { Logo } from "../common/logo"
import { EmptyState } from "../file/empty-state"
import { HexFooter } from "./hex-footer"
import { HexSidebar } from "./hex-sidebar"
import { HexToolbar } from "./hex-toolbar"
import { HexToolbarDiff } from "./hex-toolbar-diff"
import { HexToolbarSearch } from "./hex-toolbar-search"

export const Editor: FunctionComponent<EditorProps> = ({
  className = "",
  fileSource = "file-system"
}) => {
  const [activeTab, setActiveTab] = useState<string>("0")
  const {
    input: { file, fileHandle, handleId },
    onChangeInput
  } = useHexedInputContext()
  const { showAscii, sidebar, sidebarPosition } = useHexedSettingsContext()

  const [diffMode] = useState<DiffViewMode>("inline")
  const [dataType, setDataType] = useState<string>("Signed Int")
  const [endianness, setEndianness] = useState<string>("le")
  const [numberFormat, setNumberFormat] = useState<string>("dec")

  const canRender = Boolean(file)

  console.log("hex editor render")

  // Diff is disabled since we don't have multiple snapshots
  const diff = useMemo(() => {
    if (diffMode === "none") return null
    return null
  }, [diffMode])

  const [scrollToOffset, setScrollToOffset] = useState<number | null>(null)
  const [selectedOffsetRange, setSelectedOffsetRange] = useState<{
    start: number
    end: number
  } | null>(null)
  const [rangeToSyncToFindInput, setRangeToSyncToFindInput] = useState<{
    start: number
    end: number
  } | null>(null)
  const [showHistogram, setShowHistogram] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Calculate earliest byte for interpreter - memoized to avoid recalculation
  const selectedOffset = useMemo(() => {
    return selectedOffsetRange
      ? Math.min(selectedOffsetRange.start, selectedOffsetRange.end)
      : null
  }, [selectedOffsetRange])

  // Callbacks for keyboard shortcuts
  const handleToggleSearch = useCallback(() => {
    setShowSearch((prev) => {
      const newValue = !prev
      // Focus input after state update if opening
      if (newValue) {
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 0)
      }
      return newValue
    })
  }, [])

  const handleDeselectBytes = useCallback(() => {
    setSelectedOffsetRange(null)
  }, [])

  const handleRangeSelectedForSearch = useCallback(
    (
      range: {
        start: number
        end: number
      } | null
    ) => {
      setRangeToSyncToFindInput(range)
    },
    []
  )

  // Callbacks for new keyboard shortcuts
  const handleToggleHistogram = useCallback(() => {
    setShowHistogram((prev) => !prev)
  }, [])

  // Stable callback for closing search
  const handleCloseSearch = useCallback(() => {
    setShowSearch(false)
  }, [])

  // Clear rangeToSyncToFindInput after it's been processed or when search closes
  useEffect(() => {
    if (!showSearch) {
      setRangeToSyncToFindInput(null)
    }
  }, [showSearch])

  // Global keyboard shortcuts
  useGlobalKeyboard({
    selectedOffsetRange,
    data: new Uint8Array(),
    showSearch,
    onToggleSearch: handleToggleSearch,
    onCloseSearch: handleCloseSearch,
    onDeselectBytes: handleDeselectBytes,
    onToggleHistogram: handleToggleHistogram
  })

  // Focus search input when search toolbar is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Derived value for toggle group
  const paneToggleValue = sidebar || ""

  // Window size for chunked file loading
  const windowSize = 1024 * 128

  // Container ref for dimensions tracking (for sidebar)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Track container dimensions for sidebar
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Canvas ref for imperative API
  const canvasRef = useRef<{
    scrollToOffset: (offset: number) => void
    getSelectedRange: () => { start: number; end: number } | null
    getScrollTop: () => number
    setSelectedRange: (range: { start: number; end: number } | null) => void
  } | null>(null)

  // Stable callback for scroll to offset
  const handleScrollToOffset = useCallback((offset: number) => {
    setScrollToOffset(offset)
    canvasRef.current?.scrollToOffset(offset)
  }, [])

  // Stable callback for match found
  const handleMatchFound = useCallback((offset: number, length: number) => {
    setScrollToOffset(offset)
    setSelectedOffsetRange({
      start: offset,
      end: offset + length - 1
    })
    canvasRef.current?.scrollToOffset(offset)
  }, [])

  const hasSidebars = sidebar !== null

  const hexCanvasPanel = (
    <ResizablePanel
      id="hex-canvas"
      defaultSize={70}
      minSize={20}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
      >
        <HexCanvasReact
          file={file}
          showAscii={showAscii}
          diff={diff}
          windowSize={windowSize}
          selectedOffsetRange={selectedOffsetRange}
          onSelectionChange={(payload) => {
            setSelectedOffsetRange(payload.range)
          }}
        />
      </div>
    </ResizablePanel>
  )

  // Sidebar component - only render when we have data
  const sidebarPanel =
    hasSidebars && canRender ? (
      <HexSidebar
        defaultSize={30}
        minSize={30}
        data={new Uint8Array()}
        selectedOffset={selectedOffset}
        endianness={endianness as "le" | "be"}
        numberFormat={numberFormat as "dec" | "hex"}
        filePath={fileHandle?.name}
        fileId={handleId ?? undefined}
        onScrollToOffset={handleScrollToOffset}
        onSelectedOffsetRangeChange={setSelectedOffsetRange}
        onRangeSelectedForSearch={handleRangeSelectedForSearch}
        dimensions={dimensions}
      />
    ) : null

  return (
    <Card
      className={`p-0 m-0 w-full h-full rounded-none border-none shadow-none overflow-hidden ${className}`}
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="gap-0 h-full"
      >
        <CardHeader className="p-0! gap-0 m-0 bg-muted/30">
          <HexToolbar
            left={
              <Logo
                // currentSnapshot={currentSnapshot}
                showHistogram={showHistogram}
                onShowHistogramChange={setShowHistogram}
                onChangeInput={onChangeInput}
              />
            }
            file={file}
            fileSource={fileSource}
            isConnected={Boolean(fileHandle)}
            error={null}
            onRestartWatching={() => { }}
            onClose={() => onChangeInput(null)}
          />
          <HexToolbarSearch
            showSearch={showSearch}
            inputRef={searchInputRef}
            syncRangeToFindInput={showSearch ? rangeToSyncToFindInput : null}
            onMatchFound={handleMatchFound}
            onClose={handleCloseSearch}
          />
          {/* <HexToolbarTabs snapshots={snapshots} /> */}
          <HexToolbarDiff
            diff={diff}
            onScrollToOffset={handleScrollToOffset}
          />
        </CardHeader>

        <CardContent className="grow min-h-0 overflow-auto p-0">
          {!canRender ? <EmptyState onChangeInput={onChangeInput} /> : null}

          <TabsContent
            value="0"
            className={cn("h-full", !canRender && "hidden")}
          >
            <ResizablePanelGroup
              direction="horizontal"
              className="h-full"
            >
              {sidebarPosition === "left" ? (
                <>
                  {sidebarPanel}
                  {hasSidebars && <ResizableHandle withHandle />}
                  {hexCanvasPanel}
                </>
              ) : (
                <>
                  {hexCanvasPanel}
                  {hasSidebars && <ResizableHandle withHandle />}
                  {sidebarPanel}
                </>
              )}
            </ResizablePanelGroup>
          </TabsContent>
        </CardContent>

        <CardFooter
          className={cn(
            "p-0",
            canRender
              ? "opacity-100"
              : "opacity-0 transition-all duration-700 pointer-events-none"
          )}
        >
          <HexFooter
            dataType={dataType}
            setDataType={setDataType}
            endianness={endianness}
            setEndianness={setEndianness}
            numberFormat={numberFormat}
            setNumberFormat={setNumberFormat}
            totalSize={file?.size}
            hasSnapshots={false}
            selectedOffset={selectedOffset}
            paneToggleValue={paneToggleValue}
            onShowHistogram={handleToggleHistogram}
          />
        </CardFooter>
      </Tabs>
    </Card>
  )
}
