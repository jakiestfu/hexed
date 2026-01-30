/**
 * Pure function to search for byte patterns in a file
 * This function runs in the worker context via $task
 */

import type { EvaluateAPI } from "@hexed/worker"

import type { SearchContext, SearchMatch } from "./types"

/**
 * Search implementation that runs in worker context
 */
export const searchImpl: EvaluateAPI<SearchMatch[], SearchContext> = async (
  hexedFile,
  api
) => {
  // Chunk size for streaming (1MB)
  const STREAM_CHUNK_SIZE = 1024 * 1024

  // Extract context
  const pattern = api.context.pattern
  const fileSize = hexedFile.size
  const startOffset = api.context.startOffset ?? 0
  const endOffset = api.context.endOffset ?? fileSize
  const searchRange = endOffset - startOffset

  // All matches found
  const matches: SearchMatch[] = []

  // Search through file in chunks
  let currentOffset = startOffset
  let bytesSearched = 0

  while (currentOffset < endOffset) {
    api.throwIfAborted()

    const chunkEnd = Math.min(
      currentOffset + STREAM_CHUNK_SIZE + pattern.length - 1,
      endOffset
    )

    // Ensure range is loaded and read chunk
    await hexedFile.ensureRange({ start: currentOffset, end: chunkEnd })
    const chunk = hexedFile.readBytes(currentOffset, chunkEnd - currentOffset)

    if (!chunk) {
      // No data available, break
      break
    }

    // Track matches found in this chunk
    const chunkMatches: SearchMatch[] = []

    // Search for pattern in chunk
    for (let i = 0; i <= chunk.length - pattern.length; i++) {
      let match = true
      for (let j = 0; j < pattern.length; j++) {
        if (chunk[i + j] !== pattern[j]) {
          match = false
          break
        }
      }
      if (match) {
        const matchData: SearchMatch = {
          offset: currentOffset + i,
          length: pattern.length
        }
        matches.push(matchData)
        chunkMatches.push(matchData)
      }
    }

    // Emit matches found in this chunk immediately
    if (chunkMatches.length > 0) {
      api.emitResult(chunkMatches)
    }

    bytesSearched = Math.min(chunkEnd - startOffset, searchRange)
    currentOffset = chunkEnd - pattern.length + 1 // Overlap to catch matches at boundaries

    // Emit progress
    api.emitProgress({ processed: bytesSearched, size: searchRange })

    // Yield to event loop to keep UI responsive
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  // Return all matches
  return matches
}
