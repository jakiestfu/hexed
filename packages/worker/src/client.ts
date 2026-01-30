/**
 * Client-side API for interacting with the Worker
 */

import type { HexedFile } from "@hexed/file"
import { createLogger } from "@hexed/logger"

import type {
  ChartRenderRequest,
  ChartRenderResponse,
  ConnectedResponse,
  ErrorResponse,
  EvaluateAbort,
  EvaluateAPI,
  EvaluateRequest,
  EvaluateResponse,
  EvaluateResultEvent,
  ProgressEvent,
  RequestMessage,
  ResponseMessage
} from "./types"
import { generateMessageId } from "./utils"

const logger = createLogger("worker-client")

type EvaluateOptionsBase<TResult = unknown> = {
  signal?: AbortSignal
  onProgress?: (progress: { processed: number; size: number }) => void
  onResult?: (result: TResult) => void
}

/**
 * Parse and wrap string function code to match EvaluateAPI signature
 * Handles export default, import statements, and wraps functions that take (file) to take (file, api)
 */
function parseFunctionCode(functionCode: string): string {
  let code = functionCode.trim()

  // Remove import statements (they're not needed in the evaluated function)
  code = code.replace(/^import\s+.*?from\s+['"].*?['"];?\s*/gm, "")

  // Extract function if it's an export default
  if (code.includes("export default")) {
    const match = code.match(/export\s+default\s+(.+)/s)
    if (match) {
      code = match[1].trim()
    }
  }

  // Check if function already takes (file, api) parameters
  // This is a simple heuristic - check if the function signature contains both "file" and "api"
  const hasApiParameter = /\([^)]*\bapi\b[^)]*\)/.test(code) ||
    /=>\s*\{[^}]*\bapi\b/.test(code)

  if (hasApiParameter) {
    // Function already matches EvaluateAPI signature, use as-is
    return code
  }

  // Wrap function to match EvaluateAPI signature
  // User's function takes (file) and returns Promise<TResult>
  // We wrap it to take (file, api) and call the user's function with file
  return `async (file, api) => {
    const userFn = ${code};
    return await userFn(file);
  }`
}

export type WorkerClient = ReturnType<typeof createWorkerClient>

/**git sta
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
export function createWorkerClient(mainWorkerConstructor: new () => Worker) {
  let mainWorker: Worker | null = null
  const pendingRequests = new Map<string, PendingRequest>()
  const REQUEST_TIMEOUT = 30000 // 30 seconds

  // Progress callbacks mapped by request ID
  const progressCallbacks = new Map<string, (progress: number) => void>()

  // Evaluate progress callbacks mapped by request ID (custom data structure)
  const evaluateProgressCallbacks = new Map<
    string,
    (progress: { processed: number; size: number }) => void
  >()

  // Evaluate result callbacks mapped by request ID
  const evaluateResultCallbacks = new Map<string, (result: unknown) => void>()

  // Abort signal handlers mapped by request ID
  const abortSignalHandlers = new Map<string, () => void>()

  /**
   * Handle messages from any worker
   */
  function handleWorkerMessage(
    message:
      | ResponseMessage
      | ProgressEvent
      | EvaluateResultEvent
      | ChartRenderResponse
      | ConnectedResponse
      | ErrorResponse
  ): void {
    // Handle progress events separately
    if (message.type === "PROGRESS_EVENT") {
      const progressEvent = message as ProgressEvent
      // Check if this is an evaluate progress event (has custom data)
      const evaluateCallback = evaluateProgressCallbacks.get(
        progressEvent.requestId
      )
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

    // Handle evaluate result events separately
    if (message.type === "EVALUATE_RESULT_EVENT") {
      const resultEvent = message as EvaluateResultEvent
      const callback = evaluateResultCallbacks.get(resultEvent.requestId)
      if (callback) {
        callback(resultEvent.result)
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
        evaluateResultCallbacks.delete(message.id)
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
          evaluateResultCallbacks.delete(message.id)
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
        event: MessageEvent<
          ResponseMessage | ProgressEvent | EvaluateResultEvent
        >
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
      }

      return mainWorker
    } catch (error) {
      throw new Error(
        `Failed to create Main Worker: ${error instanceof Error ? error.message : "Unknown error"}`
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
   * Evaluate a function in the worker context
   * 
   * NOTE FOR PLUGIN AUTHORS / AI CODEGEN:
   *
   * The function passed to `evaluate` is STRINGIFIED and EXECUTED INSIDE A WEB WORKER.
   * It does NOT run in the host JS environment.
   *
   * When writing the `fn` callback:
   * - ✅ Only use:
   *   - the `file` argument
   *   - the `api` argument (including `api.context` if provided)
   *   - local variables declared inside the function
   *
   * - ❌ Do NOT:
   *   - import modules or use `require`
   *   - reference variables from outer scope (closures WILL be lost)
   *   - access DOM / window / document / globalThis
   *   - rely on `this`
   *   - use TypeScript-only syntax (types, generics, `as`, enums, etc.)
   *
   * - ⚠️ Execution details:
   *   - The function may be `async` or sync
   *   - It may be aborted via `AbortSignal`; long loops should check for abort via `api.throwIfAborted()`
   *   - Progress updates should be reported via `api.emitProgress(...)`
   *
   * - 📦 Data constraints:
   *   - The return value must be structured-cloneable
   *   - `api.context` (if provided) is structured-cloned into the worker
   *
   * Write this function as if it lives in a standalone `.js` file with NO imports.
   */
  const evaluate = async <
    TResult,
    TContext extends Record<string, unknown> | undefined = undefined
  >(
    file: HexedFile,
    fn: EvaluateAPI<TResult, TContext> | string,
    options?: EvaluateOptionsBase<TResult> &
      (TContext extends undefined ? {} : { context: TContext })
  ): Promise<TResult> => {
    const worker = initializeMainWorker()
    // Serialize function to string or parse string function code
    const functionCode = typeof fn === "string" ? parseFunctionCode(fn) : fn.toString()

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
          requestId: signalId
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

    // Register result callback if provided
    if (options?.onResult) {
      evaluateResultCallbacks.set(
        requestId,
        options.onResult as (result: unknown) => void
      )
    }

    const request: EvaluateRequest = {
      id: requestId,
      type: "EVALUATE_REQUEST",
      file: file.getFile()!,
      functionCode,
      signalId,
      ...(options && "context" in options && options.context !== undefined
        ? { context: options.context as Record<string, unknown> }
        : {})
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
      evaluateResultCallbacks.delete(requestId)
    }
  }

  return {
    async render(
      canvas: OffscreenCanvas,
      config: unknown,
      devicePixelRatio?: number
    ): Promise<void> {
      logger.log("Rendering chart on offscreen canvas")
      const request: ChartRenderRequest = {
        id: generateMessageId(),
        type: "CHART_RENDER_REQUEST",
        canvas,
        config,
        devicePixelRatio
      }

      try {
        // Transfer OffscreenCanvas via transfer list
        // Note: Once transferred, the canvas becomes detached and can't be transferred again
        // This should only be called once per canvas
        await sendMainWorkerRequest<ChartRenderResponse>(request, [canvas])
        logger.log("Chart rendering completed")
      } catch (error) {
        // If canvas is already detached, it means we're trying to transfer it again
        // This shouldn't happen if used correctly, but handle gracefully
        if (error instanceof Error && error.message.includes("detached")) {
          logger.log(
            "Canvas already transferred, sending update without transfer"
          )
          // Send request without transfer list (canvas reference will be null in worker)
          // Worker should handle this by updating existing chart
          const updateRequest: ChartRenderRequest = {
            ...request,
            canvas: null as unknown as OffscreenCanvas // Send null to indicate update
          }
          await sendMainWorkerRequest<ChartRenderResponse>(updateRequest)
        } else {
          throw error
        }
      }
    },

    evaluate,

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
      evaluateResultCallbacks.clear()
      abortSignalHandlers.clear()

      if (mainWorker) {
        mainWorker.terminate()
        mainWorker = null
      }
    }
  }
}
