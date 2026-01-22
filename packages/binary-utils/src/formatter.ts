/**
 * Formatting utilities for hex and ASCII display
 */

/**
 * Convert a byte to a 2-character hex string
 */
export function byteToHex(byte: number | null | undefined) {
  return byte?.toString(16).padStart(2, "0").toUpperCase() ?? ""
}

/**
 * Convert a byte to ASCII character (or '.' for non-printable)
 */
export function byteToAscii(byte: number): string {
  // Printable ASCII range: 32-126
  if (byte >= 32 && byte <= 126) {
    return String.fromCharCode(byte)
  }
  return "."
}

/**
 * Format an offset/address as hex
 */
export function formatAddress(offset: number, width: number = 8): string {
  return "0x" + offset.toString(16).padStart(width, "0").toUpperCase()
}

/**
 * Convert Uint8Array to hex string representation
 */
export function toHexString(data: Uint8Array, separator: string = " "): string {
  return Array.from(data)
    .map((byte) => byteToHex(byte))
    .join(separator)
}

/**
 * Convert Uint8Array to ASCII string representation
 */
export function toAsciiString(data: Uint8Array): string {
  return Array.from(data)
    .map((byte) => byteToAscii(byte))
    .join("")
}

/**
 * Format a number as hexadecimal with proper sign handling
 * @param value - The number to format
 * @returns Formatted hex string like "0x1A" or "-0x1A"
 */
export function formatHex(value: number): string {
  return (
    (value < 0 ? "-" : "") + "0x" + Math.abs(value).toString(16).toUpperCase()
  )
}

/**
 * Format a byte array as a preview string
 * @param bytes - The byte array to format
 * @param maxLength - Maximum number of bytes to show (default: 8)
 * @returns Formatted preview string like "[1, 2, 3, ...]" or "[1, 2, 3]"
 */
export function formatBytesPreview(
  bytes: Uint8Array,
  maxLength: number = 8
): string {
  const preview = Array.from(bytes.slice(0, maxLength))
  const suffix = bytes.length > maxLength ? ", ..." : ""
  return `[${preview.join(", ")}${suffix}]`
}

/**
 * Format a row of bytes for display
 */
export interface FormattedRow {
  address: string
  hexBytes: string[]
  ascii: string
  startOffset: number
  endOffset: number
}

/**
 * Format binary data into rows for display
 * Only returns rows that contain actual data bytes (no empty rows/cells)
 * @param data - The data to format
 * @param bytesPerRow - Number of bytes per row (default: 16)
 * @param dataStartOffset - Optional offset where the data starts in the original file (for preserving offsets)
 */
export function formatDataIntoRows(
  data: Uint8Array,
  bytesPerRow: number = 16,
  dataStartOffset?: number
): FormattedRow[] {
  const rows: FormattedRow[] = []

  // If dataStartOffset is provided, we need to preserve file offsets
  if (dataStartOffset !== undefined && dataStartOffset > 0) {
    // Calculate which row the data starts in
    const startRow = Math.floor(dataStartOffset / bytesPerRow)
    const startRowOffset = startRow * bytesPerRow

    // Process data row by row, only creating rows that contain actual data
    let currentDataIndex = 0

    while (currentDataIndex < data.length) {
      const fileOffset = dataStartOffset + currentDataIndex
      const rowStartOffset = Math.floor(fileOffset / bytesPerRow) * bytesPerRow
      const offsetInRow = fileOffset - rowStartOffset

      const hexBytes: string[] = []
      const asciiChars: string[] = []

      // Fill cells in this row starting from where data begins
      for (
        let cellIndex = offsetInRow;
        cellIndex < bytesPerRow && currentDataIndex < data.length;
        cellIndex++
      ) {
        const byte = data[currentDataIndex]
        hexBytes.push(byteToHex(byte))
        asciiChars.push(byteToAscii(byte))
        currentDataIndex++
      }

      const rowEndOffset = rowStartOffset + hexBytes.length - 1

      rows.push({
        address: formatAddress(rowStartOffset),
        hexBytes,
        ascii: asciiChars.join(""),
        startOffset: rowStartOffset,
        endOffset: rowEndOffset
      })
    }

    return rows
  }

  // Normal case: no offset preservation, format data starting from 0
  for (let i = 0; i < data.length; i += bytesPerRow) {
    const chunk = data.slice(i, Math.min(i + bytesPerRow, data.length))
    const hexBytes = Array.from(chunk).map((byte) => byteToHex(byte))
    const ascii = toAsciiString(chunk)

    rows.push({
      address: formatAddress(i),
      hexBytes,
      ascii,
      startOffset: i,
      endOffset: i + chunk.length - 1
    })
  }

  return rows
}

/**
 * Format bytes to appropriate unit (B, KB, MB, GB)
 * @param bytes - The number of bytes
 * @returns Formatted string like "512 bytes", "45 KB", "1.2 MB", or "2.5 GB"
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes.toLocaleString()} bytes`
  }

  const KB = 1024
  const MB = KB * 1024
  const GB = MB * 1024

  if (bytes < MB) {
    const kb = bytes / KB
    const formattedKb = kb % 1 === 0 ? kb.toFixed(0) : kb.toFixed(1)
    return `${formattedKb} KB`
  }

  if (bytes < GB) {
    const mb = bytes / MB
    const formattedMb = mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)
    return `${formattedMb} MB`
  }

  const gb = bytes / GB
  const formattedGb = gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)
  return `${formattedGb} GB`
}

/**
 * Format file size with bytes and most relevant unit
 * @param bytes - The number of bytes
 * @returns Formatted string like "512 bytes" or "1,024 bytes • 1 KB"
 */
export function formatFileSize(
  bytes: number,
  hideBytes: boolean = false
): string {
  const formattedBytes = bytes.toLocaleString()

  if (bytes < 1024) {
    return `${formattedBytes} bytes`
  }

  const KB = 1024
  const MB = KB * 1024
  const GB = MB * 1024
  const TB = GB * 1024

  if (bytes < MB) {
    const kb = bytes / KB
    const formattedKb = kb % 1 === 0 ? kb.toFixed(0) : kb.toFixed(1)
    return hideBytes
      ? `${formattedKb} KB`
      : `${formattedBytes} bytes (${formattedKb} KB)`
  }

  if (bytes < GB) {
    const mb = bytes / MB
    const formattedMb = mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)
    return hideBytes
      ? `${formattedMb} MB`
      : `${formattedBytes} bytes (${formattedMb} MB)`
  }

  if (bytes < TB) {
    const gb = bytes / GB
    const formattedGb = gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)
    return hideBytes
      ? `${formattedGb} GB`
      : `${formattedBytes} bytes (${formattedGb} GB)`
  }

  const tb = bytes / TB
  const formattedTb = tb % 1 === 0 ? tb.toFixed(0) : tb.toFixed(1)
  return hideBytes
    ? `${formattedTb} TB`
    : `${formattedBytes} bytes (${formattedTb} TB)`
}
