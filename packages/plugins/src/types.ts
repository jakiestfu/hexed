import type { HexedFile } from "@hexed/file";
import type { LucideIcon } from "lucide-react";
import type { FunctionComponent, PropsWithChildren, ReactNode } from "react";
import type { UseHexedSettings } from "@hexed/editor";
import type { HexedState } from "@hexed/editor";
import { Keys } from "react-hotkeys-hook";

export type HexedPluginComponent<T = Record<string, unknown>> = FunctionComponent<PropsWithChildren<{
  file: HexedFile;
  settings: UseHexedSettings;
  state: HexedState;
} & T>>

export type HexedPluginOptions<T = Record<string, unknown>> = {
  type: "sidebar" | "toolbar" | "visualization" | "label"
  id: string;
  title: string;
  icon: LucideIcon;
  component: HexedPluginComponent<T>
  hotkey?: {
    formatted: string;
    keys: string;
  };
}

export type HexedPlugin<T = Record<string, unknown>> = Omit<HexedPluginOptions<T>, "component"> & {
  component: ReactNode;
}
