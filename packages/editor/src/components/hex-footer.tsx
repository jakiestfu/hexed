import type { FunctionComponent } from "react"
import {
  BarChart3,
  Binary,
  CaseSensitive,
  ChevronDownIcon,
  FileText,
  Type
} from "lucide-react"

import { formatFileSize } from "@hexed/binary-utils/formatter"
import type { BinarySnapshot } from "@hexed/types"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@hexed/ui"

import { useSettings, type Sidebar } from "../hooks/use-settings"
import { MemoryProfiler } from "./memory-profiler"

export type HexFooterProps = {
  totalSize: number | undefined
  dataType: string
  setDataType: (value: string) => void
  endianness: string
  setEndianness: (value: string) => void
  numberFormat: string
  setNumberFormat: (value: string) => void
  hasSnapshots: boolean
  selectedOffset: number | null
  paneToggleValue: string
  onShowHistogram: () => void
}

export const HexFooter: FunctionComponent<HexFooterProps> = ({
  totalSize,
  dataType,
  setDataType,
  endianness,
  setEndianness,
  numberFormat,
  setNumberFormat,
  hasSnapshots,
  selectedOffset,
  paneToggleValue,
  onShowHistogram
}) => {
  const { showAscii, setShowAscii, showMemoryProfiler, setSidebar } =
    useSettings()

  const bytesLabel = totalSize ? (
    <div className="flex items-center gap-2 font-mono">
      <span className="text-xs text-muted-foreground">
        {formatFileSize(totalSize)}
      </span>
      {showMemoryProfiler && <MemoryProfiler />}
    </div>
  ) : undefined

  return (
    <div className="flex items-center justify-between w-full border-t bg-muted/30 p-4">
      <div className="flex items-start min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Select
            value={dataType}
            onValueChange={setDataType}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Signed Int">Signed Int</SelectItem>
              <SelectItem value="Unsigned Int">Unsigned Int</SelectItem>
              <SelectItem value="Floats">Floats</SelectItem>
              <SelectItem value="UTF-8">UTF-8</SelectItem>
              <SelectItem value="SLEB128">SLEB128</SelectItem>
              <SelectItem value="ULEB128">ULEB128</SelectItem>
              <SelectItem value="Binary">Binary</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="justify-between font-mono"
              >
                {endianness}, {numberFormat}
                <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-48"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Endianness</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={endianness}
                  onValueChange={setEndianness}
                >
                  <DropdownMenuRadioItem value="le">
                    little
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="be">big</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Format</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={numberFormat}
                  onValueChange={setNumberFormat}
                >
                  <DropdownMenuRadioItem value="dec">
                    decimal
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="hex">
                    hexadecimal
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {bytesLabel ? (
        <div className="flex items-center grow justify-center">
          {bytesLabel}
        </div>
      ) : (
        <span />
      )}
      <div className="flex items-end justify-end flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                variant="outline"
                pressed={showAscii}
                onPressedChange={setShowAscii}
                aria-label="Toggle ASCII view"
                size="sm"
                className={showAscii ? "bg-accent" : ""}
              >
                <CaseSensitive />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Toggle ASCII view</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onShowHistogram}
                disabled={!hasSnapshots}
                aria-label="Show histogram"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show Histogram</TooltipContent>
          </Tooltip>
          <ToggleGroup
            type="single"
            value={paneToggleValue}
            onValueChange={(value) => setSidebar((value || null) as Sidebar)}
            variant="outline"
            size="sm"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="interpreter"
                  aria-label="Toggle interpreter"
                  className={
                    paneToggleValue === "interpreter" ? "bg-accent" : ""
                  }
                >
                  <Binary />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                {selectedOffset === null
                  ? "Select bytes to enable interpreter"
                  : "Toggle interpreter panel"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="templates"
                  aria-label="Toggle templates panel"
                  className={paneToggleValue === "templates" ? "bg-accent" : ""}
                >
                  <FileText />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Toggle templates panel</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="strings"
                  aria-label="Toggle strings panel"
                  className={paneToggleValue === "strings" ? "bg-accent" : ""}
                >
                  <Type />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Toggle strings panel</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </div>
      </div>
    </div>
  )
}
