// SharedWorker bundle - built with esbuild

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
  windowManager: new WindowManager(),
  ports: /* @__PURE__ */ new Set()
};
function generateMessageId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function sendResponse(port, message) {
  try {
    if (message.type === "BYTE_RANGE_RESPONSE") {
      port.postMessage(message, [message.data.buffer]);
    } else {
      port.postMessage(message);
    }
  } catch (error) {
    console.error("Error sending response:", error);
  }
}
function sendError(port, error, originalMessageId) {
  const response = {
    id: generateMessageId(),
    type: "ERROR",
    error,
    originalMessageId
  };
  sendResponse(port, response);
}
async function handleOpenFile(port, request) {
  try {
    await context.handleManager.openFile(request.fileId, request.handle);
    const response = {
      id: generateMessageId(),
      type: "CONNECTED"
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
async function handleReadByteRange(port, request) {
  try {
    if (!context.handleManager.hasFile(request.fileId)) {
      sendError(port, `File ${request.fileId} is not open`, request.id);
      return;
    }
    const data = await context.windowManager.getWindow(
      request.fileId,
      request.start,
      request.end,
      (start, end) => context.handleManager.readByteRange(request.fileId, start, end)
    );
    const response = {
      id: generateMessageId(),
      type: "BYTE_RANGE_RESPONSE",
      fileId: request.fileId,
      start: request.start,
      end: request.end,
      data
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
async function handleGetFileSize(port, request) {
  try {
    const size = await context.handleManager.getFileSize(request.fileId);
    const response = {
      id: generateMessageId(),
      type: "FILE_SIZE_RESPONSE",
      fileId: request.fileId,
      size
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
function handleCloseFile(port, request) {
  try {
    context.handleManager.closeFile(request.fileId);
    context.windowManager.clearCache(request.fileId);
    const response = {
      id: generateMessageId(),
      type: "CONNECTED"
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
function handleSetWindowSize(port, request) {
  try {
    context.windowManager.setWindowSize(request.fileId, request.windowSize);
    const response = {
      id: generateMessageId(),
      type: "CONNECTED"
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
async function handleRequest(port, message) {
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
      sendError(
        port,
        `Operation ${message.type} not yet implemented`,
        message.id
      );
      break;
    default:
      const unknownMessage = message;
      sendError(
        port,
        `Unknown message type: ${unknownMessage.type}`,
        unknownMessage.id
      );
  }
}
function handleConnect(port) {
  context.ports.add(port);
  const response = {
    id: generateMessageId(),
    type: "CONNECTED"
  };
  sendResponse(port, response);
  port.onmessage = (event) => {
    const message = event.data;
    if (message.type === "CONNECTED" || message.type.startsWith("RESPONSE")) {
      return;
    }
    handleRequest(port, message).catch((error) => {
      console.error("Unhandled error in request handler:", error);
      sendError(port, "Internal error processing request", message.id);
    });
  };
  port.addEventListener("error", (error) => {
    console.error("Port error:", error);
    context.ports.delete(port);
  });
}
self.onconnect = (event) => {
  const port = event.ports[0];
  port.start();
  handleConnect(port);
};
