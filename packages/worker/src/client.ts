/**
 * Client-side API for interacting with the Worker
 */

import { createLogger } from "@hexed/logger";
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

const logger = createLogger("worker-client");

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
 * Create a worker client connected to the Worker
 */
export function createWorkerClient(
  WorkerConstructor: new () => Worker
): WorkerClient {
  let worker: Worker | null = null;
  const pendingRequests = new Map<string, PendingRequest>();
  const REQUEST_TIMEOUT = 30000; // 30 seconds

  /**
   * Initialize the Worker connection
   */
  function initialize(): Worker {
    if (worker) {
      return worker;
    }

    try {
      worker = new WorkerConstructor();

      // Handle messages from worker
      worker.onmessage = (event: MessageEvent<ResponseMessage>) => {
        const message = event.data;
        const pending = pendingRequests.get(message.id);

        if (pending) {
          clearTimeout(pending.timeout);
          pendingRequests.delete(message.id);

          if (message.type === "ERROR") {
            const errorMsg = (message as ErrorResponse).error;
            logger.log(`Error response: ${errorMsg} (request: ${message.id})`);
            pending.reject(new Error(errorMsg));
          } else {
            logger.log(`Response received: ${message.type} (request: ${message.id})`);
            pending.resolve(message);
          }
        } else if (message.type === "CONNECTED") {
          // Initial connection acknowledgment - no pending request
          logger.log("Worker connected");
        } else {
          logger.log(`Received response for unknown request: ${message.id}`);
        }
      };

      worker.onerror = (error) => {
        logger.log("Worker error:", error);
        // Reject all pending requests
        for (const pending of Array.from(pendingRequests.values())) {
          clearTimeout(pending.timeout);
          pending.reject(new Error("Worker connection error"));
        }
        pendingRequests.clear();
      };

      return worker;
    } catch (error) {
      throw new Error(
        `Failed to create Worker: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Send a request and wait for response
   */
  function sendRequest<T extends ResponseMessage>(
    request: RequestMessage
  ): Promise<T> {
    const worker = initialize();
    logger.log(`Sending request: ${request.type} (id: ${request.id})`);

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        logger.log(`Request timeout: ${request.type} (id: ${request.id})`);
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
          worker.postMessage(request);
        } else {
          worker.postMessage(request);
        }
      } catch (error) {
        logger.log(`Failed to send request: ${request.type}`, error);
        clearTimeout(timeout);
        pendingRequests.delete(request.id);
        reject(
          new Error(
            `Failed to send request: ${error instanceof Error ? error.message : "Unknown error"}`
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
      logger.log(`Opening file: ${fileId}`);
      const request: OpenFileRequest = {
        id: generateMessageId(),
        type: "OPEN_FILE",
        fileId,
        handle,
      };
      await sendRequest<ConnectedResponse>(request);
      logger.log(`File opened: ${fileId}`);
    },

    async readByteRange(
      fileId: string,
      start: number,
      end: number
    ): Promise<Uint8Array> {
      logger.log(`Reading byte range: ${fileId} [${start}-${end}]`);
      const request: ReadByteRangeRequest = {
        id: generateMessageId(),
        type: "READ_BYTE_RANGE",
        fileId,
        start,
        end,
      };
      const response = await sendRequest<ByteRangeResponse>(request);
      logger.log(`Byte range read: ${fileId} [${start}-${end}], ${response.data.length} bytes`);
      return response.data;
    },

    async getFileSize(fileId: string): Promise<number> {
      logger.log(`Getting file size: ${fileId}`);
      const request: GetFileSizeRequest = {
        id: generateMessageId(),
        type: "GET_FILE_SIZE",
        fileId,
      };
      const response = await sendRequest<FileSizeResponse>(request);
      logger.log(`File size: ${fileId} = ${response.size} bytes`);
      return response.size;
    },

    async setWindowSize(fileId: string, size: number): Promise<void> {
      logger.log(`Setting window size: ${fileId} = ${size} bytes`);
      const request: SetWindowSizeRequest = {
        id: generateMessageId(),
        type: "SET_WINDOW_SIZE",
        fileId,
        windowSize: size,
      };
      await sendRequest<ConnectedResponse>(request);
    },

    async closeFile(fileId: string): Promise<void> {
      logger.log(`Closing file: ${fileId}`);
      const request: CloseFileRequest = {
        id: generateMessageId(),
        type: "CLOSE_FILE",
        fileId,
      };
      await sendRequest<ConnectedResponse>(request);
      logger.log(`File closed: ${fileId}`);
    },

    disconnect(): void {
      logger.log("Disconnecting worker client");
      // Reject all pending requests
      for (const pending of Array.from(pendingRequests.values())) {
        clearTimeout(pending.timeout);
        pending.reject(new Error("Worker disconnected"));
      }
      pendingRequests.clear();

      if (worker) {
        worker.terminate();
        worker = null;
      }
    },
  };
}
