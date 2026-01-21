/**
 * Worker entry point for file access
 */

import { createLogger } from "@hexed/logger";
import { extractStrings, type StringEncoding } from "@hexed/binary-utils/strings";
import { FileHandleManager } from "./file-handle-manager";
import type {
  WorkerMessage,
  RequestMessage,
  ResponseMessage,
  OpenFileRequest,
  GetFileSizeRequest,
  CloseFileRequest,
  StreamFileRequest,
  SearchRequest,
  StringsRequest,
  FileSizeResponse,
  StreamFileResponse,
  SearchResponse,
  StringsResponse,
  ErrorResponse,
  ConnectedResponse,
  ProgressEvent,
} from "./types";

const logger = createLogger("worker");

/**
 * Worker context
 */
interface WorkerContext {
  handleManager: FileHandleManager;
}

// Global context for this worker instance
const context: WorkerContext = {
  handleManager: new FileHandleManager(),
};

// Chunk size for streaming (1MB)
const STREAM_CHUNK_SIZE = 1024 * 1024;

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send a response message
 */
function sendResponse(message: ResponseMessage): void {
  try {
    self.postMessage(message);
  } catch (error) {
    console.error("Error sending response:", error);
  }
}

/**
 * Send a progress event
 */
function sendProgress(event: ProgressEvent): void {
  try {
    self.postMessage(event);
  } catch (error) {
    console.error("Error sending progress event:", error);
  }
}

/**
 * Send an error response
 */
function sendError(error: string, originalMessageId?: string): void {
  logger.log(
    "Error:",
    error,
    originalMessageId ? `(request: ${originalMessageId})` : ""
  );
  const response: ErrorResponse = {
    id: generateMessageId(),
    type: "ERROR",
    error,
    originalMessageId,
  };
  sendResponse(response);
}

/**
 * Handle OPEN_FILE request
 */
async function handleOpenFile(request: OpenFileRequest): Promise<void> {
  logger.log(`Opening file: ${request.fileId} (request: ${request.id})`);
  try {
    await context.handleManager.openFile(request.fileId, request.handle);
    logger.log(`File opened successfully: ${request.fileId}`);
    const response: ConnectedResponse = {
      id: request.id,
      type: "CONNECTED",
    };
    sendResponse(response);
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to open file",
      request.id
    );
  }
}

/**
 * Handle STREAM_FILE_REQUEST - Stream through entire file with progress updates
 */
async function handleStreamFile(request: StreamFileRequest): Promise<void> {
  logger.log(`Streaming file: ${request.fileId} (request: ${request.id})`);
  try {
    if (!context.handleManager.hasFile(request.fileId)) {
      sendError(`File ${request.fileId} is not open`, request.id);
      return;
    }

    const fileSize = await context.handleManager.getFileSize(request.fileId);
    let bytesRead = 0;

    // Stream through the file in chunks
    while (bytesRead < fileSize) {
      const chunkEnd = Math.min(bytesRead + STREAM_CHUNK_SIZE, fileSize);
      
      // Read chunk (we don't need to store it, just read through)
      await context.handleManager.readByteRange(
        request.fileId,
        bytesRead,
        chunkEnd
      );

      bytesRead = chunkEnd;

      // Calculate progress percentage
      const progress = Math.min(100, Math.round((bytesRead / fileSize) * 100));

      // Send progress event
      const progressEvent: ProgressEvent = {
        id: generateMessageId(),
        type: "PROGRESS_EVENT",
        requestId: request.id,
        progress,
        bytesRead,
        totalBytes: fileSize,
      };
      sendProgress(progressEvent);

      // Yield to event loop to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    logger.log(`File streamed successfully: ${request.fileId}, ${bytesRead} bytes`);
    const response: StreamFileResponse = {
      id: request.id,
      type: "STREAM_FILE_RESPONSE",
      fileId: request.fileId,
    };
    sendResponse(response);
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to stream file",
      request.id
    );
  }
}

/**
 * Handle SEARCH_REQUEST - Search for pattern in file with progress updates
 */
async function handleSearch(request: SearchRequest): Promise<void> {
  logger.log(`Searching file: ${request.fileId} (request: ${request.id})`);
  try {
    if (!context.handleManager.hasFile(request.fileId)) {
      sendError(`File ${request.fileId} is not open`, request.id);
      return;
    }

    const fileSize = await context.handleManager.getFileSize(request.fileId);
    const startOffset = request.startOffset ?? 0;
    const endOffset = request.endOffset ?? fileSize;
    const searchRange = endOffset - startOffset;
    const pattern = request.pattern;
    const matches: Array<{ offset: number; length: number }> = [];

    // Search through file in chunks
    let currentOffset = startOffset;
    let bytesSearched = 0;

    while (currentOffset < endOffset) {
      const chunkEnd = Math.min(
        currentOffset + STREAM_CHUNK_SIZE + pattern.length - 1,
        endOffset
      );

      // Read chunk for searching
      const chunk = await context.handleManager.readByteRange(
        request.fileId,
        currentOffset,
        chunkEnd
      );

      // Search for pattern in chunk
      for (let i = 0; i <= chunk.length - pattern.length; i++) {
        let match = true;
        for (let j = 0; j < pattern.length; j++) {
          if (chunk[i + j] !== pattern[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          matches.push({
            offset: currentOffset + i,
            length: pattern.length,
          });
        }
      }

      bytesSearched = Math.min(chunkEnd - startOffset, searchRange);
      currentOffset = chunkEnd - pattern.length + 1; // Overlap to catch matches at boundaries

      // Calculate progress percentage
      const progress = Math.min(
        100,
        Math.round((bytesSearched / searchRange) * 100)
      );

      // Send progress event
      const progressEvent: ProgressEvent = {
        id: generateMessageId(),
        type: "PROGRESS_EVENT",
        requestId: request.id,
        progress,
        bytesRead: bytesSearched,
        totalBytes: searchRange,
      };
      sendProgress(progressEvent);

      // Yield to event loop to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    logger.log(
      `Search completed: ${request.fileId}, found ${matches.length} matches`
    );
    const response: SearchResponse = {
      id: request.id,
      type: "SEARCH_RESPONSE",
      fileId: request.fileId,
      matches,
    };
    sendResponse(response);
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to search file",
      request.id
    );
  }
}

/**
 * Get the overlap buffer size needed for a given encoding
 */
function getOverlapSize(encoding: string): number {
  switch (encoding) {
    case "ascii":
      return 0; // No multi-byte sequences
    case "utf8":
      return 3; // Max UTF-8 sequence is 4 bytes, need 3 to detect incomplete sequences
    case "utf16le":
    case "utf16be":
      return 1; // 2-byte units, need 1 byte to detect incomplete unit
    case "utf32le":
    case "utf32be":
      return 3; // 4-byte units, need 3 bytes to detect incomplete unit
    default:
      return 3; // Default to safe value for unknown encodings
  }
}

/**
 * Handle STRINGS_REQUEST - Extract strings from file with progress updates
 */
async function handleStrings(request: StringsRequest): Promise<void> {
  logger.log(`Extracting strings from file: ${request.fileId} (request: ${request.id})`);
  try {
    if (!context.handleManager.hasFile(request.fileId)) {
      sendError(`File ${request.fileId} is not open`, request.id);
      return;
    }

    const fileSize = await context.handleManager.getFileSize(request.fileId);
    const startOffset = request.startOffset ?? 0;
    const endOffset = request.endOffset ?? fileSize;
    const searchRange = endOffset - startOffset;
    const encoding = request.encoding ?? "ascii";
    const overlapSize = getOverlapSize(encoding);

    // Accumulate matches as we process chunks
    const allMatches: Array<{
      offset: number;
      length: number;
      encoding: StringEncoding;
      text: string;
    }> = [];

    // Overlap buffer from previous chunk
    let overlapBuffer = new Uint8Array(0);

    // Read and process the file in chunks
    let bytesRead = 0;
    while (bytesRead < searchRange) {
      const chunkStart = startOffset + bytesRead;
      const chunkEnd = Math.min(
        chunkStart + STREAM_CHUNK_SIZE,
        startOffset + searchRange
      );

      // Read chunk
      const chunk = await context.handleManager.readByteRange(
        request.fileId,
        chunkStart,
        chunkEnd
      );

      // Combine overlap buffer with current chunk
      const combinedLength = overlapBuffer.length + chunk.length;
      const combinedData = new Uint8Array(combinedLength);
      combinedData.set(overlapBuffer, 0);
      combinedData.set(chunk, overlapBuffer.length);

      // Extract strings from combined data
      const chunkMatches = extractStrings(combinedData, {
        minLength: request.minLength,
        encoding: request.encoding,
      });

      // Adjust offsets and filter out matches in overlap region
      for (const match of chunkMatches) {
        // Filter out matches that are entirely within the overlap region
        if (match.offset < overlapBuffer.length) {
          // Check if match extends beyond overlap region
          const matchEnd = match.offset + match.length;
          if (matchEnd <= overlapBuffer.length) {
            // Match is entirely in overlap, skip (already processed in previous chunk)
            continue;
          }
          // Match spans overlap boundary - it starts in overlap but extends into current chunk
          // The match was already reported in the previous chunk, so skip it
          continue;
        } else {
          // Match is entirely in current chunk (or starts at overlap boundary)
          // Adjust offset: subtract overlap length to get position relative to chunk start,
          // then add absolute chunk start position
          const adjustedOffset = chunkStart + (match.offset - overlapBuffer.length);
          allMatches.push({
            ...match,
            offset: adjustedOffset,
          });
        }
      }

      // Save last few bytes as overlap for next chunk
      // Take last overlapSize bytes from combined buffer (or all if combined is smaller)
      const overlapLength = Math.min(overlapSize, combinedData.length);
      if (overlapLength > 0) {
        overlapBuffer = combinedData.slice(combinedData.length - overlapLength);
      } else {
        overlapBuffer = new Uint8Array(0);
      }

      const chunkSize = chunkEnd - chunkStart;
      bytesRead += chunkSize;

      // Calculate progress percentage
      const progress = Math.min(
        100,
        Math.round((bytesRead / searchRange) * 100)
      );

      // Send progress event
      const progressEvent: ProgressEvent = {
        id: generateMessageId(),
        type: "PROGRESS_EVENT",
        requestId: request.id,
        progress,
        bytesRead: bytesRead,
        totalBytes: searchRange,
      };
      sendProgress(progressEvent);

      // Yield to event loop to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    logger.log(
      `Strings extraction completed: ${request.fileId}, found ${allMatches.length} matches`
    );
    const response: StringsResponse = {
      id: request.id,
      type: "STRINGS_RESPONSE",
      fileId: request.fileId,
      matches: allMatches,
    };
    sendResponse(response);
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to extract strings",
      request.id
    );
  }
}

/**
 * Handle GET_FILE_SIZE request
 */
async function handleGetFileSize(request: GetFileSizeRequest): Promise<void> {
  logger.log(`Getting file size: ${request.fileId} (request: ${request.id})`);
  try {
    const size = await context.handleManager.getFileSize(request.fileId);
    logger.log(`File size: ${request.fileId} = ${size} bytes`);
    const response: FileSizeResponse = {
      id: request.id,
      type: "FILE_SIZE_RESPONSE",
      fileId: request.fileId,
      size,
    };
    sendResponse(response);
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to get file size",
      request.id
    );
  }
}

/**
 * Handle CLOSE_FILE request
 */
function handleCloseFile(request: CloseFileRequest): void {
  logger.log(`Closing file: ${request.fileId} (request: ${request.id})`);
  try {
    context.handleManager.closeFile(request.fileId);
    logger.log(`File closed successfully: ${request.fileId}`);
    const response: ConnectedResponse = {
      id: request.id,
      type: "CONNECTED",
    };
    sendResponse(response);
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to close file",
      request.id
    );
  }
}

/**
 * Route a request message to the appropriate handler
 */
async function handleRequest(message: RequestMessage): Promise<void> {
  switch (message.type) {
    case "OPEN_FILE":
      await handleOpenFile(message);
      break;
    case "GET_FILE_SIZE":
      await handleGetFileSize(message);
      break;
    case "CLOSE_FILE":
      handleCloseFile(message);
      break;
    case "STREAM_FILE_REQUEST":
      await handleStreamFile(message);
      break;
    case "SEARCH_REQUEST":
      await handleSearch(message);
      break;
    case "STRINGS_REQUEST":
      await handleStrings(message);
      break;
    default:
      const unknownMessage = message as { type: string; id: string };
      sendError(
        `Unknown message type: ${unknownMessage.type}`,
        unknownMessage.id
      );
  }
}

/**
 * Worker global scope handler
 */
if (typeof self !== "undefined") {
  logger.log("Worker initialized");
  // Send connection acknowledgment on startup
  const response: ConnectedResponse = {
    id: generateMessageId(),
    type: "CONNECTED",
  };
  sendResponse(response);

  // Handle messages from client
  self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;
    // Ignore response messages and progress events (they come from worker, not client)
    if (
      message.type === "CONNECTED" ||
      message.type.startsWith("RESPONSE") ||
      message.type === "PROGRESS_EVENT"
    ) {
      return;
    }
    logger.log(`Received request: ${message.type} (id: ${message.id})`);
    handleRequest(message as RequestMessage).catch((error) => {
      logger.log("Unhandled error in request handler:", error);
      sendError("Internal error processing request", message.id);
    });
  };

  // Handle worker errors
  self.onerror = (error: ErrorEvent) => {
    logger.log("Worker error:", error);
  };
}
