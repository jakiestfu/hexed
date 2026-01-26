import type { HexedFile } from "@hexed/file";
import type { LucideIcon } from "lucide-react";
import type { FunctionComponent, PropsWithChildren, ReactNode } from "react";
import type { UseHexedSettings } from "../hooks/use-hexed-settings";
import type { HexedState } from "../hooks/use-hexed-state";

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
}

export type HexedPlugin<T = Record<string, unknown>> = Omit<HexedPluginOptions<T>, "component"> & {
  component: ReactNode;
}