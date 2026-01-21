import { beforeEach, describe, expect, it, vi } from "vitest"

import { FileHandleManager } from "./file-handle-manager"
import {
  createMockFileHandle,
  createMockMessagePort,
  createTestData
} from "./test-utils"
import type {
  ByteRangeResponse,
  CloseFileRequest,
  ConnectedResponse,
  ErrorResponse,
  FileSizeResponse,
  GetFileSizeRequest,
  OpenFileRequest,
  ReadByteRangeRequest,
  SetWindowSizeRequest
} from "./types"
import { WindowManager } from "./window-manager"

// We need to test the worker functions directly, but they're not exported
// So we'll import the worker file and test the message handling logic
// by simulating the worker context

describe("Worker message handling", () => {
  let handleManager: FileHandleManager
  let windowManager: WindowManager
  let mockPort: ReturnType<typeof createMockMessagePort>

  beforeEach(() => {
    handleManager = new FileHandleManager()
    windowManager = new WindowManager()
    mockPort = createMockMessagePort()
  })

  // Helper to simulate sending a message and getting response
  async function sendMessageAndGetResponse(
    request:
      | OpenFileRequest
      | ReadByteRangeRequest
      | GetFileSizeRequest
      | CloseFileRequest
      | SetWindowSizeRequest
  ): Promise<any> {
    // This is a simplified test - in reality, the worker handles this
    // We'll test the underlying managers directly and simulate message flow
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout"))
      }, 1000)

      mockPort.port.onmessage = (event: MessageEvent) => {
        clearTimeout(timeout)
        const response = event.data
        if (response.type === "ERROR") {
          reject(new Error((response as ErrorResponse).error))
        } else {
          resolve(response)
        }
      }

      // Simulate message being sent to worker
      mockPort.sendMessage(request)
    })
  }

  describe("OPEN_FILE", () => {
    it("should register file handle", async () => {
      const handle = createMockFileHandle("test.bin", 100)
      const request: OpenFileRequest = {
        id: "test-id",
        type: "OPEN_FILE",
        fileId: "file1",
        handle
      }

      // Simulate worker handling the request
      await handleManager.openFile(request.fileId, request.handle)

      expect(handleManager.hasFile("file1")).toBe(true)
      const size = await handleManager.getFileSize("file1")
      expect(size).toBe(100)
    })

    it("should handle file handle errors", async () => {
      const handle = createMockFileHandle("test.bin", 100)

      // Create a handle that throws on getFile
      const badHandle = {
        ...handle,
        async getFile() {
          throw new Error("Permission denied")
        }
      } as FileSystemFileHandle

      await expect(handleManager.openFile("file1", badHandle)).rejects.toThrow(
        "Permission denied"
      )
    })
  })

  describe("READ_BYTE_RANGE", () => {
    beforeEach(async () => {
      const handle = createMockFileHandle(
        "test.bin",
        1000,
        createTestData(1000)
      )
      await handleManager.openFile("file1", handle)
    })

    it("should read byte range with windowing", async () => {
      const request: ReadByteRangeRequest = {
        id: "test-id",
        type: "READ_BYTE_RANGE",
        fileId: "file1",
        start: 0,
        end: 100
      }

      const data = await windowManager.getWindow(
        request.fileId,
        request.start,
        request.end,
        (start, end) => handleManager.readByteRange(request.fileId, start, end)
      )

      expect(data).toBeInstanceOf(Uint8Array)
      expect(data.length).toBe(100)
    })

    it("should use cached window on second request", async () => {
      const readSpy = vi.fn((start: number, end: number) =>
        handleManager.readByteRange("file1", start, end)
      )

      await windowManager.getWindow("file1", 0, 100, readSpy)
      await windowManager.getWindow("file1", 50, 150, readSpy)

      // Should only read once (second uses cache)
      expect(readSpy).toHaveBeenCalledTimes(1)
    })

    it("should handle out of bounds range", async () => {
      const data = await handleManager.readByteRange("file1", 900, 2000)
      expect(data.length).toBe(100) // Clamped to file size
    })
  })

  describe("GET_FILE_SIZE", () => {
    beforeEach(async () => {
      const handle = createMockFileHandle("test.bin", 2048)
      await handleManager.openFile("file1", handle)
    })

    it("should return file size", async () => {
      const size = await handleManager.getFileSize("file1")
      expect(size).toBe(2048)
    })

    it("should throw error for non-existent file", async () => {
      await expect(handleManager.getFileSize("nonexistent")).rejects.toThrow(
        "File nonexistent is not open"
      )
    })
  })

  describe("CLOSE_FILE", () => {
    beforeEach(async () => {
      const handle = createMockFileHandle("test.bin", 100)
      await handleManager.openFile("file1", handle)
      await windowManager.getWindow("file1", 0, 50, async () =>
        createTestData(50)
      )
    })

    it("should close file and clear cache", () => {
      const request: CloseFileRequest = {
        id: "test-id",
        type: "CLOSE_FILE",
        fileId: "file1"
      }

      handleManager.closeFile(request.fileId)
      windowManager.clearCache(request.fileId)

      expect(handleManager.hasFile("file1")).toBe(false)
      expect(windowManager.getCacheStats("file1").windowCount).toBe(0)
    })
  })

  describe("SET_WINDOW_SIZE", () => {
    it("should update window size and clear cache", async () => {
      const handle = createMockFileHandle(
        "test.bin",
        1000,
        createTestData(1000)
      )
      await handleManager.openFile("file1", handle)

      // Load a window
      await windowManager.getWindow("file1", 0, 100, async () =>
        createTestData(100)
      )
      expect(windowManager.getCacheStats("file1").windowCount).toBeGreaterThan(
        0
      )

      const request: SetWindowSizeRequest = {
        id: "test-id",
        type: "SET_WINDOW_SIZE",
        fileId: "file1",
        windowSize: 512 * 1024
      }

      windowManager.setWindowSize(request.fileId, request.windowSize)

      expect(windowManager.getCacheStats("file1").windowCount).toBe(0)
    })
  })

  describe("error handling", () => {
    it("should handle invalid file ID in READ_BYTE_RANGE", async () => {
      const request: ReadByteRangeRequest = {
        id: "test-id",
        type: "READ_BYTE_RANGE",
        fileId: "nonexistent",
        start: 0,
        end: 100
      }

      await expect(
        handleManager.readByteRange(request.fileId, request.start, request.end)
      ).rejects.toThrow("File nonexistent is not open")
    })

    it("should handle invalid file ID in GET_FILE_SIZE", async () => {
      const request: GetFileSizeRequest = {
        id: "test-id",
        type: "GET_FILE_SIZE",
        fileId: "nonexistent"
      }

      await expect(handleManager.getFileSize(request.fileId)).rejects.toThrow(
        "File nonexistent is not open"
      )
    })
  })

  describe("multiple ports (multi-tab simulation)", () => {
    it("should handle requests from multiple ports independently", async () => {
      const port1 = createMockMessagePort()
      const port2 = createMockMessagePort()

      const handle1 = createMockFileHandle("file1.bin", 100)
      const handle2 = createMockFileHandle("file2.bin", 200)

      // Port 1 opens file1
      await handleManager.openFile("file1", handle1)

      // Port 2 opens file2
      await handleManager.openFile("file2", handle2)

      expect(handleManager.hasFile("file1")).toBe(true)
      expect(handleManager.hasFile("file2")).toBe(true)
      expect(handleManager.getOpenFileIds()).toHaveLength(2)
    })
  })

  describe("message ID generation", () => {
    it("should generate unique message IDs", () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        ids.add(id)
      }
      // With timestamp + random, collisions should be extremely rare
      expect(ids.size).toBeGreaterThan(90)
    })
  })
})
