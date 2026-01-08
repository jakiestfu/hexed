import {
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import type { FunctionComponent } from "react";
import type { DiffViewMode } from "@hexed/types";
import { formatDataIntoRows } from "@hexed/binary-utils/formatter";
import { computeDiff, getDiffAtOffset } from "@hexed/binary-utils/differ";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Toggle,
  Button,
  cn,
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
  ChevronsUpDown,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DiffViewer } from "./diff-viewer";
import { EmptyState } from "./empty-state";
import { HexToolbar } from "./hex-toolbar";
import { Logo } from "~/components/logo";
import { HexFooter } from "~/components/hex-editor/hex-footer";
import type { HexEditorProps, HexEditorViewProps, HexViewProps } from "./types";
import {
  computeCollapsibleSections,
  buildVirtualItems,
  getBasename,
} from "./utils";

const HexEditorView: FunctionComponent<HexEditorViewProps> = ({
  scrollToOffset,
  snapshot,
  showAscii,
  diff,
}) => {
  const bytesPerRow = 16;
  const hexViewRef = useRef<{
    scrollToOffset: (offset: number) => void;
  } | null>(null);

  const rows = useMemo(() => {
    return formatDataIntoRows(snapshot.data, bytesPerRow);
  }, [snapshot.data, bytesPerRow]);

  useEffect(() => {
    if (scrollToOffset) {
      hexViewRef.current?.scrollToOffset(scrollToOffset);
    }
  }, [scrollToOffset]);

  const getDiffColorClass = (offset: number) => {
    if (!diff) return "";
    const byteDiff = getDiffAtOffset(diff, offset);
    if (!byteDiff) return "";

    switch (byteDiff.type) {
      case "added":
        return "bg-green-500/20 text-green-900 dark:text-green-100 font-semibold";
      case "removed":
        return "bg-red-500/20 text-red-900 dark:text-red-100 font-semibold";
      case "modified":
        return "bg-yellow-500/20 text-yellow-900 dark:text-yellow-100 font-semibold";
      default:
        return "";
    }
  };

  return (
    <div className="h-full">
      {/* Stats */}
      {/* {diff && diffMode !== "none" && (
        <DiffViewer diff={diff} onScrollToOffset={handleScrollToOffset} />
      )} */}

      <HexView
        ref={hexViewRef}
        rows={rows}
        showAscii={showAscii}
        diff={diff}
        getDiffColorClass={getDiffColorClass}
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
  const [showAscii, setShowAscii] = useState(true);
  const [diffMode, setDiffMode] = useState<DiffViewMode>("inline");
  const [dataType, setDataType] = useState<string>("Signed Int");
  const [endianness, setEndianness] = useState<string>("le");
  const [numberFormat, setNumberFormat] = useState<string>("dec");
  const currentSnapshot = snapshots[parseInt(activeTab, 10)] || snapshots[0];
  const hasFile = filePath != null && filePath !== "";
  const hasSnapshots = snapshots.length > 0;

  // Get previous snapshot for the active tab
  const activeTabIndex = parseInt(activeTab, 10);
  const previousSnapshot =
    activeTabIndex > 0 ? snapshots[activeTabIndex - 1] : undefined;

  const bytesLabel = hasFile ? (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {currentSnapshot?.data.length.toLocaleString()} bytes
      </span>
    </div>
  ) : undefined;

  const diff = useMemo(() => {
    if (!previousSnapshot || diffMode === "none") return null;
    return computeDiff(previousSnapshot, currentSnapshot);
  }, [previousSnapshot, currentSnapshot, diffMode]);

  const [scrollToOffset, setScrollToOffset] = useState<number | null>(null);
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
                    title={isConnected ? "Connected" : "Disconnected"}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isConnected ? "Connected" : "Disconnected"}
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
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-2 shrink-0"
              >
                <X className="h-4 w-4" />
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

    // When we have snapshots, render TabsContent if inside Tabs, otherwise render HexEditorView directly
    if (insideTabs) {
      return snapshots.map((snapshot, index) => (
        <TabsContent
          key={snapshot.id}
          value={index.toString()}
          className="h-full"
        >
          <HexEditorView
            scrollToOffset={scrollToOffset}
            snapshot={snapshot}
            showAscii={showAscii}
            diff={diff}
          />
        </TabsContent>
      ));
    }

    // Render HexEditorView directly when not inside Tabs (shouldn't happen with current logic, but for safety)
    const activeSnapshot = snapshots[parseInt(activeTab, 10)] || snapshots[0];
    return (
      <HexEditorView
        scrollToOffset={scrollToOffset}
        snapshot={activeSnapshot}
        showAscii={showAscii}
        diff={diff}
      />
    );
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
                <Toggle
                  pressed={showAscii}
                  onPressedChange={setShowAscii}
                  aria-label="Toggle ASCII view"
                  size="sm"
                >
                  <Eye className="h-3 w-3" />
                  <span className="ml-1 text-xs">ASCII</span>
                </Toggle>
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
          <CardFooter className="p-0">
            {/* <HexFooter
              // left={bytesLabel}
              // right={
              //   hasFile ? (
              //     <Toggle
              //       pressed={showAscii}
              //       onPressedChange={setShowAscii}
              //       aria-label="Toggle ASCII view"
              //       size="sm"
              //     >
              //       <Eye className="h-3 w-3" />
              //       <span className="ml-1 text-xs">ASCII</span>
              //     </Toggle>
              //   ) : undefined
              // }
              center={hasFile ? <span>test</span> : undefined}
            /> */}
          </CardFooter>
        </>
      )}
    </Card>
  );
};

const HexView = forwardRef<
  { scrollToOffset: (offset: number) => void },
  HexViewProps
>(({ rows, showAscii, diff, getDiffColorClass }, ref) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const bytesPerRow = 16;
  const [highlightedOffset, setHighlightedOffset] = useState<number | null>(
    null
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [parentHeight, setParentHeight] = useState<number>(0);

  // Track parentRef height changes
  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    const updateHeight = () => {
      setParentHeight(element.clientHeight);
    };

    // Initial height
    updateHeight();

    // Use ResizeObserver to track height changes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Compute collapsible sections when in diff mode
  const collapsibleSections = useMemo(() => {
    if (!diff) return [];
    return computeCollapsibleSections(rows, diff, bytesPerRow);
  }, [rows, diff, bytesPerRow]);

  // Build virtual items (rows + collapse buttons)
  const virtualItems = useMemo(() => {
    if (!diff || collapsibleSections.length === 0) {
      return rows.map((_, i) => ({ type: "row" as const, rowIndex: i }));
    }
    return buildVirtualItems(rows, collapsibleSections, expandedSections);
  }, [rows, collapsibleSections, expandedSections, diff]);

  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = virtualItems[index];
      if (item.type === "collapse") {
        return 32; // Collapse button height
      }
      return 24; // Regular row height
    },
    overscan: 200, // Render 5 extra rows above and below viewport
  });

  const scrollToOffset = useCallback(
    (offset: number) => {
      const rowIndex = Math.floor(offset / bytesPerRow);

      // Find the virtual item index for this row
      const virtualItemIndex = virtualItems.findIndex(
        (item) => item.type === "row" && item.rowIndex === rowIndex
      );

      if (virtualItemIndex >= 0) {
        virtualizer.scrollToIndex(virtualItemIndex, {
          align: "center",
          behavior: "smooth",
        });
      } else {
        // Row might be collapsed, try to expand its section
        for (const section of collapsibleSections) {
          if (
            rowIndex >= section.startRowIndex &&
            rowIndex <= section.endRowIndex
          ) {
            setExpandedSections((prev) => new Set(prev).add(section.id));
            // Wait for expansion, then scroll
            setTimeout(() => {
              const newVirtualItems = buildVirtualItems(
                rows,
                collapsibleSections,
                new Set(expandedSections).add(section.id)
              );
              const newVirtualItemIndex = newVirtualItems.findIndex(
                (item) => item.type === "row" && item.rowIndex === rowIndex
              );
              if (newVirtualItemIndex >= 0) {
                virtualizer.scrollToIndex(newVirtualItemIndex, {
                  align: "center",
                  behavior: "smooth",
                });
              }
            }, 100);
            break;
          }
        }
      }

      setHighlightedOffset(offset);
      // Clear highlight after animation
      setTimeout(() => setHighlightedOffset(null), 2000);
    },
    [
      virtualizer,
      bytesPerRow,
      virtualItems,
      collapsibleSections,
      rows,
      expandedSections,
    ]
  );

  useImperativeHandle(ref, () => ({
    scrollToOffset,
  }));

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  return (
    <div
      ref={parentRef}
      className="overflow-auto h-full grow font-mono text-sm"
    >
      <div style={{ height: `${parentHeight}px` }}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem, index) => {
            const item = virtualItems[virtualItem.index];

            if (item.type === "collapse") {
              // Render collapse button
              return (
                <div
                  key={item.section.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className={`flex items-center justify-center ${
                    index ? "border-y" : "border-b"
                  } border-border bg-muted/30 hover:bg-muted/50 transition-colors`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(item.section.id)}
                    className="text-muted-foreground hover:text-foreground my-px w-full"
                  >
                    <span className="flex items-center justify-center w-full">
                      <ChevronsUpDown className="h-4 w-4 mr-2" />
                      <span className="text-xs">
                        {item.section.hiddenRowCount} line
                        {item.section.hiddenRowCount !== 1 ? "s" : ""} hidden
                      </span>
                    </span>
                  </Button>
                </div>
              );
            }

            // Render regular row
            const row = rows[item.rowIndex];
            return (
              <div
                key={row.startOffset}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="flex gap-4 hover:bg-muted/50 px-4"
              >
                <div className="flex h-full items-center text-muted-foreground select-none shrink-0 w-24">
                  {row.address}
                </div>

                <div className="flex h-full items-center gap-1 flex-wrap">
                  {row.hexBytes.map((byte, index) => {
                    const offset = row.startOffset + index;
                    const colorClass = getDiffColorClass(offset);
                    const isHighlighted = highlightedOffset === offset;
                    return (
                      <span
                        key={offset}
                        className={cn(
                          "inline-block w-6 text-center rounded px-0.5 transition-all",
                          colorClass,
                          isHighlighted &&
                            "ring-2 ring-primary ring-offset-1 bg-primary/20"
                        )}
                        title={`Offset: ${offset} (0x${offset
                          .toString(16)
                          .toUpperCase()})`}
                      >
                        {byte}
                      </span>
                    );
                  })}

                  {row.hexBytes.length < 16 &&
                    Array.from({ length: 16 - row.hexBytes.length }).map(
                      (_, i) => (
                        <span key={`pad-${i}`} className="inline-block w-6" />
                      )
                    )}
                </div>

                {showAscii && (
                  <div className="flex h-full items-center border-l pl-4 text-muted-foreground">
                    {row.ascii.split("").map((char, index) => {
                      const offset = row.startOffset + index;
                      const colorClass = getDiffColorClass(offset);
                      const isHighlighted = highlightedOffset === offset;
                      return (
                        <span
                          key={offset}
                          className={cn(
                            "inline-block rounded px-0.5 transition-all",
                            colorClass,
                            isHighlighted &&
                              "ring-2 ring-primary ring-offset-1 bg-primary/20"
                          )}
                          title={`Offset: ${offset}`}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

HexView.displayName = "HexView";
