"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FunctionComponent } from "react"

import { useDimensions } from "@hexed/virtual"
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
import { HexVirtual } from "@hexed/virtual"

import { useGlobalKeyboard } from "../hooks/use-global-keyboard"
import { useHandleToFile } from "../hooks/use-handle-to-file"
import {
  useHandleIdToFileHandle,
} from "../hooks/use-hex-editor-file"
import { useSettings } from "../hooks/use-settings"
import { useWorkerClient } from "../providers/worker-provider"
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<string>("0")
  const { showAscii, sidebar, sidebarPosition } = useSettings()
  const workerClient = useWorkerClient()

  const [diffMode, setDiffMode] = useState<DiffViewMode>("inline")
  const [dataType, setDataType] = useState<string>("Signed Int")
  const [endianness, setEndianness] = useState<string>("le")
  const [numberFormat, setNumberFormat] = useState<string>("dec")

  /**
   * Layout Calculations
   */

  const dimensions = useDimensions(containerRef)


  // console.log("byteRowWidth", byteRowWidth, bytesPerRow)

  const { fileHandle } = useHandleIdToFileHandle(handleId)
  const { file } = useHandleToFile(fileHandle)

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

  const virtualContainerRef = useRef<HTMLDivElement>(null)

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
          style={{ display: file !== null ? "block" : "none" }}
          className="h-full w-full overflow-auto relative"
        >
          <HexVirtual
            dimensions={dimensions}
            containerRef={virtualContainerRef}
            file={file}
            showAscii={showAscii}
            chunkSize={128 * 1024}
            overscanCount={100}
            selectedOffsetRange={selectedOffsetRange}
            onSelectedOffsetRangeChange={setSelectedOffsetRange}
          />
          {/* <div style={{ height: '2000px' }} className="bg-red-300">wat</div> */}
        </div>
      </div>
    </ResizablePanel>
  )

  // Sidebar component - only render when we have data
  const sidebarPanel =
    hasSidebars && fileHandle ? (
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
            isConnected={fileHandle !== null}
            error={null}
            onRestartWatching={() => { }}
            onClose={onClose}
          />
          <HexToolbarSearch
            handleId={handleId}
            showSearch={showSearch}
            hasFile={fileHandle !== null}
            hasSnapshots={false}
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
          {!handleId ? <EmptyState onHandleIdChange={onHandleIdChange} /> : null}

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
        </CardContent>

        <CardFooter className={cn("p-0", fileHandle ? "opacity-100" : "opacity-0 pointer-events-none")}>
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
