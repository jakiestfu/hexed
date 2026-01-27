"use client"

import type { FunctionComponent } from "react"

import { HexedPlugin } from "@hexed/plugins/types"
import { ResizablePanel } from "@hexed/ui"

import { useHexedSettingsContext } from "../../providers/hexed-settings-provider"

export type HexSidebarProps = {
  defaultSize: number
  minSize: number
  fileId?: string
  plugins: HexedPlugin[]
}

export const HexSidebar: FunctionComponent<HexSidebarProps> = ({
  defaultSize,
  minSize,
  plugins
}) => {
  const settings = useHexedSettingsContext()
  const { sidebar } = settings

  if (sidebar === null) {
    return null
  }

  const plugin = plugins.find((plugin) => plugin.id === sidebar)
  if (!plugin) return null

  return (
    <ResizablePanel
      id={sidebar}
      defaultSize={defaultSize}
      minSize={minSize}
      collapsible
    >
      <div className="h-full overflow-auto">{plugin.component}</div>
    </ResizablePanel>
  )
}
