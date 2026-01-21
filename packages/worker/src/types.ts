/**
 * Message protocol for worker communication
 */

import type { StringEncoding, StringMatch } from "@hexed/binary-utils/strings";

export type MessageType =
  | "OPEN_FILE"
  | "GET_FILE_SIZE"
  | "CLOSE_FILE"
  | "STREAM_FILE_REQUEST"
  | "SEARCH_REQUEST"
  | "STRINGS_REQUEST"
  | "FILE_SIZE_RESPONSE"
  | "STREAM_FILE_RESPONSE"
  | "SEARCH_RESPONSE"
  | "STRINGS_RESPONSE"
  | "PROGRESS_EVENT"
  | "SEARCH_MATCH_EVENT"
  | "ERROR"
  | "CONNECTED";

/**
 * Base message interface
 */
export interface BaseMessage {
  id: string;
  type: MessageType;
}

/**
 * Request Messages
 */

export interface OpenFileRequest extends BaseMessage {
  type: "OPEN_FILE";
  fileId: string;
  handle: FileSystemFileHandle;
}

export interface GetFileSizeRequest extends BaseMessage {
  type: "GET_FILE_SIZE";
  fileId: string;
}

export interface CloseFileRequest extends BaseMessage {
  type: "CLOSE_FILE";
  fileId: string;
}

export interface StreamFileRequest extends BaseMessage {
  type: "STREAM_FILE_REQUEST";
  fileId: string;
}

/**
 * Response Messages
 */

export interface FileSizeResponse extends BaseMessage {
  type: "FILE_SIZE_RESPONSE";
  fileId: string;
  size: number;
}

export interface StreamFileResponse extends BaseMessage {
  type: "STREAM_FILE_RESPONSE";
  fileId: string;
}

export interface ErrorResponse extends BaseMessage {
  type: "ERROR";
  error: string;
  originalMessageId?: string;
}

export interface ConnectedResponse extends BaseMessage {
  type: "CONNECTED";
}

/**
 * Search Messages
 */

export interface SearchRequest extends BaseMessage {
  type: "SEARCH_REQUEST";
  fileId: string;
  pattern: Uint8Array;
  startOffset?: number;
  endOffset?: number;
}

export interface SearchResponse extends BaseMessage {
  type: "SEARCH_RESPONSE";
  fileId: string;
  matches: Array<{ offset: number; length: number }>;
}

/**
 * Strings Messages
 */

export interface StringsRequest extends BaseMessage {
  type: "STRINGS_REQUEST";
  fileId: string;
  minLength: number;
  encoding: StringEncoding;
  startOffset?: number;
  endOffset?: number;
}

export interface StringsResponse extends BaseMessage {
  type: "STRINGS_RESPONSE";
  fileId: string;
  matches: StringMatch[];
}

/**
 * Progress Event (not a response, but an event)
 */
export interface ProgressEvent extends BaseMessage {
  type: "PROGRESS_EVENT";
  requestId: string;
  progress: number; // 0-100
  bytesRead: number;
  totalBytes: number;
}

/**
 * Search Match Event - streams matches as they're found
 */
export interface SearchMatchEvent extends BaseMessage {
  type: "SEARCH_MATCH_EVENT";
  requestId: string;
  matches: Array<{ offset: number; length: number }>;
}

/**
 * Union type of all request messages
 */
export type RequestMessage =
  | OpenFileRequest
  | GetFileSizeRequest
  | CloseFileRequest
  | StreamFileRequest
  | SearchRequest
  | StringsRequest;

/**
 * Union type of all response messages
 */
export type ResponseMessage =
  | FileSizeResponse
  | StreamFileResponse
  | SearchResponse
  | StringsResponse
  | ErrorResponse
  | ConnectedResponse;

/**
 * Union type of all messages (including events)
 */
export type WorkerMessage = RequestMessage | ResponseMessage | ProgressEvent | SearchMatchEvent;
