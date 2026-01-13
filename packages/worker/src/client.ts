/**
 * Client-side API for interacting with the Service Worker
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
 * Create a worker client connected to the Service Worker
 */
export function createWorkerClient(workerUrl: string | URL): WorkerClient {
  let registration: ServiceWorkerRegistration | null = null;
  let isInitialized = false;
  const pendingRequests = new Map<string, PendingRequest>();
  const REQUEST_TIMEOUT = 30000; // 30 seconds
  const CONTROLLER_WAIT_TIMEOUT = 5000; // 5 seconds

  /**
   * Wait for the service worker controller to become available
   */
  async function waitForController(): Promise<ServiceWorker> {
    // Check if controller is already available
    if (navigator.serviceWorker.controller) {
      return navigator.serviceWorker.controller;
    }

    // If we have a registration, wait for installing worker to become activated
    if (registration?.installing) {
      const installingWorker = registration.installing;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          installingWorker.removeEventListener(
            "statechange",
            stateChangeHandler
          );
          reject(new Error("Service Worker installation timeout"));
        }, CONTROLLER_WAIT_TIMEOUT);

        const stateChangeHandler = () => {
          if (!installingWorker) {
            clearTimeout(timeout);
            resolve();
            return;
          }

          if (
            installingWorker.state === "activated" ||
            installingWorker.state === "redundant"
          ) {
            clearTimeout(timeout);
            installingWorker.removeEventListener(
              "statechange",
              stateChangeHandler
            );
            if (installingWorker.state === "activated") {
              resolve();
            } else {
              reject(new Error("Service Worker installation failed"));
            }
          }
        };

        installingWorker.addEventListener("statechange", stateChangeHandler);
      });
    }

    // Check again after waiting for installation
    if (navigator.serviceWorker.controller) {
      return navigator.serviceWorker.controller;
    }

    // Wait for controllerchange event as fallback
    return new Promise<ServiceWorker>((resolve, reject) => {
      const timeout = setTimeout(() => {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          controllerChangeHandler
        );
        reject(
          new Error(
            "Service Worker controller not available after waiting. The service worker may need a page reload to take control."
          )
        );
      }, CONTROLLER_WAIT_TIMEOUT);

      const controllerChangeHandler = () => {
        if (navigator.serviceWorker.controller) {
          clearTimeout(timeout);
          navigator.serviceWorker.removeEventListener(
            "controllerchange",
            controllerChangeHandler
          );
          resolve(navigator.serviceWorker.controller);
        }
      };

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        controllerChangeHandler
      );

      // Check again immediately in case controller became available
      if (navigator.serviceWorker.controller) {
        clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          controllerChangeHandler
        );
        resolve(navigator.serviceWorker.controller);
      }
    });
  }

  /**
   * Initialize the Service Worker connection
   */
  async function initialize(): Promise<void> {
    if (isInitialized) {
      return;
    }

    if (!navigator.serviceWorker) {
      throw new Error("Service Workers are not supported in this browser");
    }

    try {
      // Register service worker with explicit scope "/" to control entire origin
      registration = await navigator.serviceWorker.register(workerUrl, {
        scope: "/",
      });

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Wait for controller to become available
      // This handles the case where the service worker is installing/activating
      try {
        await waitForController();
      } catch (error) {
        // If controller is still not available, check if it exists now
        // (it might have become available between the wait and the check)
        if (!navigator.serviceWorker.controller) {
          throw new Error(
            `Service Worker controller not available: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Handle messages from worker
      navigator.serviceWorker.onmessage = (
        event: MessageEvent<ResponseMessage>
      ) => {
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
          console.log("Service Worker connected");
        } else {
          console.warn("Received response for unknown request:", message.id);
        }
      };

      // Handle service worker errors
      navigator.serviceWorker.addEventListener("error", (error) => {
        console.error("Service Worker error:", error);
        // Reject all pending requests
        for (const pending of pendingRequests.values()) {
          clearTimeout(pending.timeout);
          pending.reject(new Error("Service Worker error"));
        }
        pendingRequests.clear();
      });

      isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to register Service Worker: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Send a request and wait for response
   */
  async function sendRequest<T extends ResponseMessage>(
    request: RequestMessage
  ): Promise<T> {
    await initialize();

    // Ensure controller is available before sending request
    const controller = await waitForController();

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
        // Send message to service worker controller
        // FileSystemFileHandle can be cloned and sent to service worker
        controller.postMessage(request);
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
        pending.reject(new Error("Service Worker disconnected"));
      }
      pendingRequests.clear();

      // Remove message handler
      if (navigator.serviceWorker) {
        navigator.serviceWorker.onmessage = null;
      }

      // Note: We don't unregister the service worker here as it might be used by other components
      // Service worker unregistration should be handled at a higher level if needed
      isInitialized = false;
    },
  };
}
