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
import { Interpreter } from "./interpreter";
import { Templates } from "./templates";
import type { HexEditorProps, HexEditorViewProps } from "./types";
import { getBasename } from "./utils";

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
}) => {
  const [activeTab, setActiveTab] = useState<string>("0");
  const { showAscii, setShowAscii } = useAsciiVisibility();
  const [diffMode, setDiffMode] = useState<DiffViewMode>("inline");
  const [dataType, setDataType] = useState<string>("Signed Int");
  const [endianness, setEndianness] = useState<string>("le");
  const [numberFormat, setNumberFormat] = useState<string>("dec");
  const { showChecksums } = useChecksumVisibility();
  const { showInterpreter, setShowInterpreter } = useInterpreterVisibility();
  const { showTemplates, setShowTemplates } = useTemplatesVisibility();
  const currentSnapshot = snapshots[parseInt(activeTab, 10)] || snapshots[0];
  const hasFile = filePath != null && filePath !== "";
  const hasSnapshots = snapshots.length > 0;

  // Get previous snapshot for the active tab
  const activeTabIndex = parseInt(activeTab, 10);
  const previousSnapshot =
    activeTabIndex > 0 ? snapshots[activeTabIndex - 1] : undefined;

  const bytesLabel = hasFile ? (
    <div className="flex items-center gap-2 font-mono">
      <span className="text-xs text-muted-foreground">
        {formatFileSize(currentSnapshot?.data.length || 0)}
      </span>
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
  const [isInterpreterPIPActive, setIsInterpreterPIPActive] = useState(false);
  const [isTemplatesPIPActive, setIsTemplatesPIPActive] = useState(false);

  // Calculate earliest byte for interpreter
  const selectedOffset = selectedOffsetRange
    ? Math.min(selectedOffsetRange.start, selectedOffsetRange.end)
    : null;

  // Derived value for toggle group
  const paneToggleValue = showInterpreter
    ? "interpreter"
    : showTemplates
    ? "templates"
    : "";

  // Handle pane toggle group change
  const handlePaneToggleChange = (value: string) => {
    if (value === "interpreter") {
      setShowInterpreter(true);
      setShowTemplates(false);
    } else if (value === "templates") {
      setShowTemplates(true);
      setShowInterpreter(false);
    } else {
      setShowInterpreter(false);
      setShowTemplates(false);
    }
  };
  const headerContent = (
    <CardHeader className="p-0! gap-0 m-0 bg-muted/30">
      {/* Primary Toolbar */}
      <HexToolbar
        left={<Logo />}
        center={
          !hasFile ? (
            <div className="flex items-center gap-2 min-w-0">
              <File className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-mono text-sm text-muted-foreground">
                No file selected
              </span>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 min-w-0 cursor-default">
                  <File className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-mono text-sm truncate" title={filePath}>
                    {getBasename(filePath!)}
                  </span>
                  <div
                    className={`inline-flex h-2 w-2 rounded-full shrink-0 ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                    title={
                      isConnected
                        ? "Watching for changes"
                        : "Not watching for change"
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isConnected
                  ? "Watching for changes"
                  : "Not watching for change"}
              </TooltipContent>
            </Tooltip>
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
                {/* <X className="h-4 w-4" /> */}
                Done
              </Button>
            )
          )
        }
      />

      {/* Secondary Toolbar - Tabs */}
      {hasFile && hasSnapshots && (
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

    return snapshots.map((snapshot, index) => (
      <TabsContent
        key={snapshot.id}
        value={index.toString()}
        className="h-full"
      >
        <div className="h-full w-full flex min-w-0">
          <HexEditorView
            scrollToOffset={scrollToOffset}
            snapshot={snapshot}
            showAscii={showAscii}
            diff={diff}
            selectedOffsetRange={selectedOffsetRange}
            onSelectedOffsetRangeChange={setSelectedOffsetRange}
          />
          {showInterpreter && (
            <div
              className={`w-[650px] shrink-0 h-full border-l ${
                isInterpreterPIPActive ? "hidden" : ""
              }`}
            >
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
          )}
          {showTemplates && (
            <div
              className={`w-[650px] shrink-0 h-full border-l ${
                isTemplatesPIPActive ? "hidden" : ""
              }`}
            >
              <Templates
                data={currentSnapshot?.data}
                onClose={() => setShowTemplates(false)}
                onPIPStateChange={setIsTemplatesPIPActive}
              />
            </div>
          )}
        </div>
      </TabsContent>
    ));
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
