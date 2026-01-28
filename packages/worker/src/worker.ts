/**
 * Worker entry point for file access
 */

import { HexedFile } from "@hexed/file"
import { extractStrings, type StringEncoding } from "@hexed/file/strings"
import { createLogger } from "@hexed/logger"

import type {
  AutocorrelationRequest,
  AutocorrelationResponse,
  ByteFrequencyRequest,
  ByteFrequencyResponse,
  ByteScatterRequest,
  ByteScatterResponse,
  ChiSquareRequest,
  ChiSquareResponse,
  ConnectedResponse,
  EntropyRequest,
  EntropyResponse,
  ErrorResponse,
  EvaluateAbort,
  EvaluateRequest,
  EvaluateResponse,
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
import {
  generateMessageId,
  sendError,
  sendProgress,
  sendResponse,
  sendSearchMatch
} from "./utils"

const logger = createLogger("worker")

// Chunk size for streaming (1MB)
const STREAM_CHUNK_SIZE = 1024 * 1024

/**
 * Track abort state for evaluate requests
 */
const abortStates = new Map<string, boolean>()

/**
 * EvaluateAPI type for use in evaluated functions
 */
export type EvaluateAPI<TContext = undefined> = {
  emitProgress: (p: { processed: number; size: number }) => void
  throwIfAborted: () => void
  context: TContext
}

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
// function getBlockSize(fileSize: number): number {
//   // return 32;
//   // if (fileSize < 1024) return 32 // < 1KB: 32 bytes (~32 points)
//   // if (fileSize < 10 * 1024) return 128 // < 10KB: 128 bytes (~80 points)
//   if (fileSize < 100 * 1024) return 32 // < 100KB: 512 bytes (~200 points)
//   if (fileSize < 1024 * 1024) return 2048 // < 1MB: 2KB (~512 points)
//   return STREAM_CHUNK_SIZE // >= 1MB: 1MB chunks
// }
const TARGET_POINTS = 512
const MIN_BLOCK = 32
const MAX_BLOCK = 1024 * 1024
export const getBlockSize = (fileSize: number): number => {
  const raw = Math.floor(fileSize / TARGET_POINTS)

  // round to nice powers of two
  const pow2 = Math.pow(2, Math.round(Math.log2(raw)))

  return Math.max(MIN_BLOCK, Math.min(pow2, MAX_BLOCK))
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
 * Calculate autocorrelation for a data array at different lag values
 * Autocorrelation measures how correlated the data is with itself at different offsets
 * Formula: r(k) = Σ((x[i] - mean) * (x[i+k] - mean)) / Σ((x[i] - mean)^2)
 * Returns values between -1 and 1, where:
 *   1 = perfect positive correlation
 *   -1 = perfect negative correlation
 *   0 = no correlation
 * @param data - The byte array to analyze
 * @param maxLag - Maximum lag to calculate (default 256)
 * @returns Array of autocorrelation values, one per lag from 1 to maxLag
 */
function calculateAutocorrelation(
  data: Uint8Array,
  maxLag: number = 256
): number[] {
  const n = data.length
  if (n < 2) return []

  // Calculate mean
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += data[i]
  }
  const mean = sum / n

  // Calculate variance (denominator for normalization)
  let variance = 0
  for (let i = 0; i < n; i++) {
    const diff = data[i] - mean
    variance += diff * diff
  }

  if (variance === 0) {
    // All values are the same, return zeros
    return new Array(Math.min(maxLag, n - 1)).fill(0)
  }

  // Calculate autocorrelation for each lag
  const autocorrelations: number[] = []
  const actualMaxLag = Math.min(maxLag, n - 1)

  for (let k = 1; k <= actualMaxLag; k++) {
    let correlation = 0
    const validPairs = n - k

    for (let i = 0; i < validPairs; i++) {
      correlation += (data[i] - mean) * (data[i + k] - mean)
    }

    // Normalize by variance
    autocorrelations.push(correlation / variance)
  }

  return autocorrelations
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

/**
 * Maximum data size to process for autocorrelation (10MB)
 * For larger files, we'll sample the data to avoid memory issues
 */
const MAX_AUTOCORRELATION_SIZE = 10 * 1024 * 1024

/**
 * Handle AUTOCORRELATION_REQUEST - Calculate autocorrelation across file
 * For large files, samples the data to avoid memory issues and improve performance
 */
async function handleAutocorrelation(
  request: AutocorrelationRequest
): Promise<void> {
  logger.log(`Calculating autocorrelation (request: ${request.id})`)
  try {
    const fileSize = request.file.size
    const startOffset = request.startOffset ?? 0
    const endOffset = request.endOffset ?? fileSize
    const searchRange = endOffset - startOffset
    const maxLag = request.maxLag ?? 256

    // Determine if we need to sample the data
    const needsSampling = searchRange > MAX_AUTOCORRELATION_SIZE
    const targetSize = needsSampling ? MAX_AUTOCORRELATION_SIZE : searchRange
    const sampleStep = needsSampling ? Math.floor(searchRange / targetSize) : 1

    logger.log(
      `Processing autocorrelation: range=${searchRange}, sampling=${needsSampling}, step=${sampleStep}, targetSize=${targetSize}`
    )

    // Read and sample data uniformly across the entire range
    const data = new Uint8Array(targetSize)
    let dataIndex = 0
    let bytesRead = 0
    let nextSamplePosition = 0 // Absolute position for next sample

    while (bytesRead < searchRange && dataIndex < targetSize) {
      const chunkStart = startOffset + bytesRead
      const chunkEnd = Math.min(
        chunkStart + STREAM_CHUNK_SIZE,
        startOffset + searchRange
      )

      // Read chunk
      const chunk = await readByteRange(request.file, chunkStart, chunkEnd)

      if (needsSampling) {
        // Sample uniformly across the entire file range
        // Find which bytes in this chunk should be sampled
        const chunkStartAbsolute = chunkStart - startOffset
        const chunkEndAbsolute = chunkEnd - startOffset

        // Find the first sample position in or after this chunk
        while (
          nextSamplePosition < chunkStartAbsolute &&
          dataIndex < targetSize
        ) {
          nextSamplePosition += sampleStep
        }

        // Sample bytes in this chunk
        while (
          nextSamplePosition >= chunkStartAbsolute &&
          nextSamplePosition < chunkEndAbsolute &&
          dataIndex < targetSize
        ) {
          const offsetInChunk = nextSamplePosition - chunkStartAbsolute
          if (offsetInChunk < chunk.length) {
            data[dataIndex++] = chunk[offsetInChunk]
          }
          nextSamplePosition += sampleStep
        }
      } else {
        // Use all data
        const copyLength = Math.min(chunk.length, targetSize - dataIndex)
        data.set(chunk.subarray(0, copyLength), dataIndex)
        dataIndex += copyLength
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

    // Use only the data we actually filled
    const actualData = data.subarray(0, dataIndex)

    // Calculate autocorrelation
    const autocorrelationValues = calculateAutocorrelation(actualData, maxLag)

    // Generate lag array
    const lags = Array.from(
      { length: autocorrelationValues.length },
      (_, i) => i + 1
    )

    logger.log(
      `Autocorrelation calculation completed: processed ${actualData.length} bytes (${needsSampling ? `sampled from ${searchRange}` : "full range"}), calculated ${autocorrelationValues.length} lags`
    )
    const response: AutocorrelationResponse = {
      id: request.id,
      type: "AUTOCORRELATION_RESPONSE",
      autocorrelationValues,
      lags
    }
    sendResponse(response)
  } catch (error) {
    sendError(
      error instanceof Error
        ? error.message
        : "Failed to calculate autocorrelation",
      request.id
    )
  }
}

/**
 * Maximum points to display in scatter plot (default 10000)
 * For larger files, we'll sample the data uniformly
 */
const DEFAULT_MAX_SCATTER_POINTS = 10000

/**
 * Handle BYTE_SCATTER_REQUEST - Create scatter plot of offset vs byte values
 * Samples data uniformly if file is large to ensure performance
 */
async function handleByteScatter(request: ByteScatterRequest): Promise<void> {
  logger.log(`Calculating byte scatter (request: ${request.id})`)
  try {
    const fileSize = request.file.size
    const startOffset = request.startOffset ?? 0
    const endOffset = request.endOffset ?? fileSize
    const searchRange = endOffset - startOffset
    const maxPoints = request.maxPoints ?? DEFAULT_MAX_SCATTER_POINTS

    // Determine if we need to sample the data
    const needsSampling = searchRange > maxPoints
    const targetPoints = Math.min(searchRange, maxPoints)
    const sampleStep = needsSampling
      ? Math.floor(searchRange / targetPoints)
      : 1

    logger.log(
      `Processing byte scatter: range=${searchRange}, sampling=${needsSampling}, step=${sampleStep}, targetPoints=${targetPoints}`
    )

    // Collect points
    const points: Array<{ x: number; y: number }> = []
    let bytesRead = 0
    let nextSamplePosition = 0 // Absolute position for next sample

    while (bytesRead < searchRange && points.length < targetPoints) {
      const chunkStart = startOffset + bytesRead
      const chunkEnd = Math.min(
        chunkStart + STREAM_CHUNK_SIZE,
        startOffset + searchRange
      )

      // Read chunk
      const chunk = await readByteRange(request.file, chunkStart, chunkEnd)

      if (needsSampling) {
        // Sample uniformly across the entire file range
        const chunkStartAbsolute = chunkStart - startOffset
        const chunkEndAbsolute = chunkEnd - startOffset

        // Find the first sample position in or after this chunk
        while (
          nextSamplePosition < chunkStartAbsolute &&
          points.length < targetPoints
        ) {
          nextSamplePosition += sampleStep
        }

        // Sample bytes in this chunk
        while (
          nextSamplePosition >= chunkStartAbsolute &&
          nextSamplePosition < chunkEndAbsolute &&
          points.length < targetPoints
        ) {
          const offsetInChunk = nextSamplePosition - chunkStartAbsolute
          if (offsetInChunk < chunk.length) {
            const absoluteOffset = startOffset + nextSamplePosition
            points.push({
              x: absoluteOffset,
              y: chunk[offsetInChunk]
            })
          }
          nextSamplePosition += sampleStep
        }
      } else {
        // Use all data
        for (let i = 0; i < chunk.length && points.length < targetPoints; i++) {
          const absoluteOffset = chunkStart + i
          points.push({
            x: absoluteOffset,
            y: chunk[i]
          })
        }
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
      `Byte scatter calculation completed: processed ${points.length} points (${needsSampling ? `sampled from ${searchRange} bytes` : "full range"})`
    )
    const response: ByteScatterResponse = {
      id: request.id,
      type: "BYTE_SCATTER_RESPONSE",
      points
    }
    sendResponse(response)
  } catch (error) {
    sendError(
      error instanceof Error
        ? error.message
        : "Failed to calculate byte scatter",
      request.id
    )
  }
}

/**
 * Handle EVALUATE_REQUEST - Execute serialized function in worker context
 */
async function handleEvaluate(request: EvaluateRequest): Promise<void> {
  logger.log(`Evaluating function (request: ${request.id})`)
  try {
    const { file, functionCode, signalId, context } = request
    // console.log("functionCode", functionCode)
    // Initialize abort state if signalId provided
    if (signalId) {
      abortStates.set(signalId, false)
    }

    // Create abort signal for HexedFile
    const abortController = new AbortController()
    const signal = abortController.signal

    // Create API object with abort and progress methods
    const api: Omit<EvaluateAPI, "context"> = {
      throwIfAborted(): void {
        if (signalId && abortStates.get(signalId)) {
          abortController.abort()
          throw new DOMException("Aborted", "AbortError")
        }
        if (signal.aborted) {
          throw new DOMException("Aborted", "AbortError")
        }
      },
      emitProgress(data: { processed: number; size: number }): void {
        const progress = Math.min(
          100,
          Math.round((data.processed / data.size) * 100)
        )
        const progressEvent: ProgressEvent = {
          id: generateMessageId(),
          type: "PROGRESS_EVENT",
          requestId: request.id,
          progress,
          bytesRead: data.processed,
          totalBytes: data.size
        }
        sendProgress(progressEvent)
      }
    }

    // Create HexedFile instance
    const hexedFile = new HexedFile(file)

    // Check abort state before execution
    api.throwIfAborted()

    const code = `
"use strict";

const __fn = (${functionCode});

return (async () => {
  try {
    return await __fn(file, api);
  } catch (error) {
    // Pass AbortError through untouched
    if (
      error &&
      typeof error === "object" &&
      error.name === "AbortError"
    ) {
      throw error;
    }

    throw error;
  }
})();
`

    // Create function in worker context
    // Use Function constructor to create a function that receives file and api
    const fn = new Function("file", "api", "context", code)

    const result = await Promise.resolve(fn(hexedFile, {
      ...api,
      context,
    }))
    // Clean up abort state
    if (signalId) {
      abortStates.delete(signalId)
    }

    // Send response
    const response: EvaluateResponse = {
      id: request.id,
      type: "EVALUATE_RESPONSE",
      result
    }
    sendResponse(response)
  } catch (error) {
    // Clean up abort state on error
    if (request.signalId) {
      abortStates.delete(request.signalId)
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      sendError("Operation aborted", request.id)
    } else {
      sendError(
        error instanceof Error ? error.message : "Failed to evaluate function",
        request.id
      )
    }
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
    case "AUTOCORRELATION_REQUEST":
      await handleAutocorrelation(message)
      break
    case "BYTE_SCATTER_REQUEST":
      await handleByteScatter(message)
      break
    case "EVALUATE_REQUEST":
      await handleEvaluate(message)
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

    // Handle abort messages separately
    if (message.type === "EVALUATE_ABORT") {
      const abortMessage = message as EvaluateAbort
      // The requestId in abort message is the signalId
      abortStates.set(abortMessage.requestId, true)
      logger.log(
        `Abort signal received for signalId: ${abortMessage.requestId}`
      )
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
