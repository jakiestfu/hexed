import { useEffect, useState } from "react"
import type { CSSProperties, FunctionComponent, ReactNode } from "react"

import { HexedFile } from "@hexed/file"
import { HexedPlugin } from "@hexed/plugins/types"
import {
  Button,
  cn,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@hexed/ui"

import { Sidebar } from "../../hooks/use-hexed-settings"
import { useHexedSettingsContext } from "../../providers/hexed-settings-provider"
import type { FileSource } from "../../types"
import { formatFilenameForDisplay } from "../../utils"
import { Brand } from "../common/logo"
import { FileSourceIcon } from "../file/file-source-icon"
import { FileStatusPopover } from "../file/file-status-popover"

export type HexToolbarProps = {
  left?: ReactNode
  file: HexedFile | null
  fileSource?: FileSource
  isConnected?: boolean
  error?: string | null
  onRestartWatching?: () => void
  onClose?: () => void
  plugins: HexedPlugin[]
}

export const HexToolbar: FunctionComponent<HexToolbarProps> = ({
  left,
  file,
  fileSource = "file-system",
  isConnected = false,
  error = null,
  onRestartWatching,
  plugins
}) => {
  const { toolbar, setToolbar } = useHexedSettingsContext()
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
      <div className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition-opacity group px-4 md:px-0">
        <FileSourceIcon
          fileSource={fileSource}
          fileName={file.name || ""}
          className="text-muted-foreground shrink-0 hidden md:flex"
        />
        <span
          className="font-mono text-sm truncate group-hover:underline"
          title={file.name}
        >
          {formatFilenameForDisplay(file.name!)}
        </span>
        <div
          className={`inline-flex h-2 w-2 rounded-full shrink-0 ${
            isConnected ? "bg-green-500" : "bg-gray-500"
          }`}
        />
      </div>
    </FileStatusPopover>
  )

  const right = file ? (
    <ToggleGroup
      type="single"
      value={toolbar || ""}
      onValueChange={(value) => {
        console.log("value", value)
        setToolbar(value === toolbar ? null : value)
      }}
      variant="outline"
      size="sm"
      className="grow md:grow-0"
    >
      {plugins
        .filter((plugin) => plugin.type === "toolbar")
        .map((plugin) => (
          <Tooltip key={plugin.id}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={plugin.id}
                aria-label={`Toggle ${plugin.title} panel`}
                className={cn(
                  "grow md:grow-0",
                  toolbar === plugin.id ? "bg-accent" : ""
                )}
              >
                <plugin.icon />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>Toggle {plugin.title}</TooltipContent>
          </Tooltip>
        ))}
    </ToggleGroup>
  ) : (
    <span />
  )

  const toolbarPlugin =
    file && toolbar ? plugins.find((plugin) => plugin.id === toolbar) : null

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b overflow-hidden">
        <div className="flex items-start flex-1">{left}</div>
        {center && (
          <div className="flex items-center grow justify-center truncate">
            {center}
          </div>
        )}
        {right && (
          <div className="flex items-end justify-end flex-1">{right}</div>
        )}
      </div>

      {toolbarPlugin && toolbarPlugin.component}
    </>
  )
}
