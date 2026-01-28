/**
 * Client-side API for interacting with the Worker
 */

import type { HexedFile } from "@hexed/file"
import type { StringEncoding, StringMatch } from "@hexed/file/strings"
import { createLogger } from "@hexed/logger"

import { generateMessageId } from "./utils"
import type {
  AutocorrelationRequest,
  AutocorrelationResponse,
  ByteFrequencyRequest,
  ByteFrequencyResponse,
  ByteScatterRequest,
  ByteScatterResponse,
  ChartRenderRequest,
  ChartRenderResponse,
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
  StringsResponse
} from "./types"

const logger = createLogger("worker-client")

type EvaluateOptionsBase = {
  signal?: AbortSignal
  onProgress?: (progress: { processed: number; size: number }) => void
}

type EvaluateAPI<TContext = undefined> = {
  throwIfAborted(): void
  emitProgress(data: { processed: number; size: number }): void
  context: TContext
}
/**
 * Worker client interface
 */
// export interface WorkerClient {
//   search(
//     file: File,
//     pattern: Uint8Array,
//     onProgress?: (progress: number) => void,
//     onMatch?: (matches: Array<{ offset: number; length: number }>) => void,
//     startOffset?: number,
//     endOffset?: number
//   ): Promise<Array<{ offset: number; length: number }>>
//   strings(
//     file: File,
//     options: { minLength: number; encoding: StringEncoding },
//     onProgress?: (progress: number) => void,
//     startOffset?: number,
//     endOffset?: number
//   ): Promise<StringMatch[]>
//   calculateByteFrequency(
//     file: File,
//     onProgress?: (progress: number) => void,
//     startOffset?: number,
//     endOffset?: number
//   ): Promise<number[]>
//   calculateEntropy(
//     file: File,
//     onProgress?: (progress: number) => void,
//     startOffset?: number,
//     endOffset?: number,
//     blockSize?: number
//   ): Promise<{ entropyValues: number[]; offsets: number[]; blockSize: number }>
//   calculateChiSquare(
//     file: File,
//     onProgress?: (progress: number) => void,
//     startOffset?: number,
//     endOffset?: number,
//     blockSize?: number
//   ): Promise<{ chiSquareValues: number[]; offsets: number[]; blockSize: number }>
//   calculateAutocorrelation(
//     file: File,
//     onProgress?: (progress: number) => void,
//     startOffset?: number,
//     endOffset?: number,
//     maxLag?: number
//   ): Promise<{ autocorrelationValues: number[]; lags: number[] }>
//   calculateByteScatter(
//     file: File,
//     onProgress?: (progress: number) => void,
//     startOffset?: number,
//     endOffset?: number,
//     maxPoints?: number
//   ): Promise<{ points: Array<{ x: number; y: number }> }>
//   render(
//     canvas: OffscreenCanvas,
//     config: unknown,
//     onProgress?: (progress: number) => void
//   ): Promise<void>
//   $evaluate<TResult, T extends Record<string, unknown> = {}>(
//     file: File,
//     fn: (file: HexedFile, api: EvaluateAPI<T>) => TResult | Promise<TResult>,
//     options?: {
//       signal?: AbortSignal
//       onProgress?: (progress: { processed: number; size: number }) => void
//       context?: T
//     },
//   ): Promise<TResult>
//   disconnect(): void
// }
export type WorkerClient = ReturnType<typeof createWorkerClient>

/**
 * Pending request tracking
 */
interface PendingRequest {
  resolve: (value: any) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

/**
 * Create a worker client connected to the Worker(s)
 */
export function createWorkerClient(
  mainWorkerConstructor: new () => Worker,
  chartWorkerConstructor?: new () => Worker
) {
  let mainWorker: Worker | null = null
  let chartWorker: Worker | null = null
  const pendingRequests = new Map<string, PendingRequest>()
  const REQUEST_TIMEOUT = 30000 // 30 seconds

  // Progress callbacks mapped by request ID
  const progressCallbacks = new Map<string, (progress: number) => void>()

  // Evaluate progress callbacks mapped by request ID (custom data structure)
  const evaluateProgressCallbacks = new Map<
    string,
    (progress: { processed: number; size: number }) => void
  >()

  // Match callbacks mapped by request ID
  const matchCallbacks = new Map<
    string,
    (matches: Array<{ offset: number; length: number }>) => void
  >()

  // Abort signal handlers mapped by request ID
  const abortSignalHandlers = new Map<string, () => void>()

  /**
   * Handle messages from any worker
   */
  function handleWorkerMessage(
    message: ResponseMessage | ProgressEvent | SearchMatchEvent | ChartRenderResponse | ConnectedResponse | ErrorResponse
  ): void {
    // Handle progress events separately
    if (message.type === "PROGRESS_EVENT") {
      const progressEvent = message as ProgressEvent
      // Check if this is an evaluate progress event (has custom data)
      const evaluateCallback = evaluateProgressCallbacks.get(progressEvent.requestId)
      if (evaluateCallback) {
        evaluateCallback({
          processed: progressEvent.bytesRead,
          size: progressEvent.totalBytes
        })
      } else {
        // Regular progress callback
        const callback = progressCallbacks.get(progressEvent.requestId)
        if (callback) {
          callback(progressEvent.progress)
        }
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
        evaluateProgressCallbacks.delete(message.id)
        matchCallbacks.delete(message.id)
        abortSignalHandlers.delete(message.id)
        pending.reject(new Error(errorMsg))
      } else {
        logger.log(
          `Response received: ${message.type} (request: ${message.id})`
        )
        // Delay cleanup slightly to allow any final progress events to be processed
        // Progress callbacks are also cleaned up in finally blocks, so this is safe
        setTimeout(() => {
          progressCallbacks.delete(message.id)
          evaluateProgressCallbacks.delete(message.id)
          matchCallbacks.delete(message.id)
          abortSignalHandlers.delete(message.id)
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

  /**
   * Initialize the main Worker connection
   */
  function initializeMainWorker(): Worker {
    if (mainWorker) {
      return mainWorker
    }

    try {
      mainWorker = new mainWorkerConstructor()

      // Handle messages from main worker
      mainWorker.onmessage = (
        event: MessageEvent<ResponseMessage | ProgressEvent | SearchMatchEvent>
      ) => {
        handleWorkerMessage(event.data)
      }

      mainWorker.onerror = (error) => {
        logger.log("Main worker error:", error)
        // Reject all pending requests
        for (const pending of Array.from(pendingRequests.values())) {
          clearTimeout(pending.timeout)
          pending.reject(new Error("Main worker connection error"))
        }
        pendingRequests.clear()
        progressCallbacks.clear()
        matchCallbacks.clear()
      }

      return mainWorker
    } catch (error) {
      throw new Error(
        `Failed to create Main Worker: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Initialize the chart Worker connection
   */
  function initializeChartWorker(): Worker {
    if (!chartWorkerConstructor) {
      throw new Error("Chart worker constructor not provided")
    }

    if (chartWorker) {
      return chartWorker
    }

    try {
      chartWorker = new chartWorkerConstructor()

      // Handle messages from chart worker
      chartWorker.onmessage = (
        event: MessageEvent<ChartRenderResponse | ConnectedResponse | ErrorResponse>
      ) => {
        handleWorkerMessage(event.data)
      }

      chartWorker.onerror = (error) => {
        logger.log("Chart worker error:", error)
        // Reject all pending requests
        for (const pending of Array.from(pendingRequests.values())) {
          clearTimeout(pending.timeout)
          pending.reject(new Error("Chart worker connection error"))
        }
        pendingRequests.clear()
        progressCallbacks.clear()
        matchCallbacks.clear()
      }

      return chartWorker
    } catch (error) {
      throw new Error(
        `Failed to create Chart Worker: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Send a request to main worker and wait for response
   */
  function sendMainWorkerRequest<T extends ResponseMessage>(
    request: RequestMessage,
    transfer?: Transferable[]
  ): Promise<T> {
    const worker = initializeMainWorker()
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

  /**
   * Send a request to chart worker and wait for response
   */
  function sendChartWorkerRequest<T extends ChartRenderResponse>(
    request: ChartRenderRequest,
    transfer?: Transferable[]
  ): Promise<T> {
    const worker = initializeChartWorker()
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

  const $evaluate = async <
    TResult,
    TContext extends Record<string, unknown> | undefined = undefined
  >(
    file: File,
    fn: (file: HexedFile, api: EvaluateAPI<TContext>) => TResult | Promise<TResult>,
    options?: EvaluateOptionsBase & (TContext extends undefined ? {} : { context: TContext })
  ): Promise<TResult> => {
    const worker = initializeMainWorker()
    // Serialize function to string
    const functionCode = fn.toString()

    // Generate request ID and signal ID
    const requestId = generateMessageId()
    const signalId = options?.signal ? `${requestId}-signal` : undefined

    logger.log(`Evaluating function (request: ${requestId})`)

    // Set up abort signal listener if provided
    let abortHandler: (() => void) | undefined
    if (options?.signal && signalId) {
      abortHandler = () => {
        logger.log(`Abort signal fired for request: ${requestId}`)
        const abortMessage: EvaluateAbort = {
          id: generateMessageId(),
          type: "EVALUATE_ABORT",
          requestId: signalId,
        }
        try {
          worker.postMessage(abortMessage)
        } catch (error) {
          logger.log("Failed to send abort message:", error)
        }
      }
      options.signal.addEventListener("abort", abortHandler)
      abortSignalHandlers.set(requestId, abortHandler)
    }

    // Register progress callback if provided
    if (options?.onProgress) {
      evaluateProgressCallbacks.set(requestId, options.onProgress)
    }

    const request: EvaluateRequest = {
      id: requestId,
      type: "EVALUATE_REQUEST",
      file,
      functionCode,
      signalId,
      ...(options && 'context' in options ? { context: options.context } : {})
    }

    try {
      const response = await sendMainWorkerRequest<EvaluateResponse>(request)
      logger.log(`Function evaluation completed (request: ${requestId})`)
      return response.result as TResult
    } finally {
      // Clean up
      if (abortHandler && options?.signal) {
        options.signal.removeEventListener("abort", abortHandler)
      }
      abortSignalHandlers.delete(requestId)
      evaluateProgressCallbacks.delete(requestId)
    }
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
        const response = await sendMainWorkerRequest<SearchResponse>(request)
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
        const response = await sendMainWorkerRequest<StringsResponse>(request)
        logger.log(
          `Strings extraction completed, found ${response.matches.length} matches`
        )
        return response.matches
      } finally {
        // Clean up progress callback
        progressCallbacks.delete(request.id)
      }
    },

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
        const response = await sendMainWorkerRequest<ByteFrequencyResponse>(request)
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
        const response = await sendMainWorkerRequest<EntropyResponse>(request)
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
        const response = await sendMainWorkerRequest<ChiSquareResponse>(request)
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

    async calculateAutocorrelation(
      file: File,
      onProgress?: (progress: number) => void,
      startOffset?: number,
      endOffset?: number,
      maxLag?: number
    ): Promise<{ autocorrelationValues: number[]; lags: number[] }> {
      logger.log(`Calculating autocorrelation for file: ${file.name}`)
      const request: AutocorrelationRequest = {
        id: generateMessageId(),
        type: "AUTOCORRELATION_REQUEST",
        file,
        maxLag,
        startOffset,
        endOffset
      }

      // Register progress callback if provided
      if (onProgress) {
        progressCallbacks.set(request.id, onProgress)
      }

      try {
        const response = await sendMainWorkerRequest<AutocorrelationResponse>(request)
        logger.log("Autocorrelation calculation completed")
        return {
          autocorrelationValues: response.autocorrelationValues,
          lags: response.lags
        }
      } finally {
        // Clean up progress callback
        progressCallbacks.delete(request.id)
      }
    },

    async calculateByteScatter(
      file: File,
      onProgress?: (progress: number) => void,
      startOffset?: number,
      endOffset?: number,
      maxPoints?: number
    ): Promise<{ points: Array<{ x: number; y: number }> }> {
      logger.log(`Calculating byte scatter for file: ${file.name}`)
      const request: ByteScatterRequest = {
        id: generateMessageId(),
        type: "BYTE_SCATTER_REQUEST",
        file,
        maxPoints,
        startOffset,
        endOffset
      }

      // Register progress callback if provided
      if (onProgress) {
        progressCallbacks.set(request.id, onProgress)
      }

      try {
        const response = await sendMainWorkerRequest<ByteScatterResponse>(request)
        logger.log("Byte scatter calculation completed")
        return {
          points: response.points
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
      if (!chartWorkerConstructor) {
        throw new Error("Chart worker not available")
      }

      logger.log("Rendering chart on offscreen canvas")
      const request: ChartRenderRequest = {
        id: generateMessageId(),
        type: "CHART_RENDER_REQUEST",
        canvas,
        config
      }

      try {
        // Transfer OffscreenCanvas via transfer list
        // Note: Once transferred, the canvas becomes detached and can't be transferred again
        // This should only be called once per canvas
        await sendChartWorkerRequest<ChartRenderResponse>(request, [canvas])
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
          await sendChartWorkerRequest<ChartRenderResponse>(updateRequest)
        } else {
          throw error
        }
      }
    },

    $evaluate,

    disconnect(): void {
      logger.log("Disconnecting worker client")
      // Reject all pending requests
      for (const pending of Array.from(pendingRequests.values())) {
        clearTimeout(pending.timeout)
        pending.reject(new Error("Worker disconnected"))
      }
      pendingRequests.clear()
      progressCallbacks.clear()
      evaluateProgressCallbacks.clear()
      matchCallbacks.clear()
      abortSignalHandlers.clear()

      if (mainWorker) {
        mainWorker.terminate()
        mainWorker = null
      }

      if (chartWorker) {
        chartWorker.terminate()
        chartWorker = null
      }
    }
  }
}
