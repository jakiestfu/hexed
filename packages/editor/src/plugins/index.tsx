import { formatHotkey } from "../utils";
import { plugins } from "./core";
import { SidebarPlugin } from "./sidebar-plugin";
import { HexedPlugin, HexedPluginOptions } from "./types";

const getComponent = (options: HexedPluginOptions) => {
  switch (options.type) {
    case "sidebar":
      return <SidebarPlugin {...options} />
    default:
      return null;
  }
}

export const createHexedEditorPlugin = (options: HexedPluginOptions) => {
  const component = getComponent(options)
  return {
    ...options,
    component
  }
}

export const pluginsWithHotkeys = (plugins: HexedPlugin[]) => {
  let autoKey = 0;

  return plugins.map((plugin) => {
    if (plugin.type === "sidebar" && !plugin.hotkey) {
      autoKey++;
      return {
        ...plugin,
        hotkey: {
          formatted: formatHotkey(["meta", `${autoKey}`]),
          keys: `ctrl+${autoKey},meta+${autoKey}`
        }
      }
    }
    return plugin;
  })
}