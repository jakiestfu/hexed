"use client"

import type { FunctionComponent } from "react"

import { ResizablePanel } from "@hexed/ui"

import { useHexedFileContext } from "../../providers/hexed-file-provider"
import { useHexedSettingsContext } from "../../providers/hexed-settings-provider"
import { useHexedStateContext } from "../../providers/hexed-state-provider"
import { useWorkerClient } from "../../providers/worker-provider"
// import { Interpreter } from "../sidebars/interpreter"
// import { Strings } from "../sidebars/strings"
// import { Templates } from "../sidebars/templates"
import { HexedPlugin, HexedPluginComponent } from "../../plugins/types"

export type HexSidebarProps = {
  defaultSize: number
  minSize: number
  filePath?: string
  fileId?: string
  plugins: HexedPlugin[]
}

export const HexSidebar: FunctionComponent<HexSidebarProps> = ({
  defaultSize,
  minSize,
  filePath,
  plugins,
}) => {
  const { input: { hexedFile } } = useHexedFileContext()
  const settings = useHexedSettingsContext()
  const state = useHexedStateContext()
  const { sidebar, setSidebar } = settings
  const {
    handleScrollToOffset,
    setSelectedOffsetRange,
    handleRangeSelectedForSearch
  } = state
  const workerClient = useWorkerClient()

  // Return null if no sidebar is selected
  if (sidebar === null) {
    return null
  }

  const borderClass = settings.sidebarPosition === "left" ? "border-r" : "border-l"

  const plugin = plugins.find((plugin) => plugin.id === sidebar)
  if (!plugin) return null;

  return (
    <ResizablePanel
      id={sidebar}
      defaultSize={defaultSize}
      minSize={minSize}
      collapsible
    >
      <div className="h-full overflow-auto">
        {plugin.component}
        {/* {sidebar === "interpreter" && (
          <Interpreter
            file={hexedFile}
            settings={settings}
            state={state}
            onClose={() => setSidebar(null)}
          />
        )}
        {sidebar === "templates" && (
          <Templates
            data={undefined}
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
        )} */}
      </div>
    </ResizablePanel>
  )
}
