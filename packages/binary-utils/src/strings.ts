/**
 * String extraction utilities for finding printable strings in binary data
 */

export type StringEncoding =
  | "ascii"
  | "utf8"
  | "utf16be"
  | "utf16le"
  | "utf32be"
  | "utf32le";

export type StringMatch = {
  offset: number;
  length: number;
  encoding: StringEncoding;
  text: string;
};

export type StringsOptions = {
  minLength?: number;
  encoding?: StringEncoding;
};

/**
 * Check if a byte is printable ASCII (32-126)
 */
function isPrintableAscii(byte: number): boolean {
  return byte >= 32 && byte <= 126;
}

/**
 * Check if a byte is a null terminator or common control character
 */
function isStringTerminator(byte: number): boolean {
  return byte === 0 || byte === 10 || byte === 13; // null, LF, CR
}

/**
 * Extract ASCII strings from binary data
 */
function extractAsciiStrings(
  data: Uint8Array,
  minLength: number
): StringMatch[] {
  const matches: StringMatch[] = [];
  let start = -1;
  let length = 0;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];

    if (isPrintableAscii(byte)) {
      if (start === -1) {
        start = i;
        length = 1;
      } else {
        length++;
      }
    } else {
      if (start !== -1 && length >= minLength) {
        const text = String.fromCharCode(
          ...Array.from(data.slice(start, start + length))
        );
        matches.push({
          offset: start,
          length,
          encoding: "ascii",
          text,
        });
      }
      start = -1;
      length = 0;
    }
  }

  // Handle string at end of data
  if (start !== -1 && length >= minLength) {
    const text = String.fromCharCode(
      ...Array.from(data.slice(start, start + length))
    );
    matches.push({
      offset: start,
      length,
      encoding: "ascii",
      text,
    });
  }

  return matches;
}

/**
 * Check if a UTF-8 sequence is valid and printable
 */
function isValidUtf8Char(bytes: Uint8Array, offset: number): {
  valid: boolean;
  length: number;
  char: string | null;
} {
  if (offset >= bytes.length) {
    return { valid: false, length: 0, char: null };
  }

  const byte0 = bytes[offset];

  // Single byte ASCII (0x00-0x7F)
  if (byte0 < 0x80) {
    if (isPrintableAscii(byte0)) {
      return {
        valid: true,
        length: 1,
        char: String.fromCharCode(byte0),
      };
    }
    return { valid: false, length: 1, char: null };
  }

  // Multi-byte UTF-8
  let length = 0;
  if ((byte0 & 0xe0) === 0xc0) length = 2;
  else if ((byte0 & 0xf0) === 0xe0) length = 3;
  else if ((byte0 & 0xf8) === 0xf0) length = 4;
  else return { valid: false, length: 1, char: null };

  if (offset + length > bytes.length) {
    return { valid: false, length: 0, char: null };
  }

  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const slice = bytes.slice(offset, offset + length);
    const char = decoder.decode(slice);
    // Check if character is printable (not control characters)
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined && codePoint >= 32 && codePoint !== 127) {
      return { valid: true, length, char };
    }
    return { valid: false, length, char: null };
  } catch {
    return { valid: false, length, char: null };
  }
}

/**
 * Extract UTF-8 strings from binary data
 */
function extractUtf8Strings(
  data: Uint8Array,
  minLength: number
): StringMatch[] {
  const matches: StringMatch[] = [];
  let start = -1;
  let length = 0;
  let charLength = 0;

  for (let i = 0; i < data.length; ) {
    const result = isValidUtf8Char(data, i);

    if (result.valid && result.char) {
      if (start === -1) {
        start = i;
        length = result.length;
        charLength = 1;
      } else {
        length += result.length;
        charLength++;
      }
      i += result.length;
    } else {
      if (start !== -1 && charLength >= minLength) {
        try {
          const decoder = new TextDecoder("utf-8", { fatal: true });
          const text = decoder.decode(data.slice(start, start + length));
          matches.push({
            offset: start,
            length,
            encoding: "utf8",
            text,
          });
        } catch {
          // Skip invalid UTF-8 sequences
        }
      }
      start = -1;
      length = 0;
      charLength = 0;
      i += result.length || 1;
    }
  }

  // Handle string at end of data
  if (start !== -1 && charLength >= minLength) {
    try {
      const decoder = new TextDecoder("utf-8", { fatal: true });
      const text = decoder.decode(data.slice(start, start + length));
      matches.push({
        offset: start,
        length,
        encoding: "utf8",
        text,
      });
    } catch {
      // Skip invalid UTF-8 sequences
    }
  }

  return matches;
}

/**
 * Read UTF-16 code unit
 */
function readUtf16CodeUnit(
  data: Uint8Array,
  offset: number,
  littleEndian: boolean
): { value: number; error: null } | { value: null; error: string } {
  if (offset + 2 > data.length) {
    return { value: null, error: "Insufficient bytes" };
  }

  const value = littleEndian
    ? data[offset] | (data[offset + 1] << 8)
    : (data[offset] << 8) | data[offset + 1];

  return { value, error: null };
}

/**
 * Check if a UTF-16 code unit represents a printable character
 */
function isPrintableUtf16(codeUnit: number): boolean {
  // Check for null terminator
  if (codeUnit === 0) {
    return false;
  }

  // Basic printable range (excluding surrogates)
  if (codeUnit >= 32 && codeUnit < 0xd800) {
    return codeUnit !== 127; // Exclude DEL
  }

  // Surrogate pairs (0xD800-0xDFFF) are handled separately
  if (codeUnit >= 0xd800 && codeUnit <= 0xdfff) {
    return false; // High/low surrogates are not printable by themselves
  }

  // Other printable ranges
  if (codeUnit >= 0xe000 && codeUnit <= 0xfffd) {
    return true;
  }

  return false;
}

/**
 * Extract UTF-16 strings from binary data
 */
function extractUtf16Strings(
  data: Uint8Array,
  minLength: number,
  littleEndian: boolean
): StringMatch[] {
  const matches: StringMatch[] = [];
  let start = -1;
  let byteLength = 0;
  let charLength = 0;

  for (let i = 0; i < data.length - 1; i += 2) {
    const result = readUtf16CodeUnit(data, i, littleEndian);
    if (result.error) break;

    const codeUnit = result.value!;

    // Check for null terminator
    if (codeUnit === 0) {
      if (start !== -1 && charLength >= minLength) {
        try {
          const decoder = new TextDecoder(
            littleEndian ? "utf-16le" : "utf-16be",
            { fatal: true }
          );
          const text = decoder.decode(data.slice(start, start + byteLength));
          matches.push({
            offset: start,
            length: byteLength,
            encoding: littleEndian ? "utf16le" : "utf16be",
            text,
          });
        } catch {
          // Skip invalid sequences
        }
      }
      start = -1;
      byteLength = 0;
      charLength = 0;
      continue;
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
            );
            const text = decoder.decode(data.slice(start, start + byteLength));
            matches.push({
              offset: start,
              length: byteLength,
              encoding: littleEndian ? "utf16le" : "utf16be",
              text,
            });
          } catch {
            // Skip invalid sequences
          }
        }
        start = -1;
        byteLength = 0;
        charLength = 0;
        break;
      }

      const lowResult = readUtf16CodeUnit(data, i + 2, littleEndian);
      if (lowResult.error) break;

      const lowSurrogate = lowResult.value!;
      if (lowSurrogate >= 0xdc00 && lowSurrogate <= 0xdfff) {
        // Valid surrogate pair
        if (start === -1) {
          start = i;
          byteLength = 4;
          charLength = 1;
        } else {
          byteLength += 4;
          charLength++;
        }
        i += 2; // Skip the low surrogate in next iteration
        continue;
      }
    }

    if (isPrintableUtf16(codeUnit)) {
      if (start === -1) {
        start = i;
        byteLength = 2;
        charLength = 1;
      } else {
        byteLength += 2;
        charLength++;
      }
    } else {
      if (start !== -1 && charLength >= minLength) {
        try {
          const decoder = new TextDecoder(
            littleEndian ? "utf-16le" : "utf-16be",
            { fatal: true }
          );
          const text = decoder.decode(data.slice(start, start + byteLength));
          matches.push({
            offset: start,
            length: byteLength,
            encoding: littleEndian ? "utf16le" : "utf16be",
            text,
          });
        } catch {
          // Skip invalid sequences
        }
      }
      start = -1;
      byteLength = 0;
      charLength = 0;
    }
  }

  // Handle string at end of data
  if (start !== -1 && charLength >= minLength) {
    try {
      const decoder = new TextDecoder(
        littleEndian ? "utf-16le" : "utf-16be",
        { fatal: true }
      );
      const text = decoder.decode(data.slice(start, start + byteLength));
      matches.push({
        offset: start,
        length: byteLength,
        encoding: littleEndian ? "utf16le" : "utf16be",
        text,
      });
    } catch {
      // Skip invalid sequences
    }
  }

  return matches;
}

/**
 * Extract UTF-32 strings from binary data
 */
function extractUtf32Strings(
  data: Uint8Array,
  minLength: number,
  littleEndian: boolean
): StringMatch[] {
  const matches: StringMatch[] = [];
  let start = -1;
  let byteLength = 0;
  let charLength = 0;

  for (let i = 0; i < data.length - 3; i += 4) {
    // Read 32-bit value
    const b0 = data[i];
    const b1 = data[i + 1];
    const b2 = data[i + 2];
    const b3 = data[i + 3];

    const codePoint = littleEndian
      ? b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)
      : (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;

    // Check for null terminator
    if (codePoint === 0) {
      if (start !== -1 && charLength >= minLength) {
        try {
          const bytes = data.slice(start, start + byteLength);
          const text = String.fromCodePoint(
            ...Array.from({ length: byteLength / 4 }, (_, j) => {
              const offset = start + j * 4;
              const b0 = bytes[offset];
              const b1 = bytes[offset + 1];
              const b2 = bytes[offset + 2];
              const b3 = bytes[offset + 3];
              return littleEndian
                ? b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)
                : (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
            })
          );
          matches.push({
            offset: start,
            length: byteLength,
            encoding: littleEndian ? "utf32le" : "utf32be",
            text,
          });
        } catch {
          // Skip invalid sequences
        }
      }
      start = -1;
      byteLength = 0;
      charLength = 0;
      continue;
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
        start = i;
        byteLength = 4;
        charLength = 1;
      } else {
        byteLength += 4;
        charLength++;
      }
    } else {
      if (start !== -1 && charLength >= minLength) {
        try {
          const bytes = data.slice(start, start + byteLength);
          const text = String.fromCodePoint(
            ...Array.from({ length: byteLength / 4 }, (_, j) => {
              const offset = start + j * 4;
              const b0 = bytes[offset];
              const b1 = bytes[offset + 1];
              const b2 = bytes[offset + 2];
              const b3 = bytes[offset + 3];
              return littleEndian
                ? b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)
                : (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
            })
          );
          matches.push({
            offset: start,
            length: byteLength,
            encoding: littleEndian ? "utf32le" : "utf32be",
            text,
          });
        } catch {
          // Skip invalid sequences
        }
      }
      start = -1;
      byteLength = 0;
      charLength = 0;
    }
  }

  // Handle string at end of data
  if (start !== -1 && charLength >= minLength) {
    try {
      const bytes = data.slice(start, start + byteLength);
      const text = String.fromCodePoint(
        ...Array.from({ length: byteLength / 4 }, (_, j) => {
          const offset = start + j * 4;
          const b0 = bytes[offset];
          const b1 = bytes[offset + 1];
          const b2 = bytes[offset + 2];
          const b3 = bytes[offset + 3];
          return littleEndian
            ? b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)
            : (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
        })
      );
      matches.push({
        offset: start,
        length: byteLength,
        encoding: littleEndian ? "utf32le" : "utf32be",
        text,
      });
    } catch {
      // Skip invalid sequences
    }
  }

  return matches;
}

/**
 * Auto-detect encoding by trying all encodings and returning the one with most matches
 */
function autoDetectEncoding(
  data: Uint8Array,
  minLength: number
): StringEncoding {
  const results: Array<{ encoding: StringEncoding; count: number }> = [
    { encoding: "ascii", count: extractAsciiStrings(data, minLength).length },
    { encoding: "utf8", count: extractUtf8Strings(data, minLength).length },
    {
      encoding: "utf16le",
      count: extractUtf16Strings(data, minLength, true).length,
    },
    {
      encoding: "utf16be",
      count: extractUtf16Strings(data, minLength, false).length,
    },
    {
      encoding: "utf32le",
      count: extractUtf32Strings(data, minLength, true).length,
    },
    {
      encoding: "utf32be",
      count: extractUtf32Strings(data, minLength, false).length,
    },
  ];

  // Sort by count descending, return the encoding with most matches
  // Use spread operator for immutability (toSorted requires ES2023+)
  const sortedResults = [...results].sort((a, b) => b.count - a.count);
  return sortedResults[0]?.encoding || "ascii";
}

/**
 * Extract strings from binary data
 */
export function extractStrings(
  data: Uint8Array,
  options: StringsOptions = {}
): StringMatch[] {
  const minLength = options.minLength ?? 4;
  const encoding = options.encoding ?? "ascii";

  switch (encoding) {
    case "ascii":
      return extractAsciiStrings(data, minLength);
    case "utf8":
      return extractUtf8Strings(data, minLength);
    case "utf16le":
      return extractUtf16Strings(data, minLength, true);
    case "utf16be":
      return extractUtf16Strings(data, minLength, false);
    case "utf32le":
      return extractUtf32Strings(data, minLength, true);
    case "utf32be":
      return extractUtf32Strings(data, minLength, false);
    default:
      return extractAsciiStrings(data, minLength);
  }
}
