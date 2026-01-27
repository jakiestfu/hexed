/**
 * Chart worker entry point for chart rendering
 */

import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Decimation,
  ChartConfiguration
} from "chart.js"
import { createLogger } from "@hexed/logger"

import {
  generateMessageId,
  sendError,
  sendResponse
} from "./utils"
import type {
  ChartRenderRequest,
  ChartRenderResponse,
  ConnectedResponse,
  ErrorResponse
} from "./types"

/**
 * Union type of all messages for the chart worker
 */
type ChartWorkerMessage =
  | ChartRenderRequest
  | ChartRenderResponse
  | ConnectedResponse
  | ErrorResponse

export type { ChartConfiguration } from "chart.js"

const logger = createLogger("chart-worker")

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Decimation
)

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
      const chart = renderChart(request.canvas, request.config as ChartConfiguration)
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
 * Worker global scope handler
 */
if (typeof self !== "undefined") {
  logger.log("Chart worker initialized")
  // Send connection acknowledgment on startup
  const response: ConnectedResponse = {
    id: generateMessageId(),
    type: "CONNECTED"
  }
  sendResponse(response)

  // Handle messages from client
  self.onmessage = (event: MessageEvent<ChartWorkerMessage>) => {
    const message = event.data
    // Ignore response messages (they come from worker, not client)
    if (
      message.type === "CONNECTED" ||
      message.type === "CHART_RENDER_RESPONSE" ||
      message.type === "ERROR"
    ) {
      return
    }
    
    // Handle chart render requests (only remaining type after filtering)
    if (message.type === "CHART_RENDER_REQUEST") {
      logger.log(`Received request: ${message.type} (id: ${message.id})`)
      handleChartRender(message).catch((error) => {
        logger.log("Unhandled error in chart render handler:", error)
        sendError("Internal error processing chart render request", message.id)
      })
    }
  }

  // Handle worker errors
  self.onerror = (error: ErrorEvent) => {
    logger.log("Chart worker error:", error)
  }
}
