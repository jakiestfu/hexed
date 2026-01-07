/**
 * Formatting utilities for hex and ASCII display
 */

/**
 * Convert a byte to a 2-character hex string
 */
export function byteToHex(byte: number): string {
  return byte.toString(16).padStart(2, '0').toUpperCase();
}

/**
 * Convert a byte to ASCII character (or '.' for non-printable)
 */
export function byteToAscii(byte: number): string {
  // Printable ASCII range: 32-126
  if (byte >= 32 && byte <= 126) {
    return String.fromCharCode(byte);
  }
  return '.';
}

/**
 * Format an offset/address as hex
 */
export function formatAddress(offset: number, width: number = 8): string {
  return '0x' + offset.toString(16).padStart(width, '0').toUpperCase();
}

/**
 * Convert Uint8Array to hex string representation
 */
export function toHexString(data: Uint8Array, separator: string = ' '): string {
  return Array.from(data)
    .map(byte => byteToHex(byte))
    .join(separator);
}

/**
 * Convert Uint8Array to ASCII string representation
 */
export function toAsciiString(data: Uint8Array): string {
  return Array.from(data)
    .map(byte => byteToAscii(byte))
    .join('');
}

/**
 * Format a row of bytes for display
 */
export interface FormattedRow {
  address: string;
  hexBytes: string[];
  ascii: string;
  startOffset: number;
  endOffset: number;
}

/**
 * Format binary data into rows for display
 */
export function formatDataIntoRows(
  data: Uint8Array,
  bytesPerRow: number = 16
): FormattedRow[] {
  const rows: FormattedRow[] = [];
  
  for (let i = 0; i < data.length; i += bytesPerRow) {
    const chunk = data.slice(i, Math.min(i + bytesPerRow, data.length));
    const hexBytes = Array.from(chunk).map(byte => byteToHex(byte));
    const ascii = toAsciiString(chunk);
    
    rows.push({
      address: formatAddress(i),
      hexBytes,
      ascii,
      startOffset: i,
      endOffset: i + chunk.length - 1
    });
  }
  
  return rows;
}

