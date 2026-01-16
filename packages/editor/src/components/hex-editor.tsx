"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FunctionComponent } from "react"
import { Loader2 } from "lucide-react"

import {
  HexCanvas,
  useCalculateEditorLayout,
  useCalculateNonEmptyRows,
  useCalculateVisibleData,
  useDimensions,
  useFormatData,
  type HexCanvasRef
} from "@hexed/canvas"
import type { DiffViewMode } from "@hexed/types"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tabs,
  TabsContent
} from "@hexed/ui"

import { useGlobalKeyboard } from "../hooks/use-global-keyboard"
import { useHandleToFile } from "../hooks/use-handle-to-file"
import {
  useHandleIdToFileHandle,
  useHexEditorFile
} from "../hooks/use-hex-editor-file"
import { useScrollWindow } from "../hooks/use-scroll-window"
import { useSettings } from "../hooks/use-settings"
import type { HexEditorProps } from "../types"
import { EmptyState } from "./empty-state"
import { HexFooter } from "./hex-footer"
import { HexSidebar } from "./hex-sidebar"
import { HexToolbar } from "./hex-toolbar"
import { HexToolbarDiff } from "./hex-toolbar-diff"
import { HexToolbarSearch } from "./hex-toolbar-search"
import { Logo } from "./logo"

export const HexEditor: FunctionComponent<HexEditorProps> = ({
  handleId,
  onClose,
  className = "",
  fileSource = "file-system",
  onHandleIdChange,
  theme,
  setTheme,
  packageInfo
}) => {
  /**
   * Container Setup
   */
  const containerRef = useRef<HTMLDivElement | null>(null)
  const scrollTopRef = useRef<number>(0)
  // const scrollTop = useScrollTop(containerElement, scrollTopRef)
  // console.log("scrollTop", scrollTop)
  const [activeTab, setActiveTab] = useState<string>("0")
  const { showAscii, sidebar, sidebarPosition } = useSettings()

  const [diffMode, setDiffMode] = useState<DiffViewMode>("inline")
  const [dataType, setDataType] = useState<string>("Signed Int")
  const [endianness, setEndianness] = useState<string>("le")
  const [numberFormat, setNumberFormat] = useState<string>("dec")

  /**
   * Layout Calculations
   */

  const hexCanvasRef = useRef<HexCanvasRef | null>(null)
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null)
  const dimensions = useDimensions(containerRef)

  // const [fileSize, setFileSize] = useState<number>(0)

  const { fileHandle, error: loadError } = useHandleIdToFileHandle(handleId)

  const {
    file,
    loading: fileLoading,
    error: fileError
  } = useHandleToFile(fileHandle)

  const layout = useCalculateEditorLayout(
    canvasElementRef,
    dimensions,
    showAscii
  )
  // console.log("layout", layout)

  const visibleDataLayout = useCalculateVisibleData(
    layout,
    dimensions,
    // windowSize, //Math.min(file?.size ?? 0, windowSize)
    file?.size
  )
  const windowSizeFactor = 1 //1.5
  const windowSize =
    visibleDataLayout.visibleRows *
    (layout?.bytesPerRow ?? 0) *
    windowSizeFactor

  const nonEmptyRows = useCalculateNonEmptyRows(
    layout,
    visibleDataLayout.visibleRows,
    windowSize
  )
  // console.log("visibleDataLayout", visibleDataLayout, layout)
  // Calculate dynamic window based on scroll position
  const { windowStart, windowEnd } = useScrollWindow({
    containerRef,
    windowSize,
    layout,
    visibleRows: nonEmptyRows,
    totalSize: file?.size
  })

  // Use hook to manage file loading and watching
  const { data, dataStartOffset, isConnected, loading, error, restart } =
    useHexEditorFile(file, windowStart, windowEnd, true)

  const hasFile = fileHandle != null
  const hasData = data !== null

  // Format data into rows
  const rows = useFormatData(
    data || new Uint8Array(),
    layout?.bytesPerRow ?? null,
    dataStartOffset
  )

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

  // Calculate earliest byte for interpreter
  const selectedOffset = selectedOffsetRange
    ? Math.min(selectedOffsetRange.start, selectedOffsetRange.end)
    : null

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
    data: data || new Uint8Array(),
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

  // Stable callback for scroll to offset
  const handleScrollToOffset = useCallback((offset: number) => {
    setScrollToOffset(offset)
  }, [])

  // Stable callback for match found
  const handleMatchFound = useCallback((offset: number, length: number) => {
    setScrollToOffset(offset)
    setSelectedOffsetRange({
      start: offset,
      end: offset + length - 1
    })
  }, [])

  const handleRequestScrollToOffset = useCallback(
    (offset: number, targetScrollTop: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: "smooth"
        })
      }
    },
    []
  )

  // Expose scrollToOffset via ref for external use
  useEffect(() => {
    if (scrollToOffset !== null) {
      hexCanvasRef.current?.scrollToOffset(scrollToOffset)
    }
  }, [scrollToOffset])

  return (
    <Card
      className={`p-0 m-0 w-full h-full rounded-none border-none shadow-none ${className}`}
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
                onHandleIdChange={onHandleIdChange}
                theme={theme}
                setTheme={setTheme}
                packageInfo={packageInfo}
              />
            }
            filePath={fileHandle?.name}
            fileSource={fileSource}
            isConnected={isConnected}
            error={error}
            onRestartWatching={restart}
            onClose={onClose}
          />
          <HexToolbarSearch
            data={data || undefined}
            showSearch={showSearch}
            hasFile={hasFile}
            hasSnapshots={hasData}
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
        <CardContent className="p-0 grow overflow-auto">
          {!hasFile ? <EmptyState onHandleIdChange={onHandleIdChange} /> : null}

          {(() => {
            // Calculate default sizes based on visible panels
            const hasSidebars = sidebar !== null

            const hexCanvasPanel = (
              <ResizablePanel
                id="hex-canvas"
                defaultSize={70}
                minSize={20}
              >
                <div
                  ref={containerRef}
                  className="h-full w-full overflow-auto relative"
                >
                  {/* Always render HexEditorView, control visibility with CSS */}
                  <div
                    style={{ display: hasData ? "block" : "none" }}
                    className="h-full w-full overflow-auto relative"
                  >
                    <HexCanvas
                      rows={rows}
                      layout={layout}
                      visibleDataLayout={visibleDataLayout}
                      ref={hexCanvasRef}
                      canvasRef={canvasElementRef}
                      data={data || new Uint8Array()}
                      showAscii={showAscii}
                      diff={diff}
                      selectedOffsetRange={selectedOffsetRange}
                      onSelectedOffsetRangeChange={setSelectedOffsetRange}
                      totalSize={file?.size}
                      windowStart={windowStart}
                      windowEnd={windowEnd}
                      containerRef={containerRef}
                      dimensions={dimensions}
                      onRequestScrollToOffset={handleRequestScrollToOffset}
                    />
                    {/* Spacer to make container scrollable to total height */}
                    <div
                      style={{
                        height: `${visibleDataLayout.totalHeight}px`,
                        width: "100%"
                      }}
                    />
                  </div>

                  {/* Loading overlay */}
                  {loading || (hasFile && !hasData) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center bg-background/80 z-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div>
                        <h3 className="font-semibold">Loading file...</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {fileHandle?.name
                            ? `Reading ${fileHandle.name}`
                            : "Loading..."}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* No data overlay */}
                  {/* {!hasData && !loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-background/80 z-10">
                      No data available
                    </div>
                  ) : null} */}
                </div>
              </ResizablePanel>
            )

            // Sidebar component - only render when we have data
            const sidebarPanel =
              hasSidebars && hasData ? (
                <HexSidebar
                  defaultSize={30}
                  minSize={30}
                  data={data}
                  selectedOffset={selectedOffset}
                  endianness={endianness as "le" | "be"}
                  numberFormat={numberFormat as "dec" | "hex"}
                  filePath={fileHandle?.name}
                  onScrollToOffset={handleScrollToOffset}
                  onSelectedOffsetRangeChange={setSelectedOffsetRange}
                  onRangeSelectedForSearch={handleRangeSelectedForSearch}
                />
              ) : null

            return (
              <TabsContent
                value="0"
                className="h-full"
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
            )
          })()}
        </CardContent>
        {hasFile ? (
          <CardFooter className="p-0">
            <HexFooter
              dataType={dataType}
              setDataType={setDataType}
              endianness={endianness}
              setEndianness={setEndianness}
              numberFormat={numberFormat}
              setNumberFormat={setNumberFormat}
              totalSize={file?.size}
              hasSnapshots={hasData}
              selectedOffset={selectedOffset}
              paneToggleValue={paneToggleValue}
              onShowHistogram={handleToggleHistogram}
            />
          </CardFooter>
        ) : null}
      </Tabs>
    </Card>
  )
}
