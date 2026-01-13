/**
 * Service Worker entry point for multi-tab file access
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
 * Service worker context
 */
interface WorkerContext {
  handleManager: FileHandleManager;
  windowManager: WindowManager;
}

// Global context shared across all connections
const context: WorkerContext = {
  handleManager: new FileHandleManager(),
  windowManager: new WindowManager(),
};

console.log(
  "[Service Worker] Initialized with FileHandleManager and WindowManager"
);

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send a response message to a specific client
 */
function sendResponse(client: Client, message: ResponseMessage): void {
  try {
    console.log(`[Service Worker] Sending response: ${message.type}`, {
      id: message.id,
      ...(message.type === "BYTE_RANGE_RESPONSE"
        ? {
            fileId: (message as ByteRangeResponse).fileId,
            start: (message as ByteRangeResponse).start,
            end: (message as ByteRangeResponse).end,
            dataLength: (message as ByteRangeResponse).data.length,
          }
        : message.type === "FILE_SIZE_RESPONSE"
        ? {
            fileId: (message as FileSizeResponse).fileId,
            size: (message as FileSizeResponse).size,
          }
        : {}),
    });

    // Transfer Uint8Array as Transferable for performance
    if (message.type === "BYTE_RANGE_RESPONSE") {
      client.postMessage(message, [message.data.buffer]);
    } else {
      client.postMessage(message);
    }
  } catch (error) {
    console.error("[Service Worker] Error sending response:", error, {
      messageType: message.type,
      messageId: message.id,
    });
  }
}

/**
 * Send an error response
 */
function sendError(
  client: Client,
  error: string,
  originalMessageId?: string
): void {
  console.error("[Service Worker] Sending error response:", {
    error,
    originalMessageId,
  });

  const response: ErrorResponse = {
    id: generateMessageId(),
    type: "ERROR",
    error,
    originalMessageId,
  };
  sendResponse(client, response);
}

/**
 * Handle OPEN_FILE request
 */
async function handleOpenFile(
  client: Client,
  request: OpenFileRequest
): Promise<void> {
  console.log("[Service Worker] Handling OPEN_FILE request:", {
    fileId: request.fileId,
    requestId: request.id,
  });

  try {
    await context.handleManager.openFile(request.fileId, request.handle);
    console.log("[Service Worker] File opened successfully:", {
      fileId: request.fileId,
    });

    const response: ConnectedResponse = {
      id: generateMessageId(),
      type: "CONNECTED",
    };
    sendResponse(client, response);
  } catch (error) {
    console.error("[Service Worker] Failed to open file:", error, {
      fileId: request.fileId,
      requestId: request.id,
    });

    sendError(
      client,
      error instanceof Error ? error.message : "Failed to open file",
      request.id
    );
  }
}

/**
 * Handle READ_BYTE_RANGE request
 */
async function handleReadByteRange(
  client: Client,
  request: ReadByteRangeRequest
): Promise<void> {
  console.log("[Service Worker] Handling READ_BYTE_RANGE request:", {
    fileId: request.fileId,
    start: request.start,
    end: request.end,
    range: request.end - request.start,
    requestId: request.id,
  });

  try {
    if (!context.handleManager.hasFile(request.fileId)) {
      console.warn("[Service Worker] File not open:", {
        fileId: request.fileId,
        requestId: request.id,
      });

      sendError(client, `File ${request.fileId} is not open`, request.id);
      return;
    }

    console.log("[Service Worker] Reading byte range from file:", {
      fileId: request.fileId,
      start: request.start,
      end: request.end,
    });

    const data = await context.windowManager.getWindow(
      request.fileId,
      request.start,
      request.end,
      (start, end) =>
        context.handleManager.readByteRange(request.fileId, start, end)
    );

    console.log("[Service Worker] Byte range read successfully:", {
      fileId: request.fileId,
      start: request.start,
      end: request.end,
      dataLength: data.length,
    });

    const response: ByteRangeResponse = {
      id: generateMessageId(),
      type: "BYTE_RANGE_RESPONSE",
      fileId: request.fileId,
      start: request.start,
      end: request.end,
      data,
    };
    sendResponse(client, response);
  } catch (error) {
    console.error("[Service Worker] Failed to read byte range:", error, {
      fileId: request.fileId,
      start: request.start,
      end: request.end,
      requestId: request.id,
    });

    sendError(
      client,
      error instanceof Error ? error.message : "Failed to read byte range",
      request.id
    );
  }
}

/**
 * Handle GET_FILE_SIZE request
 */
async function handleGetFileSize(
  client: Client,
  request: GetFileSizeRequest
): Promise<void> {
  console.log("[Service Worker] Handling GET_FILE_SIZE request:", {
    fileId: request.fileId,
    requestId: request.id,
  });

  try {
    const size = await context.handleManager.getFileSize(request.fileId);
    console.log("[Service Worker] File size retrieved:", {
      fileId: request.fileId,
      size,
    });

    const response: FileSizeResponse = {
      id: generateMessageId(),
      type: "FILE_SIZE_RESPONSE",
      fileId: request.fileId,
      size,
    };
    sendResponse(client, response);
  } catch (error) {
    console.error("[Service Worker] Failed to get file size:", error, {
      fileId: request.fileId,
      requestId: request.id,
    });

    sendError(
      client,
      error instanceof Error ? error.message : "Failed to get file size",
      request.id
    );
  }
}

/**
 * Handle CLOSE_FILE request
 */
function handleCloseFile(client: Client, request: CloseFileRequest): void {
  console.log("[Service Worker] Handling CLOSE_FILE request:", {
    fileId: request.fileId,
    requestId: request.id,
  });

  try {
    context.handleManager.closeFile(request.fileId);
    context.windowManager.clearCache(request.fileId);
    console.log("[Service Worker] File closed successfully:", {
      fileId: request.fileId,
    });

    const response: ConnectedResponse = {
      id: generateMessageId(),
      type: "CONNECTED",
    };
    sendResponse(client, response);
  } catch (error) {
    console.error("[Service Worker] Failed to close file:", error, {
      fileId: request.fileId,
      requestId: request.id,
    });

    sendError(
      client,
      error instanceof Error ? error.message : "Failed to close file",
      request.id
    );
  }
}

/**
 * Handle SET_WINDOW_SIZE request
 */
function handleSetWindowSize(
  client: Client,
  request: SetWindowSizeRequest
): void {
  console.log("[Service Worker] Handling SET_WINDOW_SIZE request:", {
    fileId: request.fileId,
    windowSize: request.windowSize,
    requestId: request.id,
  });

  try {
    context.windowManager.setWindowSize(request.fileId, request.windowSize);
    console.log("[Service Worker] Window size set successfully:", {
      fileId: request.fileId,
      windowSize: request.windowSize,
    });

    const response: ConnectedResponse = {
      id: generateMessageId(),
      type: "CONNECTED",
    };
    sendResponse(client, response);
  } catch (error) {
    console.error("[Service Worker] Failed to set window size:", error, {
      fileId: request.fileId,
      windowSize: request.windowSize,
      requestId: request.id,
    });

    sendError(
      client,
      error instanceof Error ? error.message : "Failed to set window size",
      request.id
    );
  }
}

/**
 * Route a request message to the appropriate handler
 */
async function handleRequest(
  client: Client,
  message: RequestMessage
): Promise<void> {
  console.log("[Service Worker] Routing request:", {
    type: message.type,
    id: message.id,
  });

  switch (message.type) {
    case "OPEN_FILE":
      await handleOpenFile(client, message);
      break;
    case "READ_BYTE_RANGE":
      await handleReadByteRange(client, message);
      break;
    case "GET_FILE_SIZE":
      await handleGetFileSize(client, message);
      break;
    case "CLOSE_FILE":
      handleCloseFile(client, message);
      break;
    case "SET_WINDOW_SIZE":
      handleSetWindowSize(client, message);
      break;
    case "SEARCH_REQUEST":
    case "CHECKSUM_REQUEST":
      // Future operations - not implemented yet
      console.warn("[Service Worker] Unimplemented operation:", {
        type: message.type,
        id: message.id,
      });

      sendError(
        client,
        `Operation ${message.type} not yet implemented`,
        message.id
      );
      break;
    default:
      const unknownMessage = message as { type: string; id: string };
      console.error("[Service Worker] Unknown message type:", {
        type: unknownMessage.type,
        id: unknownMessage.id,
      });

      sendError(
        client,
        `Unknown message type: ${unknownMessage.type}`,
        unknownMessage.id
      );
  }
}

/**
 * Service Worker message handler
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  const source = event.source;

  console.log("[Service Worker] Received message:", {
    type: message.type,
    id: message.id,
    hasSource: !!source,
  });

  if (!source || typeof source !== "object") {
    console.error("[Service Worker] Received message without client source:", {
      messageType: message.type,
      messageId: message.id,
    });
    return;
  }

  // In Service Worker context, event.source is a Client
  // Cast through unknown to handle type compatibility
  const client = source as unknown as Client;

  // Ignore response messages (they come from worker, not client)
  if (message.type === "CONNECTED" || message.type.startsWith("RESPONSE")) {
    console.log("[Service Worker] Ignoring response message:", {
      type: message.type,
    });
    return;
  }

  // Handle request messages
  handleRequest(client, message as RequestMessage).catch((error) => {
    console.error(
      "[Service Worker] Unhandled error in request handler:",
      error,
      {
        messageType: message.type,
        messageId: message.id,
      }
    );
    sendError(client, "Internal error processing request", message.id);
  });
};

/**
 * Service Worker install handler
 */
self.addEventListener("install", (event: Event) => {
  console.log("[Service Worker] Installing service worker...");

  const extendableEvent = event as ExtendableEvent;
  // Skip waiting to activate immediately
  if ("waitUntil" in extendableEvent && "skipWaiting" in self) {
    const swScope = self as unknown as ServiceWorkerGlobalScope;
    console.log("[Service Worker] Skipping waiting, activating immediately");
    extendableEvent.waitUntil(swScope.skipWaiting());
  } else {
    console.warn(
      "[Service Worker] Cannot skip waiting - feature not available"
    );
  }
});

/**
 * Service Worker activate handler
 */
self.addEventListener("activate", (event: Event) => {
  console.log("[Service Worker] Activating service worker...");

  const extendableEvent = event as ExtendableEvent;
  // Take control of all clients immediately
  if ("waitUntil" in extendableEvent && "clients" in self) {
    const swScope = self as unknown as ServiceWorkerGlobalScope;
    console.log("[Service Worker] Claiming all clients...");

    extendableEvent.waitUntil(
      swScope.clients.claim().then(() => {
        console.log("[Service Worker] Successfully claimed all clients");
      })
    );
  } else {
    console.warn(
      "[Service Worker] Cannot claim clients - feature not available"
    );
  }
});
