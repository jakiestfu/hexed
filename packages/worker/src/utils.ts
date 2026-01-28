/**
 * Shared utilities for worker communication
 */

import { createLogger } from "@hexed/logger"

import type {
  ErrorResponse,
  EvaluateResultEvent,
  ProgressEvent,
  ResponseMessage,
  SearchMatchEvent
} from "./types"

const logger = createLogger("worker-utils")

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Send a response message
 */
export function sendResponse(message: ResponseMessage): void {
  try {
    self.postMessage(message)
  } catch (error) {
    console.error("Error sending response:", error)
  }
}

/**
 * Send a progress event
 */
export function sendProgress(event: ProgressEvent): void {
  try {
    self.postMessage(event)
  } catch (error) {
    console.error("Error sending progress event:", error)
  }
}

/**
 * Send a search match event
 */
export function sendSearchMatch(event: SearchMatchEvent): void {
  try {
    self.postMessage(event)
  } catch (error) {
    console.error("Error sending search match event:", error)
  }
}

/**
 * Send an evaluate result event
 */
export function sendEvaluateResult(event: EvaluateResultEvent): void {
  try {
    self.postMessage(event)
  } catch (error) {
    console.error("Error sending evaluate result event:", error)
  }
}

/**
 * Send an error response
 */
export function sendError(error: string, originalMessageId?: string): void {
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
