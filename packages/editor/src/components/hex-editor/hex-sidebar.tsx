"use client"

import type { FunctionComponent } from "react"

import { ResizablePanel } from "@hexed/ui"

import { useHexedSettingsContext } from "../../providers/hexed-settings-provider"
import { useHexedStateContext } from "../../providers/hexed-state-provider"
import { useWorkerClient } from "../../providers/worker-provider"
import { Interpreter } from "../sidebars/interpreter"
import { Strings } from "../sidebars/strings"
import { Templates } from "../sidebars/templates"

export type HexSidebarProps = {
  defaultSize: number
  minSize: number
  data?: Uint8Array
  filePath?: string
  fileId?: string
}

export const HexSidebar: FunctionComponent<HexSidebarProps> = ({
  defaultSize,
  minSize,
  data = new Uint8Array(),
  filePath,
  fileId
}) => {
  const { sidebar, sidebarPosition, setSidebar } = useHexedSettingsContext()
  const {
    selectedOffset,
    endianness,
    numberFormat,
    handleScrollToOffset,
    setSelectedOffsetRange,
    handleRangeSelectedForSearch,
    dimensions
  } = useHexedStateContext()
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
            endianness={endianness as "le" | "be"}
            numberFormat={numberFormat as "dec" | "hex"}
            onClose={() => setSidebar(null)}
            onScrollToOffset={handleScrollToOffset}
          />
        )}
        {sidebar === "templates" && (
          <Templates
            data={data}
            filePath={filePath}
            onClose={() => setSidebar(null)}
            onScrollToOffset={handleScrollToOffset}
            onSelectedOffsetRangeChange={setSelectedOffsetRange}
          />
        )}
        {sidebar === "strings" && (
          <Strings
            onClose={() => setSidebar(null)}
            onScrollToOffset={handleScrollToOffset}
            onSelectedOffsetRangeChange={setSelectedOffsetRange}
            onRangeSelectedForSearch={handleRangeSelectedForSearch}
          />
        )}
      </div>
    </ResizablePanel>
  )
}
