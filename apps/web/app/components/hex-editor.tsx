import * as React from "react";
import type { BinarySnapshot, DiffViewMode, DiffResult } from "@hexed/types";
import type { FormattedRow } from "@hexed/binary-utils/formatter";
import { formatDataIntoRows } from "@hexed/binary-utils/formatter";
import {
  computeDiff,
  getDiffAtOffset,
  hasDiffAtOffset,
} from "@hexed/binary-utils/differ";
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
} from "@hexed/ui";
import {
  Columns2,
  Minus,
  Eye,
  X,
  ChevronDownIcon,
  File,
  Loader2,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DiffViewer } from "./diff-viewer";
import { EmptyState } from "./empty-state";
import { HexToolbar } from "./hex-toolbar";
import type { RecentFile } from "~/hooks/use-recent-files";
import { Logo } from "~/components/logo";
import { HexFooter } from "~/components/hex-footer";

interface HexEditorProps {
  snapshots: BinarySnapshot[];
  filePath?: string | null;
  isConnected: boolean;
  loading?: boolean;
  onClose?: () => void;
  onFileSelect?: (filePath: string) => void;
  recentFiles?: RecentFile[];
  className?: string;
}

interface HexEditorViewProps {
  snapshot: BinarySnapshot;
  previousSnapshot?: BinarySnapshot;
  filePath: string;
  isConnected: boolean;
  onClose?: () => void;
  showAscii: boolean;
  diffMode: DiffViewMode;
  onShowAsciiChange: (show: boolean) => void;
  onDiffModeChange: (mode: DiffViewMode) => void;
}

interface CollapsibleSection {
  startRowIndex: number;
  endRowIndex: number;
  id: string;
  hiddenRowCount: number;
}

type VirtualItemType =
  | { type: "row"; rowIndex: number }
  | { type: "collapse"; section: CollapsibleSection };

/**
 * Check if a row has any changes in the diff
 */
function hasRowChanges(row: FormattedRow, diff: DiffResult): boolean {
  for (let offset = row.startOffset; offset <= row.endOffset; offset++) {
    if (hasDiffAtOffset(diff, offset)) {
      return true;
    }
  }
  return false;
}

/**
 * Compute collapsible sections for empty rows
 * Maintains a 3-row buffer above and below changed rows
 */
function computeCollapsibleSections(
  rows: FormattedRow[],
  diff: DiffResult | null,
  bytesPerRow: number
): CollapsibleSection[] {
  if (!diff) return [];

  const sections: CollapsibleSection[] = [];
  const bufferRows = 3;
  const minCollapsibleRows = 4; // Need at least 4 empty rows to collapse

  // Mark which rows have changes
  const rowsWithChanges = new Set<number>();
  for (let i = 0; i < rows.length; i++) {
    if (hasRowChanges(rows[i], diff)) {
      rowsWithChanges.add(i);
    }
  }

  // Mark rows that should be visible (changed rows + buffer)
  const visibleRows = new Set<number>();
  for (const changedRowIndex of rowsWithChanges) {
    // Add buffer rows above
    for (
      let i = Math.max(0, changedRowIndex - bufferRows);
      i < changedRowIndex;
      i++
    ) {
      visibleRows.add(i);
    }
    // Add the changed row itself
    visibleRows.add(changedRowIndex);
    // Add buffer rows below
    for (
      let i = changedRowIndex + 1;
      i <= Math.min(rows.length - 1, changedRowIndex + bufferRows);
      i++
    ) {
      visibleRows.add(i);
    }
  }

  // Find consecutive empty rows that should be collapsed
  let startEmptyRow: number | null = null;
  for (let i = 0; i < rows.length; i++) {
    const isEmpty = !rowsWithChanges.has(i);
    const shouldBeVisible = visibleRows.has(i);

    if (isEmpty && !shouldBeVisible) {
      if (startEmptyRow === null) {
        startEmptyRow = i;
      }
    } else {
      if (startEmptyRow !== null) {
        const emptyRowCount = i - startEmptyRow;
        if (emptyRowCount >= minCollapsibleRows) {
          sections.push({
            startRowIndex: startEmptyRow,
            endRowIndex: i - 1,
            id: `collapse-${startEmptyRow}-${i - 1}`,
            hiddenRowCount: emptyRowCount,
          });
        }
        startEmptyRow = null;
      }
    }
  }

  // Handle trailing empty rows
  if (startEmptyRow !== null) {
    const emptyRowCount = rows.length - startEmptyRow;
    if (emptyRowCount >= minCollapsibleRows) {
      sections.push({
        startRowIndex: startEmptyRow,
        endRowIndex: rows.length - 1,
        id: `collapse-${startEmptyRow}-${rows.length - 1}`,
        hiddenRowCount: emptyRowCount,
      });
    }
  }

  return sections;
}

/**
 * Build virtual items list including rows and collapse buttons
 */
function buildVirtualItems(
  rows: FormattedRow[],
  collapsibleSections: CollapsibleSection[],
  expandedSections: Set<string>
): VirtualItemType[] {
  const items: VirtualItemType[] = [];
  const sectionMap = new Map<string, CollapsibleSection>();

  for (const section of collapsibleSections) {
    sectionMap.set(section.id, section);
  }

  let i = 0;
  while (i < rows.length) {
    // Check if we're at the start of a collapsible section
    let foundSection: CollapsibleSection | null = null;
    for (const section of collapsibleSections) {
      if (section.startRowIndex === i) {
        foundSection = section;
        break;
      }
    }

    if (foundSection && !expandedSections.has(foundSection.id)) {
      // Add collapse button
      items.push({ type: "collapse", section: foundSection });
      // Skip to end of section
      i = foundSection.endRowIndex + 1;
    } else {
      // Add regular row
      items.push({ type: "row", rowIndex: i });
      i++;
    }
  }

  return items;
}

/**
 * Get the basename from a file path
 */
function getBasename(filePath: string): string {
  return filePath.split("/").pop() || filePath.split("\\").pop() || filePath;
}

function HexEditorView({
  snapshot,
  previousSnapshot,
  filePath,
  isConnected,
  onClose,
  showAscii,
  diffMode,
  onShowAsciiChange,
  onDiffModeChange,
}: HexEditorViewProps) {
  const bytesPerRow = 16;
  const hexViewRef = React.useRef<{
    scrollToOffset: (offset: number) => void;
  } | null>(null);

  // Compute diff if we have a previous snapshot and diff mode is active
  const diff = React.useMemo(() => {
    if (!previousSnapshot || diffMode === "none") return null;
    return computeDiff(previousSnapshot, snapshot);
  }, [previousSnapshot, snapshot, diffMode]);

  const rows = React.useMemo(() => {
    return formatDataIntoRows(snapshot.data, bytesPerRow);
  }, [snapshot.data, bytesPerRow]);

  const previousRows = React.useMemo(() => {
    if (!previousSnapshot) return null;
    return formatDataIntoRows(previousSnapshot.data, bytesPerRow);
  }, [previousSnapshot, bytesPerRow]);

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

  const handleScrollToOffset = React.useCallback((offset: number) => {
    hexViewRef.current?.scrollToOffset(offset);
  }, []);

  return (
    <div className="space-y-4 h-full">
      {/* Stats */}
      {diff && diffMode !== "none" && (
        <DiffViewer diff={diff} onScrollToOffset={handleScrollToOffset} />
      )}

      {/* Hex Editor View */}
      {diffMode === "side-by-side" && previousRows ? (
        <div className="grid grid-cols-2">
          <Card className="p-0">
            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2 text-muted-foreground">
                Previous
              </div>
              <HexView
                rows={previousRows}
                showAscii={showAscii}
                diff={null}
                getDiffColorClass={() => ""}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2">Current</div>
              <HexView
                ref={hexViewRef}
                rows={rows}
                showAscii={showAscii}
                diff={diff}
                getDiffColorClass={getDiffColorClass}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <HexView
          ref={hexViewRef}
          rows={rows}
          showAscii={showAscii}
          diff={diff}
          getDiffColorClass={getDiffColorClass}
        />
      )}
    </div>
  );
}

export function HexEditor({
  snapshots,
  filePath,
  isConnected,
  loading = false,
  onClose,
  onFileSelect,
  recentFiles = [],
  className = "",
}: HexEditorProps) {
  const [activeTab, setActiveTab] = React.useState<string>("0");
  const [showAscii, setShowAscii] = React.useState(true);
  const [diffMode, setDiffMode] = React.useState<DiffViewMode>("none");
  const currentSnapshot = snapshots[parseInt(activeTab, 10)] || snapshots[0];
  const hasFile = filePath != null && filePath !== "";
  const hasSnapshots = snapshots.length > 0;

  // Get previous snapshot for the active tab
  const activeTabIndex = parseInt(activeTab, 10);
  const previousSnapshot =
    activeTabIndex > 0 ? snapshots[activeTabIndex - 1] : undefined;

  const toggleDiffMode = () => {
    if (!previousSnapshot) return;

    setDiffMode((current) => {
      if (current === "none") return "inline";
      if (current === "inline") return "side-by-side";
      return "none";
    });
  };

  // Show empty state when no file is selected
  if (!hasFile) {
    return (
      <Card
        className={`p-0 m-0 w-full h-full rounded-none border-none shadow-none ${className}`}
      >
        <CardHeader className="p-0! gap-0 m-0 border-b bg-muted/30">
          {/* Primary Toolbar */}
          <HexToolbar
            left={<Logo />}
            center={
              <div className="flex items-center gap-2 min-w-0">
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-sm text-muted-foreground">
                  No file selected
                </span>
              </div>
            }
            right={<span />}
          />
        </CardHeader>
        <CardContent className="pt-6">
          {onFileSelect ? (
            <EmptyState onFileSelect={onFileSelect} recentFiles={recentFiles} />
          ) : (
            <div className="flex items-center justify-center min-h-[500px] text-muted-foreground">
              Please select a file to begin
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const bytesLabel = (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {currentSnapshot?.data.length.toLocaleString()} bytes
      </span>
    </div>
  );

  return (
    <Card
      className={`p-0 m-0 w-full h-full rounded-none shadow-none border-none ${className}`}
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="gap-0 h-full"
      >
        <CardHeader className="p-0! gap-0 m-0 border-b bg-muted/30">
          {/* Primary Toolbar */}
          <HexToolbar
            left={<Logo />}
            center={
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <File className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-mono text-sm truncate" title={filePath}>
                    {getBasename(filePath)}
                  </span>
                  <div
                    className={`inline-flex h-2 w-2 rounded-full shrink-0 ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                    title={isConnected ? "Connected" : "Disconnected"}
                  />
                </div>
              </>
            }
            right={
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
            }
          />

          {/* Secondary Toolbar - Tabs */}
          {hasSnapshots && (
            <div className="p-4">
              <TabsList>
                {snapshots.map((snapshot, index) => (
                  <TabsTrigger key={snapshot.id} value={index.toString()}>
                    {snapshot.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 grow overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center min-h-[500px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <h3 className="font-semibold">Loading file...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Reading {filePath}
                </p>
              </div>
            </div>
          ) : hasSnapshots ? (
            snapshots.map((snapshot, index) => (
              <TabsContent
                key={snapshot.id}
                value={index.toString()}
                className="h-full"
              >
                <HexEditorView
                  snapshot={snapshot}
                  previousSnapshot={
                    index > 0 ? snapshots[index - 1] : undefined
                  }
                  filePath={filePath}
                  isConnected={isConnected}
                  onClose={onClose}
                  showAscii={showAscii}
                  diffMode={diffMode}
                  onShowAsciiChange={setShowAscii}
                  onDiffModeChange={setDiffMode}
                />
              </TabsContent>
            ))
          ) : (
            <div className="flex items-center justify-center min-h-[500px] text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
        <CardFooter className="p-0">
          <HexFooter
            left={bytesLabel}
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
            center={<span>test</span>}
          />
          {/* <div className="flex items-center justify-end gap-2 w-full">
            
            {previousSnapshot && (
              <Toggle
                pressed={diffMode !== "none"}
                onPressedChange={toggleDiffMode}
                aria-label="Toggle diff mode"
                size="sm"
              >
                {diffMode === "side-by-side" ? (
                  <Columns2 className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                <span className="ml-1 text-xs">
                  {diffMode === "none"
                    ? "Diff"
                    : diffMode === "inline"
                    ? "Inline"
                    : "Side-by-Side"}
                </span>
              </Toggle>
            )}
          </div> */}
        </CardFooter>
      </Tabs>
    </Card>
  );
}

interface HexViewProps {
  rows: ReturnType<typeof formatDataIntoRows>;
  showAscii: boolean;
  diff: ReturnType<typeof computeDiff> | null;
  getDiffColorClass: (offset: number) => string;
}

const HexView = React.forwardRef<
  { scrollToOffset: (offset: number) => void },
  HexViewProps
>(({ rows, showAscii, diff, getDiffColorClass }, ref) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const bytesPerRow = 16;
  const [highlightedOffset, setHighlightedOffset] = React.useState<
    number | null
  >(null);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set()
  );
  const [parentHeight, setParentHeight] = React.useState<number>(0);

  // Track parentRef height changes
  React.useEffect(() => {
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
  const collapsibleSections = React.useMemo(() => {
    if (!diff) return [];
    return computeCollapsibleSections(rows, diff, bytesPerRow);
  }, [rows, diff, bytesPerRow]);

  // Build virtual items (rows + collapse buttons)
  const virtualItems = React.useMemo(() => {
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

  const scrollToOffset = React.useCallback(
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

  React.useImperativeHandle(ref, () => ({
    scrollToOffset,
  }));

  const toggleSection = React.useCallback((sectionId: string) => {
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
          {virtualizer.getVirtualItems().map((virtualItem) => {
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
                  className="flex items-center justify-center border-y border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(item.section.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDownIcon className="h-4 w-4 mr-2" />
                    <span className="text-xs">
                      {item.section.hiddenRowCount} line
                      {item.section.hiddenRowCount !== 1 ? "s" : ""} hidden
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
                className="flex gap-4 hover:bg-muted/50 py-0.5"
              >
                <div className="text-muted-foreground select-none shrink-0 w-24">
                  {row.address}
                </div>

                <div className="flex gap-1 flex-wrap">
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
                  <div className="border-l pl-4 text-muted-foreground">
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
