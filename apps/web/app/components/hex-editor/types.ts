import type { BinarySnapshot, DiffResult } from "@hexed/types";
import type { RecentFile } from "~/hooks/use-recent-files";
import type { Endianness, NumberFormat } from "@hexed/binary-utils/interpreter";

export type HexEditorProps = {
  snapshots: BinarySnapshot[];
  filePath?: string | null;
  isConnected: boolean;
  loading?: boolean;
  onClose?: () => void;
  onFileSelect?: (filePath: string) => void;
  recentFiles?: RecentFile[];
  className?: string;
};

export type HexEditorViewProps = {
  scrollToOffset: number | null;
  snapshot: BinarySnapshot;
  diff: DiffResult | null;
  showAscii: boolean;
  selectedOffset: number | null;
  onSelectedOffsetChange: (offset: number | null) => void;
};

export type InterpreterProps = {
  data: Uint8Array;
  selectedOffset: number | null;
  endianness: Endianness;
  numberFormat: NumberFormat;
};

