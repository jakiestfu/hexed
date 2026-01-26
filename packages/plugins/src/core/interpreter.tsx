import { useMemo } from "react"
import { Binary, MousePointerClick } from "lucide-react"

import { formatNumber } from "@hexed/file/interpreter"
import type { Endianness, NumberFormat } from "@hexed/file/interpreter"
import {
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
  TableRow
} from "@hexed/ui"

import { formatAddress, type HexedFile } from "@hexed/file"
import { HexedPluginComponent } from "../types"
import { createHexedEditorPlugin } from "../index"

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

export const Interpreter: HexedPluginComponent = ({ file, state }) => {
  // Extract values from props
  const selectedOffset = state.selectedOffset
  const endianness = state.endianness as Endianness
  const numberFormat = state.numberFormat as NumberFormat
  // const onScrollToOffset = state.handleScrollToOffset

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

  // const { toggleSidebarPosition } = useHexedSettingsContext()

  const hexAddress =
    selectedOffset !== null ? formatAddress(selectedOffset) : ""
  const byteOffset =
    selectedOffset !== null ? selectedOffset.toLocaleString() : ""

  return (
    <>
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
        <div>
          {selectedOffset !== null && (
            <div className="flex items-center p-4 text-xs gap-4 border-b">
              <button
                onClick={() => state.handleScrollToOffset(selectedOffset)}
                className="font-mono hover:text-foreground hover:underline transition-colors cursor-pointer"
                aria-label={`Scroll to offset ${hexAddress}`}
              >
                {hexAddress}
              </button>
              <span className="text-muted-foreground/70">•</span>
              <span>Offset {byteOffset}</span>
              <span className="text-muted-foreground/70">•</span>
              <span className="font-mono">
                {endianness === "le" ? "LE" : "BE"}
              </span>
            </div>
          )}
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
        </div>
      )}
    </>
  )
}

export const interpreterPlugin = createHexedEditorPlugin({
  type: "sidebar",
  id: "interpreter",
  title: "Interpreter",
  icon: Binary,
  component: Interpreter
})
