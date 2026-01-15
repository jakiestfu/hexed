"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FunctionComponent } from "react"
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
import { createMinimalSnapshot } from "../utils"
import { EmptyState } from "./empty-state"
import { HexFooter } from "./hex-footer"
import { HexSidebar } from "./hex-sidebar"
import { HexToolbar } from "./hex-toolbar"
import { HexToolbarDiff } from "./hex-toolbar-diff"
import { HexToolbarSearch } from "./hex-toolbar-search"
import { HexToolbarTabs } from "./hex-toolbar-tabs"
import { Logo } from "./logo"

const HexEditorView: FunctionComponent<HexEditorViewProps> = ({
  scrollToOffset,
  data,
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
        data={data}
        showAscii={showAscii}
        diff={diff}
        selectedOffsetRange={selectedOffsetRange}
        onSelectedOffsetRangeChange={onSelectedOffsetRangeChange}
      />
    </div>
  )
}

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
  // Use hook to manage file loading and watching
  const { data, fileHandle, isConnected, loading, error, restart } =
    useHexEditorFile(handleId || null)

  const [activeTab, setActiveTab] = useState<string>("0")
  const { showAscii, sidebar, sidebarPosition } = useSettings()

  const [diffMode, setDiffMode] = useState<DiffViewMode>("inline")
  const [dataType, setDataType] = useState<string>("Signed Int")
  const [endianness, setEndianness] = useState<string>("le")
  const [numberFormat, setNumberFormat] = useState<string>("dec")

  const hasFile = fileHandle != null
  const hasData = data !== null

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
          {!hasFile ? (
            <EmptyState onHandleIdChange={onHandleIdChange} />
          ) : loading || (hasFile && !hasData) ? (
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
          ) : !hasData ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available
            </div>
          ) : (
            (() => {
              // Calculate default sizes based on visible panels
              const hasSidebars = sidebar !== null

              const hexCanvasPanel = (
                <ResizablePanel
                  id="hex-canvas"
                  defaultSize={70}
                  minSize={20}
                >
                  <HexEditorView
                    scrollToOffset={scrollToOffset}
                    data={data}
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
            })()
          )}
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
              data={data}
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
