/**
 * Worker entry point for file access
 */

import { extractStrings, type StringEncoding } from "@hexed/file/strings"
import { createLogger } from "@hexed/logger"

import { renderChart } from "./chart-worker"
import type {
  ByteFrequencyRequest,
  ByteFrequencyResponse,
  ChartRenderRequest,
  ChartRenderResponse,
  ChiSquareRequest,
  ChiSquareResponse,
  ConnectedResponse,
  EntropyRequest,
  EntropyResponse,
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
 * Calculate Shannon entropy for a block of bytes
 * Formula: H(X) = -Σ p(x) * log2(p(x))
 * @param data - The byte array containing the block
 * @param start - Start index (inclusive)
 * @param end - End index (exclusive)
 */
function calculateBlockEntropy(
  data: Uint8Array,
  start: number = 0,
  end?: number
): number {
  const blockLength = (end ?? data.length) - start
  if (blockLength === 0) return 0

  // Count byte frequencies
  const frequencies = new Array(256).fill(0)
  for (let i = start; i < (end ?? data.length); i++) {
    frequencies[data[i]]++
  }

  // Calculate entropy
  let entropy = 0
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const probability = frequencies[i] / blockLength
      entropy -= probability * Math.log2(probability)
    }
  }

  return entropy
}

/**
 * Determine optimal block size based on file size for block-based calculations
 * Smaller files use smaller blocks to get more data points for visualization
 */
function getBlockSize(fileSize: number): number {
  // return 32;
  // if (fileSize < 1024) return 32 // < 1KB: 32 bytes (~32 points)
  // if (fileSize < 10 * 1024) return 128 // < 10KB: 128 bytes (~80 points)
  if (fileSize < 100 * 1024) return 32 // < 100KB: 512 bytes (~200 points)
  if (fileSize < 1024 * 1024) return 2048 // < 1MB: 2KB (~512 points)
  return STREAM_CHUNK_SIZE // >= 1MB: 1MB chunks
}

/**
 * Calculate chi-square statistic for a block of bytes
 * Formula: χ² = Σ((observed - expected)² / expected)
 * Tests how well the byte distribution matches a uniform distribution
 * Lower values indicate randomness, higher values indicate structure/patterns
 * @param data - The byte array containing the block
 * @param start - Start index (inclusive)
 * @param end - End index (exclusive)
 */
function calculateBlockChiSquare(
  data: Uint8Array,
  start: number = 0,
  end?: number
): number {
  const blockLength = (end ?? data.length) - start
  if (blockLength === 0) return 0

  // Expected frequency for uniform distribution: blockLength / 256
  const expected = blockLength / 256

  // Count byte frequencies
  const frequencies = new Array(256).fill(0)
  for (let i = start; i < (end ?? data.length); i++) {
    frequencies[data[i]]++
  }

  // Calculate chi-square statistic
  let chiSquare = 0
  for (let i = 0; i < 256; i++) {
    const observed = frequencies[i]
    const diff = observed - expected
    chiSquare += (diff * diff) / expected
  }

  return chiSquare
}

/**
 * Handle ENTROPY_REQUEST - Calculate entropy per block/chunk across file
 * Uses adaptive block sizing: smaller blocks for small files, 1MB chunks for large files
 */
async function handleEntropy(request: EntropyRequest): Promise<void> {
  logger.log(`Calculating entropy (request: ${request.id})`)
  try {
    const fileSize = request.file.size
    const startOffset = request.startOffset ?? 0
    const endOffset = request.endOffset ?? fileSize
    const searchRange = endOffset - startOffset

    // Determine block size based on file size (or use provided blockSize)
    const blockSize = request.blockSize ?? getBlockSize(searchRange)

    const entropyValues: number[] = []
    const offsets: number[] = []

    // For large files (>= 1MB), use efficient chunk-based processing
    // For small files, process in smaller blocks for better visualization
    if (blockSize >= STREAM_CHUNK_SIZE) {
      // Large file: process in 1MB chunks (same pattern as byte frequency)
      let bytesRead = 0
      while (bytesRead < searchRange) {
        const chunkStart = startOffset + bytesRead
        const chunkEnd = Math.min(
          chunkStart + STREAM_CHUNK_SIZE,
          startOffset + searchRange
        )

        // Read chunk
        const chunk = await readByteRange(request.file, chunkStart, chunkEnd)

        // Calculate entropy for entire chunk
        const entropy = calculateBlockEntropy(chunk)
        entropyValues.push(entropy)
        offsets.push(chunkStart)

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
    } else {
      // Small file: process in smaller blocks for better visualization
      let currentOffset = startOffset
      let blocksProcessed = 0

      while (currentOffset < endOffset) {
        const blockEnd = Math.min(currentOffset + blockSize, endOffset)

        // Read block
        const block = await readByteRange(request.file, currentOffset, blockEnd)

        // Calculate entropy for this block
        const entropy = calculateBlockEntropy(block)
        entropyValues.push(entropy)
        offsets.push(currentOffset)

        blocksProcessed++
        currentOffset = blockEnd

        // Send progress event periodically (every 10 blocks or at end)
        if (blocksProcessed % 10 === 0 || currentOffset >= endOffset) {
          const progress = Math.min(
            100,
            Math.round(((currentOffset - startOffset) / searchRange) * 100)
          )

          const progressEvent: ProgressEvent = {
            id: generateMessageId(),
            type: "PROGRESS_EVENT",
            requestId: request.id,
            progress,
            bytesRead: currentOffset - startOffset,
            totalBytes: searchRange
          }
          sendProgress(progressEvent)
        }

        // Yield to event loop periodically to keep UI responsive
        if (blocksProcessed % 100 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }
    }

    logger.log(
      `Entropy calculation completed, processed ${entropyValues.length} blocks`
    )
    const response: EntropyResponse = {
      id: request.id,
      type: "ENTROPY_RESPONSE",
      entropyValues,
      blockSize,
      offsets
    }
    sendResponse(response)
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to calculate entropy",
      request.id
    )
  }
}

/**
 * Handle CHI_SQUARE_REQUEST - Calculate chi-square per block/chunk across file
 * Uses adaptive block sizing: smaller blocks for small files, 1MB chunks for large files
 */
async function handleChiSquare(request: ChiSquareRequest): Promise<void> {
  logger.log(`Calculating chi-square (request: ${request.id})`)
  try {
    const fileSize = request.file.size
    const startOffset = request.startOffset ?? 0
    const endOffset = request.endOffset ?? fileSize
    const searchRange = endOffset - startOffset

    // Determine block size based on file size (or use provided blockSize)
    const blockSize = request.blockSize ?? getBlockSize(searchRange)

    const chiSquareValues: number[] = []
    const offsets: number[] = []

    // For large files (>= 1MB), use efficient chunk-based processing
    // For small files, process in smaller blocks for better visualization
    if (blockSize >= STREAM_CHUNK_SIZE) {
      // Large file: process in 1MB chunks (same pattern as entropy)
      let bytesRead = 0
      while (bytesRead < searchRange) {
        const chunkStart = startOffset + bytesRead
        const chunkEnd = Math.min(
          chunkStart + STREAM_CHUNK_SIZE,
          startOffset + searchRange
        )

        // Read chunk
        const chunk = await readByteRange(request.file, chunkStart, chunkEnd)

        // Calculate chi-square for entire chunk
        const chiSquare = calculateBlockChiSquare(chunk)
        chiSquareValues.push(chiSquare)
        offsets.push(chunkStart)

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
    } else {
      // Small file: process in smaller blocks for better visualization
      let currentOffset = startOffset
      let blocksProcessed = 0

      while (currentOffset < endOffset) {
        const blockEnd = Math.min(currentOffset + blockSize, endOffset)

        // Read block
        const block = await readByteRange(request.file, currentOffset, blockEnd)

        // Calculate chi-square for this block
        const chiSquare = calculateBlockChiSquare(block)
        chiSquareValues.push(chiSquare)
        offsets.push(currentOffset)

        blocksProcessed++
        currentOffset = blockEnd

        // Send progress event periodically (every 10 blocks or at end)
        if (blocksProcessed % 10 === 0 || currentOffset >= endOffset) {
          const progress = Math.min(
            100,
            Math.round(((currentOffset - startOffset) / searchRange) * 100)
          )

          const progressEvent: ProgressEvent = {
            id: generateMessageId(),
            type: "PROGRESS_EVENT",
            requestId: request.id,
            progress,
            bytesRead: currentOffset - startOffset,
            totalBytes: searchRange
          }
          sendProgress(progressEvent)
        }

        // Yield to event loop periodically to keep UI responsive
        if (blocksProcessed % 100 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }
    }

    logger.log(
      `Chi-square calculation completed, processed ${chiSquareValues.length} blocks`
    )
    const response: ChiSquareResponse = {
      id: request.id,
      type: "CHI_SQUARE_RESPONSE",
      chiSquareValues,
      blockSize,
      offsets
    }
    sendResponse(response)
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to calculate chi-square",
      request.id
    )
  }
}

/**
 * Handle BYTE_FREQUENCY_REQUEST - Calculate byte frequency distribution
 */
async function handleByteFrequency(
  request: ByteFrequencyRequest
): Promise<void> {
  logger.log(`Calculating byte frequency (request: ${request.id})`)
  try {
    const fileSize = request.file.size
    const startOffset = request.startOffset ?? 0
    const endOffset = request.endOffset ?? fileSize
    const searchRange = endOffset - startOffset

    // Initialize frequency array (256 elements for bytes 0-255)
    const frequencies = new Array(256).fill(0)

    // Process file in chunks
    let bytesRead = 0
    while (bytesRead < searchRange) {
      const chunkStart = startOffset + bytesRead
      const chunkEnd = Math.min(
        chunkStart + STREAM_CHUNK_SIZE,
        startOffset + searchRange
      )

      // Read chunk
      const chunk = await readByteRange(request.file, chunkStart, chunkEnd)

      // Count byte frequencies in this chunk
      for (let i = 0; i < chunk.length; i++) {
        frequencies[chunk[i]]++
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

    logger.log("Byte frequency calculation completed")
    const response: ByteFrequencyResponse = {
      id: request.id,
      type: "BYTE_FREQUENCY_RESPONSE",
      frequencies
    }
    sendResponse(response)
  } catch (error) {
    sendError(
      error instanceof Error
        ? error.message
        : "Failed to calculate byte frequency",
      request.id
    )
  }
}

// Store chart instances by canvas (for updates without re-transferring)
const chartInstances = new Map<OffscreenCanvas, unknown>()

/**
 * Handle CHART_RENDER_REQUEST - Render chart on offscreen canvas
 */
async function handleChartRender(request: ChartRenderRequest): Promise<void> {
  logger.log(`Rendering chart (request: ${request.id})`)
  try {
    // Check if we already have a chart instance for this canvas
    const existingChart = chartInstances.get(request.canvas)

    if (existingChart && request.canvas) {
      // Update existing chart with new config
      // Chart.js doesn't have a direct update method, so we'll create a new one
      // But first, destroy the old one if possible
      if (typeof (existingChart as any).destroy === "function") {
        (existingChart as any).destroy()
      }
    }

    // Create new chart instance
    if (request.canvas) {
      const chart = renderChart(request.canvas, request.config)
      chartInstances.set(request.canvas, chart)
    } else {
      // Canvas is null, which means this is an update request
      // We can't update without the canvas, so this is an error
      throw new Error("Canvas is required for chart rendering")
    }

    const response: ChartRenderResponse = {
      id: request.id,
      type: "CHART_RENDER_RESPONSE",
      success: true
    }
    sendResponse(response)
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to render chart",
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
    case "BYTE_FREQUENCY_REQUEST":
      await handleByteFrequency(message)
      break
    case "ENTROPY_REQUEST":
      await handleEntropy(message)
      break
    case "CHI_SQUARE_REQUEST":
      await handleChiSquare(message)
      break
    case "CHART_RENDER_REQUEST":
      await handleChartRender(message)
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
