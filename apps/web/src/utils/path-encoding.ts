/**
 * Handle ID utilities for URLs
 * Handle IDs are used directly in URLs without encoding
 */

/**
 * Encodes a handle ID for use in URLs
 * Since handle IDs are already URL-safe, this just passes through the ID
 * @param handleId - The handle ID to encode
 * @returns The handle ID as-is
 */
export function encodeHandleId(handleId: string): string {
  return handleId;
}

/**
 * Decodes a handle ID from a URL
 * Since handle IDs are used directly, this just passes through the value
 * @param handleId - The handle ID from the URL
 * @returns The handle ID as-is, or null if empty
 */
export function decodeHandleId(handleId: string): string | null {
  if (!handleId) {
    return null;
  }
  return handleId;
}
