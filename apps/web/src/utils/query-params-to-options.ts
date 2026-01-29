import { HexedSettings, Sidebar } from "@hexed/editor"

import { QueryParams } from "~/hooks/use-query-param-state"
import {
  isBoolean,
  isSidebar,
  isSidebarPosition,
  isTheme
} from "~/utils/type-guards"

export const queryParamsToOptions = (queryParams: QueryParams) => {
  const temp: Partial<HexedSettings> = {}
  for (const [key, value] of Object.entries(queryParams)) {
    if (typeof value !== "string") continue
    switch (key) {
      case "theme":
        if (isTheme(value)) {
          temp.theme = value
        }
        break
      case "showAscii":
      case "showChecksums":
      case "showMemoryProfiler":
        if (isBoolean(value)) {
          temp[key] = value === "true"
        }
        break

      case "sidebar":
        temp.sidebar = value
        break
      case "sidebarPosition":
        if (isSidebarPosition(value)) {
          temp.sidebarPosition = value
        }
        break
      case "visualization":
        temp.visualization = value
        break
      default:
        break
    }
  }
  return temp
}
