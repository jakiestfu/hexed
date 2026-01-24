import { useEffect, useRef, useState } from "react"
import type { FunctionComponent } from "react"
import { Clock, FolderOpen, Loader2 } from "lucide-react"

import { formatFileSize } from "@hexed/binary-utils/formatter"
import {
  Button,
  Card,
  CardContent,
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@hexed/ui"

import { OnHexedInputChange } from "../../hooks/use-hexed-input"
import { useRecentFiles } from "../../hooks/use-recent-files"
import { formatTimestamp, getBasename } from "../../utils"
import type { FileHandleMetadata } from "../../utils/file-handle-storage"
import { AboutFileSystemAccessDialog } from "../dialogs/about-file-system-access-dialog"
import { supportsFileSystemAccess } from "../../utils/file-system-access"

type DataPickerProps = {
  recentFiles: FileHandleMetadata[]
  onChangeInput: OnHexedInputChange
}

// Recent Files Component
const RecentFilesDropdown: FunctionComponent<{
  recentFiles: FileHandleMetadata[]
  onSelect: (handleId: string) => void
}> = ({ recentFiles, onSelect }) => {
  const [fileSizes, setFileSizes] = useState<Map<string, number>>(new Map())
  const [isLoadingSizes, setIsLoadingSizes] = useState(false)

  if (recentFiles.length === 0) return null

  const loadFileSizes = async () => {
    setIsLoadingSizes(true)
    const sizes = new Map<string, number>()

    try {
      await Promise.all(
        recentFiles.map(async (file) => {
          try {
            const fileObj = await file.handle.getFile()
            sizes.set(file.id, fileObj.size)
          } catch (error) {
            // Silently fail for individual files
            console.warn(`Failed to get size for file ${file.id}:`, error)
          }
        })
      )
      setFileSizes(sizes)
    } finally {
      setIsLoadingSizes(false)
    }
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && fileSizes.size === 0) {
          loadFileSizes()
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-2"
        align="end"
      >
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Recent Files
          </div>
          {recentFiles.map((file) => {
            const fileSize = fileSizes.get(file.id)
            return (
              <Button
                key={file.id}
                type="button"
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2 px-2"
                onClick={() => {
                  onSelect(file.id)
                }}
              >
                <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                  <span className="font-mono text-sm truncate w-full">
                    {getBasename(file.handle.name)}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatTimestamp(file.timestamp)}</span>
                    {fileSize !== undefined && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(fileSize, true)}</span>
                      </>
                    )}
                    {isLoadingSizes && fileSize === undefined && (
                      <>
                        <span>•</span>
                        <span className="text-muted-foreground/50">
                          Loading size...
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const DataPicker: FunctionComponent<DataPickerProps> = ({
  recentFiles,
  onChangeInput
}) => {
  const { addRecentFile, getFileHandleById } = useRecentFiles()
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showFileSystemInfoDialog, setShowFileSystemInfoDialog] =
    useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // Wait for component mount and local storage restoration
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleRecentFileSelect = async (handleId: string) => {
    setIsLoading(true)
    try {
      const handleData = await getFileHandleById(handleId)
      if (!handleData) {
        throw new Error("File handle not found or permission denied")
      }
      // Call callback with handleId
      onChangeInput(handleId)
    } catch (error) {
      console.error("Error reopening file handle:", error)
      alert("Could not reopen file. Please select it again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSystemAccessPicker = async () => {
    if (!(supportsFileSystemAccess()) || !window.showOpenFilePicker) {
      // Fallback: open a normal file input picker
      fileInputRef.current?.click()
      return
    }

    setIsLoading(true)
    try {
      const [handle] = await window.showOpenFilePicker({
        excludeAcceptAllOption: false,
        multiple: false
      })

      // Save handle and get handleId
      const handleId = await addRecentFile(handle.name, "file-system", handle)

      if (!handleId) {
        console.error("Failed to save file handle")
        alert("Failed to save file handle. Please try again.")
        return
      }

      // Call callback with handleId
      onChangeInput(handleId)
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof DOMException && error.name !== "AbortError") {
        console.error("Error opening file picker:", error)
        alert("Failed to open file. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFallbackFilePicked: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const file = e.currentTarget.files?.[0]
    // allow picking the same file twice in a row
    e.currentTarget.value = ""

    if (!file) return

    setIsLoading(true)
    try {
      // Fallback path: pass the File object directly
      onChangeInput(file)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card
      className={`bg-transparent w-full max-w-lg border-none h-[250px] transition-all duration-300 ${isMounted ? "opacity-100" : "opacity-0"
        }`}
    >
      <CardContent className="space-y-4 bg-transparent">
        <div className="space-y-4 mt-4">
          <label className="text-sm font-medium inline-block mb-2">
            Select a file
          </label>

          {/* Hidden fallback input (used when File System Access API isn't available) */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFallbackFilePicked}
          />

          <div className="flex gap-2">
            <Button
              onClick={handleFileSystemAccessPicker}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FolderOpen className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Opening..." : "Choose File"}
            </Button>

            {supportsFileSystemAccess() && recentFiles.length > 0 && (
              <RecentFilesDropdown
                recentFiles={recentFiles}
                onSelect={handleRecentFileSelect}
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {supportsFileSystemAccess() ? (
              <>
                Choose a file using the{" "}
                <button
                  type="button"
                  onClick={() => setShowFileSystemInfoDialog(true)}
                  className="underline cursor-pointer hover:text-foreground transition-colors"
                >
                  File System Access API
                </button>
                {recentFiles.length > 0 && " or select from recent files"}
              </>
            ) : (
              "Choose a file from your device (your browser doesn’t support the File System Access API)."
            )}
          </p>
        </div>
      </CardContent>
      <AboutFileSystemAccessDialog
        open={showFileSystemInfoDialog}
        onOpenChange={setShowFileSystemInfoDialog}
      />
    </Card>
  )
}
