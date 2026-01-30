import type { FunctionComponent, PropsWithChildren, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import type { HexedState, UseHexedSettings } from "@hexed/editor"
import type { HexedFile } from "@hexed/file"
import type { HexedVisualization } from "@hexed/worker"

export type HexedPluginType = "sidebar" | "toolbar" | "label"

export type HexedPluginComponent = FunctionComponent<
  PropsWithChildren<
    {
      file: HexedFile
      settings: UseHexedSettings
      state: HexedState
    }
  >>

export type HexedPluginOptions = {
  type: HexedPluginType
  id: string
  title: string
  info?: undefined
  icon: LucideIcon
  component: HexedPluginComponent
  hotkey?: {
    formatted: string
    keys: string
  }
}

export type HexedPlugin = Omit<HexedPluginOptions, "component"> & {
  component: ReactNode
}

/**
 * Visualization preset with metadata and visualization function
 */
export type VisualizationPreset = {
  id: string
  title: string
  icon: LucideIcon
  info?: ReactNode
  visualization: HexedVisualization
}
