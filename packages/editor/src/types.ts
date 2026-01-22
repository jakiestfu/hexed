import type { Endianness, NumberFormat } from "@hexed/binary-utils/interpreter"
import type { BinarySnapshot } from "@hexed/types"

import { useHexedFile } from "./hooks/use-hexed-file"
import { UseHexedSettings } from "./hooks/use-hexed-settings"

export type FileSource = "file-system"

/**
 * Get the display name for a FileSource type
 * @param source - The file source type
 * @returns The display name: "File System" for "file-system"
 */
export function getFileSourceDisplayName(source: FileSource): string {
  return "File System"
}

export type SelectionRange = { start: number; end: number } | null

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

export type EditorProps = {
  onClose?: () => void
  className?: string
  fileSource?: FileSource
  onAddSnapshot?: (snapshot: BinarySnapshot) => void
  // Data picker callbacks (for empty state)
  // onChangeInput: (input: HexedFileInput) => void
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

export type HexedFileInput =
  | FileSystemFileHandle
  | File
  | ArrayBufferView<ArrayBuffer>
  | string
  | null
  | undefined
