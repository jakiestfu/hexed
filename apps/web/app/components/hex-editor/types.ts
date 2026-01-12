import type { BinarySnapshot, DiffResult } from "@hexed/types";
import type { RecentFile } from "~/hooks/use-recent-files";
import type { Endianness, NumberFormat } from "@hexed/binary-utils/interpreter";

export type HexEditorProps = {
  snapshots: BinarySnapshot[];
  filePath?: string | null;
  isConnected: boolean;
  loading?: boolean;
  onClose?: () => void;
  onFileSelect?: (filePath: string | BinarySnapshot) => void;
  recentFiles?: RecentFile[];
  className?: string;
  fileSource?: "path" | "client" | "url";
  originalSource?: string;
  error?: string | null;
  onRestartWatching?: () => void;
  onAddSnapshot?: (snapshot: BinarySnapshot) => void;
};

export type SelectionRange = { start: number; end: number } | null;

export type HexEditorViewProps = {
  scrollToOffset: number | null;
  snapshot: BinarySnapshot;
  diff: DiffResult | null;
  showAscii: boolean;
  selectedOffsetRange: SelectionRange;
  onSelectedOffsetRangeChange: (range: SelectionRange) => void;
};

export type InterpreterProps = {
  data: Uint8Array;
  selectedOffset: number | null;
  endianness: Endianness;
  numberFormat: NumberFormat;
  onClose?: () => void;
  onScrollToOffset?: (offset: number) => void;
  onPIPStateChange?: (isPIPActive: boolean) => void;
};

export type TemplatesProps = {
  data?: Uint8Array;
  filePath?: string;
  onClose?: () => void;
  onScrollToOffset?: (offset: number) => void;
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void;
  onPIPStateChange?: (isPIPActive: boolean) => void;
};

export type StringsProps = {
  data: Uint8Array;
  onClose?: () => void;
  onScrollToOffset?: (offset: number) => void;
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void;
  onRangeSelectedForSearch?: (range: SelectionRange) => void;
  onPIPStateChange?: (isPIPActive: boolean) => void;
};
