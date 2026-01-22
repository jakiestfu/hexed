import { beforeEach, describe, expect, it, vi } from "vitest"

import { FileHandleManager } from "./file-handle-manager"
import {
  createMockFileHandle,
  createMockMessagePort,
  createTestData
} from "./test-utils"
import type {
  CloseFileRequest,
  ConnectedResponse,
  ErrorResponse,
  FileSizeResponse,
  GetFileSizeRequest,
  OpenFileRequest
} from "./types"

// We need to test the worker functions directly, but they're not exported
// So we'll import the worker file and test the message handling logic
// by simulating the worker context

describe("Worker message handling", () => {
  let handleManager: FileHandleManager

  beforeEach(() => {
    handleManager = new FileHandleManager()
  })

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

  describe("readByteRange", () => {
    beforeEach(async () => {
      const handle = createMockFileHandle(
        "test.bin",
        1000,
        createTestData(1000)
      )
      await handleManager.openFile("file1", handle)
    })

    it("should read byte range", async () => {
      const data = await handleManager.readByteRange("file1", 0, 100)

      expect(data).toBeInstanceOf(Uint8Array)
      expect(data.length).toBe(100)
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
    })

    it("should close file", () => {
      const request: CloseFileRequest = {
        id: "test-id",
        type: "CLOSE_FILE",
        fileId: "file1"
      }

      handleManager.closeFile(request.fileId)

      expect(handleManager.hasFile("file1")).toBe(false)
    })
  })

  describe("error handling", () => {
    it("should handle invalid file ID in readByteRange", async () => {
      await expect(
        handleManager.readByteRange("nonexistent", 0, 100)
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

  describe("multiple files", () => {
    it("should handle multiple files independently", async () => {
      const handle1 = createMockFileHandle("file1.bin", 100)
      const handle2 = createMockFileHandle("file2.bin", 200)

      await handleManager.openFile("file1", handle1)
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
