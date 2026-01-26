import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useContext
} from "react"

import { UseHexedState } from "../hooks/use-hexed-state"

/**
 * Context for the editor state
 */
const HexedStateContext = createContext<UseHexedState[0] | null>(null)

/**
 * Provider component that provides the editor state
 * The state is initialized at the root and shared via context
 */
export const HexedStateProvider: FunctionComponent<
  PropsWithChildren<{
    value: UseHexedState[0]
  }>
> = ({ children, value }) => (
  <HexedStateContext.Provider value={value}>
    {children}
  </HexedStateContext.Provider>
)

/**
 * Hook to access the editor state from context
 * Returns the state object or throws an error if not initialized
 */
export const useHexedStateContext = () => {
  const ctx = useContext(HexedStateContext)
  if (!ctx) {
    throw new Error(
      "useHexedStateContext must be used within <HexedStateProvider />"
    )
  }
  return ctx
}
