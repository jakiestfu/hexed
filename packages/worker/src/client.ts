/**
 * Client-side API for interacting with the Worker
 */

import type { StringEncoding, StringMatch } from "@hexed/file/strings"
import { createLogger } from "@hexed/logger"

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
  StringsResponse
} from "./types"

const logger = createLogger("worker-client")

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Worker client interface
 */
export interface WorkerClient {
  search(
    file: File,
    pattern: Uint8Array,
    onProgress?: (progress: number) => void,
    onMatch?: (matches: Array<{ offset: number; length: number }>) => void,
    startOffset?: number,
    endOffset?: number
  ): Promise<Array<{ offset: number; length: number }>>
  strings(
    file: File,
    options: { minLength: number; encoding: StringEncoding },
    onProgress?: (progress: number) => void,
    startOffset?: number,
    endOffset?: number
  ): Promise<StringMatch[]>
  charts: {
    calculateByteFrequency(
      file: File,
      onProgress?: (progress: number) => void,
      startOffset?: number,
      endOffset?: number
    ): Promise<number[]>
    calculateEntropy(
      file: File,
      onProgress?: (progress: number) => void,
      startOffset?: number,
      endOffset?: number,
      blockSize?: number
    ): Promise<{ entropyValues: number[]; offsets: number[]; blockSize: number }>
    calculateChiSquare(
      file: File,
      onProgress?: (progress: number) => void,
      startOffset?: number,
      endOffset?: number,
      blockSize?: number
    ): Promise<{ chiSquareValues: number[]; offsets: number[]; blockSize: number }>
    render(
      canvas: OffscreenCanvas,
      config: unknown,
      onProgress?: (progress: number) => void
    ): Promise<void>
  }
  disconnect(): void
}

/**
 * Pending request tracking
 */
interface PendingRequest {
  resolve: (value: any) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

/**
 * Create a worker client connected to the Worker
 */
export function createWorkerClient(
  WorkerConstructor: new () => Worker
): WorkerClient {
  let worker: Worker | null = null
  const pendingRequests = new Map<string, PendingRequest>()
  const REQUEST_TIMEOUT = 30000 // 30 seconds

  // Progress callbacks mapped by request ID
  const progressCallbacks = new Map<string, (progress: number) => void>()

  // Match callbacks mapped by request ID
  const matchCallbacks = new Map<
    string,
    (matches: Array<{ offset: number; length: number }>) => void
  >()

  /**
   * Initialize the Worker connection
   */
  function initialize(): Worker {
    if (worker) {
      return worker
    }

    try {
      worker = new WorkerConstructor()

      // Handle messages from worker
      worker.onmessage = (
        event: MessageEvent<ResponseMessage | ProgressEvent | SearchMatchEvent>
      ) => {
        const message = event.data

        // Handle progress events separately
        if (message.type === "PROGRESS_EVENT") {
          const progressEvent = message as ProgressEvent
          const callback = progressCallbacks.get(progressEvent.requestId)
          if (callback) {
            callback(progressEvent.progress)
          }
          return
        }

        // Handle search match events separately
        if (message.type === "SEARCH_MATCH_EVENT") {
          const matchEvent = message as SearchMatchEvent
          const callback = matchCallbacks.get(matchEvent.requestId)
          if (callback) {
            callback(matchEvent.matches)
          }
          return
        }

        const pending = pendingRequests.get(message.id)

        if (pending) {
          clearTimeout(pending.timeout)
          pendingRequests.delete(message.id)

          if (message.type === "ERROR") {
            const errorMsg = (message as ErrorResponse).error
            logger.log(`Error response: ${errorMsg} (request: ${message.id})`)
            // Clean up callbacks before rejecting
            progressCallbacks.delete(message.id)
            matchCallbacks.delete(message.id)
            pending.reject(new Error(errorMsg))
          } else {
            logger.log(
              `Response received: ${message.type} (request: ${message.id})`
            )
            // Delay cleanup slightly to allow any final progress events to be processed
            // Progress callbacks are also cleaned up in finally blocks, so this is safe
            setTimeout(() => {
              progressCallbacks.delete(message.id)
              matchCallbacks.delete(message.id)
            }, 0)
            pending.resolve(message)
          }
        } else if (message.type === "CONNECTED") {
          // Initial connection acknowledgment - no pending request
          logger.log("Worker connected")
        } else {
          logger.log(`Received response for unknown request: ${message.id}`)
        }
      }

      worker.onerror = (error) => {
        logger.log("Worker error:", error)
        // Reject all pending requests
        for (const pending of Array.from(pendingRequests.values())) {
          clearTimeout(pending.timeout)
          pending.reject(new Error("Worker connection error"))
        }
        pendingRequests.clear()
        progressCallbacks.clear()
        matchCallbacks.clear()
      }

      return worker
    } catch (error) {
      throw new Error(
        `Failed to create Worker: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Send a request and wait for response
   */
  function sendRequest<T extends ResponseMessage>(
    request: RequestMessage,
    transfer?: Transferable[]
  ): Promise<T> {
    const worker = initialize()
    logger.log(`Sending request: ${request.type} (id: ${request.id})`)

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        logger.log(`Request timeout: ${request.type} (id: ${request.id})`)
        pendingRequests.delete(request.id)
        reject(new Error(`Request timeout: ${request.type}`))
      }, REQUEST_TIMEOUT)

      pendingRequests.set(request.id, {
        resolve: (response: T) => {
          resolve(response)
        },
        reject,
        timeout
      })

      try {
        // File objects are structured cloneable and can be passed via postMessage
        // OffscreenCanvas needs to be transferred via transfer list
        if (transfer && transfer.length > 0) {
          worker.postMessage(request, transfer)
        } else {
          worker.postMessage(request)
        }
      } catch (error) {
        logger.log(`Failed to send request: ${request.type}`, error)
        clearTimeout(timeout)
        pendingRequests.delete(request.id)
        reject(
          new Error(
            `Failed to send request: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        )
      }
    })
  }

  return {
    async search(
      file: File,
      pattern: Uint8Array,
      onProgress?: (progress: number) => void,
      onMatch?: (matches: Array<{ offset: number; length: number }>) => void,
      startOffset?: number,
      endOffset?: number
    ): Promise<Array<{ offset: number; length: number }>> {
      logger.log(`Searching file: ${file.name}`)
      const request: SearchRequest = {
        id: generateMessageId(),
        type: "SEARCH_REQUEST",
        file,
        pattern,
        startOffset,
        endOffset
      }

      // Register progress callback if provided
      if (onProgress) {
        progressCallbacks.set(request.id, onProgress)
      }

      // Register match callback if provided
      if (onMatch) {
        matchCallbacks.set(request.id, onMatch)
      }

      try {
        const response = await sendRequest<SearchResponse>(request)
        logger.log(`Search completed, found ${response.matches.length} matches`)
        return response.matches
      } finally {
        // Clean up callbacks
        progressCallbacks.delete(request.id)
        matchCallbacks.delete(request.id)
      }
    },

    async strings(
      file: File,
      options: { minLength: number; encoding: StringEncoding },
      onProgress?: (progress: number) => void,
      startOffset?: number,
      endOffset?: number
    ): Promise<StringMatch[]> {
      logger.log(`Extracting strings from file: ${file.name}`)
      const request: StringsRequest = {
        id: generateMessageId(),
        type: "STRINGS_REQUEST",
        file,
        minLength: options.minLength,
        encoding: options.encoding,
        startOffset,
        endOffset
      }

      // Register progress callback if provided
      if (onProgress) {
        progressCallbacks.set(request.id, onProgress)
      }

      try {
        const response = await sendRequest<StringsResponse>(request)
        logger.log(
          `Strings extraction completed, found ${response.matches.length} matches`
        )
        return response.matches
      } finally {
        // Clean up progress callback
        progressCallbacks.delete(request.id)
      }
    },

    charts: {
      async calculateByteFrequency(
        file: File,
        onProgress?: (progress: number) => void,
        startOffset?: number,
        endOffset?: number
      ): Promise<number[]> {
        logger.log(`Calculating byte frequency for file: ${file.name}`)
        const request: ByteFrequencyRequest = {
          id: generateMessageId(),
          type: "BYTE_FREQUENCY_REQUEST",
          file,
          startOffset,
          endOffset
        }

        // Register progress callback if provided
        if (onProgress) {
          progressCallbacks.set(request.id, onProgress)
        }

        try {
          const response = await sendRequest<ByteFrequencyResponse>(request)
          logger.log("Byte frequency calculation completed")
          return response.frequencies
        } finally {
          // Clean up progress callback
          progressCallbacks.delete(request.id)
        }
      },

      async calculateEntropy(
        file: File,
        onProgress?: (progress: number) => void,
        startOffset?: number,
        endOffset?: number,
        blockSize?: number
      ): Promise<{ entropyValues: number[]; offsets: number[]; blockSize: number }> {
        logger.log(`Calculating entropy for file: ${file.name}`)
        const request: EntropyRequest = {
          id: generateMessageId(),
          type: "ENTROPY_REQUEST",
          file,
          blockSize,
          startOffset,
          endOffset
        }

        // Register progress callback if provided
        if (onProgress) {
          progressCallbacks.set(request.id, onProgress)
        }

        try {
          const response = await sendRequest<EntropyResponse>(request)
          logger.log("Entropy calculation completed")
          return {
            entropyValues: response.entropyValues,
            offsets: response.offsets,
            blockSize: response.blockSize
          }
        } finally {
          // Clean up progress callback
          progressCallbacks.delete(request.id)
        }
      },

      async calculateChiSquare(
        file: File,
        onProgress?: (progress: number) => void,
        startOffset?: number,
        endOffset?: number,
        blockSize?: number
      ): Promise<{ chiSquareValues: number[]; offsets: number[]; blockSize: number }> {
        logger.log(`Calculating chi-square for file: ${file.name}`)
        const request: ChiSquareRequest = {
          id: generateMessageId(),
          type: "CHI_SQUARE_REQUEST",
          file,
          blockSize,
          startOffset,
          endOffset
        }

        // Register progress callback if provided
        if (onProgress) {
          progressCallbacks.set(request.id, onProgress)
        }

        try {
          const response = await sendRequest<ChiSquareResponse>(request)
          logger.log("Chi-square calculation completed")
          return {
            chiSquareValues: response.chiSquareValues,
            offsets: response.offsets,
            blockSize: response.blockSize
          }
        } finally {
          // Clean up progress callback
          progressCallbacks.delete(request.id)
        }
      },

      async render(
        canvas: OffscreenCanvas,
        config: unknown,
        onProgress?: (progress: number) => void
      ): Promise<void> {
        logger.log("Rendering chart on offscreen canvas")
        const request: ChartRenderRequest = {
          id: generateMessageId(),
          type: "CHART_RENDER_REQUEST",
          canvas,
          config
        }

        // Register progress callback if provided
        if (onProgress) {
          progressCallbacks.set(request.id, onProgress)
        }

        try {
          // Transfer OffscreenCanvas via transfer list
          // Note: Once transferred, the canvas becomes detached and can't be transferred again
          // This should only be called once per canvas
          await sendRequest<ChartRenderResponse>(request, [canvas])
          logger.log("Chart rendering completed")
        } catch (error) {
          // If canvas is already detached, it means we're trying to transfer it again
          // This shouldn't happen if used correctly, but handle gracefully
          if (error instanceof Error && error.message.includes("detached")) {
            logger.log("Canvas already transferred, sending update without transfer")
            // Send request without transfer list (canvas reference will be null in worker)
            // Worker should handle this by updating existing chart
            const updateRequest: ChartRenderRequest = {
              ...request,
              canvas: null as unknown as OffscreenCanvas // Send null to indicate update
            }
            await sendRequest<ChartRenderResponse>(updateRequest)
          } else {
            throw error
          }
        } finally {
          // Clean up progress callback
          progressCallbacks.delete(request.id)
        }
      }
    },

    disconnect(): void {
      logger.log("Disconnecting worker client")
      // Reject all pending requests
      for (const pending of Array.from(pendingRequests.values())) {
        clearTimeout(pending.timeout)
        pending.reject(new Error("Worker disconnected"))
      }
      pendingRequests.clear()
      progressCallbacks.clear()
      matchCallbacks.clear()

      if (worker) {
        worker.terminate()
        worker = null
      }
    }
  }
}
