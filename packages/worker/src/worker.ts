/**
 * Worker entry point for file access
 */

import { extractStrings, type StringEncoding } from "@hexed/file/strings"
import { createLogger } from "@hexed/logger"

import type {
  ConnectedResponse,
  ErrorResponse,
  ProgressEvent,
  RequestMessage,
  ResponseMessage,
  SearchMatchEvent,
  SearchRequest,
  SearchResponse,
  StringsRequest,
  StringsResponse,
  WorkerMessage
} from "./types"

const logger = createLogger("worker")

// Chunk size for streaming (1MB)
const STREAM_CHUNK_SIZE = 1024 * 1024

/**
 * Read a byte range from a File object
 */
async function readByteRange(
  file: File,
  start: number,
  end: number
): Promise<Uint8Array> {
  const blob = file.slice(start, end)
  const arrayBuffer = await blob.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Send a response message
 */
function sendResponse(message: ResponseMessage): void {
  try {
    self.postMessage(message)
  } catch (error) {
    console.error("Error sending response:", error)
  }
}

/**
 * Send a progress event
 */
function sendProgress(event: ProgressEvent): void {
  try {
    self.postMessage(event)
  } catch (error) {
    console.error("Error sending progress event:", error)
  }
}

/**
 * Send a search match event
 */
function sendSearchMatch(event: SearchMatchEvent): void {
  try {
    self.postMessage(event)
  } catch (error) {
    console.error("Error sending search match event:", error)
  }
}

/**
 * Send an error response
 */
function sendError(error: string, originalMessageId?: string): void {
  logger.log(
    "Error:",
    error,
    originalMessageId ? `(request: ${originalMessageId})` : ""
  )
  const response: ErrorResponse = {
    id: generateMessageId(),
    type: "ERROR",
    error,
    originalMessageId
  }
  sendResponse(response)
}

/**
 * Handle SEARCH_REQUEST - Search for pattern in file with progress updates
 */
async function handleSearch(request: SearchRequest): Promise<void> {
  logger.log(`Searching file (request: ${request.id})`)
  try {
    const fileSize = request.file.size
    const startOffset = request.startOffset ?? 0
    const endOffset = request.endOffset ?? fileSize
    const searchRange = endOffset - startOffset
    const pattern = request.pattern
    const matches: Array<{ offset: number; length: number }> = []

    // Search through file in chunks
    let currentOffset = startOffset
    let bytesSearched = 0

    while (currentOffset < endOffset) {
      const chunkEnd = Math.min(
        currentOffset + STREAM_CHUNK_SIZE + pattern.length - 1,
        endOffset
      )

      // Read chunk for searching
      const chunk = await readByteRange(request.file, currentOffset, chunkEnd)

      // Track matches found in this chunk
      const chunkMatches: Array<{ offset: number; length: number }> = []

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
          const matchData = {
            offset: currentOffset + i,
            length: pattern.length
          }
          matches.push(matchData)
          chunkMatches.push(matchData)
        }
      }

      // Send matches found in this chunk immediately
      if (chunkMatches.length > 0) {
        const matchEvent: SearchMatchEvent = {
          id: generateMessageId(),
          type: "SEARCH_MATCH_EVENT",
          requestId: request.id,
          matches: chunkMatches
        }
        sendSearchMatch(matchEvent)
      }

      bytesSearched = Math.min(chunkEnd - startOffset, searchRange)
      currentOffset = chunkEnd - pattern.length + 1 // Overlap to catch matches at boundaries

      // Calculate progress percentage
      const progress = Math.min(
        100,
        Math.round((bytesSearched / searchRange) * 100)
      )

      // Send progress event
      const progressEvent: ProgressEvent = {
        id: generateMessageId(),
        type: "PROGRESS_EVENT",
        requestId: request.id,
        progress,
        bytesRead: bytesSearched,
        totalBytes: searchRange
      }
      sendProgress(progressEvent)

      // Yield to event loop to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    logger.log(`Search completed, found ${matches.length} matches`)
    const response: SearchResponse = {
      id: request.id,
      type: "SEARCH_RESPONSE",
      matches
    }
    sendResponse(response)
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to search file",
      request.id
    )
  }
}

/**
 * Get the overlap buffer size needed for a given encoding
 */
function getOverlapSize(encoding: string): number {
  switch (encoding) {
    case "ascii":
      return 0 // No multi-byte sequences
    case "utf8":
      return 3 // Max UTF-8 sequence is 4 bytes, need 3 to detect incomplete sequences
    case "utf16le":
    case "utf16be":
      return 1 // 2-byte units, need 1 byte to detect incomplete unit
    case "utf32le":
    case "utf32be":
      return 3 // 4-byte units, need 3 bytes to detect incomplete unit
    default:
      return 3 // Default to safe value for unknown encodings
  }
}

/**
 * Handle STRINGS_REQUEST - Extract strings from file with progress updates
 */
async function handleStrings(request: StringsRequest): Promise<void> {
  logger.log(`Extracting strings from file (request: ${request.id})`)
  try {
    const fileSize = request.file.size
    const startOffset = request.startOffset ?? 0
    const endOffset = request.endOffset ?? fileSize
    const searchRange = endOffset - startOffset
    const encoding = request.encoding ?? "ascii"
    const overlapSize = getOverlapSize(encoding)

    // Accumulate matches as we process chunks
    const allMatches: Array<{
      offset: number
      length: number
      encoding: StringEncoding
      text: string
    }> = []

    // Overlap buffer from previous chunk
    let overlapBuffer = new Uint8Array(0)

    // Read and process the file in chunks
    let bytesRead = 0
    while (bytesRead < searchRange) {
      const chunkStart = startOffset + bytesRead
      const chunkEnd = Math.min(
        chunkStart + STREAM_CHUNK_SIZE,
        startOffset + searchRange
      )

      // Read chunk
      const chunk = await readByteRange(request.file, chunkStart, chunkEnd)

      // Combine overlap buffer with current chunk
      const combinedLength = overlapBuffer.length + chunk.length
      const combinedData = new Uint8Array(combinedLength)
      combinedData.set(overlapBuffer, 0)
      combinedData.set(chunk, overlapBuffer.length)

      // Extract strings from combined data
      const chunkMatches = extractStrings(combinedData, {
        minLength: request.minLength,
        encoding: request.encoding
      })

      // Adjust offsets and filter out matches in overlap region
      for (const match of chunkMatches) {
        // Filter out matches that are entirely within the overlap region
        if (match.offset < overlapBuffer.length) {
          // Check if match extends beyond overlap region
          const matchEnd = match.offset + match.length
          if (matchEnd <= overlapBuffer.length) {
            // Match is entirely in overlap, skip (already processed in previous chunk)
            continue
          }
          // Match spans overlap boundary - it starts in overlap but extends into current chunk
          // The match was already reported in the previous chunk, so skip it
          continue
        } else {
          // Match is entirely in current chunk (or starts at overlap boundary)
          // Adjust offset: subtract overlap length to get position relative to chunk start,
          // then add absolute chunk start position
          const adjustedOffset =
            chunkStart + (match.offset - overlapBuffer.length)
          allMatches.push({
            ...match,
            offset: adjustedOffset
          })
        }
      }

      // Save last few bytes as overlap for next chunk
      // Take last overlapSize bytes from combined buffer (or all if combined is smaller)
      const overlapLength = Math.min(overlapSize, combinedData.length)
      if (overlapLength > 0) {
        overlapBuffer = combinedData.slice(combinedData.length - overlapLength)
      } else {
        overlapBuffer = new Uint8Array(0)
      }

      const chunkSize = chunkEnd - chunkStart
      bytesRead += chunkSize

      // Calculate progress percentage
      const progress = Math.min(
        100,
        Math.round((bytesRead / searchRange) * 100)
      )

      // Send progress event
      const progressEvent: ProgressEvent = {
        id: generateMessageId(),
        type: "PROGRESS_EVENT",
        requestId: request.id,
        progress,
        bytesRead: bytesRead,
        totalBytes: searchRange
      }
      sendProgress(progressEvent)

      // Yield to event loop to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    logger.log(
      `Strings extraction completed, found ${allMatches.length} matches`
    )
    const response: StringsResponse = {
      id: request.id,
      type: "STRINGS_RESPONSE",
      matches: allMatches
    }
    sendResponse(response)
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to extract strings",
      request.id
    )
  }
}

/**
 * Route a request message to the appropriate handler
 */
async function handleRequest(message: RequestMessage): Promise<void> {
  switch (message.type) {
    case "SEARCH_REQUEST":
      await handleSearch(message)
      break
    case "STRINGS_REQUEST":
      await handleStrings(message)
      break
    default:
      const unknownMessage = message as { type: string; id: string }
      sendError(
        `Unknown message type: ${unknownMessage.type}`,
        unknownMessage.id
      )
  }
}

/**
 * Worker global scope handler
 */
if (typeof self !== "undefined") {
  logger.log("Worker initialized")
  // Send connection acknowledgment on startup
  const response: ConnectedResponse = {
    id: generateMessageId(),
    type: "CONNECTED"
  }
  sendResponse(response)

  // Handle messages from client
  self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data
    // Ignore response messages and progress events (they come from worker, not client)
    if (
      message.type === "CONNECTED" ||
      message.type.startsWith("RESPONSE") ||
      message.type === "PROGRESS_EVENT" ||
      message.type === "SEARCH_MATCH_EVENT"
    ) {
      return
    }
    logger.log(`Received request: ${message.type} (id: ${message.id})`)
    handleRequest(message as RequestMessage).catch((error) => {
      logger.log("Unhandled error in request handler:", error)
      sendError("Internal error processing request", message.id)
    })
  }

  // Handle worker errors
  self.onerror = (error: ErrorEvent) => {
    logger.log("Worker error:", error)
  }
}
