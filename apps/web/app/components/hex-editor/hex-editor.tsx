import { useRef, useEffect, useState, useMemo } from "react";
import type { FunctionComponent } from "react";
import type { DiffViewMode } from "@hexed/types";
import { computeDiff } from "@hexed/binary-utils/differ";
import { formatFileSize } from "@hexed/binary-utils/formatter";
import { HexCanvas, type HexCanvasRef } from "@hexed/canvas";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  cn,
} from "@hexed/ui";
import {
  Eye,
  X,
  ChevronDownIcon,
  File,
  Loader2,
  Code,
  CaseSensitive,
  Binary,
  FileText,
  BarChart3,
  Type,
} from "lucide-react";
import { DiffViewer } from "./diff-viewer";
import { EmptyState } from "./empty-state";
import { HexToolbar } from "./hex-toolbar";
import { Logo } from "~/components/logo";
import { HexFooter } from "~/components/hex-editor/hex-footer";
import { useChecksumVisibility } from "~/hooks/use-checksum-visibility";
import { useAsciiVisibility } from "~/hooks/use-ascii-visibility";
import { useInterpreterVisibility } from "~/hooks/use-interpreter-visibility";
import { useTemplatesVisibility } from "~/hooks/use-templates-visibility";
import { useStringsVisibility } from "~/hooks/use-strings-visibility";
import { useSidebarPosition } from "~/hooks/use-sidebar-position";
import { useGlobalKeyboard } from "~/hooks/use-global-keyboard";
import { Interpreter } from "./interpreter";
import { MemoryProfiler } from "./memory-profiler";
import { Templates } from "./templates";
import { Strings } from "./strings";
import { FindInput } from "./find-input";
import { FileStatusPopover } from "./file-status-popover";
import { FileSourceIcon } from "./file-source-icon";
import type { HexEditorProps, HexEditorViewProps } from "./types";
import { formatFilenameForDisplay } from "./utils";

const HexEditorView: FunctionComponent<HexEditorViewProps> = ({
  scrollToOffset,
  snapshot,
  showAscii,
  diff,
  selectedOffsetRange,
  onSelectedOffsetRangeChange,
}) => {
  const hexCanvasRef = useRef<HexCanvasRef | null>(null);

  useEffect(() => {
    if (scrollToOffset !== null) {
      hexCanvasRef.current?.scrollToOffset(scrollToOffset);
    }
  }, [scrollToOffset]);

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
  );
};

export const HexEditor: FunctionComponent<HexEditorProps> = ({
  snapshots,
  filePath,
  isConnected,
  loading = false,
  onClose,
  onFileSelect,
  recentFiles = [],
  className = "",
  fileSource = "upload",
  originalSource,
  error,
  onRestartWatching,
}) => {
  const [activeTab, setActiveTab] = useState<string>("0");
  const { showAscii, setShowAscii } = useAsciiVisibility();
  const [diffMode, setDiffMode] = useState<DiffViewMode>("inline");
  const [dataType, setDataType] = useState<string>("Signed Int");
  const [endianness, setEndianness] = useState<string>("le");
  const [numberFormat, setNumberFormat] = useState<string>("dec");
  const { showChecksums, setShowChecksums } = useChecksumVisibility();
  const { showInterpreter, setShowInterpreter } = useInterpreterVisibility();
  const { showTemplates, setShowTemplates } = useTemplatesVisibility();
  const { showStrings, setShowStrings } = useStringsVisibility();
  const { sidebarPosition, setSidebarPosition } = useSidebarPosition();
  const currentSnapshot = snapshots[parseInt(activeTab, 10)] || snapshots[0];
  const hasFile = filePath != null && filePath !== "";
  const hasSnapshots = snapshots.length > 0;
  const hasMultipleSnapshots = snapshots.length > 1;

  // Get previous snapshot for the active tab
  const activeTabIndex = parseInt(activeTab, 10);
  const previousSnapshot =
    activeTabIndex > 0 ? snapshots[activeTabIndex - 1] : undefined;

  const bytesLabel = hasFile ? (
    <div className="flex items-center gap-2 font-mono">
      <span className="text-xs text-muted-foreground">
        {formatFileSize(currentSnapshot?.data.length || 0)}
      </span>
      <MemoryProfiler />
    </div>
  ) : undefined;

  const diff = useMemo(() => {
    if (!previousSnapshot || diffMode === "none") return null;
    return computeDiff(previousSnapshot, currentSnapshot);
  }, [previousSnapshot, currentSnapshot, diffMode]);

  const [scrollToOffset, setScrollToOffset] = useState<number | null>(null);
  const [selectedOffsetRange, setSelectedOffsetRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [rangeToSyncToFindInput, setRangeToSyncToFindInput] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [isInterpreterPIPActive, setIsInterpreterPIPActive] = useState(false);
  const [isTemplatesPIPActive, setIsTemplatesPIPActive] = useState(false);
  const [isStringsPIPActive, setIsStringsPIPActive] = useState(false);
  const [showHistogram, setShowHistogram] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Calculate earliest byte for interpreter
  const selectedOffset = selectedOffsetRange
    ? Math.min(selectedOffsetRange.start, selectedOffsetRange.end)
    : null;

  // Callbacks for keyboard shortcuts
  const handleToggleSearch = () => {
    setShowSearch((prev) => {
      const newValue = !prev;
      // Focus input after state update if opening
      if (newValue) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
      }
      return newValue;
    });
  };

  const handleCloseSidebars = () => {
    setShowInterpreter(false);
    setShowTemplates(false);
    setShowStrings(false);
  };

  const handleDeselectBytes = () => {
    setSelectedOffsetRange(null);
  };

  const handleRangeSelectedForSearch = (
    range: {
      start: number;
      end: number;
    } | null
  ) => {
    setRangeToSyncToFindInput(range);
  };

  // Callbacks for new keyboard shortcuts
  const handleToggleAscii = () => {
    setShowAscii((prev) => !prev);
  };

  const handleToggleChecksums = () => {
    setShowChecksums((prev) => !prev);
  };

  const handleToggleHistogram = () => {
    setShowHistogram((prev) => !prev);
  };

  const handleToggleInterpreter = () => {
    setShowInterpreter((prev) => {
      const newValue = !prev;
      if (newValue) {
        setShowTemplates(false);
        setShowStrings(false);
      }
      return newValue;
    });
  };

  const handleToggleTemplates = () => {
    setShowTemplates((prev) => {
      const newValue = !prev;
      if (newValue) {
        setShowInterpreter(false);
        setShowStrings(false);
      }
      return newValue;
    });
  };

  const handleToggleStrings = () => {
    setShowStrings((prev) => {
      const newValue = !prev;
      if (newValue) {
        setShowInterpreter(false);
        setShowTemplates(false);
      }
      return newValue;
    });
  };

  const handleToggleSidebarPosition = () => {
    setSidebarPosition((prev) => (prev === "left" ? "right" : "left"));
  };

  // Clear rangeToSyncToFindInput after it's been processed or when search closes
  useEffect(() => {
    if (!showSearch) {
      setRangeToSyncToFindInput(null);
    }
  }, [showSearch]);

  // Global keyboard shortcuts
  useGlobalKeyboard({
    selectedOffsetRange,
    data: currentSnapshot?.data || new Uint8Array(),
    showSearch,
    showInterpreter,
    showTemplates,
    showStrings,
    onToggleSearch: handleToggleSearch,
    onCloseSearch: () => setShowSearch(false),
    onCloseSidebars: handleCloseSidebars,
    onDeselectBytes: handleDeselectBytes,
    onToggleAscii: handleToggleAscii,
    onToggleChecksums: handleToggleChecksums,
    onToggleHistogram: handleToggleHistogram,
    onToggleInterpreter: handleToggleInterpreter,
    onToggleTemplates: handleToggleTemplates,
    onToggleStrings: handleToggleStrings,
    onToggleSidebarPosition: handleToggleSidebarPosition,
  });

  // Focus search input when search toolbar is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Derived value for toggle group
  const paneToggleValue = showInterpreter
    ? "interpreter"
    : showTemplates
    ? "templates"
    : showStrings
    ? "strings"
    : "";

  // Handle pane toggle group change
  const handlePaneToggleChange = (value: string) => {
    setShowInterpreter(false);
    setShowTemplates(false);
    setShowStrings(false);

    switch (value) {
      case "interpreter":
        setShowInterpreter(true);
        break;
      case "templates":
        setShowTemplates(true);
        break;
      case "strings":
        setShowStrings(true);
        break;
      default:
        break;
    }
  };
  const headerContent = (
    <CardHeader className="p-0! gap-0 m-0 bg-muted/30">
      {/* Primary Toolbar */}
      <HexToolbar
        left={
          <Logo
            currentSnapshot={currentSnapshot}
            showHistogram={showHistogram}
            onShowHistogramChange={setShowHistogram}
          />
        }
        center={
          !hasFile ? (
            <div className="flex items-center gap-2 min-w-0">
              <FileSourceIcon
                fileSource={fileSource}
                className="h-4 w-4 text-muted-foreground shrink-0"
              />
              <span className="font-mono text-sm text-muted-foreground">
                No file selected
              </span>
            </div>
          ) : (
            <FileStatusPopover
              fileSource={fileSource}
              originalSource={originalSource || filePath || ""}
              isConnected={isConnected}
              error={error}
              onRestartWatching={onRestartWatching}
            >
              <div className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition-opacity group">
                <FileSourceIcon
                  fileSource={fileSource}
                  className="text-muted-foreground shrink-0"
                />
                <span
                  className="font-mono text-sm truncate group-hover:underline"
                  title={filePath}
                >
                  {formatFilenameForDisplay(filePath!)}
                </span>
                <div
                  className={`inline-flex h-2 w-2 rounded-full shrink-0 ${
                    fileSource === "disk"
                      ? isConnected
                        ? "bg-green-500"
                        : "bg-red-500"
                      : "bg-gray-500"
                  }`}
                />
                {fileSource}
              </div>
            </FileStatusPopover>
          )
        }
        right={
          !hasFile ? (
            <span />
          ) : (
            onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="ml-2 shrink-0"
              >
                Done
              </Button>
            )
          )
        }
      />

      {/* Secondary Toolbar - Search */}

      <div
        className={cn(
          "border-b",
          hasFile && showSearch && hasSnapshots && currentSnapshot?.data
            ? ""
            : "hidden"
        )}
      >
        <div className="p-4">
          <FindInput
            data={currentSnapshot?.data}
            inputRef={searchInputRef}
            syncRangeToFindInput={showSearch ? rangeToSyncToFindInput : null}
            onMatchFound={(offset, length) => {
              setScrollToOffset(offset);
              setSelectedOffsetRange({
                start: offset,
                end: offset + length - 1,
              });
            }}
            onClose={() => setShowSearch(false)}
          />
        </div>
      </div>

      {/* Secondary Toolbar - Tabs */}
      {hasFile && hasMultipleSnapshots && (
        <div className="border-b">
          <div className="p-4">
            <TabsList>
              {snapshots.map((snapshot, index) => (
                <TabsTrigger key={snapshot.id} value={index.toString()}>
                  {snapshot.label}
                  {showChecksums && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {snapshot.md5 ? ` (${snapshot.md5.slice(0, 7)})` : ""}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>
      )}

      {diff ? (
        <DiffViewer diff={diff} onScrollToOffset={setScrollToOffset} />
      ) : null}
    </CardHeader>
  );

  const renderCardContent = (insideTabs: boolean) => {
    if (!hasFile) {
      return onFileSelect ? (
        <EmptyState onFileSelect={onFileSelect} recentFiles={recentFiles} />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Please select a file to begin
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <h3 className="font-semibold">Loading file...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Reading {filePath}
            </p>
          </div>
        </div>
      );
    }

    if (!hasSnapshots) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No data available
        </div>
      );
    }

    return snapshots.map((snapshot, index) => {
      // Calculate default sizes based on visible panels
      const hasInterpreter = showInterpreter && !isInterpreterPIPActive;
      const hasTemplates = showTemplates && !isTemplatesPIPActive;
      const hasStrings = showStrings && !isStringsPIPActive;
      const hasSidebars = hasInterpreter || hasTemplates || hasStrings;

      // Calculate sizes for the sidebar group relative to hex canvas
      let hexCanvasDefaultSize = 100;
      let sidebarGroupDefaultSize = 0;

      if (hasInterpreter && hasTemplates) {
        hexCanvasDefaultSize = 50;
        sidebarGroupDefaultSize = 50;
      } else if (hasInterpreter || hasTemplates || hasStrings) {
        hexCanvasDefaultSize = 70;
        sidebarGroupDefaultSize = 30;
      }

      // Calculate sizes for interpreter, templates, and strings within the sidebar group
      let interpreterDefaultSize = 0;
      let templatesDefaultSize = 0;
      let stringsDefaultSize = 0;

      if (hasInterpreter && hasTemplates) {
        interpreterDefaultSize = 60; // 60% of sidebar group
        templatesDefaultSize = 40; // 40% of sidebar group
      } else if (hasInterpreter) {
        interpreterDefaultSize = 100; // 100% of sidebar group
      } else if (hasTemplates) {
        templatesDefaultSize = 100; // 100% of sidebar group
      } else if (hasStrings) {
        stringsDefaultSize = 100; // 100% of sidebar group
      }

      // Render panels based on sidebar position
      const borderClass = sidebarPosition === "left" ? "border-r" : "border-l";

      const interpreterPanel = showInterpreter ? (
        <ResizablePanel
          id="interpreter"
          defaultSize={isInterpreterPIPActive ? 0 : interpreterDefaultSize}
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
              onScrollToOffset={setScrollToOffset}
              onPIPStateChange={setIsInterpreterPIPActive}
            />
          </div>
        </ResizablePanel>
      ) : null;

      const templatesPanel = showTemplates ? (
        <ResizablePanel
          id="templates"
          defaultSize={isTemplatesPIPActive ? 0 : templatesDefaultSize}
          minSize={10}
          collapsible
        >
          <div className={`h-full ${borderClass}`}>
            <Templates
              data={currentSnapshot?.data}
              filePath={filePath || undefined}
              onClose={() => setShowTemplates(false)}
              onScrollToOffset={setScrollToOffset}
              onSelectedOffsetRangeChange={setSelectedOffsetRange}
              onPIPStateChange={setIsTemplatesPIPActive}
            />
          </div>
        </ResizablePanel>
      ) : null;

      const stringsPanel = showStrings ? (
        <ResizablePanel
          id="strings"
          defaultSize={isStringsPIPActive ? 0 : stringsDefaultSize}
          minSize={10}
          collapsible
        >
          <div className={`h-full ${borderClass}`}>
            <Strings
              data={snapshot.data}
              onClose={() => setShowStrings(false)}
              onScrollToOffset={setScrollToOffset}
              onSelectedOffsetRangeChange={setSelectedOffsetRange}
              onRangeSelectedForSearch={handleRangeSelectedForSearch}
              onPIPStateChange={setIsStringsPIPActive}
            />
          </div>
        </ResizablePanel>
      ) : null;

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
      );

      // Sidebar group component (nested ResizablePanelGroup)
      const sidebarGroup = hasSidebars ? (
        <ResizablePanel
          id="sidebar-group"
          defaultSize={sidebarGroupDefaultSize}
          minSize={15}
          collapsible
        >
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {interpreterPanel}
            {showInterpreter && showTemplates && <ResizableHandle withHandle />}
            {templatesPanel}
            {showStrings && (showInterpreter || showTemplates) && (
              <ResizableHandle withHandle />
            )}
            {stringsPanel}
          </ResizablePanelGroup>
        </ResizablePanel>
      ) : null;

      return (
        <TabsContent
          key={snapshot.id}
          value={index.toString()}
          className="h-full"
        >
          <ResizablePanelGroup direction="horizontal" className="h-full">
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
      );
    });
  };

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
              left={
                <div className="flex items-center gap-2">
                  <Select value={dataType} onValueChange={setDataType}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Signed Int">Signed Int</SelectItem>
                      <SelectItem value="Unsigned Int">Unsigned Int</SelectItem>
                      <SelectItem value="Floats">Floats</SelectItem>
                      <SelectItem value="UTF-8">UTF-8</SelectItem>
                      <SelectItem value="SLEB128">SLEB128</SelectItem>
                      <SelectItem value="ULEB128">ULEB128</SelectItem>
                      <SelectItem value="Binary">Binary</SelectItem>
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-between font-mono"
                      >
                        {endianness}, {numberFormat}
                        <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Endianness</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={endianness}
                          onValueChange={setEndianness}
                        >
                          <DropdownMenuRadioItem value="le">
                            little
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="be">
                            big
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Format</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={numberFormat}
                          onValueChange={setNumberFormat}
                        >
                          <DropdownMenuRadioItem value="dec">
                            decimal
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="hex">
                            hexadecimal
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              }
              right={
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Toggle
                        variant="outline"
                        pressed={showAscii}
                        onPressedChange={setShowAscii}
                        aria-label="Toggle ASCII view"
                        size="sm"
                        className={showAscii ? "bg-accent" : ""}
                      >
                        <CaseSensitive />
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>Toggle ASCII view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistogram(true)}
                        disabled={!hasSnapshots || !currentSnapshot?.data}
                        aria-label="Show histogram"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Show Histogram</TooltipContent>
                  </Tooltip>
                  <ToggleGroup
                    type="single"
                    value={paneToggleValue}
                    onValueChange={handlePaneToggleChange}
                    variant="outline"
                    size="sm"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem
                          value="interpreter"
                          aria-label="Toggle interpreter"
                          className={
                            paneToggleValue === "interpreter" ? "bg-accent" : ""
                          }
                        >
                          <Binary />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        {selectedOffset === null
                          ? "Select bytes to enable interpreter"
                          : "Toggle interpreter panel"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem
                          value="templates"
                          aria-label="Toggle templates panel"
                          className={
                            paneToggleValue === "templates" ? "bg-accent" : ""
                          }
                        >
                          <FileText />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>Toggle templates panel</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem
                          value="strings"
                          aria-label="Toggle strings panel"
                          className={
                            paneToggleValue === "strings" ? "bg-accent" : ""
                          }
                        >
                          <Type />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>Toggle strings panel</TooltipContent>
                    </Tooltip>
                  </ToggleGroup>
                </div>
              }
              center={bytesLabel}
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
  );
};
