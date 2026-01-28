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
import type { EvaluateAPI } from "@hexed/worker"

import { createHexedEditorPlugin } from "../.."
import { HexedPluginComponent } from "../../types"

/**
 * Pure function to extract strings from binary data
 * This function runs in the worker context via $evaluate
 */
const extractStringsImpl: EvaluateAPI<
  StringMatch[],
  {
    minLength: number
    encoding: StringEncoding
    startOffset?: number
    endOffset?: number
  }
> = async (hexedFile, api) => {
  // Chunk size for streaming (1MB)
  const STREAM_CHUNK_SIZE = 1024 * 1024

  /**
   * Get the overlap buffer size needed for a given encoding
   */
  const getOverlapSize = (encoding: string): number => {
    switch (encoding) {
      case "ascii":
        return 0 // No multi-byte sequences
      case "utf8":
        return 3 // Max UTF-8 sequence is 4 bytes, need 3 to detect incomplete sequences
      case "utf16le":
      case "utf16be":
        return 1 // 2-byte units, need 1 byte to detect incomplete unit
      case "utf32le":
      case "utf32be":
        return 3 // 4-byte units, need 3 bytes to detect incomplete unit
      default:
        return 3 // Default to safe value for unknown encodings
    }
  }

  /**
   * Check if a byte is printable ASCII (32-126)
   */
  const isPrintableAscii = (byte: number): boolean => {
    return byte >= 32 && byte <= 126
  }

  /**
   * Check if a UTF-8 sequence is valid and printable
   */
  const isValidUtf8Char = (
    bytes: Uint8Array,
    offset: number
  ): {
    valid: boolean
    length: number
    char: string | null
  } => {
    if (offset >= bytes.length) {
      return { valid: false, length: 0, char: null }
    }

    const byte0 = bytes[offset]

    // Single byte ASCII (0x00-0x7F)
    if (byte0 < 0x80) {
      if (isPrintableAscii(byte0)) {
        return {
          valid: true,
          length: 1,
          char: String.fromCharCode(byte0)
        }
      }
      return { valid: false, length: 1, char: null }
    }

    // Multi-byte UTF-8
    let length = 0
    if ((byte0 & 0xe0) === 0xc0) length = 2
    else if ((byte0 & 0xf0) === 0xe0) length = 3
    else if ((byte0 & 0xf8) === 0xf0) length = 4
    else return { valid: false, length: 1, char: null }

    if (offset + length > bytes.length) {
      return { valid: false, length: 0, char: null }
    }

    try {
      const decoder = new TextDecoder("utf-8", { fatal: true })
      const slice = bytes.slice(offset, offset + length)
      const char = decoder.decode(slice)
      // Check if character is printable (not control characters)
      const codePoint = char.codePointAt(0)
      if (codePoint !== undefined && codePoint >= 32 && codePoint !== 127) {
        return { valid: true, length, char }
      }
      return { valid: false, length, char: null }
    } catch {
      return { valid: false, length, char: null }
    }
  }

  /**
   * Extract ASCII strings from binary data
   */
  const extractAsciiStrings = (
    data: Uint8Array,
    minLength: number
  ): StringMatch[] => {
    const matches: StringMatch[] = []
    let start = -1
    let length = 0

    for (let i = 0; i < data.length; i++) {
      const byte = data[i]

      if (isPrintableAscii(byte)) {
        if (start === -1) {
          start = i
          length = 1
        } else {
          length++
        }
      } else {
        if (start !== -1 && length >= minLength) {
          const text = String.fromCharCode(
            ...Array.from(data.slice(start, start + length))
          )
          matches.push({
            offset: start,
            length,
            encoding: "ascii",
            text
          })
        }
        start = -1
        length = 0
      }
    }

    // Handle string at end of data
    if (start !== -1 && length >= minLength) {
      const text = String.fromCharCode(
        ...Array.from(data.slice(start, start + length))
      )
      matches.push({
        offset: start,
        length,
        encoding: "ascii",
        text
      })
    }

    return matches
  }

  /**
   * Extract UTF-8 strings from binary data
   */
  const extractUtf8Strings = (
    data: Uint8Array,
    minLength: number
  ): StringMatch[] => {
    const matches: StringMatch[] = []
    let start = -1
    let length = 0
    let charLength = 0

    for (let i = 0; i < data.length; ) {
      const result = isValidUtf8Char(data, i)

      if (result.valid && result.char) {
        if (start === -1) {
          start = i
          length = result.length
          charLength = 1
        } else {
          length += result.length
          charLength++
        }
        i += result.length
      } else {
        if (start !== -1 && charLength >= minLength) {
          try {
            const decoder = new TextDecoder("utf-8", { fatal: true })
            const text = decoder.decode(data.slice(start, start + length))
            matches.push({
              offset: start,
              length,
              encoding: "utf8",
              text
            })
          } catch {
            // Skip invalid UTF-8 sequences
          }
        }
        start = -1
        length = 0
        charLength = 0
        i += result.length || 1
      }
    }

    // Handle string at end of data
    if (start !== -1 && charLength >= minLength) {
      try {
        const decoder = new TextDecoder("utf-8", { fatal: true })
        const text = decoder.decode(data.slice(start, start + length))
        matches.push({
          offset: start,
          length,
          encoding: "utf8",
          text
        })
      } catch {
        // Skip invalid UTF-8 sequences
      }
    }

    return matches
  }

  /**
   * Read UTF-16 code unit
   */
  const readUtf16CodeUnit = (
    data: Uint8Array,
    offset: number,
    littleEndian: boolean
  ): { value: number; error: null } | { value: null; error: string } => {
    if (offset + 2 > data.length) {
      return { value: null, error: "Insufficient bytes" }
    }

    const value = littleEndian
      ? data[offset] | (data[offset + 1] << 8)
      : (data[offset] << 8) | data[offset + 1]

    return { value, error: null }
  }

  /**
   * Check if a UTF-16 code unit represents a printable character
   */
  const isPrintableUtf16 = (codeUnit: number): boolean => {
    // Check for null terminator
    if (codeUnit === 0) {
      return false
    }

    // Basic printable range (excluding surrogates)
    if (codeUnit >= 32 && codeUnit < 0xd800) {
      return codeUnit !== 127 // Exclude DEL
    }

    // Surrogate pairs (0xD800-0xDFFF) are handled separately
    if (codeUnit >= 0xd800 && codeUnit <= 0xdfff) {
      return false // High/low surrogates are not printable by themselves
    }

    // Other printable ranges
    if (codeUnit >= 0xe000 && codeUnit <= 0xfffd) {
      return true
    }

    return false
  }

  /**
   * Extract UTF-16 strings from binary data
   */
  const extractUtf16Strings = (
    data: Uint8Array,
    minLength: number,
    littleEndian: boolean
  ): StringMatch[] => {
    const matches: StringMatch[] = []
    let start = -1
    let byteLength = 0
    let charLength = 0

    for (let i = 0; i < data.length - 1; i += 2) {
      const result = readUtf16CodeUnit(data, i, littleEndian)
      if (result.error) break

      const codeUnit = result.value!

      // Check for null terminator
      if (codeUnit === 0) {
        if (start !== -1 && charLength >= minLength) {
          try {
            const decoder = new TextDecoder(
              littleEndian ? "utf-16le" : "utf-16be",
              { fatal: true }
            )
            const text = decoder.decode(data.slice(start, start + byteLength))
            matches.push({
              offset: start,
              length: byteLength,
              encoding: littleEndian ? "utf16le" : "utf16be",
              text
            })
          } catch {
            // Skip invalid sequences
          }
        }
        start = -1
        byteLength = 0
        charLength = 0
        continue
      }

      // Handle surrogate pairs
      if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
        // High surrogate - need low surrogate
        if (i + 4 > data.length) {
          if (start !== -1 && charLength >= minLength) {
            try {
              const decoder = new TextDecoder(
                littleEndian ? "utf-16le" : "utf-16be",
                { fatal: true }
              )
              const text = decoder.decode(data.slice(start, start + byteLength))
              matches.push({
                offset: start,
                length: byteLength,
                encoding: littleEndian ? "utf16le" : "utf16be",
                text
              })
            } catch {
              // Skip invalid sequences
            }
          }
          start = -1
          byteLength = 0
          charLength = 0
          break
        }

        const lowResult = readUtf16CodeUnit(data, i + 2, littleEndian)
        if (lowResult.error) break

        const lowSurrogate = lowResult.value!
        if (lowSurrogate >= 0xdc00 && lowSurrogate <= 0xdfff) {
          // Valid surrogate pair
          if (start === -1) {
            start = i
            byteLength = 4
            charLength = 1
          } else {
            byteLength += 4
            charLength++
          }
          i += 2 // Skip the low surrogate in next iteration
          continue
        }
      }

      if (isPrintableUtf16(codeUnit)) {
        if (start === -1) {
          start = i
          byteLength = 2
          charLength = 1
        } else {
          byteLength += 2
          charLength++
        }
      } else {
        if (start !== -1 && charLength >= minLength) {
          try {
            const decoder = new TextDecoder(
              littleEndian ? "utf-16le" : "utf-16be",
              { fatal: true }
            )
            const text = decoder.decode(data.slice(start, start + byteLength))
            matches.push({
              offset: start,
              length: byteLength,
              encoding: littleEndian ? "utf16le" : "utf16be",
              text
            })
          } catch {
            // Skip invalid sequences
          }
        }
        start = -1
        byteLength = 0
        charLength = 0
      }
    }

    // Handle string at end of data
    if (start !== -1 && charLength >= minLength) {
      try {
        const decoder = new TextDecoder(
          littleEndian ? "utf-16le" : "utf-16be",
          { fatal: true }
        )
        const text = decoder.decode(data.slice(start, start + byteLength))
        matches.push({
          offset: start,
          length: byteLength,
          encoding: littleEndian ? "utf16le" : "utf16be",
          text
        })
      } catch {
        // Skip invalid sequences
      }
    }

    return matches
  }

  /**
   * Extract UTF-32 strings from binary data
   */
  const extractUtf32Strings = (
    data: Uint8Array,
    minLength: number,
    littleEndian: boolean
  ): StringMatch[] => {
    const matches: StringMatch[] = []
    let start = -1
    let byteLength = 0
    let charLength = 0

    for (let i = 0; i < data.length - 3; i += 4) {
      // Read 32-bit value
      const b0 = data[i]
      const b1 = data[i + 1]
      const b2 = data[i + 2]
      const b3 = data[i + 3]

      const codePoint = littleEndian
        ? b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)
        : (b0 << 24) | (b1 << 16) | (b2 << 8) | b3

      // Check for null terminator
      if (codePoint === 0) {
        if (start !== -1 && charLength >= minLength) {
          try {
            const bytes = data.slice(start, start + byteLength)
            const text = String.fromCodePoint(
              ...Array.from({ length: byteLength / 4 }, (_, j) => {
                const offset = start + j * 4
                const b0 = bytes[offset]
                const b1 = bytes[offset + 1]
                const b2 = bytes[offset + 2]
                const b3 = bytes[offset + 3]
                return littleEndian
                  ? b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)
                  : (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
              })
            )
            matches.push({
              offset: start,
              length: byteLength,
              encoding: littleEndian ? "utf32le" : "utf32be",
              text
            })
          } catch {
            // Skip invalid sequences
          }
        }
        start = -1
        byteLength = 0
        charLength = 0
        continue
      }

      // Check if code point is valid and printable
      if (
        codePoint >= 32 &&
        codePoint <= 0x10ffff &&
        (codePoint < 0xd800 || codePoint > 0xdfff) &&
        codePoint !== 0xfffe &&
        codePoint !== 0xffff
      ) {
        if (start === -1) {
          start = i
          byteLength = 4
          charLength = 1
        } else {
          byteLength += 4
          charLength++
        }
      } else {
        if (start !== -1 && charLength >= minLength) {
          try {
            const bytes = data.slice(start, start + byteLength)
            const text = String.fromCodePoint(
              ...Array.from({ length: byteLength / 4 }, (_, j) => {
                const offset = start + j * 4
                const b0 = bytes[offset]
                const b1 = bytes[offset + 1]
                const b2 = bytes[offset + 2]
                const b3 = bytes[offset + 3]
                return littleEndian
                  ? b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)
                  : (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
              })
            )
            matches.push({
              offset: start,
              length: byteLength,
              encoding: littleEndian ? "utf32le" : "utf32be",
              text
            })
          } catch {
            // Skip invalid sequences
          }
        }
        start = -1
        byteLength = 0
        charLength = 0
      }
    }

    // Handle string at end of data
    if (start !== -1 && charLength >= minLength) {
      try {
        const bytes = data.slice(start, start + byteLength)
        const text = String.fromCodePoint(
          ...Array.from({ length: byteLength / 4 }, (_, j) => {
            const offset = start + j * 4
            const b0 = bytes[offset]
            const b1 = bytes[offset + 1]
            const b2 = bytes[offset + 2]
            const b3 = bytes[offset + 3]
            return littleEndian
              ? b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)
              : (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
          })
        )
        matches.push({
          offset: start,
          length: byteLength,
          encoding: littleEndian ? "utf32le" : "utf32be",
          text
        })
      } catch {
        // Skip invalid sequences
      }
    }

    return matches
  }

  /**
   * Extract strings from binary data based on encoding
   */
  const extractStrings = (
    data: Uint8Array,
    minLength: number,
    encoding: StringEncoding
  ): StringMatch[] => {
    switch (encoding) {
      case "ascii":
        return extractAsciiStrings(data, minLength)
      case "utf8":
        return extractUtf8Strings(data, minLength)
      case "utf16le":
        return extractUtf16Strings(data, minLength, true)
      case "utf16be":
        return extractUtf16Strings(data, minLength, false)
      case "utf32le":
        return extractUtf32Strings(data, minLength, true)
      case "utf32be":
        return extractUtf32Strings(data, minLength, false)
      default:
        return extractAsciiStrings(data, minLength)
    }
  }

  // Main extraction logic
  const fileSize = hexedFile.size
  const startOffset = api.context?.startOffset ?? 0
  const endOffset = api.context?.endOffset ?? fileSize
  const searchRange = endOffset - startOffset
  const minLength = api.context?.minLength ?? 4
  const encoding = api.context?.encoding ?? "ascii"
  const overlapSize = getOverlapSize(encoding)

  // Accumulate matches as we process chunks
  const allMatches: StringMatch[] = []

  // Overlap buffer from previous chunk
  let overlapBuffer = new Uint8Array(0)

  // Read and process the file in chunks
  let bytesRead = 0
  while (bytesRead < searchRange) {
    api.throwIfAborted()

    const chunkStart = startOffset + bytesRead
    const chunkEnd = Math.min(
      chunkStart + STREAM_CHUNK_SIZE,
      startOffset + searchRange
    )

    // Ensure range is loaded and read chunk
    await hexedFile.ensureRange({ start: chunkStart, end: chunkEnd })
    const chunk = hexedFile.readBytes(chunkStart, chunkEnd - chunkStart)

    if (chunk) {
      // Combine overlap buffer with current chunk
      const combinedLength = overlapBuffer.length + chunk.length
      const combinedData = new Uint8Array(combinedLength)
      combinedData.set(overlapBuffer, 0)
      combinedData.set(chunk, overlapBuffer.length)

      // Extract strings from combined data
      const chunkMatches = extractStrings(combinedData, minLength, encoding)

      // Adjust offsets and filter out matches in overlap region
      for (const match of chunkMatches) {
        // Filter out matches that are entirely within the overlap region
        if (match.offset < overlapBuffer.length) {
          // Check if match extends beyond overlap region
          const matchEnd = match.offset + match.length
          if (matchEnd <= overlapBuffer.length) {
            // Match is entirely in overlap, skip (already processed in previous chunk)
            continue
          }
          // Match spans overlap boundary - it starts in overlap but extends into current chunk
          // The match was already reported in the previous chunk, so skip it
          continue
        } else {
          // Match is entirely in current chunk (or starts at overlap boundary)
          // Adjust offset: subtract overlap length to get position relative to chunk start,
          // then add absolute chunk start position
          const adjustedOffset =
            chunkStart + (match.offset - overlapBuffer.length)
          allMatches.push({
            ...match,
            offset: adjustedOffset
          })
        }
      }

      // Save last few bytes as overlap for next chunk
      // Take last overlapSize bytes from combined buffer (or all if combined is smaller)
      const overlapLength = Math.min(overlapSize, combinedData.length)
      if (overlapLength > 0) {
        overlapBuffer = combinedData.slice(combinedData.length - overlapLength)
      } else {
        overlapBuffer = new Uint8Array(0)
      }
    }

    const chunkSize = chunkEnd - chunkStart
    bytesRead += chunkSize

    // Emit progress
    api.emitProgress({ processed: bytesRead, size: searchRange })

    // Yield to event loop to keep UI responsive
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return allMatches
}

export const Strings: HexedPluginComponent<"sidebar"> = ({ file, state }) => {
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
    if (!file?.worker || !file) {
      return
    }

    setIsSearching(true)
    setSearchProgress(0)
    setExtractedStrings([])

    try {
      const matches = await file.worker.$evaluate(file, extractStringsImpl, {
        context: { minLength, encoding },
        onProgress: (progress) => {
          const percentage = Math.round(
            (progress.processed / progress.size) * 100
          )
          setSearchProgress(percentage)
        }
      })
      setExtractedStrings(matches)
    } catch (error) {
      console.error("Failed to extract strings:", error)
      setExtractedStrings([])
    } finally {
      setIsSearching(false)
      setSearchProgress(0)
    }
  }, [file, minLength, encoding])

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
                  <SelectItem
                    key={length}
                    value={length.toString()}
                  >
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
            disabled={isSearching || !file?.worker || !file}
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
            <Progress
              value={searchProgress}
              className="h-2"
            />
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
