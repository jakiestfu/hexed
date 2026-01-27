import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createWorkerClient, type WorkerClient } from "./client"
import { createMockFile, createMockWorker, createTestData } from "./test-utils"
import type {
  ConnectedResponse,
  ErrorResponse,
  SearchResponse,
  StringsResponse
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
    it("should create Worker on first use", async () => {
      // Worker should be created when client methods are called
      const file = createMockFile("test.bin", 100)
      const searchPromise = client.search(file, new Uint8Array([1, 2, 3]))

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockWorker.worker).toBeDefined()
      expect(mockWorker.messages.length).toBeGreaterThan(0)

      // Complete the promise
      const request = mockWorker.messages[0]?.data
      if (request) {
        const response: SearchResponse = {
          id: request.id,
          type: "SEARCH_RESPONSE",
          matches: []
        }
        mockWorker.simulateMessage(response)
        await searchPromise
      }
    })

    it("should send CONNECTED message on connection", async () => {
      // Trigger initialization by calling a method
      const file = createMockFile("test.bin", 100)
      const searchPromise = client.search(file, new Uint8Array([1, 2, 3]))

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
        const response: SearchResponse = {
          id: request.id,
          type: "SEARCH_RESPONSE",
          matches: []
        }
        mockWorker.simulateMessage(response)
        await searchPromise
      }
    })
  })

  describe("search", () => {
    it("should send SEARCH_REQUEST with File", async () => {
      const file = createMockFile("test.bin", 100)
      const pattern = new Uint8Array([1, 2, 3])

      const searchPromise = client.search(file, pattern)

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockWorker.messages.length).toBeGreaterThan(0)
      const request = mockWorker.messages[0]?.data
      expect(request?.type).toBe("SEARCH_REQUEST")
      expect(request?.file).toBe(file)
      expect(request?.pattern).toEqual(pattern)

      // Simulate response with matching ID
      const response: SearchResponse = {
        id: request.id,
        type: "SEARCH_RESPONSE",
        matches: []
      }
      mockWorker.simulateMessage(response)

      await searchPromise
    })

    it("should handle error response", async () => {
      const file = createMockFile("test.bin", 100)
      const pattern = new Uint8Array([1, 2, 3])

      const searchPromise = client.search(file, pattern)

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      const request = mockWorker.messages[0]?.data
      const errorResponse: ErrorResponse = {
        id: request.id,
        type: "ERROR",
        error: "Failed to search file",
        originalMessageId: request.id
      }
      mockWorker.simulateMessage(errorResponse)

      await expect(searchPromise).rejects.toThrow("Failed to search file")
    })

    it("should return matches from response", async () => {
      const file = createMockFile("test.bin", 100)
      const pattern = new Uint8Array([1, 2, 3])
      const expectedMatches = [
        { offset: 10, length: 3 },
        { offset: 50, length: 3 }
      ]

      const searchPromise = client.search(file, pattern)

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      const request = mockWorker.messages[0]?.data
      const response: SearchResponse = {
        id: request.id,
        type: "SEARCH_RESPONSE",
        matches: expectedMatches
      }
      mockWorker.simulateMessage(response)

      const matches = await searchPromise
      expect(matches).toEqual(expectedMatches)
    })
  })

  describe("strings", () => {
    it("should send STRINGS_REQUEST with File", async () => {
      const file = createMockFile("test.bin", 100)
      const options = { minLength: 4, encoding: "ascii" as const }

      const stringsPromise = client.strings(file, options)

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockWorker.messages.length).toBeGreaterThan(0)
      const request = mockWorker.messages[0]?.data
      expect(request?.type).toBe("STRINGS_REQUEST")
      expect(request?.file).toBe(file)
      expect(request?.minLength).toBe(4)
      expect(request?.encoding).toBe("ascii")

      // Simulate response with matching ID
      const response: StringsResponse = {
        id: request.id,
        type: "STRINGS_RESPONSE",
        matches: []
      }
      mockWorker.simulateMessage(response)

      await stringsPromise
    })

    it("should handle error response", async () => {
      const file = createMockFile("test.bin", 100)
      const options = { minLength: 4, encoding: "ascii" as const }

      const stringsPromise = client.strings(file, options)

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      const request = mockWorker.messages[0]?.data
      const errorResponse: ErrorResponse = {
        id: request.id,
        type: "ERROR",
        error: "Failed to extract strings",
        originalMessageId: request.id
      }
      mockWorker.simulateMessage(errorResponse)

      await expect(stringsPromise).rejects.toThrow("Failed to extract strings")
    })

    it("should return matches from response", async () => {
      const file = createMockFile("test.bin", 100)
      const options = { minLength: 4, encoding: "ascii" as const }
      const expectedMatches = [
        {
          offset: 10,
          length: 5,
          encoding: "ascii" as const,
          text: "hello"
        }
      ]

      const stringsPromise = client.strings(file, options)

      // Wait for message to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      const request = mockWorker.messages[0]?.data
      const response: StringsResponse = {
        id: request.id,
        type: "STRINGS_RESPONSE",
        matches: expectedMatches
      }
      mockWorker.simulateMessage(response)

      const matches = await stringsPromise
      expect(matches).toEqual(expectedMatches)
    })
  })

  describe("disconnect", () => {
    it("should terminate worker and reject pending requests", async () => {
      // Start a request that won't complete
      const file = createMockFile("test.bin", 100)
      const searchPromise = client.search(file, new Uint8Array([1, 2, 3]))

      // Disconnect before response
      client.disconnect()

      await expect(searchPromise).rejects.toThrow("Worker disconnected")
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

      const file = createMockFile("test.bin", 100)
      const searchPromise = client.search(file, new Uint8Array([1, 2, 3]))

      // Advance time past timeout (30 seconds)
      vi.advanceTimersByTime(30000)

      await expect(searchPromise).rejects.toThrow("Request timeout")

      vi.useRealTimers()
    })
  })

  describe("multiple concurrent requests", () => {
    it("should handle multiple concurrent requests", async () => {
      const file1 = createMockFile("file1.bin", 1000)
      const file2 = createMockFile("file2.bin", 2000)
      const file3 = createMockFile("file3.bin", 3000)

      const promise1 = client.search(file1, new Uint8Array([1]))
      const promise2 = client.search(file2, new Uint8Array([2]))
      const promise3 = client.strings(file3, {
        minLength: 4,
        encoding: "ascii"
      })

      // Wait for all messages to be sent
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockWorker.messages.length).toBe(3)

      // Send responses in different order, matching request IDs
      const request3 = mockWorker.messages[2]?.data
      const response3: StringsResponse = {
        id: request3.id,
        type: "STRINGS_RESPONSE",
        matches: []
      }
      mockWorker.simulateMessage(response3)

      const request1 = mockWorker.messages[0]?.data
      const response1: SearchResponse = {
        id: request1.id,
        type: "SEARCH_RESPONSE",
        matches: [{ offset: 10, length: 1 }]
      }
      mockWorker.simulateMessage(response1)

      const request2 = mockWorker.messages[1]?.data
      const response2: SearchResponse = {
        id: request2.id,
        type: "SEARCH_RESPONSE",
        matches: [{ offset: 20, length: 1 }]
      }
      mockWorker.simulateMessage(response2)

      const [matches1, matches2, strings3] = await Promise.all([
        promise1,
        promise2,
        promise3
      ])

      expect(matches1).toEqual([{ offset: 10, length: 1 }])
      expect(matches2).toEqual([{ offset: 20, length: 1 }])
      expect(strings3).toEqual([])
    })
  })

  describe("error handling", () => {
    it("should handle worker errors", async () => {
      const file = createMockFile("test.bin", 100)

      const searchPromise = client.search(file, new Uint8Array([1, 2, 3]))

      // Simulate worker error
      if (mockWorker.worker.onerror) {
        mockWorker.worker.onerror(
          new ErrorEvent("error", { message: "Connection failed" })
        )
      }

      await expect(searchPromise).rejects.toThrow()
    })
  })
})
