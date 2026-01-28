/**
 * Worker entry point for file access
 */

import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  Decimation,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterController
} from "chart.js"

import { HexedFile } from "@hexed/file"
import { extractStrings, type StringEncoding } from "@hexed/file/strings"
import { createLogger } from "@hexed/logger"

import type {
  ChartRenderRequest,
  ChartRenderResponse,
  ConnectedResponse,
  ErrorResponse,
  EvaluateAbort,
  EvaluateAPIOptions,
  EvaluateRequest,
  EvaluateResponse,
  ProgressEvent,
  RequestMessage,
  ResponseMessage,
  StringsRequest,
  StringsResponse,
  WorkerMessage
} from "./types"

// Export ChartConfiguration type for use by plugins
export type { ChartConfiguration }

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  ScatterController,
  Decimation
)
import {
  generateMessageId,
  sendError,
  sendEvaluateResult,
  sendProgress,
  sendResponse
} from "./utils"

const logger = createLogger("worker")

// Chunk size for streaming (1MB)
const STREAM_CHUNK_SIZE = 1024 * 1024

/**
 * Track abort state for evaluate requests
 */
const abortStates = new Map<string, boolean>()

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
 * Store chart instances by canvas (for updates without re-transferring)
 */
const chartInstances = new Map<OffscreenCanvas, unknown>()

/**
 * Generic chart rendering function
 * @param canvas - Offscreen canvas to render on
 * @param config - Chart.js configuration object
 * @returns Chart instance
 */
function renderChart(
  canvas: OffscreenCanvas,
  config: ChartConfiguration
): Chart {
  // Validate config structure
  if (!config || typeof config !== "object") {
    throw new Error("Invalid chart configuration")
  }

  return new Chart(canvas, config)
}

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
        ; (existingChart as any).destroy()
      }
    }

    // Create new chart instance
    if (request.canvas) {
      const chart = renderChart(
        request.canvas,
        request.config as ChartConfiguration
      )
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

    // Create API object with abort, progress, and result methods
    const api: Omit<EvaluateAPIOptions<unknown, unknown>, "context"> = {
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
      },
      emitResult(result: unknown): void {
        const resultEvent = {
          id: generateMessageId(),
          type: "EVALUATE_RESULT_EVENT" as const,
          requestId: request.id,
          result
        }
        sendEvaluateResult(resultEvent)
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
    case "STRINGS_REQUEST":
      await handleStrings(message)
      break
    case "CHART_RENDER_REQUEST":
      await handleChartRender(message)
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
      message.type === "EVALUATE_RESULT_EVENT"
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
