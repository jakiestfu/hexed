import { useMemo } from "react"

import type { FormattedRow } from "@hexed/binary-utils/formatter"
import { formatDataIntoRows } from "@hexed/binary-utils/formatter"

/**
 * Hook for formatting data into rows for display
 * @param data - The data to format into rows
 * @param bytesPerRow - Number of bytes per row
 * @param dataStartOffset - Optional offset where the data starts in the original file (for preserving offsets)
 * @param totalSize - Optional total file size (for creating empty rows/cells after data)
 * @returns Formatted rows
 */
export function useFormatData(
  data: Uint8Array,
  bytesPerRow: number | null,
  dataStartOffset?: number,
  totalSize?: number
): FormattedRow[] {
  return useMemo(() => {
    if (bytesPerRow === null) return []
    return formatDataIntoRows(data, bytesPerRow, dataStartOffset, totalSize)
  }, [data, bytesPerRow, dataStartOffset, totalSize])
}
