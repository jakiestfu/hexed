import type { Endianness, NumberFormat } from "@hexed/binary-utils/interpreter"
import type { BinarySnapshot, DiffResult } from "@hexed/types"

import type { FileHandleMetadata } from "./utils/file-handle-storage"

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
  handleId?: string | null
  onClose?: () => void
  className?: string
  fileSource?: FileSource
  onAddSnapshot?: (snapshot: BinarySnapshot) => void
  // Data picker callbacks (for empty state)
  onHandleIdChange?: (handleId: string) => void
  // Logo props (optional - Logo is integrated internally)
  onNavigate?: (path: string) => void
  LinkComponent?: React.ComponentType<{
    to: string
    className?: string
    children: React.ReactNode
  }>
  theme?: string
  setTheme?: (theme: string) => void
  packageInfo?: {
    name: string
    description: string
    version: string
    repository: {
      url: string
    }
  }
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
}

export type TemplatesProps = {
  data?: Uint8Array
  filePath?: string
  onClose?: () => void
  onScrollToOffset?: (offset: number) => void
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void
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
}
