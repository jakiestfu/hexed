import { useMemo } from "react"
import type { FunctionComponent } from "react"
import { ArrowLeftRight, MousePointerClick, X } from "lucide-react"

import { formatAddress } from "@hexed/file/formatter"
import { formatNumber } from "@hexed/file/interpreter"
import type { Endianness, NumberFormat } from "@hexed/file/interpreter"
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

import type { HexedFile } from "@hexed/file"
import { useHexedSettingsContext } from "../../providers/hexed-settings-provider"
import type { InterpreterProps } from "../../types"

interface InterpretedValue {
  type: string
  unsigned?: string
  signed?: string
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} UTC`
}

type ReadFn = (file: HexedFile, offset: number, endianness?: Endianness) => { value: number | bigint | string | Date; error: string | null } | { value: null; error: string }
type FormatFn = (v: number | bigint | string | Date, nf?: NumberFormat) => string

const fmtNum = (v: number | bigint | string | Date, nf: NumberFormat = "dec") => formatNumber(v as number, nf)
const fmtBigInt = (v: number | bigint | string | Date, nf: NumberFormat = "dec") => formatNumber(Number(v), nf)
const fmtFloat = (v: number | bigint | string | Date) => (v as number).toString()
const fmtStr = (v: number | bigint | string | Date) => v as string
const fmtDate = (v: number | bigint | string | Date) => formatDate(v as Date)

const INTERPRETER_READS: Array<{
  type: string
  unsigned?: ReadFn
  signed?: ReadFn
  format: FormatFn
  endian?: boolean
}> = [
    { type: "8-bit Integer", unsigned: (f, o) => f.readUint8(o), signed: (f, o) => f.readInt8(o), format: fmtNum, endian: false },
    { type: "16-bit Integer", unsigned: (f, o, e) => f.readUint16(o, e!), signed: (f, o, e) => f.readInt16(o, e!), format: fmtNum, endian: true },
    { type: "24-bit Integer", unsigned: (f, o, e) => f.readUint24(o, e!), signed: (f, o, e) => f.readInt24(o, e!), format: fmtNum, endian: true },
    { type: "32-bit Integer", unsigned: (f, o, e) => f.readUint32(o, e!), signed: (f, o, e) => f.readInt32(o, e!), format: fmtNum, endian: true },
    { type: "64-bit Integer (+)", unsigned: (f, o, e) => f.readUint64(o, e!), format: fmtBigInt, endian: true },
    { type: "64-bit Integer (±)", signed: (f, o, e) => f.readInt64(o, e!), format: fmtBigInt, endian: true },
    { type: "16-bit Float. P.", unsigned: (f, o, e) => f.readFloat16(o, e!), format: fmtFloat, endian: true },
    { type: "32-bit Float. P.", unsigned: (f, o, e) => f.readFloat32(o, e!), format: fmtFloat, endian: true },
    { type: "64-bit Float. P.", unsigned: (f, o, e) => f.readFloat64(o, e!), format: fmtFloat, endian: true },
    { type: "LEB128 (+)", unsigned: (f, o) => f.readLEB128(o), format: fmtBigInt, endian: false },
    { type: "LEB128 (±)", signed: (f, o) => f.readSLEB128(o), format: fmtBigInt, endian: false },
    { type: "Rational (+)", unsigned: (f, o, e) => f.readRational(o, e!), format: fmtStr, endian: true },
    { type: "SRational (±)", signed: (f, o, e) => f.readSRational(o, e!), format: fmtStr, endian: true },
    { type: "MS-DOS DateTime", unsigned: (f, o, e) => f.readMSDOSDateTime(o, e!), format: fmtDate, endian: true },
    { type: "OLE 2.0 DateTime", unsigned: (f, o, e) => f.readOLEDateTime(o, e!), format: fmtDate, endian: true },
    { type: "UNIX 32-bit DateTime", unsigned: (f, o, e) => f.readUnixDateTime(o, e!), format: fmtDate, endian: true },
    { type: "Macintosh HFS DateTime", unsigned: (f, o, e) => f.readMacHFSDateTime(o, e!), format: fmtDate, endian: true },
    { type: "Macintosh HFS+ DateTime", unsigned: (f, o, e) => f.readMacHFSPlusDateTime(o, e!), format: fmtDate, endian: true },
    { type: "UTF-8 Character", unsigned: (f, o) => f.readUTF8Char(o), format: fmtStr, endian: false },
    { type: "UTF-16 Character", unsigned: (f, o, e) => f.readUTF16Char(o, e!), format: fmtStr, endian: true },
    { type: "Binary", unsigned: (f, o) => f.readBinary(o), format: fmtStr, endian: false }
  ]

function buildInterpreterList(file: HexedFile, offset: number, endianness: Endianness, numberFormat: NumberFormat): InterpretedValue[] {
  return INTERPRETER_READS.map(entry => {
    const result: InterpretedValue = { type: entry.type }
    const read = (fn?: ReadFn) => fn ? (entry.endian ? fn(file, offset, endianness) : fn(file, offset)) : null
    const format = (v: number | bigint | string | Date) => entry.format(v, numberFormat)

    const u = read(entry.unsigned)
    if (u && !u.error && u.value !== null) result.unsigned = format(u.value)

    const s = read(entry.signed)
    if (s && !s.error && s.value !== null) result.signed = format(s.value)

    return result
  })
}

export const Interpreter: FunctionComponent<InterpreterProps> = ({
  file,
  settings: _settings,
  state,
  onClose
}) => {
  // Extract values from props
  const selectedOffset = state.selectedOffset
  const endianness = state.endianness as Endianness
  const numberFormat = state.numberFormat as NumberFormat
  const onScrollToOffset = state.handleScrollToOffset

  const interpretedData = useMemo<InterpretedValue[]>(() => {
    if (
      !file ||
      selectedOffset === null ||
      selectedOffset < 0 ||
      selectedOffset >= file.size
    ) {
      return []
    }

    return buildInterpreterList(file, selectedOffset, endianness, numberFormat)
  }, [file, selectedOffset, endianness, numberFormat])

  const { toggleSidebarPosition } = useHexedSettingsContext()

  const hexAddress =
    selectedOffset !== null ? formatAddress(selectedOffset) : ""
  const byteOffset =
    selectedOffset !== null ? selectedOffset.toLocaleString() : ""

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col p-0 rounded-none border-none bg-sidebar overflow-hidden gap-0">
        <CardHeader className="py-3! px-4 border-b shrink-0 gap-0 bg-secondary">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <CardTitle className="text-sm font-medium shrink-0 flex-1">
                Interpreter
              </CardTitle>
              {selectedOffset !== null && (
                <div className="flex items-center justify-center grow gap-2 text-xs text-muted-foreground min-w-0">
                  {onScrollToOffset ? (
                    <button
                      onClick={() => onScrollToOffset(selectedOffset)}
                      className="font-mono hover:text-foreground hover:underline transition-colors cursor-pointer"
                      aria-label={`Scroll to offset ${hexAddress}`}
                    >
                      {hexAddress}
                    </button>
                  ) : (
                    <span className="font-mono">{hexAddress}</span>
                  )}
                  <span className="text-muted-foreground/70">•</span>
                  <span>Offset {byteOffset}</span>
                  <span className="text-muted-foreground/70">•</span>
                  <span className="font-mono">
                    {endianness === "le" ? "LE" : "BE"}
                  </span>
                </div>
              )}
            </div>
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
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-7 w-7 p-0"
                  aria-label="Close interpreter"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          {selectedOffset === null ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MousePointerClick className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No selection</EmptyTitle>
                <EmptyDescription>
                  Select bytes in the hex editor to view interpreted values
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead>Unsigned (+)</TableHead>
                  <TableHead>Signed (±)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interpretedData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-xs">
                      {row.type}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.unsigned !== undefined ? (
                        row.unsigned
                      ) : (
                        <span className="text-muted-foreground">
                          {row.type.includes("DateTime")
                            ? "Invalid date"
                            : row.type.includes("Character")
                              ? "Null"
                              : "Invalid number"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.signed !== undefined ? (
                        row.signed
                      ) : (
                        <span className="text-muted-foreground">
                          {row.type.includes("DateTime")
                            ? "Invalid date"
                            : row.type.includes("Character")
                              ? "Null"
                              : "Invalid number"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
