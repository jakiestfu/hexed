import type { FunctionComponent, PropsWithChildren, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Keys } from "react-hotkeys-hook"

import type { HexedState, UseHexedSettings } from "@hexed/editor"
import type { HexedFile } from "@hexed/file"

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
    } & T &
      (PluginType extends "visualization"
        ? {
            foo: string
          }
        : {
            foo?: never
          })
  >
>
// export type HexedVisualizationPluginComponent<T = Record<string, unknown>> =
//   HexedPluginComponent<
//     T & {
//       foo: string
//     }
//   >

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

export type HexedPluginOptions<T = Record<string, unknown>> =
  | HexedPluginOptionsForType<"sidebar" | "toolbar" | "label", T>
  | HexedPluginOptionsForType<"visualization", T>

type HexedPluginForType<
  PluginType extends HexedPluginType,
  T = Record<string, unknown>
> = Omit<HexedPluginOptionsForType<PluginType, T>, "component"> & {
  component: ReactNode
}

export type HexedPlugin<T = Record<string, unknown>> =
  | HexedPluginForType<"sidebar" | "toolbar" | "label", T>
  | HexedPluginForType<"visualization", T>
