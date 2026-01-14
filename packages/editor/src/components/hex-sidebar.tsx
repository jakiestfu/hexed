"use client"

import type { FunctionComponent } from "react"
import type { Endianness, NumberFormat } from "@hexed/binary-utils/interpreter"
import { ResizablePanel } from "@hexed/ui"
import type { SelectionRange } from "../types"
import { useSettings } from "../hooks/use-settings"
import { Interpreter } from "./interpreter"
import { Strings } from "./strings"
import { Templates } from "./templates"

export type HexSidebarProps = {
  defaultSize: number
  minSize: number
  snapshotData: Uint8Array
  currentSnapshotData?: Uint8Array
  selectedOffset: number | null
  endianness: Endianness
  numberFormat: NumberFormat
  filePath?: string
  onScrollToOffset: (offset: number) => void
  onSelectedOffsetRangeChange: (range: SelectionRange) => void
  onRangeSelectedForSearch?: (range: SelectionRange) => void
}

export const HexSidebar: FunctionComponent<HexSidebarProps> = ({
  defaultSize,
  minSize,
  snapshotData,
  currentSnapshotData,
  selectedOffset,
  endianness,
  numberFormat,
  filePath,
  onScrollToOffset,
  onSelectedOffsetRangeChange,
  onRangeSelectedForSearch
}) => {
  const { sidebar, sidebarPosition, setSidebar } = useSettings()

  // Return null if no sidebar is selected
  if (sidebar === null) {
    return null
  }

  const borderClass = sidebarPosition === "left" ? "border-r" : "border-l"

  return (
    <ResizablePanel
      id={sidebar}
      defaultSize={defaultSize}
      minSize={minSize}
      collapsible
    >
      <div className={`h-full ${borderClass}`}>
        {sidebar === "interpreter" && (
          <Interpreter
            data={snapshotData}
            selectedOffset={selectedOffset}
            endianness={endianness}
            numberFormat={numberFormat}
            onClose={() => setSidebar(null)}
            onScrollToOffset={onScrollToOffset}
          />
        )}
        {sidebar === "templates" && (
          <Templates
            data={currentSnapshotData}
            filePath={filePath}
            onClose={() => setSidebar(null)}
            onScrollToOffset={onScrollToOffset}
            onSelectedOffsetRangeChange={onSelectedOffsetRangeChange}
          />
        )}
        {sidebar === "strings" && (
          <Strings
            data={snapshotData}
            onClose={() => setSidebar(null)}
            onScrollToOffset={onScrollToOffset}
            onSelectedOffsetRangeChange={onSelectedOffsetRangeChange}
            onRangeSelectedForSearch={onRangeSelectedForSearch}
          />
        )}
      </div>
    </ResizablePanel>
  )
}
