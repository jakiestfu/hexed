import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { Search, Type } from "lucide-react"
import { FixedSizeList } from "react-window"

import { formatAddress } from "@hexed/file/formatter"
import type { StringEncoding, StringMatch } from "@hexed/file/strings"

import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Table,
  TableHead,
  TableHeader,
  TableRow
} from "@hexed/ui"

import { HexedPluginComponent } from "../types"
import { createHexedEditorPlugin } from "../index"
import { useWorkerClient } from "@hexed/editor"

export const Strings: HexedPluginComponent = ({ file, state }) => {
  const workerClient = useWorkerClient()
  const [minLength, setMinLength] = useState<number>(4)
  const [encoding, setEncoding] = useState<StringEncoding>("ascii")
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [extractedStrings, setExtractedStrings] = useState<StringMatch[]>([])
  const [searchProgress, setSearchProgress] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const [availableHeight, setAvailableHeight] = useState<number>(0)

  const minLengthOptions: readonly number[] = [4, 8, 10, 12, 24, 36]

  const handleSearch = useCallback(async () => {
    const fileHandle = file?.getHandle()
    if (!workerClient || !fileHandle) {
      return
    }

    setIsSearching(true)
    setSearchProgress(0)
    setExtractedStrings([])

    try {
      // Get File object from handle
      const fileObj = await fileHandle.getFile()
      console.log("getStrings", { minLength, encoding })
      const matches = await workerClient.strings(
        fileObj,
        {
          minLength,
          encoding
        },
        (progress: number) => {
          setSearchProgress(progress)
        }
      )
      console.log("getStrings Done", matches.length)
      setExtractedStrings(matches)
    } catch (error) {
      console.error("Failed to extract strings:", error)
      setExtractedStrings([])
    } finally {
      setIsSearching(false)
      setSearchProgress(0)
    }
  }, [workerClient, file, minLength, encoding])

  // Calculate available height for the virtualized list
  useEffect(() => {
    const updateHeight = () => {
      if (!containerRef.current || !controlsRef.current) return

      const containerHeight = containerRef.current.clientHeight
      const controlsHeight = controlsRef.current.offsetHeight
      const padding = 16 // space-y-4 = 1rem = 16px
      const progressHeight = isSearching ? 60 : 0 // Approximate progress bar height

      const calculatedHeight =
        containerHeight - controlsHeight - padding - progressHeight

      setAvailableHeight(Math.max(0, calculatedHeight))
    }

    updateHeight()
    const resizeObserver = new ResizeObserver(updateHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    if (controlsRef.current) {
      resizeObserver.observe(controlsRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [isSearching, extractedStrings.length])

  // Row height constant (h-13 = 52px)
  const ROW_HEIGHT = 52

  // Virtualized row component - renders as div styled like table row
  const Row = useCallback(
    ({ index, style }: { index: number; style: CSSProperties }) => {
      const match = extractedStrings[index]
      if (!match) return null

      const hexOffset = formatAddress(match.offset)
      const decimalOffset = match.offset.toLocaleString()
      const displayText =
        match.text.length > 100 ? `${match.text.slice(0, 100)}...` : match.text

      const range = {
        start: match.offset,
        end: match.offset + match.length - 1
      }

      return (
        <div
          style={style}
          className="h-13 border-b hover:bg-muted/50 transition-colors grid grid-cols-[120px_80px_1fr] items-center"
        >
          <div className="font-mono text-xs pl-4">
            <button
              onClick={() => {
                state.handleScrollToOffset(match.offset)
                state.setSelectedOffsetRange(range)
              }}
              className="hover:text-foreground hover:underline transition-colors cursor-pointer text-left"
              aria-label={`Scroll to offset ${hexOffset}`}
            >
              {hexOffset}
              <br />
              <span className="text-muted-foreground">{decimalOffset}</span>
            </button>
          </div>
          <div className="font-mono text-xs">{match.length}</div>
          <div className="font-mono text-xs break-all pr-4">{displayText}</div>
        </div>
      )
    },
    [extractedStrings, state]
  )

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full space-y-4 overflow-hidden"
    >
      {/* Controls - Always visible */}
      <div
        ref={controlsRef}
        className="flex flex-col gap-4 shrink-0 p-4 border-b m-0"
      >
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1.5 grow">
            <label className="text-xs text-muted-foreground font-medium">
              Min Length
            </label>
            <Select
              value={minLength.toString()}
              onValueChange={(value) => setMinLength(parseInt(value, 10))}
              disabled={isSearching}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Min Length" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {minLengthOptions.map((length) => (
                  <SelectItem key={length} value={length.toString()}>
                    {length} characters
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 grow">
            <label className="text-xs text-muted-foreground font-medium">
              Encoding
            </label>
            <Select
              value={encoding}
              onValueChange={(value) => setEncoding(value as StringEncoding)}
              disabled={isSearching}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Encoding" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="ascii">ASCII</SelectItem>
                <SelectItem value="utf8">UTF-8</SelectItem>
                <SelectItem value="utf16le">UTF-16 LE</SelectItem>
                <SelectItem value="utf16be">UTF-16 BE</SelectItem>
                <SelectItem value="utf32le">UTF-32 LE</SelectItem>
                <SelectItem value="utf32be">UTF-32 BE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching || !workerClient || !file?.getHandle()}
            size="icon"
          >
            {isSearching ? <Spinner /> : <Search />}
          </Button>
        </div>

        {!isSearching && extractedStrings.length > 0 ? (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {extractedStrings.length.toLocaleString()} string
            {extractedStrings.length !== 1 ? "s" : ""} found
          </div>
        ) : null}
      </div>

      {/* Progress */}
      {isSearching && (
        <div className="flex p-4 h-full justify-center items-center">
          <div className="space-y-2 w-4/5">
            <Progress value={searchProgress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Extracting strings...</span>
              <span>{searchProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State or Results */}
      {!isSearching && extractedStrings.length === 0 ? (
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
      ) : extractedStrings.length > 0 ? (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="relative w-full overflow-x-auto shrink-0">
            <Table>
              <TableHeader>
                <TableRow className="h-13">
                  <TableHead className="w-[120px] pl-4">Offset</TableHead>
                  <TableHead className="w-[80px]">Length</TableHead>
                  <TableHead className="pr-4">String</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          {availableHeight > 0 && (
            <div className="flex-1 min-h-0 overflow-x-auto">
              <FixedSizeList
                height={availableHeight}
                width="100%"
                itemCount={extractedStrings.length}
                itemSize={ROW_HEIGHT}
                overscanCount={5}
              >
                {Row}
              </FixedSizeList>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export const stringsPlugin = createHexedEditorPlugin({
  type: "sidebar",
  id: "strings",
  title: "Strings",
  icon: Type,
  component: Strings
})
