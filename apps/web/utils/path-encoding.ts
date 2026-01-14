/**
 * URL-safe base64 encoding/decoding utilities for file paths
 */

/**
 * Checks if a path is a URL (starts with http:// or https://)
 * @param path - The path to check
 * @returns true if the path is a URL, false otherwise
 */
export function isUrlPath(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://")
}

/**
 * Encodes a file path to a URL-safe base64 string
 * @param path - The file path to encode
 * @returns URL-safe base64 encoded string
 */
export function encodeFilePath(path: string): string {
  if (!path) {
    return ""
  }

  // Convert to base64
  const base64 = btoa(unescape(encodeURIComponent(path)))

  // Make it URL-safe: replace + with -, / with _, and remove padding =
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

/**
 * Decodes a URL-safe base64 string back to a file path
 * @param encoded - The URL-safe base64 encoded string
 * @returns The decoded file path, or null if decoding fails
 */
export function decodeFilePath(encoded: string): string | null {
  if (!encoded) {
    return null
  }

  try {
    // Restore URL-safe characters: replace - with +, _ with /
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")

    // Add padding if needed (base64 strings should be multiples of 4)
    while (base64.length % 4) {
      base64 += "="
    }

    // Decode from base64
    const decoded = decodeURIComponent(escape(atob(base64)))
    return decoded
  } catch (error) {
    console.error("Failed to decode file path:", error)
    return null
  }
}

/**
 * Checks if a path is a handle ID (starts with "handle:")
 * @param path - The path to check
 * @returns true if the path is a handle ID, false otherwise
 */
export function isHandleId(path: string): boolean {
  return path.startsWith("handle:")
}

/**
 * Encodes a handle ID for use in URLs
 * @param handleId - The handle ID to encode
 * @returns URL-safe base64 encoded string with "handle:" prefix
 */
export function encodeHandleId(handleId: string): string {
  const handlePath = `handle:${handleId}`
  return encodeFilePath(handlePath)
}

/**
 * Decodes a handle ID from a URL-encoded string
 * @param encoded - The URL-safe base64 encoded string
 * @returns The handle ID (without "handle:" prefix), or null if decoding fails or not a handle ID
 */
export function decodeHandleId(encoded: string): string | null {
  const decoded = decodeFilePath(encoded)
  if (!decoded) {
    return null
  }

  if (!isHandleId(decoded)) {
    return null
  }

  // Remove "handle:" prefix
  return decoded.substring(7)
}
