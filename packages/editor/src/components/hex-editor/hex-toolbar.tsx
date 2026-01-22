import { useEffect, useState } from "react"
import type { CSSProperties, FunctionComponent, ReactNode } from "react"

import { Button } from "@hexed/ui"

import type { FileSource } from "../../types"
import { formatFilenameForDisplay } from "../../utils"
import { FileSourceIcon } from "../file/file-source-icon"
import { FileStatusPopover } from "../file/file-status-popover"

export type HexToolbarProps = {
  left?: ReactNode
  filePath?: string | null
  fileSource?: FileSource
  isConnected?: boolean
  error?: string | null
  onRestartWatching?: () => void
  onClose?: () => void
  isElectron?: boolean | (() => boolean) // Optional prop to check if running in Electron
}

/**
 * Checks if the app is running in Electron
 * This is a minimal implementation - can be overridden via props
 */
function isElectron(): boolean {
  return typeof window !== "undefined" && (window as any).electron !== undefined
}

export const HexToolbar: FunctionComponent<HexToolbarProps> = ({
  left,
  filePath,
  fileSource = "file-system",
  isConnected = false,
  error = null,
  onRestartWatching,
  onClose,
  isElectron: isElectronProp
}) => {
  const [isInElectron, setIsInElectron] = useState(false)

  useEffect(() => {
    const inElectron =
      typeof isElectronProp === "function"
        ? isElectronProp()
        : isElectronProp !== undefined
          ? isElectronProp
          : isElectron()
    setIsInElectron(inElectron)

    if (inElectron) {
      // Add global style to ensure interactive elements are not draggable
      const style = document.createElement("style")
      style.textContent = `
        [data-electron-drag-region] button,
        [data-electron-drag-region] input,
        [data-electron-drag-region] select,
        [data-electron-drag-region] a,
        [data-electron-drag-region] [role="button"],
        [data-electron-drag-region] [role="menuitem"] {
          -webkit-app-region: no-drag !important;
        }
      `
      document.head.appendChild(style)

      return () => {
        document.head.removeChild(style)
      }
    }
  }, [isElectronProp])

  const hasFile = filePath != null && filePath !== ""

  const center = !hasFile ? (
    <div className="flex items-center gap-2 min-w-0">
      <span className="font-mono text-sm text-muted-foreground">
        No file selected
      </span>
    </div>
  ) : (
    <FileStatusPopover
      fileSource={fileSource}
      filePath={filePath || ""}
      isConnected={isConnected}
      error={error}
      onRestartWatching={onRestartWatching}
    >
      <div className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition-opacity group">
        <FileSourceIcon
          fileSource={fileSource}
          className="text-muted-foreground shrink-0"
        />
        <span
          className="font-mono text-sm truncate group-hover:underline"
          title={filePath}
        >
          {formatFilenameForDisplay(filePath!)}
        </span>
        <div
          className={`inline-flex h-2 w-2 rounded-full shrink-0 ${
            isConnected ? "bg-green-500" : "bg-gray-500"
          }`}
        />
      </div>
    </FileStatusPopover>
  )

  const right = !hasFile ? (
    <span />
  ) : (
    onClose && (
      <Button
        variant="outline"
        size="sm"
        onClick={onClose}
        className="ml-2 shrink-0"
      >
        Done
      </Button>
    )
  )

  return (
    <div
      data-electron-drag-region={isInElectron ? "" : undefined}
      className="flex items-center justify-between p-4 border-b"
      style={
        isInElectron
          ? ({
              WebkitAppRegion: "drag"
            } as CSSProperties)
          : undefined
      }
    >
      <div className="flex items-start min-w-0 flex-1">{left}</div>
      {center && (
        <div className="flex items-center grow justify-center">{center}</div>
      )}
      {right && (
        <div className="flex items-end justify-end flex-1 min-w-0">{right}</div>
      )}
    </div>
  )
}
