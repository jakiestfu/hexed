"use client"

import type { FunctionComponent } from "react"

import type { Endianness, NumberFormat } from "@hexed/binary-utils/interpreter"
import { ResizablePanel } from "@hexed/ui"

import { useSettings } from "../hooks/use-settings"
import { useWorkerClient } from "../providers/worker-provider"
import type { SelectionRange } from "../types"
import { Interpreter } from "./interpreter"
import { Strings } from "./strings"
import { Templates } from "./templates"

export type HexSidebarProps = {
  defaultSize: number
  minSize: number
  data: Uint8Array
  selectedOffset: number | null
  endianness: Endianness
  numberFormat: NumberFormat
  filePath?: string
  fileId?: string
  onScrollToOffset: (offset: number) => void
  onSelectedOffsetRangeChange: (range: SelectionRange) => void
  onRangeSelectedForSearch?: (range: SelectionRange) => void
  dimensions: {
    width: number
    height: number
  }
}

export const HexSidebar: FunctionComponent<HexSidebarProps> = ({
  defaultSize,
  minSize,
  data,
  selectedOffset,
  endianness,
  numberFormat,
  filePath,
  fileId,
  onScrollToOffset,
  onSelectedOffsetRangeChange,
  onRangeSelectedForSearch,
  dimensions
}) => {
  const { sidebar, sidebarPosition, setSidebar } = useSettings()
  const workerClient = useWorkerClient()

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
      <div className="h-full overflow-auto">
        {sidebar === "interpreter" && (
          <Interpreter
            data={data}
            selectedOffset={selectedOffset}
            endianness={endianness}
            numberFormat={numberFormat}
            onClose={() => setSidebar(null)}
            onScrollToOffset={onScrollToOffset}
          />
        )}
        {sidebar === "templates" && (
          <Templates
            data={data}
            filePath={filePath}
            onClose={() => setSidebar(null)}
            onScrollToOffset={onScrollToOffset}
            onSelectedOffsetRangeChange={onSelectedOffsetRangeChange}
          />
        )}
        {sidebar === "strings" && (
          <Strings
            fileId={fileId}
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
