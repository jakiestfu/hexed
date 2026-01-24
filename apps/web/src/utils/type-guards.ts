import { Sidebar, SidebarPosition, Theme } from "@hexed/editor"

export const isTheme: (value: string) => value is Theme = (value) =>
  value === "light" || value === "dark" || value === "system"
export const isBoolean: (value: string) => value is "true" | "false" = (
  value
) => value === "true" || value === "false"
export const isSidebar: (value: string) => value is NonNullable<Sidebar> = (
  value
) =>
  value === "templates" ||
  value === "strings" ||
  value === "interpreter" ||
  value === null
export const isSidebarPosition: (value: string) => value is SidebarPosition = (
  value
) => value === "left" || value === "right"
