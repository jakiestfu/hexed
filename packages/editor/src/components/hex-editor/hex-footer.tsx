import type { FunctionComponent } from "react"
import {
  BarChart3,
  Binary,
  CaseSensitive,
  ChevronDownIcon,
  FileText,
  Type
} from "lucide-react"

import { formatFileSize } from "@hexed/file/formatter"
import type { BinarySnapshot } from "@hexed/types"
import {
  Button,
  cn,
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

import { useHexedSettings, type Sidebar } from "../../hooks/use-hexed-settings"
import { useHexedSettingsContext } from "../../providers/hexed-settings-provider"
import { useHexedStateContext } from "../../providers/hexed-state-provider"
import { MemoryProfiler } from "../common/memory-profiler"

export type HexFooterProps = {
  totalSize: number | undefined
  hasSnapshots: boolean
  paneToggleValue: string
}

export const HexFooter: FunctionComponent<HexFooterProps> = ({
  totalSize,
  hasSnapshots,
  paneToggleValue
}) => {
  const { showAscii, setShowAscii, showMemoryProfiler, setSidebar } =
    useHexedSettingsContext()
  const {
    dataType,
    setDataType,
    endianness,
    setEndianness,
    numberFormat,
    setNumberFormat,
    selectedOffset,
    handleToggleHistogram
  } = useHexedStateContext()

  const bytesLabel = totalSize ? (
    <div className="items-center gap-2 font-mono hidden md:flex flex-col">
      <span className="text-xs text-muted-foreground">
        {formatFileSize(totalSize)}
      </span>
      {showMemoryProfiler && <MemoryProfiler />}
    </div>
  ) : undefined

  return (
    <div className="flex w-full flex-col gap-3 border-t bg-muted/30 p-4 md:flex-row md:items-center md:justify-between md:gap-4 h-auto md:h-[66px]">
      {/* left */}
      <div className="flex w-full min-w-0 md:w-auto md:flex-1">
        <div className="flex w-full grow items-center gap-2">
          <Select
            value={dataType}
            onValueChange={setDataType}
          >
            <SelectTrigger
              size="sm"
              className="grow md:grow-0"
            >
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
                className="justify-between font-mono grow md:grow-0"
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

      {/* center */}
      <div className="order-last hidden w-full items-center justify-start md:order-none md:w-auto md:flex md:flex-1 md:justify-center">
        {bytesLabel ? bytesLabel : <span className="hidden md:inline" />}
      </div>

      {/* right */}
      <div className="flex w-full min-w-0 items-center justify-start md:w-auto md:flex-1 md:justify-end">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                variant="outline"
                pressed={showAscii}
                onPressedChange={setShowAscii}
                aria-label="Toggle ASCII view"
                size="sm"
                className={cn("grow md:grow-0", showAscii ? "bg-accent" : "")}
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
                onClick={handleToggleHistogram}
                disabled={!hasSnapshots}
                aria-label="Show histogram"
                className="grow md:grow-0"
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
            className="grow md:grow-0"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="interpreter"
                  aria-label="Toggle interpreter"
                  className={cn(
                    "grow md:grow-0",
                    paneToggleValue === "interpreter" ? "bg-accent" : ""
                  )}
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
                  className={cn(
                    "grow md:grow-0",
                    paneToggleValue === "templates" ? "bg-accent" : ""
                  )}
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
                  className={cn(
                    "grow md:grow-0",
                    paneToggleValue === "strings" ? "bg-accent" : ""
                  )}
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
