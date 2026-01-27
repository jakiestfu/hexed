/**
 * Message protocol for worker communication
 */

import type { StringEncoding, StringMatch } from "@hexed/file/strings"

export type MessageType =
  | "SEARCH_REQUEST"
  | "STRINGS_REQUEST"
  | "BYTE_FREQUENCY_REQUEST"
  | "ENTROPY_REQUEST"
  | "CHI_SQUARE_REQUEST"
  | "AUTOCORRELATION_REQUEST"
  | "BYTE_SCATTER_REQUEST"
  | "CHART_RENDER_REQUEST"
  | "SEARCH_RESPONSE"
  | "STRINGS_RESPONSE"
  | "BYTE_FREQUENCY_RESPONSE"
  | "ENTROPY_RESPONSE"
  | "CHI_SQUARE_RESPONSE"
  | "AUTOCORRELATION_RESPONSE"
  | "BYTE_SCATTER_RESPONSE"
  | "CHART_RENDER_RESPONSE"
  | "PROGRESS_EVENT"
  | "SEARCH_MATCH_EVENT"
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

export interface ByteFrequencyRequest extends BaseMessage {
  type: "BYTE_FREQUENCY_REQUEST"
  file: File
  startOffset?: number
  endOffset?: number
}

export interface ByteFrequencyResponse extends BaseMessage {
  type: "BYTE_FREQUENCY_RESPONSE"
  frequencies: number[] // Array of 256 numbers representing counts for bytes 0-255
}

export interface EntropyRequest extends BaseMessage {
  type: "ENTROPY_REQUEST"
  file: File
  blockSize?: number // Default 256
  startOffset?: number
  endOffset?: number
}

export interface EntropyResponse extends BaseMessage {
  type: "ENTROPY_RESPONSE"
  entropyValues: number[] // Array of entropy values, one per block
  blockSize: number
  offsets: number[] // Array of starting offsets for each block
}

export interface ChiSquareRequest extends BaseMessage {
  type: "CHI_SQUARE_REQUEST"
  file: File
  blockSize?: number // Default determined by getBlockSize()
  startOffset?: number
  endOffset?: number
}

export interface ChiSquareResponse extends BaseMessage {
  type: "CHI_SQUARE_RESPONSE"
  chiSquareValues: number[] // Array of chi-square values, one per block
  blockSize: number
  offsets: number[] // Array of starting offsets for each block
}

export interface AutocorrelationRequest extends BaseMessage {
  type: "AUTOCORRELATION_REQUEST"
  file: File
  maxLag?: number // Default 256
  startOffset?: number
  endOffset?: number
}

export interface AutocorrelationResponse extends BaseMessage {
  type: "AUTOCORRELATION_RESPONSE"
  autocorrelationValues: number[] // Array of autocorrelation values, one per lag
  lags: number[] // Array of lag offsets used
}

export interface ByteScatterRequest extends BaseMessage {
  type: "BYTE_SCATTER_REQUEST"
  file: File
  maxPoints?: number // Default 10000 for performance
  startOffset?: number
  endOffset?: number
}

export interface ByteScatterResponse extends BaseMessage {
  type: "BYTE_SCATTER_RESPONSE"
  points: Array<{ x: number; y: number }> // x = offset, y = byte value
}

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
 * Union type of all request messages for the main worker
 */
export type RequestMessage =
  | SearchRequest
  | StringsRequest
  | ByteFrequencyRequest
  | EntropyRequest
  | ChiSquareRequest
  | AutocorrelationRequest
  | ByteScatterRequest

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
  | ByteFrequencyResponse
  | EntropyResponse
  | ChiSquareResponse
  | AutocorrelationResponse
  | ByteScatterResponse
  | ChartRenderResponse
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
