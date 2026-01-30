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
import { createLogger } from "@hexed/logger"

import type {
  ChartEvaluateRequest,
  ChartEvaluateResponse,
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
  WorkerMessage
} from "./types"
import {
  generateMessageId,
  sendError,
  sendEvaluateResult,
  sendProgress,
  sendResponse
} from "./utils"

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

const logger = createLogger("worker")

/**
 * Track abort state for evaluate requests
 */
const abortStates = new Map<string, boolean>()

/**
 * Store chart instances by canvas
 * Note: Since we recreate the canvas each time, each canvas will only be used once
 * We keep this map to destroy old charts before creating new ones if needed
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

  // @ts-ignore
  return new Chart(canvas, config)
}

/**
 * Handle CHART_RENDER_REQUEST - Render chart on offscreen canvas
 */
async function handleChartRender(request: ChartRenderRequest): Promise<void> {
  logger.log(`Rendering chart (request: ${request.id})`)
  try {
    if (!request.canvas) {
      throw new Error("Canvas is required for chart rendering")
    }

    // Check if we already have a chart instance for this canvas
    // (This shouldn't happen with the new approach, but we clean up just in case)
    const existingChart = chartInstances.get(request.canvas)
    if (existingChart) {
      // Destroy the old chart before creating a new one
      if (typeof (existingChart as any).destroy === "function") {
        ;(existingChart as any).destroy()
      }
      chartInstances.delete(request.canvas)
    }

    // Merge devicePixelRatio into chart config if provided
    const baseConfig = request.config as ChartConfiguration
    const chartConfig: ChartConfiguration = {
      ...baseConfig,
      options: {
        ...(baseConfig.options || {}),
        ...(request.devicePixelRatio !== undefined
          ? { devicePixelRatio: request.devicePixelRatio }
          : {})
      }
    }

    // Create new chart instance
    const chart = renderChart(request.canvas, chartConfig)
    chartInstances.set(request.canvas, chart)

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
 * Handle CHART_EVALUATE_REQUEST - Execute visualization function and render chart on canvas
 */
async function handleChartEvaluate(
  request: ChartEvaluateRequest
): Promise<void> {
  logger.log(`Evaluating and rendering chart (request: ${request.id})`)
  try {
    const { canvas, file, functionCode, signalId, context, devicePixelRatio } =
      request

    if (!canvas) {
      throw new Error("Canvas is required for chart rendering")
    }

    // Check if we already have a chart instance for this canvas
    const existingChart = chartInstances.get(canvas)
    if (existingChart) {
      // Destroy the old chart before creating a new one
      if (typeof (existingChart as any).destroy === "function") {
        ;(existingChart as any).destroy()
      }
      chartInstances.delete(canvas)
    }

    // Initialize abort state if signalId provided
    if (signalId) {
      abortStates.set(signalId, false)
    }

    // Create abort signal for HexedFile
    const abortController = new AbortController()
    const signal = abortController.signal

    // Create API object with abort, progress, and result methods
    const api: Omit<
      EvaluateAPIOptions<ChartConfiguration, unknown>,
      "context"
    > = {
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
      emitResult(result: ChartConfiguration): void {
        // Not used for chart evaluation, but keep for API compatibility
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

const __fn = ${functionCode}

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
    const fn = new Function("file", "api", "context", code)

    // Execute visualization function to get chart config
    const chartConfig = (await Promise.resolve(
      fn(hexedFile, {
        ...api,
        context
      })
    )) as ChartConfiguration

    // Clean up abort state
    if (signalId) {
      abortStates.delete(signalId)
    }

    // Merge devicePixelRatio into chart config if provided
    const finalConfig: ChartConfiguration = {
      ...chartConfig,
      options: {
        ...(chartConfig.options || {}),
        ...(devicePixelRatio !== undefined ? { devicePixelRatio } : {})
      }
    }

    // Render chart on canvas
    const chart = renderChart(canvas, finalConfig)
    chartInstances.set(canvas, chart)

    const response: ChartEvaluateResponse = {
      id: request.id,
      type: "CHART_EVALUATE_RESPONSE",
      success: true
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
        error instanceof Error
          ? error.message
          : "Failed to evaluate and render chart",
        request.id
      )
    }
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

    const result = await Promise.resolve(
      fn(hexedFile, {
        ...api,
        context
      })
    )
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
    case "CHART_RENDER_REQUEST":
      await handleChartRender(message)
      break
    case "CHART_EVALUATE_REQUEST":
      await handleChartEvaluate(message)
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
  // @ts-ignore
  self.onerror = (error: ErrorEvent) => {
    logger.log("Worker error:", error)
  }
}
