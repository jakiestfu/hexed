import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useContext
} from "react"

import { UseHexedSettings } from "../hooks/use-hexed-settings"

/**
 * Context for the worker client
 */
const HexedSettingsContext = createContext<UseHexedSettings | null>(null)

/**
 * Provider component that initializes and provides the worker client
 * The client is initialized once at the root and shared via context
 */
export const HexedSettingsProvider: FunctionComponent<
  PropsWithChildren<{
    value: UseHexedSettings
  }>
> = ({ children, value }) => (
  <HexedSettingsContext.Provider value={value}>
    {children}
  </HexedSettingsContext.Provider>
)

/**
 * Hook to access the worker client from context
 * Returns the worker client instance or null if not initialized
 */
export const useHexedSettingsContext = () => {
  const ctx = useContext(HexedSettingsContext)
  if (!ctx) {
    throw new Error(
      "useHexedSettingsContext must be used within <HexedSettingsProvider />"
    )
  }
  return ctx
}
