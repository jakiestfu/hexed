import type { BinarySnapshot, DiffResult } from "@hexed/types";
import type { FormattedRow } from "@hexed/binary-utils/formatter";
import type { RecentFile } from "~/hooks/use-recent-files";
import { formatDataIntoRows } from "@hexed/binary-utils/formatter";
import { computeDiff } from "@hexed/binary-utils/differ";

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
};

export type CollapsibleSection = {
  startRowIndex: number;
  endRowIndex: number;
  id: string;
  hiddenRowCount: number;
};

export type VirtualItemType =
  | { type: "row"; rowIndex: number }
  | { type: "collapse"; section: CollapsibleSection };

export type HexViewProps = {
  rows: ReturnType<typeof formatDataIntoRows>;
  showAscii: boolean;
  diff: ReturnType<typeof computeDiff> | null;
  getDiffColorClass: (offset: number) => string;
};

