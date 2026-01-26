import { SidebarPlugin } from "./sidebar-plugin";
import { HexedPluginOptions } from "./types";

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