import { formatHotkey } from "@hexed/editor"

import { plugins } from "./core"
import { LabelPlugin } from "./label-plugin"
import { SidebarPlugin } from "./sidebar-plugin"
import { ToolbarPlugin } from "./toolbar-plugin"
import { HexedPlugin, HexedPluginOptions } from "./types"
import { VisualizationPlugin } from "./visualization-plugin"

const getComponent = (options: HexedPluginOptions) => {
  switch (options.type) {
    case "sidebar":
      return <SidebarPlugin {...options} />
    case "toolbar":
      return <ToolbarPlugin {...options} />
    case "label":
      return <LabelPlugin {...options} />
    case "visualization":
      return <VisualizationPlugin {...options} />
    default:
      return null
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
  let autoKey = 0

  return plugins.map((plugin) => {
    if (plugin.type === "sidebar" && !plugin.hotkey) {
      autoKey++
      return {
        ...plugin,
        hotkey: {
          formatted: formatHotkey(["meta", `${autoKey}`]),
          keys: `ctrl+${autoKey},meta+${autoKey}`
        }
      }
    }
    return plugin
  })
}
