import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react"
import type { FunctionComponent, ReactNode } from "react"

import type { BinarySnapshot } from "@hexed/types"

import { createSnapshotFromFile } from "../utils"

type DragDropContextType = {
  setOnFileSelect: (
    callback: ((filePath: string | BinarySnapshot) => void) | null
  ) => void
}

const DragDropContext = createContext<DragDropContextType>({
  setOnFileSelect: () => {}
})

export const useDragDrop = () => useContext(DragDropContext)

type DragDropProviderProps = {
  children: ReactNode
}

export const DragDropProvider: FunctionComponent<DragDropProviderProps> = ({
  children
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [onFileSelectCallback, setOnFileSelectCallback] = useState<
    ((filePath: string | BinarySnapshot) => void) | null
  >(null)

  const setOnFileSelect = useCallback(
    (callback: ((filePath: string | BinarySnapshot) => void) | null) => {
      setOnFileSelectCallback(() => callback)
    },
    []
  )

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.types.includes("Files")) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only hide if we're leaving the window/document
    if (
      e.currentTarget === e.target ||
      (e.target as HTMLElement).closest("body") === null
    ) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer?.files[0]
      if (!file || !onFileSelectCallback) return

      try {
        const snapshot = await createSnapshotFromFile(file)
        onFileSelectCallback(snapshot)
      } catch (error) {
        console.error("Error reading dropped file:", error)
      }
    },
    [onFileSelectCallback]
  )

  useEffect(() => {
    // Add global drag event listeners to document body
    const body = document.body
    body.addEventListener("dragenter", handleDragEnter)
    body.addEventListener("dragleave", handleDragLeave)
    body.addEventListener("dragover", handleDragOver)
    body.addEventListener("drop", handleDrop)

    return () => {
      body.removeEventListener("dragenter", handleDragEnter)
      body.removeEventListener("dragleave", handleDragLeave)
      body.removeEventListener("dragover", handleDragOver)
      body.removeEventListener("drop", handleDrop)
    }
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop])

  return (
    <DragDropContext.Provider value={{ setOnFileSelect }}>
      {children}
      {/* Full-screen drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 pointer-events-none">
          <div className="text-4xl font-bold text-foreground">Drop</div>
        </div>
      )}
    </DragDropContext.Provider>
  )
}
