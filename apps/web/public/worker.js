// Service Worker bundle - built with esbuild

// src/file-handle-manager.ts
var FileHandleManager = class {
  handles = /* @__PURE__ */ new Map();
  /**
   * Register a file handle
   */
  async openFile(fileId, handle) {
    const file = await handle.getFile();
    const info = {
      handle,
      size: file.size,
      lastAccessed: Date.now()
    };
    this.handles.set(fileId, info);
  }
  /**
   * Check if a file is open
   */
  hasFile(fileId) {
    return this.handles.has(fileId);
  }
  /**
   * Get file size, fetching if not cached
   */
  async getFileSize(fileId) {
    const info = this.handles.get(fileId);
    if (!info) {
      throw new Error(`File ${fileId} is not open`);
    }
    const file = await info.handle.getFile();
    info.size = file.size;
    info.lastAccessed = Date.now();
    return file.size;
  }
  /**
   * Read a byte range from a file
   */
  async readByteRange(fileId, start, end) {
    const info = this.handles.get(fileId);
    if (!info) {
      throw new Error(`File ${fileId} is not open`);
    }
    const file = await info.handle.getFile();
    const fileSize = file.size;
    const clampedStart = Math.max(0, Math.min(start, fileSize));
    const clampedEnd = Math.max(clampedStart, Math.min(end, fileSize));
    if (clampedStart >= fileSize) {
      return new Uint8Array(0);
    }
    const blob = file.slice(clampedStart, clampedEnd);
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    info.lastAccessed = Date.now();
    info.size = fileSize;
    return data;
  }
  /**
   * Close a file handle
   */
  closeFile(fileId) {
    this.handles.delete(fileId);
  }
  /**
   * Close all file handles
   */
  closeAll() {
    this.handles.clear();
  }
  /**
   * Get all open file IDs
   */
  getOpenFileIds() {
    return Array.from(this.handles.keys());
  }
  /**
   * Get file info (for debugging)
   */
  getFileInfo(fileId) {
    return this.handles.get(fileId);
  }
};

// src/types.ts
var DEFAULT_WINDOW_CONFIG = {
  size: 256 * 1024,
  // 256KB
  overlap: 4 * 1024,
  // 4KB overlap
  maxCacheSize: 10
  // Maximum number of cached windows
};

// src/window-manager.ts
var WindowManager = class {
  windows = /* @__PURE__ */ new Map();
  configs = /* @__PURE__ */ new Map();
  /**
   * Get or create window configuration for a file
   */
  getConfig(fileId) {
    if (!this.configs.has(fileId)) {
      this.configs.set(fileId, { ...DEFAULT_WINDOW_CONFIG });
    }
    return this.configs.get(fileId);
  }
  /**
   * Generate a cache key for a window
   */
  getWindowKey(start, end) {
    return `${start}-${end}`;
  }
  /**
   * Get a window, loading it if not cached
   */
  async getWindow(fileId, start, end, readFn) {
    const config = this.getConfig(fileId);
    const now = Date.now();
    const windowStart = Math.floor(start / config.size) * config.size;
    const windowEnd = Math.min(
      windowStart + config.size + config.overlap,
      end
    );
    const key = this.getWindowKey(windowStart, windowEnd);
    if (!this.windows.has(fileId)) {
      this.windows.set(fileId, /* @__PURE__ */ new Map());
    }
    const fileCache = this.windows.get(fileId);
    const cached = fileCache.get(key);
    if (cached) {
      cached.lastAccessed = now;
      const offset2 = start - windowStart;
      const length2 = end - start;
      return cached.data.slice(offset2, offset2 + length2);
    }
    const data = await readFn(windowStart, windowEnd);
    const window = {
      start: windowStart,
      end: windowEnd,
      data,
      lastAccessed: now
    };
    this.evictIfNeeded(fileId, config.maxCacheSize);
    fileCache.set(key, window);
    const offset = start - windowStart;
    const length = end - start;
    return data.slice(offset, offset + length);
  }
  /**
   * Evict least recently used windows if cache exceeds limit
   */
  evictIfNeeded(fileId, maxSize) {
    const fileCache = this.windows.get(fileId);
    if (!fileCache || fileCache.size <= maxSize) {
      return;
    }
    const entries = Array.from(fileCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    const toRemove = entries.length - maxSize;
    for (let i = 0; i < toRemove; i++) {
      fileCache.delete(entries[i][0]);
    }
  }
  /**
   * Set window size for a file
   */
  setWindowSize(fileId, size) {
    const config = this.getConfig(fileId);
    config.size = size;
    this.clearCache(fileId);
  }
  /**
   * Clear cache for a specific file
   */
  clearCache(fileId) {
    this.windows.delete(fileId);
  }
  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.windows.clear();
  }
  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(fileId) {
    const fileCache = this.windows.get(fileId);
    if (!fileCache) {
      return { windowCount: 0, totalBytes: 0 };
    }
    let totalBytes = 0;
    for (const window of fileCache.values()) {
      totalBytes += window.data.length;
    }
    return {
      windowCount: fileCache.size,
      totalBytes
    };
  }
};

// src/worker.ts
var context = {
  handleManager: new FileHandleManager(),
  windowManager: new WindowManager()
};
console.log(
  "[Service Worker] Initialized with FileHandleManager and WindowManager"
);
function generateMessageId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function sendResponse(client, message) {
  try {
    console.log(`[Service Worker] Sending response: ${message.type}`, {
      id: message.id,
      ...message.type === "BYTE_RANGE_RESPONSE" ? {
        fileId: message.fileId,
        start: message.start,
        end: message.end,
        dataLength: message.data.length
      } : message.type === "FILE_SIZE_RESPONSE" ? {
        fileId: message.fileId,
        size: message.size
      } : {}
    });
    if (message.type === "BYTE_RANGE_RESPONSE") {
      client.postMessage(message, [message.data.buffer]);
    } else {
      client.postMessage(message);
    }
  } catch (error) {
    console.error("[Service Worker] Error sending response:", error, {
      messageType: message.type,
      messageId: message.id
    });
  }
}
function sendError(client, error, originalMessageId) {
  console.error("[Service Worker] Sending error response:", {
    error,
    originalMessageId
  });
  const response = {
    id: generateMessageId(),
    type: "ERROR",
    error,
    originalMessageId
  };
  sendResponse(client, response);
}
async function handleOpenFile(client, request) {
  console.log("[Service Worker] Handling OPEN_FILE request:", {
    fileId: request.fileId,
    requestId: request.id
  });
  try {
    await context.handleManager.openFile(request.fileId, request.handle);
    console.log("[Service Worker] File opened successfully:", {
      fileId: request.fileId
    });
    const response = {
      id: generateMessageId(),
      type: "CONNECTED"
    };
    sendResponse(client, response);
  } catch (error) {
    console.error("[Service Worker] Failed to open file:", error, {
      fileId: request.fileId,
      requestId: request.id
    });
    sendError(
      client,
      error instanceof Error ? error.message : "Failed to open file",
      request.id
    );
  }
}
async function handleReadByteRange(client, request) {
  console.log("[Service Worker] Handling READ_BYTE_RANGE request:", {
    fileId: request.fileId,
    start: request.start,
    end: request.end,
    range: request.end - request.start,
    requestId: request.id
  });
  try {
    if (!context.handleManager.hasFile(request.fileId)) {
      console.warn("[Service Worker] File not open:", {
        fileId: request.fileId,
        requestId: request.id
      });
      sendError(client, `File ${request.fileId} is not open`, request.id);
      return;
    }
    console.log("[Service Worker] Reading byte range from file:", {
      fileId: request.fileId,
      start: request.start,
      end: request.end
    });
    const data = await context.windowManager.getWindow(
      request.fileId,
      request.start,
      request.end,
      (start, end) => context.handleManager.readByteRange(request.fileId, start, end)
    );
    console.log("[Service Worker] Byte range read successfully:", {
      fileId: request.fileId,
      start: request.start,
      end: request.end,
      dataLength: data.length
    });
    const response = {
      id: generateMessageId(),
      type: "BYTE_RANGE_RESPONSE",
      fileId: request.fileId,
      start: request.start,
      end: request.end,
      data
    };
    sendResponse(client, response);
  } catch (error) {
    console.error("[Service Worker] Failed to read byte range:", error, {
      fileId: request.fileId,
      start: request.start,
      end: request.end,
      requestId: request.id
    });
    sendError(
      client,
      error instanceof Error ? error.message : "Failed to read byte range",
      request.id
    );
  }
}
async function handleGetFileSize(client, request) {
  console.log("[Service Worker] Handling GET_FILE_SIZE request:", {
    fileId: request.fileId,
    requestId: request.id
  });
  try {
    const size = await context.handleManager.getFileSize(request.fileId);
    console.log("[Service Worker] File size retrieved:", {
      fileId: request.fileId,
      size
    });
    const response = {
      id: generateMessageId(),
      type: "FILE_SIZE_RESPONSE",
      fileId: request.fileId,
      size
    };
    sendResponse(client, response);
  } catch (error) {
    console.error("[Service Worker] Failed to get file size:", error, {
      fileId: request.fileId,
      requestId: request.id
    });
    sendError(
      client,
      error instanceof Error ? error.message : "Failed to get file size",
      request.id
    );
  }
}
function handleCloseFile(client, request) {
  console.log("[Service Worker] Handling CLOSE_FILE request:", {
    fileId: request.fileId,
    requestId: request.id
  });
  try {
    context.handleManager.closeFile(request.fileId);
    context.windowManager.clearCache(request.fileId);
    console.log("[Service Worker] File closed successfully:", {
      fileId: request.fileId
    });
    const response = {
      id: generateMessageId(),
      type: "CONNECTED"
    };
    sendResponse(client, response);
  } catch (error) {
    console.error("[Service Worker] Failed to close file:", error, {
      fileId: request.fileId,
      requestId: request.id
    });
    sendError(
      client,
      error instanceof Error ? error.message : "Failed to close file",
      request.id
    );
  }
}
function handleSetWindowSize(client, request) {
  console.log("[Service Worker] Handling SET_WINDOW_SIZE request:", {
    fileId: request.fileId,
    windowSize: request.windowSize,
    requestId: request.id
  });
  try {
    context.windowManager.setWindowSize(request.fileId, request.windowSize);
    console.log("[Service Worker] Window size set successfully:", {
      fileId: request.fileId,
      windowSize: request.windowSize
    });
    const response = {
      id: generateMessageId(),
      type: "CONNECTED"
    };
    sendResponse(client, response);
  } catch (error) {
    console.error("[Service Worker] Failed to set window size:", error, {
      fileId: request.fileId,
      windowSize: request.windowSize,
      requestId: request.id
    });
    sendError(
      client,
      error instanceof Error ? error.message : "Failed to set window size",
      request.id
    );
  }
}
async function handleRequest(client, message) {
  console.log("[Service Worker] Routing request:", {
    type: message.type,
    id: message.id
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
      console.warn("[Service Worker] Unimplemented operation:", {
        type: message.type,
        id: message.id
      });
      sendError(
        client,
        `Operation ${message.type} not yet implemented`,
        message.id
      );
      break;
    default:
      const unknownMessage = message;
      console.error("[Service Worker] Unknown message type:", {
        type: unknownMessage.type,
        id: unknownMessage.id
      });
      sendError(
        client,
        `Unknown message type: ${unknownMessage.type}`,
        unknownMessage.id
      );
  }
}
self.onmessage = (event) => {
  const message = event.data;
  const source = event.source;
  console.log("[Service Worker] Received message:", {
    type: message.type,
    id: message.id,
    hasSource: !!source
  });
  if (!source || typeof source !== "object") {
    console.error("[Service Worker] Received message without client source:", {
      messageType: message.type,
      messageId: message.id
    });
    return;
  }
  const client = source;
  if (message.type === "CONNECTED" || message.type.startsWith("RESPONSE")) {
    console.log("[Service Worker] Ignoring response message:", {
      type: message.type
    });
    return;
  }
  handleRequest(client, message).catch((error) => {
    console.error(
      "[Service Worker] Unhandled error in request handler:",
      error,
      {
        messageType: message.type,
        messageId: message.id
      }
    );
    sendError(client, "Internal error processing request", message.id);
  });
};
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing service worker...");
  const extendableEvent = event;
  if ("waitUntil" in extendableEvent && "skipWaiting" in self) {
    const swScope = self;
    console.log("[Service Worker] Skipping waiting, activating immediately");
    extendableEvent.waitUntil(swScope.skipWaiting());
  } else {
    console.warn(
      "[Service Worker] Cannot skip waiting - feature not available"
    );
  }
});
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating service worker...");
  const extendableEvent = event;
  if ("waitUntil" in extendableEvent && "clients" in self) {
    const swScope = self;
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
