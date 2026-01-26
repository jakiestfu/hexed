/**
 * Message protocol for worker communication
 */

import type { StringEncoding, StringMatch } from "@hexed/file/strings"

export type MessageType =
  | "SEARCH_REQUEST"
  | "STRINGS_REQUEST"
  | "SEARCH_RESPONSE"
  | "STRINGS_RESPONSE"
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
 * Union type of all request messages
 */
export type RequestMessage = SearchRequest | StringsRequest

/**
 * Union type of all response messages
 */
export type ResponseMessage =
  | SearchResponse
  | StringsResponse
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
