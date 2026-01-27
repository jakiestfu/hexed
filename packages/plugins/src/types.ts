import type { FunctionComponent, PropsWithChildren, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Keys } from "react-hotkeys-hook"

import type { HexedState, UseHexedSettings } from "@hexed/editor"
import type { HexedFile } from "@hexed/file"
import type { WorkerClient } from "@hexed/worker"
import type { ChartConfiguration } from "@hexed/worker/chart-worker"

export type HexedPluginType = "sidebar" | "toolbar" | "visualization" | "label"

export type HexedPluginComponent<
  PluginType extends HexedPluginType,
  T = Record<string, unknown>
> = FunctionComponent<
  PropsWithChildren<
    {
      file: HexedFile
      settings: UseHexedSettings
      state: HexedState
    } & T
  >
>

/**
 * Chart calculation function for visualization plugins
 * Takes a file, worker client, progress callback, and optional offsets
 * Returns a promise that resolves to a Chart.js configuration object
 */
export type ChartCalculationFunction = (
  file: File,
  workerClient: WorkerClient,
  onProgress: (progress: number) => void,
  startOffset?: number,
  endOffset?: number
) => Promise<ChartConfiguration>

export type HexedPluginOptionsForType<
  PluginType extends HexedPluginType,
  T = Record<string, unknown>
> = {
  type: PluginType
  id: string
  title: string
  icon: LucideIcon
  component: HexedPluginComponent<PluginType, T>
  hotkey?: {
    formatted: string
    keys: string
  }
}

export type HexedPluginOptionsForVisualization = {
  type: "visualization"
  id: string
  title: string
  icon: LucideIcon
  chart: ChartCalculationFunction
  hotkey?: {
    formatted: string
    keys: string
  }
}

export type HexedPluginOptions<T = Record<string, unknown>> =
  | HexedPluginOptionsForType<"sidebar" | "toolbar" | "label", T>
  | HexedPluginOptionsForVisualization

type HexedPluginForType<
  PluginType extends HexedPluginType,
  T = Record<string, unknown>
> = Omit<HexedPluginOptionsForType<PluginType, T>, "component"> & {
  component: ReactNode
}

type HexedPluginForVisualization = Omit<
  HexedPluginOptionsForVisualization,
  "chart"
> & {
  component: ReactNode
}

export type HexedPlugin<T = Record<string, unknown>> =
  | HexedPluginForType<"sidebar" | "toolbar" | "label", T>
  | HexedPluginForVisualization
