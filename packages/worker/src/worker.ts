/**
 * SharedWorker entry point for multi-tab file access
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
 * Shared worker context
 */
interface WorkerContext {
  handleManager: FileHandleManager;
  windowManager: WindowManager;
  ports: Set<MessagePort>;
}

// Global context shared across all connections
const context: WorkerContext = {
  handleManager: new FileHandleManager(),
  windowManager: new WindowManager(),
  ports: new Set<MessagePort>(),
};

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send a response message to a specific port
 */
function sendResponse(port: MessagePort, message: ResponseMessage): void {
  try {
    // Transfer Uint8Array as Transferable for performance
    if (message.type === "BYTE_RANGE_RESPONSE") {
      port.postMessage(message, [message.data.buffer]);
    } else {
      port.postMessage(message);
    }
  } catch (error) {
    console.error("Error sending response:", error);
  }
}

/**
 * Send an error response
 */
function sendError(
  port: MessagePort,
  error: string,
  originalMessageId?: string
): void {
  const response: ErrorResponse = {
    id: generateMessageId(),
    type: "ERROR",
    error,
    originalMessageId,
  };
  sendResponse(port, response);
}

/**
 * Handle OPEN_FILE request
 */
async function handleOpenFile(
  port: MessagePort,
  request: OpenFileRequest
): Promise<void> {
  try {
    await context.handleManager.openFile(request.fileId, request.handle);
    const response: ConnectedResponse = {
      id: generateMessageId(),
      type: "CONNECTED",
    };
    sendResponse(port, response);
  } catch (error) {
    sendError(
      port,
      error instanceof Error ? error.message : "Failed to open file",
      request.id
    );
  }
}

/**
 * Handle READ_BYTE_RANGE request
 */
async function handleReadByteRange(
  port: MessagePort,
  request: ReadByteRangeRequest
): Promise<void> {
  try {
    if (!context.handleManager.hasFile(request.fileId)) {
      sendError(port, `File ${request.fileId} is not open`, request.id);
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
      id: generateMessageId(),
      type: "BYTE_RANGE_RESPONSE",
      fileId: request.fileId,
      start: request.start,
      end: request.end,
      data,
    };
    sendResponse(port, response);
  } catch (error) {
    sendError(
      port,
      error instanceof Error ? error.message : "Failed to read byte range",
      request.id
    );
  }
}

/**
 * Handle GET_FILE_SIZE request
 */
async function handleGetFileSize(
  port: MessagePort,
  request: GetFileSizeRequest
): Promise<void> {
  try {
    const size = await context.handleManager.getFileSize(request.fileId);
    const response: FileSizeResponse = {
      id: generateMessageId(),
      type: "FILE_SIZE_RESPONSE",
      fileId: request.fileId,
      size,
    };
    sendResponse(port, response);
  } catch (error) {
    sendError(
      port,
      error instanceof Error ? error.message : "Failed to get file size",
      request.id
    );
  }
}

/**
 * Handle CLOSE_FILE request
 */
function handleCloseFile(port: MessagePort, request: CloseFileRequest): void {
  try {
    context.handleManager.closeFile(request.fileId);
    context.windowManager.clearCache(request.fileId);
    const response: ConnectedResponse = {
      id: generateMessageId(),
      type: "CONNECTED",
    };
    sendResponse(port, response);
  } catch (error) {
    sendError(
      port,
      error instanceof Error ? error.message : "Failed to close file",
      request.id
    );
  }
}

/**
 * Handle SET_WINDOW_SIZE request
 */
function handleSetWindowSize(
  port: MessagePort,
  request: SetWindowSizeRequest
): void {
  try {
    context.windowManager.setWindowSize(request.fileId, request.windowSize);
    const response: ConnectedResponse = {
      id: generateMessageId(),
      type: "CONNECTED",
    };
    sendResponse(port, response);
  } catch (error) {
    sendError(
      port,
      error instanceof Error ? error.message : "Failed to set window size",
      request.id
    );
  }
}

/**
 * Route a request message to the appropriate handler
 */
async function handleRequest(
  port: MessagePort,
  message: RequestMessage
): Promise<void> {
  switch (message.type) {
    case "OPEN_FILE":
      await handleOpenFile(port, message);
      break;
    case "READ_BYTE_RANGE":
      await handleReadByteRange(port, message);
      break;
    case "GET_FILE_SIZE":
      await handleGetFileSize(port, message);
      break;
    case "CLOSE_FILE":
      handleCloseFile(port, message);
      break;
    case "SET_WINDOW_SIZE":
      handleSetWindowSize(port, message);
      break;
    case "SEARCH_REQUEST":
    case "CHECKSUM_REQUEST":
      // Future operations - not implemented yet
      sendError(
        port,
        `Operation ${message.type} not yet implemented`,
        message.id
      );
      break;
    default:
      const unknownMessage = message as { type: string; id: string };
      sendError(
        port,
        `Unknown message type: ${unknownMessage.type}`,
        unknownMessage.id
      );
  }
}

/**
 * Handle a new port connection
 */
function handleConnect(port: MessagePort): void {
  context.ports.add(port);

  // Send connection acknowledgment
  const response: ConnectedResponse = {
    id: generateMessageId(),
    type: "CONNECTED",
  };
  sendResponse(port, response);

  // Handle messages from this port
  port.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;
    if (message.type === "CONNECTED" || message.type.startsWith("RESPONSE")) {
      // Ignore response messages (they come from worker, not client)
      return;
    }
    handleRequest(port, message as RequestMessage).catch((error) => {
      console.error("Unhandled error in request handler:", error);
      sendError(port, "Internal error processing request", message.id);
    });
  };

  // Handle port disconnection
  port.addEventListener("error", (error: Event) => {
    console.error("Port error:", error);
    context.ports.delete(port);
  });

  // Note: SharedWorker ports don't have onclose, but we can detect disconnection
  // by catching errors when trying to send messages
}

/**
 * SharedWorker global scope handler
 */
// if (typeof self !== "undefined" && "SharedWorkerGlobalScope" in self) {
//   // SharedWorker context
//   const sharedWorkerScope = self as unknown as SharedWorkerGlobalScope;

//   sharedWorkerScope.onconnect = (event: MessageEvent) => {
//     const port = event.ports[0];
//     handleConnect(port);
//   };
// } else if (typeof self !== "undefined") {
//   // Fallback for regular Worker context (for testing)
//   const workerScope = self as unknown as Worker;
//   handleConnect(workerScope as unknown as MessagePort);
// }
self.onconnect = (event) => {
  const port = event.ports[0];

  // Required in some browsers to start receiving messages
  port.start();

  handleConnect(port);
};
