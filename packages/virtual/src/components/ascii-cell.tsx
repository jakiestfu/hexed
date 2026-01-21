import { FunctionComponent } from "react"

import { byteToAscii } from "@hexed/binary-utils"
import { cn } from "@hexed/ui"

import { asciiCharWidth, rowHeight } from "../constants"
import { highlight } from "../utils/selection-dom"

const asciiCharWidthStyle = { width: `${asciiCharWidth}px` }
const rowHeightStyle = { height: `${rowHeight}px` }

export type AsciiCellProps = {
  byteOffset: number
  byte?: number
  byteExists: boolean
  isSelected: boolean
  index: number
  preview?: boolean
  onMouseDown?: (e: React.MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const AsciiCell: FunctionComponent<AsciiCellProps> = ({
  byteOffset,
  byte,
  byteExists,
  isSelected,
  index,
  preview = false,
  onMouseDown,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div
      key={index}
      data-index={index}
      className={cn(
        "ascii-cell text-center flex items-center justify-center h-full select-none",
        "hover:bg-chart-4/30 dark:hover:bg-chart-4/20",
        "[&.pair-hover]:bg-chart-4/30 dark:[&.pair-hover]:bg-chart-4/20",
        isSelected ? highlight : ""
      )}
      style={rowHeightStyle}
      onMouseDown={byteExists ? onMouseDown : undefined}
      onMouseEnter={byteExists ? onMouseEnter : undefined}
      onMouseLeave={onMouseLeave}
    >
      <div style={asciiCharWidthStyle}>
        {!preview && byteExists && byte !== undefined
          ? byteToAscii(byte)
          : null}
      </div>
    </div>
  )
}
