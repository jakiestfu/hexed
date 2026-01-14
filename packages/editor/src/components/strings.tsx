import { useEffect, useMemo, useRef, useState } from "react"
import type { FunctionComponent, RefObject } from "react"
import { ArrowLeftRight, Maximize2, Type, X } from "lucide-react"

import { formatAddress } from "@hexed/binary-utils/formatter"
import {
  extractStrings,
  type StringEncoding,
  type StringMatch
} from "@hexed/binary-utils/strings"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@hexed/ui"

import { usePIP } from "../hooks/use-pip"
import { useSettings } from "../hooks/use-settings"
import type { StringsProps } from "../types"

export const Strings: FunctionComponent<StringsProps> = ({
  data,
  onClose,
  onScrollToOffset,
  onSelectedOffsetRangeChange,
  onRangeSelectedForSearch,
  onPIPStateChange
}) => {
  const stringsRef = useRef<HTMLDivElement>(null)
  const { isPIPActive, stylesLoaded, togglePIP, isSupported } = usePIP(
    stringsRef as RefObject<HTMLElement>
  )
  const { toggleSidebarPosition } = useSettings()
  const [minLength, setMinLength] = useState<number>(4)
  const [encoding, setEncoding] = useState<StringEncoding>("ascii")

  // Notify parent component when PIP state changes
  useEffect(() => {
    onPIPStateChange?.(isPIPActive)
  }, [isPIPActive, onPIPStateChange])

  const extractedStrings = useMemo<StringMatch[]>(() => {
    if (!data || data.length === 0) {
      return []
    }

    try {
      return extractStrings(data, {
        minLength,
        encoding
      })
    } catch (error) {
      console.error("Failed to extract strings:", error)
      return []
    }
  }, [data, minLength, encoding])

  const handleMinLengthChange = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num > 0) {
      setMinLength(num)
    }
  }

  return (
    <div
      ref={stringsRef}
      className="h-full"
      style={{
        visibility: isPIPActive && !stylesLoaded ? "hidden" : "visible"
      }}
    >
      <Card className="h-full flex flex-col p-0 rounded-none border-none bg-sidebar overflow-hidden gap-0">
        <CardHeader className="py-3! px-4 border-b shrink-0 gap-0 bg-secondary">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <CardTitle className="text-sm font-medium shrink-0 flex-1">
                Strings
              </CardTitle>
            </div>
            {!isPIPActive && (
              <div className="flex items-center gap-2 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSidebarPosition}
                      className="h-7 w-7 p-0"
                      aria-label="Toggle sidebar position"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle sidebar position</TooltipContent>
                </Tooltip>
                {isSupported && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePIP}
                    className="h-7 w-7 p-0"
                    aria-label="Open Picture-in-Picture window"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                )}
                {onClose && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-7 w-7 p-0"
                    aria-label="Close strings"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 overflow-y-auto">
          {!data || data.length === 0 ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Type className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No data available</EmptyTitle>
                <EmptyDescription>
                  Load a file to extract strings from binary data
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex items-end gap-4 flex-wrap">
                <div className="flex flex-col gap-2 min-w-[120px]">
                  <Label
                    htmlFor="min-length"
                    className="text-xs"
                  >
                    Min Length
                  </Label>
                  <Input
                    id="min-length"
                    type="number"
                    min="1"
                    value={minLength}
                    onChange={(e) => handleMinLengthChange(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <Label
                    htmlFor="encoding"
                    className="text-xs"
                  >
                    Encoding
                  </Label>
                  <Select
                    value={encoding}
                    onValueChange={(value) =>
                      setEncoding(value as StringEncoding)
                    }
                  >
                    <SelectTrigger
                      id="encoding"
                      className="h-8"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ascii">ASCII</SelectItem>
                      <SelectItem value="utf8">UTF-8</SelectItem>
                      <SelectItem value="utf16le">UTF-16 LE</SelectItem>
                      <SelectItem value="utf16be">UTF-16 BE</SelectItem>
                      <SelectItem value="utf32le">UTF-32 LE</SelectItem>
                      <SelectItem value="utf32be">UTF-32 BE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center text-xs text-muted-foreground ml-auto">
                  {extractedStrings.length} string
                  {extractedStrings.length !== 1 ? "s" : ""} found
                </div>
              </div>

              {/* Strings Table */}
              {extractedStrings.length === 0 ? (
                <Empty className="h-full">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Type className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>No strings found</EmptyTitle>
                    <EmptyDescription>
                      Try adjusting the minimum length or encoding settings
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="overflow-hidden -mx-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px] pl-4">Offset</TableHead>
                        <TableHead className="w-[80px]">Length</TableHead>
                        {/* <TableHead className="w-[100px]">Encoding</TableHead> */}
                        <TableHead className="pr-4">String</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedStrings.map((match, index) => {
                        const hexOffset = formatAddress(match.offset)
                        const decimalOffset = match.offset.toLocaleString()
                        const displayText =
                          match.text.length > 100
                            ? `${match.text.slice(0, 100)}...`
                            : match.text

                        return (
                          <TableRow key={`${match.offset}-${index}`}>
                            <TableCell className="font-mono text-xs pl-4">
                              {(onScrollToOffset ||
                                onSelectedOffsetRangeChange) &&
                              !isPIPActive ? (
                                <button
                                  onClick={() => {
                                    const range = {
                                      start: match.offset,
                                      end: match.offset + match.length - 1
                                    }
                                    if (onScrollToOffset) {
                                      onScrollToOffset(match.offset)
                                    }
                                    if (onSelectedOffsetRangeChange) {
                                      onSelectedOffsetRangeChange(range)
                                    }
                                    if (onRangeSelectedForSearch) {
                                      onRangeSelectedForSearch(range)
                                    }
                                  }}
                                  className="hover:text-foreground hover:underline transition-colors cursor-pointer text-left"
                                  aria-label={`Scroll to offset ${hexOffset}`}
                                >
                                  {hexOffset}
                                  <br />
                                  <span className="text-muted-foreground">
                                    {decimalOffset}
                                  </span>
                                </button>
                              ) : (
                                <>
                                  {hexOffset}
                                  <br />
                                  <span className="text-muted-foreground">
                                    {decimalOffset}
                                  </span>
                                </>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {match.length}
                            </TableCell>
                            {/* <TableCell className="text-xs">
                              {match.encoding.toUpperCase()}
                            </TableCell> */}
                            <TableCell className="font-mono text-xs break-all pr-4">
                              {displayText}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
