/**
 * Data interpretation utilities for reading various data types from binary data
 */

export type Endianness = "le" | "be";
export type NumberFormat = "dec" | "hex";

/**
 * Format a number as decimal or hexadecimal
 */
export function formatNumber(
  value: number,
  format: NumberFormat = "dec"
): string {
  if (format === "hex") {
    return `0x${value.toString(16).toUpperCase()}`;
  }
  return value.toString();
}

/**
 * Read bytes
 */
function readBytes(
  data: Uint8Array,
  offset: number,
  length: number
): Uint8Array | null {
  if (offset < 0 || offset + length > data.length) {
    return null;
  }
  return data.slice(offset, offset + length);
}

/**
 * Read unsigned 8-bit integer
 */
export function readUint8(
  data: Uint8Array,
  offset: number
): { value: number; error: null } | { value: null; error: string } {
  if (offset < 0 || offset >= data.length) {
    return { value: null, error: "Invalid offset" };
  }
  return { value: data[offset], error: null };
}

/**
 * Read signed 8-bit integer
 */
export function readInt8(
  data: Uint8Array,
  offset: number
): { value: number; error: null } | { value: null; error: string } {
  const result = readUint8(data, offset);
  if (result.error) return result;
  const unsigned = result.value!;
  const signed = unsigned > 127 ? unsigned - 256 : unsigned;
  return { value: signed, error: null };
}

/**
 * Read unsigned 16-bit integer
 */
export function readUint16(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: number; error: null } | { value: null; error: string } {
  const bytes = readBytes(data, offset, 2);
  if (!bytes) {
    return { value: null, error: "Insufficient bytes" };
  }
  const value = endianness === "le"
    ? bytes[0] | (bytes[1] << 8)
    : (bytes[0] << 8) | bytes[1];
  return { value, error: null };
}

/**
 * Read signed 16-bit integer
 */
export function readInt16(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: number; error: null } | { value: null; error: string } {
  const result = readUint16(data, offset, endianness);
  if (result.error) return result;
  const unsigned = result.value!;
  const signed = unsigned > 32767 ? unsigned - 65536 : unsigned;
  return { value: signed, error: null };
}

/**
 * Read unsigned 24-bit integer
 */
export function readUint24(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: number; error: null } | { value: null; error: string } {
  const bytes = readBytes(data, offset, 3);
  if (!bytes) {
    return { value: null, error: "Insufficient bytes" };
  }
  const value = endianness === "le"
    ? bytes[0] | (bytes[1] << 8) | (bytes[2] << 16)
    : (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
  return { value, error: null };
}

/**
 * Read signed 24-bit integer
 */
export function readInt24(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: number; error: null } | { value: null; error: string } {
  const result = readUint24(data, offset, endianness);
  if (result.error) return result;
  const unsigned = result.value!;
  const signed = unsigned > 8388607 ? unsigned - 16777216 : unsigned;
  return { value: signed, error: null };
}

/**
 * Read unsigned 32-bit integer
 */
export function readUint32(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: number; error: null } | { value: null; error: string } {
  const bytes = readBytes(data, offset, 4);
  if (!bytes) {
    return { value: null, error: "Insufficient bytes" };
  }
  const value = endianness === "le"
    ? bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)
    : (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  // JavaScript numbers are 64-bit floats, so we need to handle 32-bit overflow
  return { value: value >>> 0, error: null };
}

/**
 * Read signed 32-bit integer
 */
export function readInt32(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: number; error: null } | { value: null; error: string } {
  const result = readUint32(data, offset, endianness);
  if (result.error) return result;
  const unsigned = result.value!;
  const signed = unsigned > 2147483647 ? unsigned - 4294967296 : unsigned;
  return { value: signed, error: null };
}

/**
 * Read unsigned 64-bit integer (as BigInt)
 */
export function readUint64(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: bigint; error: null } | { value: null; error: string } {
  const bytes = readBytes(data, offset, 8);
  if (!bytes) {
    return { value: null, error: "Insufficient bytes" };
  }
  let value = BigInt(0);
  if (endianness === "le") {
    for (let i = 0; i < 8; i++) {
      value |= BigInt(bytes[i]) << BigInt(i * 8);
    }
  } else {
    for (let i = 0; i < 8; i++) {
      value |= BigInt(bytes[i]) << BigInt((7 - i) * 8);
    }
  }
  return { value, error: null };
}

/**
 * Read signed 64-bit integer (as BigInt)
 */
export function readInt64(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: bigint; error: null } | { value: null; error: string } {
  const result = readUint64(data, offset, endianness);
  if (result.error) return result;
  const unsigned = result.value!;
  const signed = unsigned > BigInt("9223372036854775807")
    ? unsigned - BigInt("18446744073709551616")
    : unsigned;
  return { value: signed, error: null };
}

/**
 * Read 16-bit floating point (half precision)
 */
export function readFloat16(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: number; error: null } | { value: null; error: string } {
  const result = readUint16(data, offset, endianness);
  if (result.error) return result;
  const bits = result.value!;
  
  // Extract components
  const sign = (bits >> 15) & 0x1;
  const exponent = (bits >> 10) & 0x1f;
  const mantissa = bits & 0x3ff;
  
  // Handle special cases
  if (exponent === 0) {
    if (mantissa === 0) {
      return { value: sign ? -0 : 0, error: null };
    }
    // Denormalized
    return { value: null, error: "Invalid number" };
  }
  if (exponent === 31) {
    if (mantissa === 0) {
      return { value: sign ? -Infinity : Infinity, error: null };
    }
    return { value: null, error: "Invalid number" };
  }
  
  // Normalized
  const exp = exponent - 15;
  const man = 1 + mantissa / 1024;
  const value = (sign ? -1 : 1) * man * Math.pow(2, exp);
  return { value, error: null };
}

/**
 * Read 32-bit floating point
 */
export function readFloat32(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: number; error: null } | { value: null; error: string } {
  const bytes = readBytes(data, offset, 4);
  if (!bytes) {
    return { value: null, error: "Insufficient bytes" };
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, 4);
  const value = view.getFloat32(0, endianness === "le");
  return { value, error: null };
}

/**
 * Read 64-bit floating point
 */
export function readFloat64(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: number; error: null } | { value: null; error: string } {
  const bytes = readBytes(data, offset, 8);
  if (!bytes) {
    return { value: null, error: "Insufficient bytes" };
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, 8);
  const value = view.getFloat64(0, endianness === "le");
  return { value, error: null };
}

/**
 * Read unsigned LEB128 (variable-length encoding)
 */
export function readLEB128(
  data: Uint8Array,
  offset: number
): { value: bigint; bytesRead: number; error: null } | { value: null; bytesRead: 0; error: string } {
  let value = BigInt(0);
  let shift = 0;
  let bytesRead = 0;
  
  for (let i = offset; i < data.length; i++) {
    const byte = data[i];
    bytesRead++;
    value |= BigInt(byte & 0x7f) << BigInt(shift);
    
    if ((byte & 0x80) === 0) {
      return { value, bytesRead, error: null };
    }
    
    shift += 7;
    if (shift >= 64) {
      return { value: null, bytesRead: 0, error: "Invalid number" };
    }
  }
  
  return { value: null, bytesRead: 0, error: "Insufficient bytes" };
}

/**
 * Read signed LEB128 (variable-length encoding)
 */
export function readSLEB128(
  data: Uint8Array,
  offset: number
): { value: bigint; bytesRead: number; error: null } | { value: null; bytesRead: 0; error: string } {
  let value = BigInt(0);
  let shift = 0;
  let bytesRead = 0;
  let byte: number;
  
  for (let i = offset; i < data.length; i++) {
    byte = data[i];
    bytesRead++;
    value |= BigInt(byte & 0x7f) << BigInt(shift);
    shift += 7;
    
    if ((byte & 0x80) === 0) {
      // Sign extend if the sign bit is set
      if (shift < 64 && (byte & 0x40) !== 0) {
        value |= BigInt(-1) << BigInt(shift);
      }
      return { value, bytesRead, error: null };
    }
    
    if (shift >= 64) {
      return { value: null, bytesRead: 0, error: "Invalid number" };
    }
  }
  
  return { value: null, bytesRead: 0, error: "Insufficient bytes" };
}

/**
 * Read unsigned rational number (numerator/denominator)
 */
export function readRational(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: string; error: null } | { value: null; error: string } {
  const numResult = readUint32(data, offset, endianness);
  const denResult = readUint32(data, offset + 4, endianness);
  
  if (numResult.error || denResult.error) {
    return { value: null, error: "Insufficient bytes" };
  }
  
  const num = numResult.value!;
  const den = denResult.value!;
  
  if (den === 0) {
    return { value: null, error: "Invalid number" };
  }
  
  return { value: `${num}/${den}`, error: null };
}

/**
 * Read signed rational number (numerator/denominator)
 */
export function readSRational(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: string; error: null } | { value: null; error: string } {
  const numResult = readInt32(data, offset, endianness);
  const denResult = readInt32(data, offset + 4, endianness);
  
  if (numResult.error || denResult.error) {
    return { value: null, error: "Insufficient bytes" };
  }
  
  const num = numResult.value!;
  const den = denResult.value!;
  
  if (den === 0) {
    return { value: null, error: "Invalid number" };
  }
  
  return { value: `${num}/${den}`, error: null };
}

/**
 * Read MS-DOS DateTime
 */
export function readMSDOSDateTime(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: Date; error: null } | { value: null; error: string } {
  const result = readUint32(data, offset, endianness);
  if (result.error) {
    return { value: null, error: "Insufficient bytes" };
  }
  
  const value = result.value!;
  const date = (value >> 16) & 0xffff;
  const time = value & 0xffff;
  
  const year = ((date >> 9) & 0x7f) + 1980;
  const month = (date >> 5) & 0x0f;
  const day = date & 0x1f;
  const hour = (time >> 11) & 0x1f;
  const minute = (time >> 5) & 0x3f;
  const second = (time & 0x1f) * 2;
  
  if (month === 0 || day === 0) {
    return { value: null, error: "Invalid date" };
  }
  
  try {
    const dateObj = new Date(year, month - 1, day, hour, minute, second);
    return { value: dateObj, error: null };
  } catch {
    return { value: null, error: "Invalid date" };
  }
}

/**
 * Read OLE 2.0 DateTime (days since December 30, 1899)
 */
export function readOLEDateTime(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: Date; error: null } | { value: null; error: string } {
  const result = readFloat64(data, offset, endianness);
  if (result.error) {
    return { value: null, error: "Insufficient bytes" };
  }
  
  const days = result.value!;
  // OLE epoch: December 30, 1899
  const oleEpoch = new Date(1899, 11, 30);
  const milliseconds = days * 24 * 60 * 60 * 1000;
  const date = new Date(oleEpoch.getTime() + milliseconds);
  
  if (isNaN(date.getTime())) {
    return { value: null, error: "Invalid date" };
  }
  
  return { value: date, error: null };
}

/**
 * Read UNIX 32-bit DateTime (seconds since January 1, 1970)
 */
export function readUnixDateTime(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: Date; error: null } | { value: null; error: string } {
  const result = readUint32(data, offset, endianness);
  if (result.error) {
    return { value: null, error: "Insufficient bytes" };
  }
  
  const seconds = result.value!;
  const date = new Date(seconds * 1000);
  
  if (isNaN(date.getTime())) {
    return { value: null, error: "Invalid date" };
  }
  
  return { value: date, error: null };
}

/**
 * Read Macintosh HFS DateTime (seconds since January 1, 1904)
 */
export function readMacHFSDateTime(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: Date; error: null } | { value: null; error: string } {
  const result = readUint32(data, offset, endianness);
  if (result.error) {
    return { value: null, error: "Insufficient bytes" };
  }
  
  const seconds = result.value!;
  // HFS epoch: January 1, 1904
  const hfsEpoch = new Date(1904, 0, 1);
  const date = new Date(hfsEpoch.getTime() + seconds * 1000);
  
  if (isNaN(date.getTime())) {
    return { value: null, error: "Invalid date" };
  }
  
  return { value: date, error: null };
}

/**
 * Read Macintosh HFS+ DateTime (seconds since January 1, 1904)
 */
export function readMacHFSPlusDateTime(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: Date; error: null } | { value: null; error: string } {
  // HFS+ uses the same format as HFS
  return readMacHFSDateTime(data, offset, endianness);
}

/**
 * Read UTF-8 character
 */
export function readUTF8Char(
  data: Uint8Array,
  offset: number
): { value: string; error: null } | { value: null; error: string } {
  if (offset < 0 || offset >= data.length) {
    return { value: null, error: "Invalid offset" };
  }
  
  const byte = data[offset];
  if (byte === 0) {
    return { value: null, error: "Null" };
  }
  
  // Single byte UTF-8 (ASCII)
  if (byte < 0x80) {
    return { value: String.fromCharCode(byte), error: null };
  }
  
  // Multi-byte UTF-8 - try to read up to 4 bytes
  let bytesToRead = 0;
  if ((byte & 0xe0) === 0xc0) bytesToRead = 2;
  else if ((byte & 0xf0) === 0xe0) bytesToRead = 3;
  else if ((byte & 0xf8) === 0xf0) bytesToRead = 4;
  else return { value: null, error: "Invalid number" };
  
  if (offset + bytesToRead > data.length) {
    return { value: null, error: "Insufficient bytes" };
  }
  
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const bytes = data.slice(offset, offset + bytesToRead);
    const char = decoder.decode(bytes);
    return { value: char, error: null };
  } catch {
    return { value: null, error: "Invalid number" };
  }
}

/**
 * Read UTF-16 character
 */
export function readUTF16Char(
  data: Uint8Array,
  offset: number,
  endianness: Endianness = "le"
): { value: string; error: null } | { value: null; error: string } {
  if (offset < 0 || offset + 2 > data.length) {
    return { value: null, error: "Insufficient bytes" };
  }
  
  const result = readUint16(data, offset, endianness);
  if (result.error) {
    return { value: null, error: "Insufficient bytes" };
  }
  
  const codeUnit = result.value!;
  if (codeUnit === 0) {
    return { value: null, error: "Null" };
  }
  
  // Check for surrogate pair
  if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
    // High surrogate - need low surrogate
    if (offset + 4 > data.length) {
      return { value: null, error: "Insufficient bytes" };
    }
    const lowResult = readUint16(data, offset + 2, endianness);
    if (lowResult.error) {
      return { value: null, error: "Insufficient bytes" };
    }
    const lowSurrogate = lowResult.value!;
    if (lowSurrogate >= 0xdc00 && lowSurrogate <= 0xdfff) {
      const codePoint = 0x10000 + ((codeUnit - 0xd800) << 10) + (lowSurrogate - 0xdc00);
      return { value: String.fromCodePoint(codePoint), error: null };
    }
    return { value: null, error: "Invalid number" };
  }
  
  return { value: String.fromCharCode(codeUnit), error: null };
}

/**
 * Read binary representation (8 bits)
 */
export function readBinary(
  data: Uint8Array,
  offset: number
): { value: string; error: null } | { value: null; error: string } {
  const result = readUint8(data, offset);
  if (result.error) {
    return { value: null, error: result.error };
  }
  const byte = result.value!;
  const binary = byte.toString(2).padStart(8, "0");
  return { value: binary, error: null };
}
