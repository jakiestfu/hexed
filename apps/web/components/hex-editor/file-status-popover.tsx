"use client"

import { FunctionComponent, ReactNode } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

import { Button, Popover, PopoverContent, PopoverTrigger } from "@hexed/ui"

import { FileSource } from "./types"

export type FileStatusPopoverProps = {
  fileSource: FileSource
  originalSource: string
  isConnected?: boolean
  error?: string | null
  onRestartWatching?: () => void
  children: ReactNode
}

export const FileStatusPopover: FunctionComponent<FileStatusPopoverProps> = ({
  fileSource,
  originalSource,
  isConnected = false,
  error = null,
  onRestartWatching,
  children
}) => {
  const getDotColor = () => {
    if (fileSource === "disk") {
      return isConnected ? "bg-green-500" : "bg-red-500"
    }
    return "bg-gray-500"
  }
  console.log({ fileSource, originalSource, isConnected, error })
  const getStatusText = () => {
    if (fileSource === "disk") {
      if (error) {
        return "Error watching file"
      }
      return isConnected ? "Watching for changes" : "Not watching for changes"
    }
    if (fileSource === "url") {
      return "Fetched from URL"
    }
    return "Upload"
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        className="w-md"
      >
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`inline-flex h-2 w-2 rounded-full ${getDotColor()}`}
              />
              <span className="text-sm font-medium">
                {getStatusText()}
                {error ? `: ${error}` : ""}
              </span>
            </div>
          </div>

          {fileSource === "disk" && (
            <>
              <div className="text-xs text-muted-foreground font-mono break-all">
                <span className="font-semibold">Disk:</span> {originalSource}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Changes to the file will automatically appear in the editor.
                </p>
              </div>
              {error && (
                <div className="space-y-2">
                  {onRestartWatching && (
                    <Button
                      onClick={onRestartWatching}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restart Watching
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {fileSource === "upload" && (
            <>
              <div className="text-xs text-muted-foreground font-mono break-all">
                <span className="font-semibold">Upload:</span> {originalSource}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  This file was uploaded from your device. Drag and drop the
                  file again to add it as a new snapshot for comparison.
                </p>
              </div>
            </>
          )}

          {fileSource === "url" && (
            <>
              <div className="text-xs text-muted-foreground font-mono break-all">
                <span className="font-semibold">URL:</span> {originalSource}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  This file was fetched from a URL. Drag and drop a file to add
                  it as a new snapshot for comparison.
                </p>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
