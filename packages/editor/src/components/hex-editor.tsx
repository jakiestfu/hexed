"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FunctionComponent, ReactNode } from "react"
import { Loader2 } from "lucide-react"

import { computeDiff } from "@hexed/binary-utils/differ"
import { formatFileSize } from "@hexed/binary-utils/formatter"
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
import { useFileManager } from "../providers/file-manager-provider"
import type { HexEditorProps, HexEditorViewProps } from "../types"
import { EmptyState } from "./empty-state"
import { HexFooter } from "./hex-footer"
import { HexToolbar } from "./hex-toolbar"
import { HexToolbarDiff } from "./hex-toolbar-diff"
import { HexToolbarSearch } from "./hex-toolbar-search"
import { HexToolbarTabs } from "./hex-toolbar-tabs"
import { Interpreter } from "./interpreter"
import { Strings } from "./strings"
import { Templates } from "./templates"

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
  // Get file manager from context
  const fileManager = useFileManager()

  // Use hook to manage file loading and watching
  const { snapshots, filePath, isConnected, loading, error, restart } =
    useHexEditorFile(handleId || null, fileManager || null)

  const [activeTab, setActiveTab] = useState<string>("0")
  const {
    showAscii,
    setShowAscii,
    showChecksums,
    setShowChecksums,
    showInterpreter,
    setShowInterpreter,
    showTemplates,
    setShowTemplates,
    showStrings,
    setShowStrings,
    sidebarPosition,
    toggleSidebarPosition,
    showMemoryProfiler,
    showWorkerStatus
  } = useSettings()

  const [diffMode, setDiffMode] = useState<DiffViewMode>("inline")
  const [dataType, setDataType] = useState<string>("Signed Int")
  const [endianness, setEndianness] = useState<string>("le")
  const [numberFormat, setNumberFormat] = useState<string>("dec")
  const currentSnapshot = snapshots[parseInt(activeTab, 10)] || snapshots[0]
  const hasFile = filePath != null && filePath !== ""
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

  const handleCloseSidebars = useCallback(() => {
    setShowInterpreter(false)
    setShowTemplates(false)
    setShowStrings(false)
  }, [setShowInterpreter, setShowTemplates, setShowStrings])

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
  const handleToggleAscii = useCallback(() => {
    setShowAscii((prev) => !prev)
  }, [setShowAscii])

  const handleToggleChecksums = useCallback(() => {
    setShowChecksums((prev) => !prev)
  }, [setShowChecksums])

  const handleToggleHistogram = useCallback(() => {
    setShowHistogram((prev) => !prev)
  }, [])

  const handleToggleInterpreter = useCallback(() => {
    setShowInterpreter((prev) => {
      const newValue = !prev
      if (newValue) {
        setShowTemplates(false)
        setShowStrings(false)
      }
      return newValue
    })
  }, [setShowInterpreter, setShowTemplates, setShowStrings])

  const handleToggleTemplates = useCallback(() => {
    setShowTemplates((prev) => {
      const newValue = !prev
      if (newValue) {
        setShowInterpreter(false)
        setShowStrings(false)
      }
      return newValue
    })
  }, [setShowTemplates, setShowInterpreter, setShowStrings])

  const handleToggleStrings = useCallback(() => {
    setShowStrings((prev) => {
      const newValue = !prev
      if (newValue) {
        setShowInterpreter(false)
        setShowTemplates(false)
      }
      return newValue
    })
  }, [setShowStrings, setShowInterpreter, setShowTemplates])

  const handleToggleSidebarPosition = useCallback(() => {
    toggleSidebarPosition()
  }, [toggleSidebarPosition])

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
    showInterpreter,
    showTemplates,
    showStrings,
    onToggleSearch: handleToggleSearch,
    onCloseSearch: handleCloseSearch,
    onCloseSidebars: handleCloseSidebars,
    onDeselectBytes: handleDeselectBytes,
    onToggleAscii: handleToggleAscii,
    onToggleChecksums: handleToggleChecksums,
    onToggleHistogram: handleToggleHistogram,
    onToggleInterpreter: handleToggleInterpreter,
    onToggleTemplates: handleToggleTemplates,
    onToggleStrings: handleToggleStrings,
    onToggleSidebarPosition: handleToggleSidebarPosition
  })

  // Focus search input when search toolbar is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Derived value for toggle group
  const paneToggleValue = showInterpreter
    ? "interpreter"
    : showTemplates
      ? "templates"
      : showStrings
        ? "strings"
        : ""

  // Handle pane toggle group change
  const handlePaneToggleChange = useCallback(
    (value: string) => {
      setShowInterpreter(false)
      setShowTemplates(false)
      setShowStrings(false)

      switch (value) {
        case "interpreter":
          setShowInterpreter(true)
          break
        case "templates":
          setShowTemplates(true)
          break
        case "strings":
          setShowStrings(true)
          break
        default:
          break
      }
    },
    [setShowInterpreter, setShowTemplates, setShowStrings]
  )

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

  const headerContent = (
    <CardHeader className="p-0! gap-0 m-0 bg-muted/30">
      <HexToolbar
        left={logo}
        filePath={filePath}
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
  )

  const renderCardContent = (insideTabs: boolean) => {
    if (!hasFile) {
      return <EmptyState onHandleReady={onHandleReady} />
    }

    if (loading || (hasFile && !hasSnapshots)) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <h3 className="font-semibold">Loading file...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filePath ? `Reading ${filePath}` : "Loading..."}
            </p>
          </div>
        </div>
      )
    }

    if (!hasSnapshots) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No data available
        </div>
      )
    }

    return snapshots.map((snapshot, index) => {
      // Calculate default sizes based on visible panels
      const hasInterpreter = showInterpreter
      const hasTemplates = showTemplates
      const hasStrings = showStrings
      const hasSidebars = hasInterpreter || hasTemplates || hasStrings

      // Calculate sizes for the sidebar group relative to hex canvas
      let hexCanvasDefaultSize = 100
      let sidebarGroupDefaultSize = 0

      if (hasInterpreter && hasTemplates) {
        hexCanvasDefaultSize = 50
        sidebarGroupDefaultSize = 50
      } else if (hasInterpreter || hasTemplates || hasStrings) {
        hexCanvasDefaultSize = 70
        sidebarGroupDefaultSize = 30
      }

      // Calculate sizes for interpreter, templates, and strings within the sidebar group
      let interpreterDefaultSize = 0
      let templatesDefaultSize = 0
      let stringsDefaultSize = 0

      if (hasInterpreter && hasTemplates) {
        interpreterDefaultSize = 60 // 60% of sidebar group
        templatesDefaultSize = 40 // 40% of sidebar group
      } else if (hasInterpreter) {
        interpreterDefaultSize = 100 // 100% of sidebar group
      } else if (hasTemplates) {
        templatesDefaultSize = 100 // 100% of sidebar group
      } else if (hasStrings) {
        stringsDefaultSize = 100 // 100% of sidebar group
      }

      // Render panels based on sidebar position
      const borderClass = sidebarPosition === "left" ? "border-r" : "border-l"

      const interpreterPanel = showInterpreter ? (
        <ResizablePanel
          id="interpreter"
          defaultSize={interpreterDefaultSize}
          minSize={15}
          collapsible
        >
          <div className={`h-full ${borderClass}`}>
            <Interpreter
              data={snapshot.data}
              selectedOffset={selectedOffset}
              endianness={endianness as "le" | "be"}
              numberFormat={numberFormat as "dec" | "hex"}
              onClose={() => setShowInterpreter(false)}
              onScrollToOffset={handleScrollToOffset}
            />
          </div>
        </ResizablePanel>
      ) : null

      const templatesPanel = showTemplates ? (
        <ResizablePanel
          id="templates"
          defaultSize={templatesDefaultSize}
          minSize={10}
          collapsible
        >
          <div className={`h-full ${borderClass}`}>
            <Templates
              data={currentSnapshot?.data}
              filePath={filePath || undefined}
              onClose={() => setShowTemplates(false)}
              onScrollToOffset={handleScrollToOffset}
              onSelectedOffsetRangeChange={setSelectedOffsetRange}
            />
          </div>
        </ResizablePanel>
      ) : null

      const stringsPanel = showStrings ? (
        <ResizablePanel
          id="strings"
          defaultSize={stringsDefaultSize}
          minSize={10}
          collapsible
        >
          <div className={`h-full ${borderClass}`}>
            <Strings
              data={snapshot.data}
              onClose={() => setShowStrings(false)}
              onScrollToOffset={handleScrollToOffset}
              onSelectedOffsetRangeChange={setSelectedOffsetRange}
              onRangeSelectedForSearch={handleRangeSelectedForSearch}
            />
          </div>
        </ResizablePanel>
      ) : null

      const hexCanvasPanel = (
        <ResizablePanel
          id="hex-canvas"
          defaultSize={hexCanvasDefaultSize}
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

      // Sidebar group component (nested ResizablePanelGroup)
      const sidebarGroup = hasSidebars ? (
        <ResizablePanel
          id="sidebar-group"
          defaultSize={sidebarGroupDefaultSize}
          minSize={15}
          collapsible
        >
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full"
          >
            {interpreterPanel}
            {showInterpreter && showTemplates && <ResizableHandle withHandle />}
            {templatesPanel}
            {showStrings && (showInterpreter || showTemplates) && (
              <ResizableHandle withHandle />
            )}
            {stringsPanel}
          </ResizablePanelGroup>
        </ResizablePanel>
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
                {sidebarGroup}
                {hasSidebars && <ResizableHandle withHandle />}
                {hexCanvasPanel}
              </>
            ) : (
              <>
                {hexCanvasPanel}
                {hasSidebars && <ResizableHandle withHandle />}
                {sidebarGroup}
              </>
            )}
          </ResizablePanelGroup>
        </TabsContent>
      )
    })
  }

  return (
    <Card
      className={`p-0 m-0 w-full h-full rounded-none border-none shadow-none ${className}`}
    >
      {hasFile && hasSnapshots ? (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="gap-0 h-full"
        >
          {headerContent}
          <CardContent className="p-0 grow overflow-auto">
            {renderCardContent(true)}
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
              onPaneToggleChange={handlePaneToggleChange}
              onShowHistogram={handleToggleHistogram}
            />
          </CardFooter>
        </Tabs>
      ) : (
        <>
          {headerContent}
          <CardContent className="p-0 grow overflow-auto">
            {renderCardContent(false)}
          </CardContent>
        </>
      )}
    </Card>
  )
}
