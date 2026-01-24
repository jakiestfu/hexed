import { useEffect, useState } from "react"
import type { CSSProperties, FunctionComponent, ReactNode } from "react"

import { Button } from "@hexed/ui"

import type { FileSource } from "../../types"
import { formatFilenameForDisplay } from "../../utils"
import { FileSourceIcon } from "../file/file-source-icon"
import { FileStatusPopover } from "../file/file-status-popover"
import { Brand } from "../common/logo"

export type HexToolbarProps = {
  left?: ReactNode
  file: File | null
  fileSource?: FileSource
  isConnected?: boolean
  error?: string | null
  onRestartWatching?: () => void
  onClose?: () => void
}

export const HexToolbar: FunctionComponent<HexToolbarProps> = ({
  left,
  file,
  fileSource = "file-system",
  isConnected = false,
  error = null,
  onRestartWatching,
  onClose,
}) => {
  const center = !file ? (
    <div className="flex items-center gap-2 min-w-0">
      <Brand />
    </div>
  ) : (
    <FileStatusPopover
      fileSource={fileSource}
      fileName={file.name || ""}
      isConnected={isConnected}
      error={error}
      onRestartWatching={onRestartWatching}
    >
      <div className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition-opacity group">
        <FileSourceIcon
          fileSource={fileSource}
          fileName={file.name || ""}
          className="text-muted-foreground shrink-0"
        />
        <span
          className="font-mono text-sm truncate group-hover:underline"
          title={file.name}
        >
          {formatFilenameForDisplay(file.name!)}
        </span>
        <div
          className={`inline-flex h-2 w-2 rounded-full shrink-0 ${isConnected ? "bg-green-500" : "bg-gray-500"
            }`}
        />
      </div>
    </FileStatusPopover>
  )

  // const right = !file ? (
  //   <p>wat</p>
  // ) : (
  //   onClose && (
  //     <Button
  //       variant="outline"
  //       size="sm"
  //       onClick={onClose}
  //       className="ml-2 shrink-0"
  //     >
  //       Done
  //     </Button>
  //   )
  // )
  const right =
    file && onClose ? (
      <Button
        variant="outline"
        size="sm"
        onClick={onClose}
        className="ml-2 shrink-0"
      >
        Done
      </Button>
    ) : (
      <span />
    )

  return (
    <div
      className="flex items-center justify-between p-4 border-b"
    >
      <div className="flex items-start min-w-0 flex-1">{left}</div>
      {center && (
        <div className="flex items-center grow justify-center truncate">{center}</div>
      )}
      {right && (
        <div className="flex items-end justify-end flex-1 min-w-0">{right}</div>
      )}
    </div>
  )
}
