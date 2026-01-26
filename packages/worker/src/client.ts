/**
 * Client-side API for interacting with the Worker
 */

import type { StringEncoding, StringMatch } from "@hexed/file/strings"
import { createLogger } from "@hexed/logger"

import type {
  CloseFileRequest,
  ConnectedResponse,
  ErrorResponse,
  FileSizeResponse,
  GetFileSizeRequest,
  OpenFileRequest,
  ProgressEvent,
  RequestMessage,
  ResponseMessage,
  SearchMatchEvent,
  SearchRequest,
  SearchResponse,
  StreamFileRequest,
  StreamFileResponse,
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
  openFile(fileId: string, handle: FileSystemFileHandle): Promise<void>
  getFileSize(fileId: string): Promise<number>
  closeFile(fileId: string): Promise<void>
  streamFile(
    fileId: string,
    onProgress?: (progress: number) => void
  ): Promise<void>
  search(
    fileId: string,
    pattern: Uint8Array,
    onProgress?: (progress: number) => void,
    onMatch?: (matches: Array<{ offset: number; length: number }>) => void,
    startOffset?: number,
    endOffset?: number
  ): Promise<Array<{ offset: number; length: number }>>
  strings(
    fileId: string,
    options: { minLength: number; encoding: StringEncoding },
    onProgress?: (progress: number) => void,
    startOffset?: number,
    endOffset?: number
  ): Promise<StringMatch[]>
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
          // Clean up progress and match callbacks when request completes
          progressCallbacks.delete(message.id)
          matchCallbacks.delete(message.id)

          if (message.type === "ERROR") {
            const errorMsg = (message as ErrorResponse).error
            logger.log(`Error response: ${errorMsg} (request: ${message.id})`)
            pending.reject(new Error(errorMsg))
          } else {
            logger.log(
              `Response received: ${message.type} (request: ${message.id})`
            )
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
    request: RequestMessage
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
        // Transfer FileSystemFileHandle if present
        if (request.type === "OPEN_FILE") {
          // FileSystemFileHandle is not transferable, so we send it directly
          // The worker will receive it and store it
          worker.postMessage(request)
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
    async openFile(
      fileId: string,
      handle: FileSystemFileHandle
    ): Promise<void> {
      logger.log(`Opening file: ${fileId}`)
      const request: OpenFileRequest = {
        id: generateMessageId(),
        type: "OPEN_FILE",
        fileId,
        handle
      }
      await sendRequest<ConnectedResponse>(request)
      logger.log(`File opened: ${fileId}`)
    },

    async getFileSize(fileId: string): Promise<number> {
      logger.log(`Getting file size: ${fileId}`)
      const request: GetFileSizeRequest = {
        id: generateMessageId(),
        type: "GET_FILE_SIZE",
        fileId
      }
      const response = await sendRequest<FileSizeResponse>(request)
      logger.log(`File size: ${fileId} = ${response.size} bytes`)
      return response.size
    },

    async closeFile(fileId: string): Promise<void> {
      logger.log(`Closing file: ${fileId}`)
      const request: CloseFileRequest = {
        id: generateMessageId(),
        type: "CLOSE_FILE",
        fileId
      }
      await sendRequest<ConnectedResponse>(request)
      logger.log(`File closed: ${fileId}`)
    },

    async streamFile(
      fileId: string,
      onProgress?: (progress: number) => void
    ): Promise<void> {
      logger.log(`Streaming file: ${fileId}`)
      const request: StreamFileRequest = {
        id: generateMessageId(),
        type: "STREAM_FILE_REQUEST",
        fileId
      }

      // Register progress callback if provided
      if (onProgress) {
        progressCallbacks.set(request.id, onProgress)
      }

      try {
        await sendRequest<StreamFileResponse>(request)
        logger.log(`File streamed: ${fileId}`)
      } finally {
        // Clean up progress callback
        progressCallbacks.delete(request.id)
      }
    },

    async search(
      fileId: string,
      pattern: Uint8Array,
      onProgress?: (progress: number) => void,
      onMatch?: (matches: Array<{ offset: number; length: number }>) => void,
      startOffset?: number,
      endOffset?: number
    ): Promise<Array<{ offset: number; length: number }>> {
      logger.log(`Searching file: ${fileId}`)
      const request: SearchRequest = {
        id: generateMessageId(),
        type: "SEARCH_REQUEST",
        fileId,
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
        logger.log(
          `Search completed: ${fileId}, found ${response.matches.length} matches`
        )
        return response.matches
      } finally {
        // Clean up callbacks
        progressCallbacks.delete(request.id)
        matchCallbacks.delete(request.id)
      }
    },

    async strings(
      fileId: string,
      options: { minLength: number; encoding: StringEncoding },
      onProgress?: (progress: number) => void,
      startOffset?: number,
      endOffset?: number
    ): Promise<StringMatch[]> {
      logger.log(`Extracting strings from file: ${fileId}`)
      const request: StringsRequest = {
        id: generateMessageId(),
        type: "STRINGS_REQUEST",
        fileId,
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
          `Strings extraction completed: ${fileId}, found ${response.matches.length} matches`
        )
        return response.matches
      } finally {
        // Clean up progress callback
        progressCallbacks.delete(request.id)
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
