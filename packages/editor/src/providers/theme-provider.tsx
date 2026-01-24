import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState
} from "react"

import { useHexedSettings } from "../hooks/use-hexed-settings"
import { useLocalStorage } from "../hooks/use-local-storage"
import { useHexedSettingsContext } from "./hexed-settings-provider"

export type Theme = "dark" | "light" | "system"

type ThemeProviderState = ReturnType<typeof useLocalStorage<Theme>>

const initialState: ThemeProviderState = ["system", () => null]

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children }: PropsWithChildren) {
  const { theme } = useHexedSettingsContext()
  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  return <>{children}</>
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
