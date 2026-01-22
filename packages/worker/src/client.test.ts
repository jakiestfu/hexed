import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createWorkerClient, type WorkerClient } from "./client"
import {
  createMockFileHandle,
  createMockWorker,
  createTestData
} from "./test-utils"
import type {
  ConnectedResponse,
  ErrorResponse,
  FileSizeResponse
} from "./types"

// Mock Worker constructor
let mockWorker: ReturnType<typeof createMockWorker>

function createMockWorkerConstructor(): new () => Worker {
  mockWorker = createMockWorker("mock-worker")
  return vi.fn().mockImplementation(() => {
    return mockWorker.worker
  }) as unknown as new () => Worker
}

describe("createWorkerClient", () => {
  let client: WorkerClient
  let WorkerConstructor: new () => Worker

  beforeEach(() => {
    WorkerConstructor = createMockWorkerConstructor()
    client = createWorkerClient(WorkerConstructor)
  })

  afterEach(() => {
    client.disconnect()
  })

  describe("initialization", () => {
    it("should create Worker on first use", () => {
      // Worker should be created when client methods are called
      expect(mockWorker.worker).toBeDefined()
    })

    it("should send CONNECTED message on connection", async () => {
      // Trigger initialization by calling a method
      const handle = createMockFileHandle("test.bin", 100)
      const openPromise = client.openFile("file1", handle)

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Simulate CONNECTED response
      const connectedResponse: ConnectedResponse = {
        id: "test-id",
        type: "CONNECTED"
      }
      mockWorker.simulateMessage(connectedResponse)

      // Wait a bit more
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockWorker.messages.length).toBeGreaterThan(0)

      // Complete the promise
      const request = mockWorker.messages[0]?.data
      if (request) {
        const response: ConnectedResponse = {
          id: request.id,
          type: "CONNECTED"
        }
        mockWorker.simulateMessage(response)
        await openPromise
      }
    })
  })

  describe("openFile", () => {
    it("should send OPEN_FILE request", async () => {
      const handle = createMockFileHandle("test.bin", 100)

      const openPromise = client.openFile("file1", handle)

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockWorker.messages.length).toBeGreaterThan(0)
      const request = mockWorker.messages[0]?.data
      expect(request?.type).toBe("OPEN_FILE")
      expect(request?.fileId).toBe("file1")
      expect(request?.handle).toBe(handle)

      // Simulate response with matching ID
      const response: ConnectedResponse = {
        id: request.id,
        type: "CONNECTED"
      }
      mockWorker.simulateMessage(response)

      await openPromise
    })

    it("should handle error response", async () => {
      const handle = createMockFileHandle("test.bin", 100)

      const openPromise = client.openFile("file1", handle)

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      const request = mockWorker.messages[0]?.data
      const errorResponse: ErrorResponse = {
        id: request.id,
        type: "ERROR",
        error: "Failed to open file",
        originalMessageId: request.id
      }
      mockWorker.simulateMessage(errorResponse)

      await expect(openPromise).rejects.toThrow("Failed to open file")
    })
  })

  describe("streamFile", () => {
    it("should send STREAM_FILE_REQUEST", async () => {
      const streamPromise = client.streamFile("file1")

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      const request = mockWorker.messages[0]?.data
      expect(request?.type).toBe("STREAM_FILE_REQUEST")
      expect(request?.fileId).toBe("file1")

      const response: ConnectedResponse = {
        id: request.id,
        type: "CONNECTED"
      }
      mockWorker.simulateMessage(response)

      await streamPromise
    })

    it("should handle error response", async () => {
      const streamPromise = client.streamFile("file1")

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      const request = mockWorker.messages[0]?.data
      const errorResponse: ErrorResponse = {
        id: request.id,
        type: "ERROR",
        error: "File not found"
      }
      mockWorker.simulateMessage(errorResponse)

      await expect(streamPromise).rejects.toThrow("File not found")
    })
  })

  describe("getFileSize", () => {
    it("should send GET_FILE_SIZE request and return size", async () => {
      const fileSize = 2048

      const sizePromise = client.getFileSize("file1")

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      const request = mockWorker.messages[0]?.data
      expect(request?.type).toBe("GET_FILE_SIZE")
      expect(request?.fileId).toBe("file1")

      const response: FileSizeResponse = {
        id: request.id,
        type: "FILE_SIZE_RESPONSE",
        fileId: "file1",
        size: fileSize
      }
      mockWorker.simulateMessage(response)

      const size = await sizePromise
      expect(size).toBe(fileSize)
    })
  })

  describe("closeFile", () => {
    it("should send CLOSE_FILE request", async () => {
      const closePromise = client.closeFile("file1")

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      const request = mockWorker.messages[0]?.data
      expect(request?.type).toBe("CLOSE_FILE")
      expect(request?.fileId).toBe("file1")

      const response: ConnectedResponse = {
        id: request.id,
        type: "CONNECTED"
      }
      mockWorker.simulateMessage(response)

      await closePromise
    })
  })

  describe("disconnect", () => {
    it("should terminate worker and reject pending requests", async () => {
      // Start a request that won't complete
      const readPromise = client.getFileSize("file1")

      // Disconnect before response
      client.disconnect()

      await expect(readPromise).rejects.toThrow("Worker disconnected")
    })

    it("should terminate worker", () => {
      const terminateSpy = vi.spyOn(mockWorker.worker, "terminate")

      client.disconnect()

      expect(terminateSpy).toHaveBeenCalled()
    })
  })

  describe("request timeout", () => {
    it("should timeout if response not received", async () => {
      vi.useFakeTimers()

      const readPromise = client.getFileSize("file1")

      // Advance time past timeout (30 seconds)
      vi.advanceTimersByTime(30000)

      await expect(readPromise).rejects.toThrow("Request timeout")

      vi.useRealTimers()
    })
  })

  describe("multiple concurrent requests", () => {
    it("should handle multiple concurrent requests", async () => {
      const promise1 = client.getFileSize("file1")
      const promise2 = client.getFileSize("file2")
      const promise3 = client.getFileSize("file3")

      // Wait for all messages to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockWorker.messages.length).toBe(3)

      // Send responses in different order, matching request IDs
      const request3 = mockWorker.messages[2]?.data
      const response3: FileSizeResponse = {
        id: request3.id,
        type: "FILE_SIZE_RESPONSE",
        fileId: "file3",
        size: 3000
      }
      mockWorker.simulateMessage(response3)

      const request1 = mockWorker.messages[0]?.data
      const response1: FileSizeResponse = {
        id: request1.id,
        type: "FILE_SIZE_RESPONSE",
        fileId: "file1",
        size: 1000
      }
      mockWorker.simulateMessage(response1)

      const request2 = mockWorker.messages[1]?.data
      const response2: FileSizeResponse = {
        id: request2.id,
        type: "FILE_SIZE_RESPONSE",
        fileId: "file2",
        size: 2000
      }
      mockWorker.simulateMessage(response2)

      const [size1, size2, size3] = await Promise.all([
        promise1,
        promise2,
        promise3
      ])

      expect(size1).toBe(1000)
      expect(size2).toBe(2000)
      expect(size3).toBe(3000)
    })
  })

  describe("error handling", () => {
    it("should handle worker errors", async () => {
      const handle = createMockFileHandle("test.bin", 100)

      const openPromise = client.openFile("file1", handle)

      // Simulate worker error
      if (mockWorker.worker.onerror) {
        mockWorker.worker.onerror(
          new ErrorEvent("error", { message: "Connection failed" })
        )
      }

      await expect(openPromise).rejects.toThrow()
    })
  })
})
