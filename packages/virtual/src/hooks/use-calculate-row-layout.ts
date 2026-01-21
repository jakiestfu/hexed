import { useMemo } from "react"

import {
  addressColumnWidth,
  addressHexBorderWidth,
  asciiBorderWidth,
  asciiCharWidth,
  cellWidth,
  rowPadding
} from "../constants"

type UseCalculateRowLayoutParams = {
  showAscii: boolean
  dimensions: { width: number; height: number }
  minBytesPerRow?: number
  safetyMarginPx?: number
}

export const useCalculateRowLayout = ({
  showAscii,
  dimensions,
  minBytesPerRow = 1,
  safetyMarginPx = 2
}: UseCalculateRowLayoutParams) => {
  const bytesPerRow = useMemo(() => {
    if (dimensions.width <= 0) {
      return minBytesPerRow
    }

    const fixedWidth =
      rowPadding +
      addressColumnWidth +
      addressHexBorderWidth +
      (showAscii ? asciiBorderWidth : 0)

    const perByteWidth = cellWidth + (showAscii ? asciiCharWidth : 0)

    const available = dimensions.width - fixedWidth - safetyMarginPx

    const computed = Math.floor(available / perByteWidth)

    return Math.max(minBytesPerRow, computed)
  }, [dimensions.width, showAscii, minBytesPerRow, safetyMarginPx])
  
  return { bytesPerRow }
}
