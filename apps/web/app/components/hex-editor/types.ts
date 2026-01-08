import type { BinarySnapshot, DiffResult } from "@hexed/types";
import type { RecentFile } from "~/hooks/use-recent-files";

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

