/**
 * Types for search functionality
 */

export type SearchMatch = {
  offset: number
  length: number
}

export type SearchContext = {
  pattern: Uint8Array
  startOffset?: number
  endOffset?: number
}
