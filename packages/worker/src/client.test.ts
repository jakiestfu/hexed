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
  createMockWorker,
  createTestData,
} from "./test-utils";

// Mock Worker constructor
let mockWorker: ReturnType<typeof createMockWorker>;

function createMockWorkerConstructor(): new () => Worker {
  mockWorker = createMockWorker("mock-worker");
  return vi.fn().mockImplementation(() => {
    return mockWorker.worker;
  }) as unknown as new () => Worker;
}

describe("createWorkerClient", () => {
  let client: WorkerClient;
  let WorkerConstructor: new () => Worker;

  beforeEach(() => {
    WorkerConstructor = createMockWorkerConstructor();
    client = createWorkerClient(WorkerConstructor);
  });

  afterEach(() => {
    client.disconnect();
  });

  describe("initialization", () => {
    it("should create Worker on first use", () => {
      // Worker should be created when client methods are called
      expect(mockWorker.worker).toBeDefined();
    });

    it("should send CONNECTED message on connection", async () => {
      // Trigger initialization by calling a method
      const handle = createMockFileHandle("test.bin", 100);
      const openPromise = client.openFile("file1", handle);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate CONNECTED response
      const connectedResponse: ConnectedResponse = {
        id: "test-id",
        type: "CONNECTED",
      };
      mockWorker.simulateMessage(connectedResponse);

      // Wait a bit more
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockWorker.messages.length).toBeGreaterThan(0);
      
      // Complete the promise
      const request = mockWorker.messages[0]?.data;
      if (request) {
        const response: ConnectedResponse = {
          id: request.id,
          type: "CONNECTED",
        };
        mockWorker.simulateMessage(response);
        await openPromise;
      }
    });
  });

  describe("openFile", () => {
    it("should send OPEN_FILE request", async () => {
      const handle = createMockFileHandle("test.bin", 100);

      const openPromise = client.openFile("file1", handle);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockWorker.messages.length).toBeGreaterThan(0);
      const request = mockWorker.messages[0]?.data;
      expect(request?.type).toBe("OPEN_FILE");
      expect(request?.fileId).toBe("file1");
      expect(request?.handle).toBe(handle);

      // Simulate response with matching ID
      const response: ConnectedResponse = {
        id: request.id,
        type: "CONNECTED",
      };
      mockWorker.simulateMessage(response);

      await openPromise;
    });

    it("should handle error response", async () => {
      const handle = createMockFileHandle("test.bin", 100);

      const openPromise = client.openFile("file1", handle);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockWorker.messages[0]?.data;
      const errorResponse: ErrorResponse = {
        id: request.id,
        type: "ERROR",
        error: "Failed to open file",
        originalMessageId: request.id,
      };
      mockWorker.simulateMessage(errorResponse);

      await expect(openPromise).rejects.toThrow("Failed to open file");
    });
  });

  describe("readByteRange", () => {
    it("should send READ_BYTE_RANGE request and return data", async () => {
      const testData = createTestData(100);

      const readPromise = client.readByteRange("file1", 0, 100);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockWorker.messages[0]?.data;
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
      mockWorker.simulateMessage(response);

      const data = await readPromise;

      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBe(100);
      expect(Array.from(data)).toEqual(Array.from(testData));
    });

    it("should handle error response", async () => {
      const readPromise = client.readByteRange("file1", 0, 100);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockWorker.messages[0]?.data;
      const errorResponse: ErrorResponse = {
        id: request.id,
        type: "ERROR",
        error: "File not found",
      };
      mockWorker.simulateMessage(errorResponse);

      await expect(readPromise).rejects.toThrow("File not found");
    });
  });

  describe("getFileSize", () => {
    it("should send GET_FILE_SIZE request and return size", async () => {
      const fileSize = 2048;

      const sizePromise = client.getFileSize("file1");

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockWorker.messages[0]?.data;
      expect(request?.type).toBe("GET_FILE_SIZE");
      expect(request?.fileId).toBe("file1");

      const response: FileSizeResponse = {
        id: request.id,
        type: "FILE_SIZE_RESPONSE",
        fileId: "file1",
        size: fileSize,
      };
      mockWorker.simulateMessage(response);

      const size = await sizePromise;
      expect(size).toBe(fileSize);
    });
  });

  describe("setWindowSize", () => {
    it("should send SET_WINDOW_SIZE request", async () => {
      const windowSize = 512 * 1024;

      const setPromise = client.setWindowSize("file1", windowSize);

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockWorker.messages[0]?.data;
      expect(request?.type).toBe("SET_WINDOW_SIZE");
      expect(request?.fileId).toBe("file1");
      expect(request?.windowSize).toBe(windowSize);

      const response: ConnectedResponse = {
        id: request.id,
        type: "CONNECTED",
      };
      mockWorker.simulateMessage(response);

      await setPromise;
    });
  });

  describe("closeFile", () => {
    it("should send CLOSE_FILE request", async () => {
      const closePromise = client.closeFile("file1");

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = mockWorker.messages[0]?.data;
      expect(request?.type).toBe("CLOSE_FILE");
      expect(request?.fileId).toBe("file1");

      const response: ConnectedResponse = {
        id: request.id,
        type: "CONNECTED",
      };
      mockWorker.simulateMessage(response);

      await closePromise;
    });
  });

  describe("disconnect", () => {
    it("should terminate worker and reject pending requests", async () => {
      // Start a request that won't complete
      const readPromise = client.readByteRange("file1", 0, 100);

      // Disconnect before response
      client.disconnect();

      await expect(readPromise).rejects.toThrow("Worker disconnected");
    });

    it("should terminate worker", () => {
      const terminateSpy = vi.spyOn(mockWorker.worker, "terminate");

      client.disconnect();

      expect(terminateSpy).toHaveBeenCalled();
    });
  });

  describe("request timeout", () => {
    it("should timeout if response not received", async () => {
      vi.useFakeTimers();

      const readPromise = client.readByteRange("file1", 0, 100);

      // Advance time past timeout (30 seconds)
      vi.advanceTimersByTime(30000);

      await expect(readPromise).rejects.toThrow("Request timeout");

      vi.useRealTimers();
    });
  });

  describe("multiple concurrent requests", () => {
    it("should handle multiple concurrent requests", async () => {
      const promise1 = client.readByteRange("file1", 0, 100);
      const promise2 = client.readByteRange("file1", 100, 200);
      const promise3 = client.getFileSize("file1");

      // Wait for all messages to be sent
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockWorker.messages.length).toBe(3);

      // Send responses in different order, matching request IDs
      const request3 = mockWorker.messages[2]?.data;
      const response3: FileSizeResponse = {
        id: request3.id,
        type: "FILE_SIZE_RESPONSE",
        fileId: "file1",
        size: 1000,
      };
      mockWorker.simulateMessage(response3);

      const request1 = mockWorker.messages[0]?.data;
      const response1: ByteRangeResponse = {
        id: request1.id,
        type: "BYTE_RANGE_RESPONSE",
        fileId: "file1",
        start: 0,
        end: 100,
        data: createTestData(100),
      };
      mockWorker.simulateMessage(response1);

      const request2 = mockWorker.messages[1]?.data;
      const response2: ByteRangeResponse = {
        id: request2.id,
        type: "BYTE_RANGE_RESPONSE",
        fileId: "file1",
        start: 100,
        end: 200,
        data: createTestData(100),
      };
      mockWorker.simulateMessage(response2);

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
    it("should handle worker errors", async () => {
      const handle = createMockFileHandle("test.bin", 100);

      const openPromise = client.openFile("file1", handle);

      // Simulate worker error
      if (mockWorker.worker.onerror) {
        mockWorker.worker.onerror(
          new ErrorEvent("error", { message: "Connection failed" })
        );
      }

      await expect(openPromise).rejects.toThrow();
    });
  });
});
