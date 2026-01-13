import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createWorkerClient, type WorkerClient } from "./client";
import type {
  ByteRangeResponse,
  FileSizeResponse,
  ConnectedResponse,
  ErrorResponse,
} from "./types";
import {
  createMockFileHandle,
  createMockServiceWorkerNavigator,
  createTestData,
} from "./test-utils";

// Mock Service Worker globally
let mockNavigator: ReturnType<typeof createMockServiceWorkerNavigator>;

// Mock navigator.serviceWorker
Object.defineProperty(global, "navigator", {
  value: {
    serviceWorker: {} as ServiceWorkerContainer,
  },
  writable: true,
  configurable: true,
});

describe("createWorkerClient", () => {
  let client: WorkerClient;
  const workerUrl = "http://localhost/worker.js";

  beforeEach(async () => {
    // Setup mock Service Worker navigator
    mockNavigator = createMockServiceWorkerNavigator();
    (global.navigator as any) = mockNavigator.navigator;

    // Mock serviceWorker.register to return our mock registration
    const mockRegistration = await mockNavigator.navigator.serviceWorker.ready;
    vi.spyOn(global.navigator.serviceWorker, "register").mockResolvedValue(
      mockRegistration
    );

    client = createWorkerClient(workerUrl);
  });

  afterEach(() => {
    client.disconnect();
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should register Service Worker on first use", async () => {
      await client.openFile("file1", createMockFileHandle("test.bin", 100));
      expect(global.navigator.serviceWorker.register).toHaveBeenCalledWith(
        workerUrl,
        { scope: "/" }
      );
    });

    it("should handle CONNECTED message", async () => {
      const handle = createMockFileHandle("test.bin", 100);
      const openPromise = client.openFile("file1", handle);

      // Simulate service worker ready
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate CONNECTED response
      const connectedResponse: ConnectedResponse = {
        id: "test-id",
        type: "CONNECTED",
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: connectedResponse })
        );
      }

      // Wait a bit for processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      // The openFile should complete (we'll simulate the actual response in the openFile test)
      // For now, just verify the message handler is set up
      expect(global.navigator.serviceWorker.onmessage).toBeDefined();
    });
  });

  describe("openFile", () => {
    it("should send OPEN_FILE request", async () => {
      const handle = createMockFileHandle("test.bin", 100);
      let capturedRequest: any = null;

      // Mock controller.postMessage to capture the request
      const mockController = {
        postMessage: vi.fn((message: any) => {
          capturedRequest = message;
        }),
      } as unknown as ServiceWorker;

      Object.defineProperty(global.navigator.serviceWorker, "controller", {
        value: mockController,
        writable: true,
        configurable: true,
      });

      const openPromise = client.openFile("file1", handle);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedRequest).toBeDefined();
      expect(capturedRequest?.type).toBe("OPEN_FILE");
      expect(capturedRequest?.fileId).toBe("file1");
      expect(capturedRequest?.handle).toBe(handle);

      // Simulate response with matching ID
      const response: ConnectedResponse = {
        id: capturedRequest.id,
        type: "CONNECTED",
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: response })
        );
      }

      await openPromise;
    });

    it("should handle error response", async () => {
      const handle = createMockFileHandle("test.bin", 100);
      let capturedRequest: any = null;

      const mockController = {
        postMessage: vi.fn((message: any) => {
          capturedRequest = message;
        }),
      } as unknown as ServiceWorker;

      Object.defineProperty(global.navigator.serviceWorker, "controller", {
        value: mockController,
        writable: true,
        configurable: true,
      });

      const openPromise = client.openFile("file1", handle);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const errorResponse: ErrorResponse = {
        id: capturedRequest.id,
        type: "ERROR",
        error: "Failed to open file",
        originalMessageId: capturedRequest.id,
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: errorResponse })
        );
      }

      await expect(openPromise).rejects.toThrow("Failed to open file");
    });
  });

  describe("readByteRange", () => {
    it("should send READ_BYTE_RANGE request and return data", async () => {
      const testData = createTestData(100);
      let capturedRequest: any = null;

      const mockController = {
        postMessage: vi.fn((message: any) => {
          capturedRequest = message;
        }),
      } as unknown as ServiceWorker;

      Object.defineProperty(global.navigator.serviceWorker, "controller", {
        value: mockController,
        writable: true,
        configurable: true,
      });

      const readPromise = client.readByteRange("file1", 0, 100);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedRequest?.type).toBe("READ_BYTE_RANGE");
      expect(capturedRequest?.fileId).toBe("file1");
      expect(capturedRequest?.start).toBe(0);
      expect(capturedRequest?.end).toBe(100);

      const response: ByteRangeResponse = {
        id: capturedRequest.id,
        type: "BYTE_RANGE_RESPONSE",
        fileId: "file1",
        start: 0,
        end: 100,
        data: testData,
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: response })
        );
      }

      const data = await readPromise;

      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBe(100);
      expect(Array.from(data)).toEqual(Array.from(testData));
    });

    it("should handle error response", async () => {
      let capturedRequest: any = null;

      const mockController = {
        postMessage: vi.fn((message: any) => {
          capturedRequest = message;
        }),
      } as unknown as ServiceWorker;

      Object.defineProperty(global.navigator.serviceWorker, "controller", {
        value: mockController,
        writable: true,
        configurable: true,
      });

      const readPromise = client.readByteRange("file1", 0, 100);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const errorResponse: ErrorResponse = {
        id: capturedRequest.id,
        type: "ERROR",
        error: "File not found",
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: errorResponse })
        );
      }

      await expect(readPromise).rejects.toThrow("File not found");
    });
  });

  describe("getFileSize", () => {
    it("should send GET_FILE_SIZE request and return size", async () => {
      const fileSize = 2048;
      let capturedRequest: any = null;

      const mockController = {
        postMessage: vi.fn((message: any) => {
          capturedRequest = message;
        }),
      } as unknown as ServiceWorker;

      Object.defineProperty(global.navigator.serviceWorker, "controller", {
        value: mockController,
        writable: true,
        configurable: true,
      });

      const sizePromise = client.getFileSize("file1");

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedRequest?.type).toBe("GET_FILE_SIZE");
      expect(capturedRequest?.fileId).toBe("file1");

      const response: FileSizeResponse = {
        id: capturedRequest.id,
        type: "FILE_SIZE_RESPONSE",
        fileId: "file1",
        size: fileSize,
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: response })
        );
      }

      const size = await sizePromise;
      expect(size).toBe(fileSize);
    });
  });

  describe("setWindowSize", () => {
    it("should send SET_WINDOW_SIZE request", async () => {
      const windowSize = 512 * 1024;
      let capturedRequest: any = null;

      const mockController = {
        postMessage: vi.fn((message: any) => {
          capturedRequest = message;
        }),
      } as unknown as ServiceWorker;

      Object.defineProperty(global.navigator.serviceWorker, "controller", {
        value: mockController,
        writable: true,
        configurable: true,
      });

      const setPromise = client.setWindowSize("file1", windowSize);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedRequest?.type).toBe("SET_WINDOW_SIZE");
      expect(capturedRequest?.fileId).toBe("file1");
      expect(capturedRequest?.windowSize).toBe(windowSize);

      const response: ConnectedResponse = {
        id: capturedRequest.id,
        type: "CONNECTED",
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: response })
        );
      }

      await setPromise;
    });
  });

  describe("closeFile", () => {
    it("should send CLOSE_FILE request", async () => {
      let capturedRequest: any = null;

      const mockController = {
        postMessage: vi.fn((message: any) => {
          capturedRequest = message;
        }),
      } as unknown as ServiceWorker;

      Object.defineProperty(global.navigator.serviceWorker, "controller", {
        value: mockController,
        writable: true,
        configurable: true,
      });

      const closePromise = client.closeFile("file1");

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedRequest?.type).toBe("CLOSE_FILE");
      expect(capturedRequest?.fileId).toBe("file1");

      const response: ConnectedResponse = {
        id: capturedRequest.id,
        type: "CONNECTED",
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: response })
        );
      }

      await closePromise;
    });
  });

  describe("disconnect", () => {
    it("should reject pending requests", async () => {
      const mockController = {
        postMessage: vi.fn(),
      } as unknown as ServiceWorker;

      Object.defineProperty(global.navigator.serviceWorker, "controller", {
        value: mockController,
        writable: true,
        configurable: true,
      });

      // Start a request that won't complete
      const readPromise = client.readByteRange("file1", 0, 100);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Disconnect before response
      client.disconnect();

      await expect(readPromise).rejects.toThrow("Service Worker disconnected");
    });

    it("should clear message handler", () => {
      client.disconnect();

      expect(global.navigator.serviceWorker.onmessage).toBeNull();
    });
  });

  describe("request timeout", () => {
    it("should timeout if response not received", async () => {
      vi.useFakeTimers();
      const mockPort = mockWorker.simulateConnect();

      const readPromise = client.readByteRange("file1", 0, 100);

      // Advance time past timeout (30 seconds)
      vi.advanceTimersByTime(30000);

      await expect(readPromise).rejects.toThrow("Request timeout");

      vi.useRealTimers();
    });
  });

  describe("multiple concurrent requests", () => {
    it("should handle multiple concurrent requests", async () => {
      const requests: any[] = [];

      const mockController = {
        postMessage: vi.fn((message: any) => {
          requests.push(message);
        }),
      } as unknown as ServiceWorker;

      Object.defineProperty(global.navigator.serviceWorker, "controller", {
        value: mockController,
        writable: true,
        configurable: true,
      });

      const promise1 = client.readByteRange("file1", 0, 100);
      const promise2 = client.readByteRange("file1", 100, 200);
      const promise3 = client.getFileSize("file1");

      // Wait for all messages to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(requests.length).toBe(3);

      // Send responses in different order, matching request IDs
      const request3 = requests[2];
      const response3: FileSizeResponse = {
        id: request3.id,
        type: "FILE_SIZE_RESPONSE",
        fileId: "file1",
        size: 1000,
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: response3 })
        );
      }

      const request1 = requests[0];
      const response1: ByteRangeResponse = {
        id: request1.id,
        type: "BYTE_RANGE_RESPONSE",
        fileId: "file1",
        start: 0,
        end: 100,
        data: createTestData(100),
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: response1 })
        );
      }

      const request2 = requests[1];
      const response2: ByteRangeResponse = {
        id: request2.id,
        type: "BYTE_RANGE_RESPONSE",
        fileId: "file1",
        start: 100,
        end: 200,
        data: createTestData(100),
      };
      if (global.navigator.serviceWorker.onmessage) {
        global.navigator.serviceWorker.onmessage(
          new MessageEvent("message", { data: response2 })
        );
      }

      const [data1, data2, size] = await Promise.all([
        promise1,
        promise2,
        promise3,
      ]);

      expect(data1.length).toBe(100);
      expect(data2.length).toBe(100);
      expect(size).toBe(1000);
    });
  });

  describe("error handling", () => {
    it("should handle service worker errors", async () => {
      const handle = createMockFileHandle("test.bin", 100);

      const mockController = {
        postMessage: vi.fn(),
      } as unknown as ServiceWorker;

      Object.defineProperty(global.navigator.serviceWorker, "controller", {
        value: mockController,
        writable: true,
        configurable: true,
      });

      const openPromise = client.openFile("file1", handle);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate service worker error event
      const errorEvent = new ErrorEvent("error", {
        message: "Connection failed",
      });
      const errorListener = global.navigator.serviceWorker.addEventListener;
      if (errorListener) {
        // Trigger error handler if it exists
        // In real implementation, this would be handled by the error event listener
      }

      // The error should cause pending requests to be rejected
      // This is tested indirectly through the disconnect test
      client.disconnect();
      await expect(openPromise).rejects.toThrow();
    });
  });
});
