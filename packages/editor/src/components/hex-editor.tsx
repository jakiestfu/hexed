"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FunctionComponent, ReactNode } from "react"
import { Loader2 } from "lucide-react"

import { computeDiff } from "@hexed/binary-utils/differ"
import { HexCanvas, type HexCanvasRef } from "@hexed/canvas"
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
import { useHexEditorFile } from "../hooks/use-hex-editor-file"
import { useSettings } from "../hooks/use-settings"
import type { HexEditorProps, HexEditorViewProps } from "../types"
import { EmptyState } from "./empty-state"
import { HexFooter } from "./hex-footer"
import { HexSidebar } from "./hex-sidebar"
import { HexToolbar } from "./hex-toolbar"
import { HexToolbarDiff } from "./hex-toolbar-diff"
import { HexToolbarSearch } from "./hex-toolbar-search"
import { HexToolbarTabs } from "./hex-toolbar-tabs"

const HexEditorView: FunctionComponent<HexEditorViewProps> = ({
  scrollToOffset,
  snapshot,
  showAscii,
  diff,
  selectedOffsetRange,
  onSelectedOffsetRangeChange
}) => {
  const hexCanvasRef = useRef<HexCanvasRef | null>(null)

  useEffect(() => {
    if (scrollToOffset !== null) {
      hexCanvasRef.current?.scrollToOffset(scrollToOffset)
    }
  }, [scrollToOffset])

  return (
    <div className="h-full flex-1 min-w-0">
      <HexCanvas
        ref={hexCanvasRef}
        data={snapshot.data}
        showAscii={showAscii}
        diff={diff}
        selectedOffsetRange={selectedOffsetRange}
        onSelectedOffsetRangeChange={onSelectedOffsetRangeChange}
      />
    </div>
  )
}

export const HexEditor: FunctionComponent<
  HexEditorProps & { logo?: ReactNode }
> = ({
  handleId,
  onClose,
  className = "",
  fileSource = "file-system",
  onHandleReady,
  logo
}) => {
  // Use hook to manage file loading and watching
  const { snapshots, fileHandle, isConnected, loading, error, restart } =
    useHexEditorFile(handleId || null)

  const [activeTab, setActiveTab] = useState<string>("0")
  const { showAscii, sidebar, setSidebar, sidebarPosition } = useSettings()

  const [diffMode, setDiffMode] = useState<DiffViewMode>("inline")
  const [dataType, setDataType] = useState<string>("Signed Int")
  const [endianness, setEndianness] = useState<string>("le")
  const [numberFormat, setNumberFormat] = useState<string>("dec")
  const currentSnapshot = snapshots[parseInt(activeTab, 10)] || snapshots[0]
  const hasFile = fileHandle != null
  const hasSnapshots = snapshots.length > 0
  const hasMultipleSnapshots = snapshots.length > 1

  // Get previous snapshot for the active tab
  const activeTabIndex = parseInt(activeTab, 10)
  const previousSnapshot =
    activeTabIndex > 0 ? snapshots[activeTabIndex - 1] : undefined

  const diff = useMemo(() => {
    if (!previousSnapshot || diffMode === "none") return null
    return computeDiff(previousSnapshot, currentSnapshot)
  }, [previousSnapshot, currentSnapshot, diffMode])

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
    data: currentSnapshot?.data || new Uint8Array(),
    showSearch,
    sidebar,
    setSidebar,
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
  // return <p>wat</p>
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
            left={logo}
            filePath={fileHandle?.name}
            fileSource={fileSource}
            isConnected={isConnected}
            error={error}
            onRestartWatching={restart}
            onClose={onClose}
          />
          <HexToolbarSearch
            data={currentSnapshot?.data}
            showSearch={showSearch}
            hasFile={hasFile}
            hasSnapshots={hasSnapshots}
            inputRef={searchInputRef}
            syncRangeToFindInput={showSearch ? rangeToSyncToFindInput : null}
            onMatchFound={handleMatchFound}
            onClose={handleCloseSearch}
          />
          <HexToolbarTabs snapshots={snapshots} />
          <HexToolbarDiff
            diff={diff}
            onScrollToOffset={handleScrollToOffset}
          />
        </CardHeader>
        <CardContent className="p-0 grow overflow-auto">
          {!hasFile ? (
            <EmptyState onHandleReady={onHandleReady} />
          ) : loading || (hasFile && !hasSnapshots) ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center h-full">
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
          ) : !hasSnapshots ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available
            </div>
          ) : (
            snapshots.map((snapshot, index) => {
              // Calculate default sizes based on visible panels
              const hasSidebars = sidebar !== null

              // Calculate sizes for the sidebar group relative to hex canvas
              // let hexCanvasDefaultSize = 100
              // let sidebarGroupDefaultSize = 0

              // if (true) {
              //   hexCanvasDefaultSize = 70
              //   sidebarGroupDefaultSize = 30
              // }

              // Determine minSize based on sidebar type
              // const sidebarMinSize = sidebar === "interpreter" ? 15 : 10

              const hexCanvasPanel = (
                <ResizablePanel
                  id="hex-canvas"
                  defaultSize={70}
                  minSize={20}
                >
                  <HexEditorView
                    scrollToOffset={scrollToOffset}
                    snapshot={snapshot}
                    showAscii={showAscii}
                    diff={diff}
                    selectedOffsetRange={selectedOffsetRange}
                    onSelectedOffsetRangeChange={setSelectedOffsetRange}
                  />
                </ResizablePanel>
              )

              // Sidebar component
              const sidebarPanel = hasSidebars ? (
                <HexSidebar
                  defaultSize={30}
                  minSize={30}
                  snapshotData={snapshot.data}
                  currentSnapshotData={currentSnapshot?.data}
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
                  key={snapshot.id}
                  value={index.toString()}
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
            })
          )}
        </CardContent>
        <CardFooter className="p-0">
          <HexFooter
            dataType={dataType}
            setDataType={setDataType}
            endianness={endianness}
            setEndianness={setEndianness}
            numberFormat={numberFormat}
            setNumberFormat={setNumberFormat}
            currentSnapshot={currentSnapshot}
            hasSnapshots={hasSnapshots}
            selectedOffset={selectedOffset}
            paneToggleValue={paneToggleValue}
            setSidebar={setSidebar}
            onShowHistogram={handleToggleHistogram}
          />
        </CardFooter>
      </Tabs>
    </Card>
  )
}
