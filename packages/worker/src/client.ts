/**
 * Client-side API for interacting with the SharedWorker
 */

import type {
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
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Worker client interface
 */
export interface WorkerClient {
  openFile(fileId: string, handle: FileSystemFileHandle): Promise<void>;
  readByteRange(
    fileId: string,
    start: number,
    end: number
  ): Promise<Uint8Array>;
  getFileSize(fileId: string): Promise<number>;
  setWindowSize(fileId: string, size: number): Promise<void>;
  closeFile(fileId: string): Promise<void>;
  disconnect(): void;
}

/**
 * Pending request tracking
 */
interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * Create a worker client connected to the SharedWorker
 */
export function createWorkerClient(workerUrl: string | URL): WorkerClient {
  let sharedWorker: SharedWorker | null = null;
  let port: MessagePort | null = null;
  const pendingRequests = new Map<string, PendingRequest>();
  const REQUEST_TIMEOUT = 30000; // 30 seconds

  /**
   * Initialize the SharedWorker connection
   */
  function initialize(): MessagePort {
    if (port) {
      return port;
    }

    try {
      sharedWorker = new SharedWorker(workerUrl, {
        credemtials: "include",
        name: "wat",
        sameSiteCookies: "all",
      });
      port = sharedWorker.port;
      port.start();

      // Handle messages from worker
      port.onmessage = (event: MessageEvent<ResponseMessage>) => {
        const message = event.data;
        const pending = pendingRequests.get(message.id);

        if (pending) {
          clearTimeout(pending.timeout);
          pendingRequests.delete(message.id);

          if (message.type === "ERROR") {
            const errorMsg = (message as ErrorResponse).error;
            pending.reject(new Error(errorMsg));
          } else {
            pending.resolve(message);
          }
        } else if (message.type === "CONNECTED") {
          // Initial connection acknowledgment - no pending request
          console.log("Worker connected");
        } else {
          console.warn("Received response for unknown request:", message.id);
        }
      };

      port.onerror = (error) => {
        console.error("Worker port error:", error);
        // Reject all pending requests
        for (const pending of pendingRequests.values()) {
          clearTimeout(pending.timeout);
          pending.reject(new Error("Worker connection error"));
        }
        pendingRequests.clear();
      };

      return port;
    } catch (error) {
      throw new Error(
        `Failed to create SharedWorker: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Send a request and wait for response
   */
  function sendRequest<T extends ResponseMessage>(
    request: RequestMessage
  ): Promise<T> {
    const port = initialize();

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingRequests.delete(request.id);
        reject(new Error(`Request timeout: ${request.type}`));
      }, REQUEST_TIMEOUT);

      pendingRequests.set(request.id, {
        resolve: (response: T) => {
          resolve(response);
        },
        reject,
        timeout,
      });

      try {
        // Transfer FileSystemFileHandle if present
        if (request.type === "OPEN_FILE") {
          // FileSystemFileHandle is not transferable, so we send it directly
          // The worker will receive it and store it
          port.postMessage(request);
        } else {
          port.postMessage(request);
        }
      } catch (error) {
        clearTimeout(timeout);
        pendingRequests.delete(request.id);
        reject(
          new Error(
            `Failed to send request: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          )
        );
      }
    });
  }

  return {
    async openFile(
      fileId: string,
      handle: FileSystemFileHandle
    ): Promise<void> {
      const request: OpenFileRequest = {
        id: generateMessageId(),
        type: "OPEN_FILE",
        fileId,
        handle,
      };
      await sendRequest<ConnectedResponse>(request);
    },

    async readByteRange(
      fileId: string,
      start: number,
      end: number
    ): Promise<Uint8Array> {
      const request: ReadByteRangeRequest = {
        id: generateMessageId(),
        type: "READ_BYTE_RANGE",
        fileId,
        start,
        end,
      };
      const response = await sendRequest<ByteRangeResponse>(request);
      return response.data;
    },

    async getFileSize(fileId: string): Promise<number> {
      const request: GetFileSizeRequest = {
        id: generateMessageId(),
        type: "GET_FILE_SIZE",
        fileId,
      };
      const response = await sendRequest<FileSizeResponse>(request);
      return response.size;
    },

    async setWindowSize(fileId: string, size: number): Promise<void> {
      const request: SetWindowSizeRequest = {
        id: generateMessageId(),
        type: "SET_WINDOW_SIZE",
        fileId,
        windowSize: size,
      };
      await sendRequest<ConnectedResponse>(request);
    },

    async closeFile(fileId: string): Promise<void> {
      const request: CloseFileRequest = {
        id: generateMessageId(),
        type: "CLOSE_FILE",
        fileId,
      };
      await sendRequest<ConnectedResponse>(request);
    },

    disconnect(): void {
      // Reject all pending requests
      for (const pending of pendingRequests.values()) {
        clearTimeout(pending.timeout);
        pending.reject(new Error("Worker disconnected"));
      }
      pendingRequests.clear();

      if (port) {
        port.close();
        port = null;
      }

      if (sharedWorker) {
        // SharedWorker doesn't have a close method, but we can disconnect the port
        sharedWorker = null;
      }
    },
  };
}
