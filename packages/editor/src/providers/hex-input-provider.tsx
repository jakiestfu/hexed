import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useContext
} from "react"

import { OnHexedInputChange, UseHexedInput } from "../hooks/use-hexed-input"

/**
 * Context for the worker client
 */
const HexedInputContext = createContext<{
  input: UseHexedInput[0]
  onChangeInput: OnHexedInputChange
} | null>(null)

/**
 * Provider component that initializes and provides the worker client
 * The client is initialized once at the root and shared via context
 */
export const HexedInputProvider: FunctionComponent<
  PropsWithChildren<{
    input: UseHexedInput[0]
    onChangeInput: OnHexedInputChange
  }>
> = ({ children, input, onChangeInput }) => (
  <HexedInputContext.Provider value={{ input, onChangeInput }}>
    {children}
  </HexedInputContext.Provider>
)

/**
 * Hook to access the worker client from context
 * Returns the worker client instance or null if not initialized
 */
export const useHexedInputContext = () => {
  const ctx = useContext(HexedInputContext)
  if (!ctx) {
    throw new Error(
      "useHexedInputContext must be used within <HexedInputProvider />"
    )
  }
  return ctx
}
