import { useRef, useEffect, useState, useMemo } from "react";
import type { FunctionComponent } from "react";
import type { DiffViewMode } from "@hexed/types";
import { computeDiff } from "@hexed/binary-utils/differ";
import { HexCanvas, type HexCanvasRef } from "@hexed/canvas";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Toggle,
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
import { Eye, X, ChevronDownIcon, File, Loader2 } from "lucide-react";
import { DiffViewer } from "./diff-viewer";
import { EmptyState } from "./empty-state";
import { HexToolbar } from "./hex-toolbar";
import { Logo } from "~/components/logo";
import { HexFooter } from "~/components/hex-editor/hex-footer";
import { useChecksumVisibility } from "~/hooks/use-checksum-visibility";
import type { HexEditorProps, HexEditorViewProps } from "./types";
import { getBasename } from "./utils";

const HexEditorView: FunctionComponent<HexEditorViewProps> = ({
  scrollToOffset,
  snapshot,
  showAscii,
  diff,
}) => {
  const hexCanvasRef = useRef<HexCanvasRef | null>(null);

  useEffect(() => {
    if (scrollToOffset !== null) {
      hexCanvasRef.current?.scrollToOffset(scrollToOffset);
    }
  }, [scrollToOffset]);

  return (
    <div className="h-full">
      <HexCanvas
        ref={hexCanvasRef}
        data={snapshot.data}
        showAscii={showAscii}
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
  const { showChecksums } = useChecksumVisibility();
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
