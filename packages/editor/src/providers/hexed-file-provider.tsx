import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useContext
} from "react"

import { OnHexedFileChange, UseHexedFile } from "../hooks/use-hexed-file"

/**
 * Context for the hexed file
 */
const HexedFileContext = createContext<{
  input: UseHexedFile[0]
  onChangeInput: OnHexedFileChange
} | null>(null)

/**
 * Provider component that initializes and provides the hexed file
 * The file is initialized once at the root and shared via context
 */
export const HexedFileProvider: FunctionComponent<
  PropsWithChildren<{
    input: UseHexedFile[0]
    onChangeInput: OnHexedFileChange
  }>
> = ({ children, input, onChangeInput }) => (
  <HexedFileContext.Provider value={{ input, onChangeInput }}>
    {children}
  </HexedFileContext.Provider>
)

/**
 * Hook to access the hexed file from context
 * Returns the hexed file instance or null if not initialized
 */
export const useHexedFileContext = () => {
  const ctx = useContext(HexedFileContext)
  if (!ctx) {
    throw new Error(
      "useHexedFileContext must be used within <HexedFileProvider />"
    )
  }
  return ctx
}
