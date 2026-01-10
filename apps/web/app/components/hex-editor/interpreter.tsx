import { useMemo, useRef, useEffect } from "react";
import type { FunctionComponent, RefObject } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@hexed/ui";
import { formatAddress } from "@hexed/binary-utils/formatter";
import {
  X,
  MousePointerClick,
  Maximize2,
  Minimize2,
  ArrowLeftRight,
} from "lucide-react";
import {
  formatNumber,
  readUint8,
  readInt8,
  readUint16,
  readInt16,
  readUint24,
  readInt24,
  readUint32,
  readInt32,
  readUint64,
  readInt64,
  readFloat16,
  readFloat32,
  readFloat64,
  readLEB128,
  readSLEB128,
  readRational,
  readSRational,
  readMSDOSDateTime,
  readOLEDateTime,
  readUnixDateTime,
  readMacHFSDateTime,
  readMacHFSPlusDateTime,
  readUTF8Char,
  readUTF16Char,
  readBinary,
} from "@hexed/binary-utils/interpreter";
import { usePIP } from "~/hooks/use-pip";
import { useSidebarPosition } from "~/hooks/use-sidebar-position";
import type { InterpreterProps } from "./types";

interface InterpretedValue {
  type: string;
  unsigned?: string;
  signed?: string;
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} UTC`;
}

export const Interpreter: FunctionComponent<InterpreterProps> = ({
  data,
  selectedOffset,
  endianness = "le",
  numberFormat = "dec",
  onClose,
  onScrollToOffset,
  onPIPStateChange,
}) => {
  const interpretedData = useMemo<InterpretedValue[]>(() => {
    if (
      selectedOffset === null ||
      selectedOffset < 0 ||
      selectedOffset >= data.length
    ) {
      return [];
    }

    const results: InterpretedValue[] = [];

    // 8-bit Integer
    const uint8Result = readUint8(data, selectedOffset);
    const int8Result = readInt8(data, selectedOffset);
    results.push({
      type: "8-bit Integer",
      unsigned: uint8Result.error
        ? undefined
        : formatNumber(uint8Result.value!, numberFormat),
      signed: int8Result.error
        ? undefined
        : formatNumber(int8Result.value!, numberFormat),
    });

    // 16-bit Integer
    const uint16Result = readUint16(data, selectedOffset, endianness);
    const int16Result = readInt16(data, selectedOffset, endianness);
    results.push({
      type: "16-bit Integer",
      unsigned: uint16Result.error
        ? undefined
        : formatNumber(uint16Result.value!, numberFormat),
      signed: int16Result.error
        ? undefined
        : formatNumber(int16Result.value!, numberFormat),
    });

    // 24-bit Integer
    const uint24Result = readUint24(data, selectedOffset, endianness);
    const int24Result = readInt24(data, selectedOffset, endianness);
    results.push({
      type: "24-bit Integer",
      unsigned: uint24Result.error
        ? undefined
        : formatNumber(uint24Result.value!, numberFormat),
      signed: int24Result.error
        ? undefined
        : formatNumber(int24Result.value!, numberFormat),
    });

    // 32-bit Integer
    const uint32Result = readUint32(data, selectedOffset, endianness);
    const int32Result = readInt32(data, selectedOffset, endianness);
    results.push({
      type: "32-bit Integer",
      unsigned: uint32Result.error
        ? undefined
        : formatNumber(uint32Result.value!, numberFormat),
      signed: int32Result.error
        ? undefined
        : formatNumber(int32Result.value!, numberFormat),
    });

    // 64-bit Integer
    const uint64Result = readUint64(data, selectedOffset, endianness);
    const int64Result = readInt64(data, selectedOffset, endianness);
    results.push({
      type: "64-bit Integer (+)",
      unsigned: uint64Result.error
        ? undefined
        : formatNumber(Number(uint64Result.value!), numberFormat),
    });
    results.push({
      type: "64-bit Integer (±)",
      signed: int64Result.error
        ? undefined
        : formatNumber(Number(int64Result.value!), numberFormat),
    });

    // 16-bit Float
    const float16Result = readFloat16(data, selectedOffset, endianness);
    results.push({
      type: "16-bit Float. P.",
      unsigned: float16Result.error
        ? undefined
        : float16Result.value!.toString(),
    });

    // 32-bit Float
    const float32Result = readFloat32(data, selectedOffset, endianness);
    results.push({
      type: "32-bit Float. P.",
      unsigned: float32Result.error
        ? undefined
        : float32Result.value!.toString(),
    });

    // 64-bit Float
    const float64Result = readFloat64(data, selectedOffset, endianness);
    results.push({
      type: "64-bit Float. P.",
      unsigned: float64Result.error
        ? undefined
        : float64Result.value!.toString(),
    });

    // LEB128
    const leb128Result = readLEB128(data, selectedOffset);
    results.push({
      type: "LEB128 (+)",
      unsigned: leb128Result.error
        ? undefined
        : formatNumber(Number(leb128Result.value!), numberFormat),
    });
    const sleb128Result = readSLEB128(data, selectedOffset);
    results.push({
      type: "LEB128 (±)",
      signed: sleb128Result.error
        ? undefined
        : formatNumber(Number(sleb128Result.value!), numberFormat),
    });

    // Rational
    const rationalResult = readRational(data, selectedOffset, endianness);
    results.push({
      type: "Rational (+)",
      unsigned: rationalResult.error ? undefined : rationalResult.value!,
    });
    const srationalResult = readSRational(data, selectedOffset, endianness);
    results.push({
      type: "SRational (±)",
      signed: srationalResult.error ? undefined : srationalResult.value!,
    });

    // MS-DOS DateTime
    const msdosResult = readMSDOSDateTime(data, selectedOffset, endianness);
    results.push({
      type: "MS-DOS DateTime",
      unsigned: msdosResult.error ? undefined : formatDate(msdosResult.value!),
    });

    // OLE 2.0 DateTime
    const oleResult = readOLEDateTime(data, selectedOffset, endianness);
    results.push({
      type: "OLE 2.0 DateTime",
      unsigned: oleResult.error ? undefined : formatDate(oleResult.value!),
    });

    // UNIX 32-bit DateTime
    const unixResult = readUnixDateTime(data, selectedOffset, endianness);
    results.push({
      type: "UNIX 32-bit DateTime",
      unsigned: unixResult.error ? undefined : formatDate(unixResult.value!),
    });

    // Macintosh HFS DateTime
    const macHFSResult = readMacHFSDateTime(data, selectedOffset, endianness);
    results.push({
      type: "Macintosh HFS DateTime",
      unsigned: macHFSResult.error
        ? undefined
        : formatDate(macHFSResult.value!),
    });

    // Macintosh HFS+ DateTime
    const macHFSPlusResult = readMacHFSPlusDateTime(
      data,
      selectedOffset,
      endianness
    );
    results.push({
      type: "Macintosh HFS+ DateTime",
      unsigned: macHFSPlusResult.error
        ? undefined
        : formatDate(macHFSPlusResult.value!),
    });

    // UTF-8 Character
    const utf8Result = readUTF8Char(data, selectedOffset);
    results.push({
      type: "UTF-8 Character",
      unsigned: utf8Result.error ? undefined : utf8Result.value!,
    });

    // UTF-16 Character
    const utf16Result = readUTF16Char(data, selectedOffset, endianness);
    results.push({
      type: "UTF-16 Character",
      unsigned: utf16Result.error ? undefined : utf16Result.value!,
    });

    // Binary
    const binaryResult = readBinary(data, selectedOffset);
    results.push({
      type: "Binary",
      unsigned: binaryResult.error ? undefined : binaryResult.value!,
    });

    return results;
  }, [data, selectedOffset, endianness, numberFormat]);

  const interpreterRef = useRef<HTMLDivElement>(null);
  const { isPIPActive, stylesLoaded, togglePIP, isSupported } = usePIP(
    interpreterRef as RefObject<HTMLElement>
  );
  const { toggleSidebarPosition } = useSidebarPosition();

  // Notify parent component when PIP state changes
  useEffect(() => {
    onPIPStateChange?.(isPIPActive);
  }, [isPIPActive, onPIPStateChange]);

  const hexAddress =
    selectedOffset !== null ? formatAddress(selectedOffset) : "";
  const byteOffset =
    selectedOffset !== null ? selectedOffset.toLocaleString() : "";

  return (
    <div
      ref={interpreterRef}
      className="h-full"
      style={{
        visibility: isPIPActive && !stylesLoaded ? "hidden" : "visible",
      }}
    >
      <Card className="h-full flex flex-col p-0 rounded-none border-none bg-sidebar overflow-hidden gap-0">
        <CardHeader className="py-3! px-4 border-b shrink-0 gap-0 bg-secondary">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <CardTitle className="text-sm font-medium shrink-0 flex-1">
                Interpreter
              </CardTitle>
              {selectedOffset !== null && (
                <div className="flex items-center justify-center grow gap-2 text-xs text-muted-foreground min-w-0">
                  {onScrollToOffset && !isPIPActive ? (
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
                    aria-label="Close interpreter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
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
  );
};
