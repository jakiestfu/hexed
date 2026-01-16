import { useMemo } from "react"

import type { FormattedRow } from "@hexed/binary-utils/formatter"
import { formatDataIntoRows } from "@hexed/binary-utils/formatter"

/**
 * Hook for formatting data into rows for display
 * Only formats actual data bytes (no empty rows/cells)
 * @param data - The data to format into rows
 * @param bytesPerRow - Number of bytes per row
 * @param dataStartOffset - Optional offset where the data starts in the original file (for preserving offsets)
 * @returns Formatted rows
 */
export function useFormatData(
  data: Uint8Array,
  bytesPerRow: number | null,
  dataStartOffset?: number
): FormattedRow[] {
  return useMemo(() => {
    if (bytesPerRow === null) return []
    const result = formatDataIntoRows(data, bytesPerRow, dataStartOffset)
    // console.log("result", {
    //   data,
    //   bytesPerRow,
    //   dataStartOffset,
    //   result
    // })
    return result
  }, [data, bytesPerRow, dataStartOffset])
}
