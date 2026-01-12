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
  createMockSharedWorker,
  createTestData,
} from "./test-utils";

// Mock SharedWorker globally
const mockSharedWorkers = new Map<
  string,
  ReturnType<typeof createMockSharedWorker>
>();

global.SharedWorker = vi.fn().mockImplementation((url: string | URL) => {
  const urlStr = url.toString();
  if (!mockSharedWorkers.has(urlStr)) {
    mockSharedWorkers.set(urlStr, createMockSharedWorker(url));
  }
  const mock = mockSharedWorkers.get(urlStr)!;
  return mock.worker;
}) as unknown as typeof SharedWorker;

describe("createWorkerClient", () => {
  let client: WorkerClient;
  const workerUrl = "http://localhost/worker.js";
  let mockWorker: ReturnType<typeof createMockSharedWorker>;

  beforeEach(() => {
    mockSharedWorkers.clear();
    mockWorker = createMockSharedWorker(workerUrl);
    mockSharedWorkers.set(workerUrl, mockWorker);
    client = createWorkerClient(workerUrl);
  });

  afterEach(() => {
    client.disconnect();
  });

  describe("initialization", () => {
    it("should create SharedWorker on first use", () => {
      expect(global.SharedWorker).toHaveBeenCalledWith(workerUrl, {
        type: "module",
      });
    });

    it("should send CONNECTED message on connection", async () => {
      const mockPort = mockWorker.simulateConnect();
      const connectedResponse: ConnectedResponse = {
        id: "test-id",
        type: "CONNECTED",
      };
      mockPort.simulateMessage(connectedResponse);

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPort.messages.length).toBeGreaterThan(0);
    });
  });

  describe("openFile", () => {
    it("should send OPEN_FILE request", async () => {
      const mockPort = mockWorker.simulateConnect();
      const handle = createMockFileHandle("test.bin", 100);

      const openPromise = client.openFile("file1", handle);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPort.messages.length).toBeGreaterThan(0);
      const request = mockPort.messages[0]?.data;
      expect(request?.type).toBe("OPEN_FILE");
      expect(request?.fileId).toBe("file1");
      expect(request?.handle).toBe(handle);

      // Simulate response with matching ID
      const response: ConnectedResponse = {
        id: request.id,
        type: "CONNECTED",
      };
      mockPort.simulateMessage(response);

      await openPromise;
    });

    it("should handle error response", async () => {
      const mockPort = mockWorker.simulateConnect();
      const handle = createMockFileHandle("test.bin", 100);

      const openPromise = client.openFile("file1", handle);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockPort.messages[0]?.data;
      const errorResponse: ErrorResponse = {
        id: request.id,
        type: "ERROR",
        error: "Failed to open file",
        originalMessageId: request.id,
      };
      mockPort.simulateMessage(errorResponse);

      await expect(openPromise).rejects.toThrow("Failed to open file");
    });
  });

  describe("readByteRange", () => {
    it("should send READ_BYTE_RANGE request and return data", async () => {
      const mockPort = mockWorker.simulateConnect();
      const testData = createTestData(100);

      const readPromise = client.readByteRange("file1", 0, 100);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockPort.messages[0]?.data;
      expect(request?.type).toBe("READ_BYTE_RANGE");
      expect(request?.fileId).toBe("file1");
      expect(request?.start).toBe(0);
      expect(request?.end).toBe(100);

      const response: ByteRangeResponse = {
        id: request.id,
        type: "BYTE_RANGE_RESPONSE",
        fileId: "file1",
        start: 0,
        end: 100,
        data: testData,
      };
      mockPort.simulateMessage(response);

      const data = await readPromise;

      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBe(100);
      expect(Array.from(data)).toEqual(Array.from(testData));
    });

    it("should handle error response", async () => {
      const mockPort = mockWorker.simulateConnect();

      const readPromise = client.readByteRange("file1", 0, 100);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockPort.messages[0]?.data;
      const errorResponse: ErrorResponse = {
        id: request.id,
        type: "ERROR",
        error: "File not found",
      };
      mockPort.simulateMessage(errorResponse);

      await expect(readPromise).rejects.toThrow("File not found");
    });
  });

  describe("getFileSize", () => {
    it("should send GET_FILE_SIZE request and return size", async () => {
      const mockPort = mockWorker.simulateConnect();
      const fileSize = 2048;

      const sizePromise = client.getFileSize("file1");

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockPort.messages[0]?.data;
      expect(request?.type).toBe("GET_FILE_SIZE");
      expect(request?.fileId).toBe("file1");

      const response: FileSizeResponse = {
        id: request.id,
        type: "FILE_SIZE_RESPONSE",
        fileId: "file1",
        size: fileSize,
      };
      mockPort.simulateMessage(response);

      const size = await sizePromise;
      expect(size).toBe(fileSize);
    });
  });

  describe("setWindowSize", () => {
    it("should send SET_WINDOW_SIZE request", async () => {
      const mockPort = mockWorker.simulateConnect();
      const windowSize = 512 * 1024;

      const setPromise = client.setWindowSize("file1", windowSize);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockPort.messages[0]?.data;
      expect(request?.type).toBe("SET_WINDOW_SIZE");
      expect(request?.fileId).toBe("file1");
      expect(request?.windowSize).toBe(windowSize);

      const response: ConnectedResponse = {
        id: request.id,
        type: "CONNECTED",
      };
      mockPort.simulateMessage(response);

      await setPromise;
    });
  });

  describe("closeFile", () => {
    it("should send CLOSE_FILE request", async () => {
      const mockPort = mockWorker.simulateConnect();

      const closePromise = client.closeFile("file1");

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockPort.messages[0]?.data;
      expect(request?.type).toBe("CLOSE_FILE");
      expect(request?.fileId).toBe("file1");

      const response: ConnectedResponse = {
        id: request.id,
        type: "CONNECTED",
      };
      mockPort.simulateMessage(response);

      await closePromise;
    });
  });

  describe("disconnect", () => {
    it("should close port and reject pending requests", async () => {
      const mockPort = mockWorker.simulateConnect();

      // Start a request that won't complete
      const readPromise = client.readByteRange("file1", 0, 100);

      // Disconnect before response
      client.disconnect();

      await expect(readPromise).rejects.toThrow("Worker disconnected");
    });

    it("should close port", () => {
      const mockPort = mockWorker.simulateConnect();
      const closeSpy = vi.spyOn(mockPort.port, "close");

      client.disconnect();

      expect(closeSpy).toHaveBeenCalled();
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
      const mockPort = mockWorker.simulateConnect();

      const promise1 = client.readByteRange("file1", 0, 100);
      const promise2 = client.readByteRange("file1", 100, 200);
      const promise3 = client.getFileSize("file1");

      // Wait for all messages to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPort.messages.length).toBe(3);

      // Send responses in different order, matching request IDs
      const request3 = mockPort.messages[2]?.data;
      const response3: FileSizeResponse = {
        id: request3.id,
        type: "FILE_SIZE_RESPONSE",
        fileId: "file1",
        size: 1000,
      };
      mockPort.simulateMessage(response3);

      const request1 = mockPort.messages[0]?.data;
      const response1: ByteRangeResponse = {
        id: request1.id,
        type: "BYTE_RANGE_RESPONSE",
        fileId: "file1",
        start: 0,
        end: 100,
        data: createTestData(100),
      };
      mockPort.simulateMessage(response1);

      const request2 = mockPort.messages[1]?.data;
      const response2: ByteRangeResponse = {
        id: request2.id,
        type: "BYTE_RANGE_RESPONSE",
        fileId: "file1",
        start: 100,
        end: 200,
        data: createTestData(100),
      };
      mockPort.simulateMessage(response2);

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
    it("should handle port errors", async () => {
      const mockPort = mockWorker.simulateConnect();
      const handle = createMockFileHandle("test.bin", 100);

      const openPromise = client.openFile("file1", handle);

      // Simulate port error
      if (mockPort.port.onerror) {
        mockPort.port.onerror(
          new ErrorEvent("error", { message: "Connection failed" })
        );
      }

      await expect(openPromise).rejects.toThrow();
    });
  });
});
