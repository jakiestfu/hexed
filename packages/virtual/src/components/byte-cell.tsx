import { FunctionComponent } from "react"

import { byteToHex } from "@hexed/binary-utils"
import { cn } from "@hexed/ui"

import { cellWidth } from "../constants"
import { highlight } from "../utils/selection-dom"

const cellWidthStyle = { width: `${cellWidth}px` }

export type ByteCellProps = {
  byteOffset: number
  byte?: number
  byteExists: boolean
  isSelected: boolean
  index: number
  onMouseDown?: (e: React.MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const ByteCell: FunctionComponent<ByteCellProps> = ({
  byteOffset,
  byte,
  byteExists,
  isSelected,
  index,
  onMouseDown,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div
      key={index}
      data-index={index}
      className={cn(
        "byte-cell text-center flex flex-1 items-center justify-center h-full select-none",
        "hover:bg-chart-4/30 dark:hover:bg-chart-4/20",
        "[&.pair-hover]:bg-chart-4/30 dark:[&.pair-hover]:bg-chart-4/20",
        isSelected ? highlight : ""
      )}
      style={cellWidthStyle}
      onMouseDown={byteExists ? onMouseDown : undefined}
      onMouseEnter={byteExists ? onMouseEnter : undefined}
      onMouseLeave={onMouseLeave}
    >
      {byteExists && byte !== undefined ? byteToHex(byte) : null}
    </div>
  )
}
