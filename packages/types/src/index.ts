/**
 * Represents a snapshot of a binary file at a specific point in time
 */
export interface BinarySnapshot {
  /** Unique identifier for this snapshot */
  id: string;
  /** The file path being watched */
  filePath: string;
  /** The binary data */
  data: Uint8Array;
  /** Timestamp when the snapshot was taken */
  timestamp: number;
  /** Index of this snapshot (0 = baseline, 1+ = changes) */
  index: number;
  /** Label for display (e.g., "Baseline", "Change 1") */
  label: string;
  /** MD5 checksum of the file data */
  md5?: string;
}

/**
 * Represents a single byte change between snapshots
 */
export interface ByteDiff {
  /** Byte offset in the file */
  offset: number;
  /** Previous byte value (undefined for additions) */
  oldByte?: number;
  /** New byte value (undefined for deletions) */
  newByte?: number;
  /** Type of change */
  type: 'added' | 'removed' | 'modified';
}

/**
 * Result of comparing two binary snapshots
 */
export interface DiffResult {
  /** Array of all byte differences */
  diffs: ByteDiff[];
  /** Previous snapshot ID */
  previousSnapshotId: string;
  /** Current snapshot ID */
  currentSnapshotId: string;
  /** Total number of changed bytes */
  totalChanges: number;
}

/**
 * Storage adapter interface for snapshot persistence
 */
export interface SnapshotStorage {
  /** Save a snapshot */
  save(fileId: string, snapshot: BinarySnapshot): Promise<void>;
  /** Get all snapshots for a file */
  getSnapshots(fileId: string): Promise<BinarySnapshot[]>;
  /** Get a specific snapshot by ID */
  getSnapshot(fileId: string, snapshotId: string): Promise<BinarySnapshot | null>;
  /** Clear all snapshots for a file */
  clear(fileId: string): Promise<void>;
}

/**
 * SSE event types
 */
export type SSEEventType = 'snapshot' | 'error' | 'connected' | 'disconnected';

/**
 * SSE message structure
 */
export interface SSEMessage {
  type: SSEEventType;
  data?: BinarySnapshot;
  error?: string;
  timestamp: number;
}

/**
 * File selection result
 */
export interface FileSelection {
  filePath: string;
  fileName: string;
  size: number;
}

/**
 * Diff view mode
 */
export type DiffViewMode = 'inline' | 'side-by-side' | 'none';

/**
 * Hex editor display settings
 */
export interface HexEditorSettings {
  bytesPerRow: number;
  showAscii: boolean;
  showLineNumbers: boolean;
  diffMode: DiffViewMode;
}

