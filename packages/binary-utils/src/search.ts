/**
 * Search utilities for finding byte sequences in binary data
 */

/**
 * Parse a hex string into a Uint8Array
 * Supports formats: "41 42 43", "414243", "41-42-43", etc.
 */
function parseHexString(hexString: string): Uint8Array | null {
  // Remove spaces, dashes, and other separators
  const cleaned = hexString.replace(/[\s\-_]/g, "").toLowerCase();

  // Validate hex characters
  if (!/^[0-9a-f]*$/.test(cleaned)) {
    return null;
  }

  // Must have even number of characters (each byte is 2 hex digits)
  if (cleaned.length % 2 !== 0) {
    return null;
  }

  // Convert to bytes
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    const byteValue = parseInt(cleaned.slice(i, i + 2), 16);
    if (isNaN(byteValue)) {
      return null;
    }
    bytes[i / 2] = byteValue;
  }

  return bytes;
}

/**
 * Search for a byte sequence in binary data (returns first match)
 */
function searchBytes(
  data: Uint8Array,
  pattern: Uint8Array
): { offset: number; length: number } | null {
  if (pattern.length === 0 || pattern.length > data.length) {
    return null;
  }

  for (let i = 0; i <= data.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (data[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      return { offset: i, length: pattern.length };
    }
  }

  return null;
}

/**
 * Search for all occurrences of a byte sequence in binary data
 */
function searchBytesAll(
  data: Uint8Array,
  pattern: Uint8Array
): Array<{ offset: number; length: number }> {
  const matches: Array<{ offset: number; length: number }> = [];
  
  if (pattern.length === 0 || pattern.length > data.length) {
    return matches;
  }

  for (let i = 0; i <= data.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (data[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      matches.push({ offset: i, length: pattern.length });
    }
  }

  return matches;
}

/**
 * Search for hex bytes in binary data
 */
export function searchHex(
  data: Uint8Array,
  hexString: string
): { offset: number; length: number } | null {
  const pattern = parseHexString(hexString);
  if (!pattern || pattern.length === 0) {
    return null;
  }

  return searchBytes(data, pattern);
}

/**
 * Search for text string in binary data (UTF-8 encoded)
 */
export function searchText(
  data: Uint8Array,
  text: string
): { offset: number; length: number } | null {
  if (text.length === 0) {
    return null;
  }

  // Convert text to UTF-8 bytes
  const encoder = new TextEncoder();
  const pattern = encoder.encode(text);

  if (pattern.length === 0) {
    return null;
  }

  return searchBytes(data, pattern);
}

/**
 * Search for all occurrences of hex bytes in binary data
 */
export function searchHexAll(
  data: Uint8Array,
  hexString: string
): Array<{ offset: number; length: number }> {
  const pattern = parseHexString(hexString);
  if (!pattern || pattern.length === 0) {
    return [];
  }

  return searchBytesAll(data, pattern);
}

/**
 * Search for all occurrences of text string in binary data (UTF-8 encoded)
 */
export function searchTextAll(
  data: Uint8Array,
  text: string
): Array<{ offset: number; length: number }> {
  if (text.length === 0) {
    return [];
  }

  // Convert text to UTF-8 bytes
  const encoder = new TextEncoder();
  const pattern = encoder.encode(text);

  if (pattern.length === 0) {
    return [];
  }

  return searchBytesAll(data, pattern);
}
