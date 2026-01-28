/**
 * Message protocol for worker communication
 */

import type { HexedFile } from "@hexed/file"
import type { StringEncoding, StringMatch } from "@hexed/file/strings"

export type MessageType =
  | "SEARCH_REQUEST"
  | "STRINGS_REQUEST"
  | "CHART_RENDER_REQUEST"
  | "EVALUATE_REQUEST"
  | "EVALUATE_ABORT"
  | "SEARCH_RESPONSE"
  | "STRINGS_RESPONSE"
  | "CHART_RENDER_RESPONSE"
  | "EVALUATE_RESPONSE"
  | "PROGRESS_EVENT"
  | "SEARCH_MATCH_EVENT"
  | "EVALUATE_RESULT_EVENT"
  | "ERROR"
  | "CONNECTED"

/**
 * Base message interface
 */
export interface BaseMessage {
  id: string
  type: MessageType
}

/**
 * Request Messages
 */

/**
 * Response Messages
 */

export interface ErrorResponse extends BaseMessage {
  type: "ERROR"
  error: string
  originalMessageId?: string
}

export interface ConnectedResponse extends BaseMessage {
  type: "CONNECTED"
}

/**
 * Search Messages
 */

export interface SearchRequest extends BaseMessage {
  type: "SEARCH_REQUEST"
  file: File
  pattern: Uint8Array
  startOffset?: number
  endOffset?: number
}

export interface SearchResponse extends BaseMessage {
  type: "SEARCH_RESPONSE"
  matches: Array<{ offset: number; length: number }>
}

/**
 * Strings Messages
 */

export interface StringsRequest extends BaseMessage {
  type: "STRINGS_REQUEST"
  file: File
  minLength: number
  encoding: StringEncoding
  startOffset?: number
  endOffset?: number
}

export interface StringsResponse extends BaseMessage {
  type: "STRINGS_RESPONSE"
  matches: StringMatch[]
}

/**
 * Chart Messages
 */

export interface ChartRenderRequest extends BaseMessage {
  type: "CHART_RENDER_REQUEST"
  canvas: OffscreenCanvas
  config: unknown // Chart.js configuration object
}

export interface ChartRenderResponse extends BaseMessage {
  type: "CHART_RENDER_RESPONSE"
  success: boolean
}

/**
 * Evaluate Messages
 */

export interface EvaluateRequest extends BaseMessage {
  type: "EVALUATE_REQUEST"
  file: File
  functionCode: string
  signalId?: string
  context?: Record<string, unknown>
}

export interface EvaluateAbort extends BaseMessage {
  type: "EVALUATE_ABORT"
  requestId: string
}

export interface EvaluateResponse extends BaseMessage {
  type: "EVALUATE_RESPONSE"
  result: unknown
}

/**
 * Progress Event (not a response, but an event)
 */
export interface ProgressEvent extends BaseMessage {
  type: "PROGRESS_EVENT"
  requestId: string
  progress: number // 0-100
  bytesRead: number
  totalBytes: number
}

/**
 * Search Match Event - streams matches as they're found
 */
export interface SearchMatchEvent extends BaseMessage {
  type: "SEARCH_MATCH_EVENT"
  requestId: string
  matches: Array<{ offset: number; length: number }>
}

/**
 * Evaluate Result Event - streams results as they're computed
 */
export interface EvaluateResultEvent extends BaseMessage {
  type: "EVALUATE_RESULT_EVENT"
  requestId: string
  result: unknown
}

/**
 * EvaluateAPIOptions type for the API object passed to evaluated functions
 * TResult: The type of result that can be emitted and returned
 * TContext: The type of context passed to the function
 */
export type EvaluateAPIOptions<TResult = unknown, TContext = undefined> = {
  throwIfAborted(): void
  emitProgress(data: { processed: number; size: number }): void
  emitResult(result: TResult): void
  context: TContext
}

/**
 * EvaluateAPI type for evaluated functions
 * TResult: The type of result that can be emitted and returned
 * TContext: The type of context passed to the function
 */
export type EvaluateAPI<TResult = unknown, TContext = undefined> = (
  hexedFile: HexedFile,
  api: EvaluateAPIOptions<TResult, TContext>
) => Promise<TResult>

/**
 * Union type of all request messages for the main worker
 */
export type RequestMessage =
  | SearchRequest
  | StringsRequest
  | ChartRenderRequest
  | EvaluateRequest

/**
 * Union type of all request messages (including chart render requests)
 */
export type AllRequestMessage = RequestMessage | ChartRenderRequest

/**
 * Union type of all response messages
 */
export type ResponseMessage =
  | SearchResponse
  | StringsResponse
  | ChartRenderResponse
  | EvaluateResponse
  | ErrorResponse
  | ConnectedResponse

/**
 * Union type of all messages (including events)
 */
export type WorkerMessage =
  | RequestMessage
  | ResponseMessage
  | ProgressEvent
  | SearchMatchEvent
  | EvaluateResultEvent
  | EvaluateAbort
