import type { HexedFile, HexedFileInput } from "@hexed/file"

import type { HexedSettings } from "./hooks/use-hexed-settings"
import type { HexedState } from "./hooks/use-hexed-state"

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
  file: HexedFile | null
  settings: HexedSettings
  state: HexedState
  onClose?: () => void
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
  // theme?: string
  // setTheme?: (theme: string) => void
}

export type { HexedFileInput }
