/**
 * Worker entry point for file access
 */

import { FileHandleManager } from "./file-handle-manager";
import { WindowManager } from "./window-manager";
import type {
  WorkerMessage,
  RequestMessage,
  ResponseMessage,
  OpenFileRequest,
  ReadByteRangeRequest,
  GetFileSizeRequest,
  CloseFileRequest,
  SetWindowSizeRequest,
  ByteRangeResponse,
  FileSizeResponse,
  ErrorResponse,
  ConnectedResponse,
} from "./types";

/**
 * Worker context
 */
interface WorkerContext {
  handleManager: FileHandleManager;
  windowManager: WindowManager;
}

// Global context for this worker instance
const context: WorkerContext = {
  handleManager: new FileHandleManager(),
  windowManager: new WindowManager(),
};

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
    // Transfer Uint8Array as Transferable for performance
    if (message.type === "BYTE_RANGE_RESPONSE") {
      self.postMessage(message, [message.data.buffer]);
    } else {
      self.postMessage(message);
    }
  } catch (error) {
    console.error("Error sending response:", error);
  }
}

/**
 * Send an error response
 */
function sendError(
  error: string,
  originalMessageId?: string
): void {
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
async function handleOpenFile(
  request: OpenFileRequest
): Promise<void> {
  try {
    await context.handleManager.openFile(request.fileId, request.handle);
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
 * Handle READ_BYTE_RANGE request
 */
async function handleReadByteRange(
  request: ReadByteRangeRequest
): Promise<void> {
  try {
    if (!context.handleManager.hasFile(request.fileId)) {
      sendError(`File ${request.fileId} is not open`, request.id);
      return;
    }

    const data = await context.windowManager.getWindow(
      request.fileId,
      request.start,
      request.end,
      (start, end) =>
        context.handleManager.readByteRange(request.fileId, start, end)
    );

    const response: ByteRangeResponse = {
      id: request.id,
      type: "BYTE_RANGE_RESPONSE",
      fileId: request.fileId,
      start: request.start,
      end: request.end,
      data,
    };
    sendResponse(response);
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to read byte range",
      request.id
    );
  }
}

/**
 * Handle GET_FILE_SIZE request
 */
async function handleGetFileSize(
  request: GetFileSizeRequest
): Promise<void> {
  try {
    const size = await context.handleManager.getFileSize(request.fileId);
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
  try {
    context.handleManager.closeFile(request.fileId);
    context.windowManager.clearCache(request.fileId);
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
 * Handle SET_WINDOW_SIZE request
 */
function handleSetWindowSize(
  request: SetWindowSizeRequest
): void {
  try {
    context.windowManager.setWindowSize(request.fileId, request.windowSize);
    const response: ConnectedResponse = {
      id: request.id,
      type: "CONNECTED",
    };
    sendResponse(response);
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "Failed to set window size",
      request.id
    );
  }
}

/**
 * Route a request message to the appropriate handler
 */
async function handleRequest(
  message: RequestMessage
): Promise<void> {
  switch (message.type) {
    case "OPEN_FILE":
      await handleOpenFile(message);
      break;
    case "READ_BYTE_RANGE":
      await handleReadByteRange(message);
      break;
    case "GET_FILE_SIZE":
      await handleGetFileSize(message);
      break;
    case "CLOSE_FILE":
      handleCloseFile(message);
      break;
    case "SET_WINDOW_SIZE":
      handleSetWindowSize(message);
      break;
    case "SEARCH_REQUEST":
    case "CHECKSUM_REQUEST":
      // Future operations - not implemented yet
      sendError(
        `Operation ${message.type} not yet implemented`,
        message.id
      );
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
  // Send connection acknowledgment on startup
  const response: ConnectedResponse = {
    id: generateMessageId(),
    type: "CONNECTED",
  };
  sendResponse(response);

  // Handle messages from client
  self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;
    if (message.type === "CONNECTED" || message.type.startsWith("RESPONSE")) {
      // Ignore response messages (they come from worker, not client)
      return;
    }
    handleRequest(message as RequestMessage).catch((error) => {
      console.error("Unhandled error in request handler:", error);
      sendError("Internal error processing request", message.id);
    });
  };

  // Handle worker errors
  self.onerror = (error: ErrorEvent) => {
    console.error("Worker error:", error);
  };
}
