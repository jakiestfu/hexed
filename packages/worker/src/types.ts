/**
 * Message protocol for worker communication
 */

export type MessageType =
  | "OPEN_FILE"
  | "READ_BYTE_RANGE"
  | "GET_FILE_SIZE"
  | "CLOSE_FILE"
  | "SET_WINDOW_SIZE"
  | "BYTE_RANGE_RESPONSE"
  | "FILE_SIZE_RESPONSE"
  | "ERROR"
  | "CONNECTED"
  | "SEARCH_REQUEST"
  | "SEARCH_RESPONSE"
  | "CHECKSUM_REQUEST"
  | "CHECKSUM_RESPONSE";

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

export interface ReadByteRangeRequest extends BaseMessage {
  type: "READ_BYTE_RANGE";
  fileId: string;
  start: number;
  end: number;
}

export interface GetFileSizeRequest extends BaseMessage {
  type: "GET_FILE_SIZE";
  fileId: string;
}

export interface CloseFileRequest extends BaseMessage {
  type: "CLOSE_FILE";
  fileId: string;
}

export interface SetWindowSizeRequest extends BaseMessage {
  type: "SET_WINDOW_SIZE";
  fileId: string;
  windowSize: number;
}

/**
 * Response Messages
 */

export interface ByteRangeResponse extends BaseMessage {
  type: "BYTE_RANGE_RESPONSE";
  fileId: string;
  start: number;
  end: number;
  data: Uint8Array;
}

export interface FileSizeResponse extends BaseMessage {
  type: "FILE_SIZE_RESPONSE";
  fileId: string;
  size: number;
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
 * Future Message Types (anticipate, don't implement)
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

export interface ChecksumRequest extends BaseMessage {
  type: "CHECKSUM_REQUEST";
  fileId: string;
  algorithm?: "md5" | "sha256";
}

export interface ChecksumResponse extends BaseMessage {
  type: "CHECKSUM_RESPONSE";
  fileId: string;
  checksum: string;
  algorithm: "md5" | "sha256";
}

/**
 * Union type of all request messages
 */
export type RequestMessage =
  | OpenFileRequest
  | ReadByteRangeRequest
  | GetFileSizeRequest
  | CloseFileRequest
  | SetWindowSizeRequest
  | SearchRequest
  | ChecksumRequest;

/**
 * Union type of all response messages
 */
export type ResponseMessage =
  | ByteRangeResponse
  | FileSizeResponse
  | ErrorResponse
  | ConnectedResponse
  | SearchResponse
  | ChecksumResponse;

/**
 * Union type of all messages
 */
export type WorkerMessage = RequestMessage | ResponseMessage;

/**
 * Window configuration
 */
export interface WindowConfig {
  size: number;
  overlap: number;
  maxCacheSize: number;
}

/**
 * Default window configuration
 */
export const DEFAULT_WINDOW_CONFIG: WindowConfig = {
  size: 256 * 1024, // 256KB
  overlap: 4 * 1024, // 4KB overlap
  maxCacheSize: 10, // Maximum number of cached windows
};
