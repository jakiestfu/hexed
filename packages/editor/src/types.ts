import type { Endianness, NumberFormat } from "@hexed/binary-utils/interpreter"
import type { BinarySnapshot, DiffResult } from "@hexed/types"

import type { FileHandleMetadata } from "./utils/file-handle-storage"
import type { FileManager } from "./utils"

// Define RecentFile type locally to avoid dependency on web app hooks
// This matches the structure used by the editor components
export type RecentFile = {
  path: string
  timestamp: number
  source?: FileSource
  handleId?: string // IndexedDB ID for FileSystemFileHandle
}

export type FileSource = "file-system"

/**
 * Get the display name for a FileSource type
 * @param source - The file source type
 * @returns The display name: "File System" for "file-system"
 */
export function getFileSourceDisplayName(source: FileSource): string {
  return "File System"
}

export type HexEditorProps = {
  snapshots: BinarySnapshot[]
  filePath?: string | null
  isConnected: boolean
  loading?: boolean
  onClose?: () => void
  onFileSelect?: (filePath: string | BinarySnapshot) => void
  className?: string
  fileSource?: FileSource
  originalSource?: string
  error?: string | null
  onRestartWatching?: () => void
  onAddSnapshot?: (snapshot: BinarySnapshot) => void
  // Data picker callbacks (for empty state)
  onHandleReady?: (handleData: FileHandleMetadata, handleId: string) => Promise<void>
  fileManager?: FileManager | null
}

export type SelectionRange = { start: number; end: number } | null

export type HexEditorViewProps = {
  scrollToOffset: number | null
  snapshot: BinarySnapshot
  diff: DiffResult | null
  showAscii: boolean
  selectedOffsetRange: SelectionRange
  onSelectedOffsetRangeChange: (range: SelectionRange) => void
}

export type InterpreterProps = {
  data: Uint8Array
  selectedOffset: number | null
  endianness: Endianness
  numberFormat: NumberFormat
  onClose?: () => void
  onScrollToOffset?: (offset: number) => void
  onPIPStateChange?: (isPIPActive: boolean) => void
}

export type TemplatesProps = {
  data?: Uint8Array
  filePath?: string
  onClose?: () => void
  onScrollToOffset?: (offset: number) => void
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void
  onPIPStateChange?: (isPIPActive: boolean) => void
  // Props for URL state management (optional - uses internal state if not provided)
  selectedTemplateName?: string
  onTemplateNameChange?: (name: string) => void
}

export type StringsProps = {
  data: Uint8Array
  onClose?: () => void
  onScrollToOffset?: (offset: number) => void
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void
  onRangeSelectedForSearch?: (range: SelectionRange) => void
  onPIPStateChange?: (isPIPActive: boolean) => void
}
