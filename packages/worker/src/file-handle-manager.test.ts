import { beforeEach, describe, expect, it } from "vitest"

import { FileHandleManager } from "./file-handle-manager"
import { createMockFileHandle, createTestData } from "./test-utils"

describe("FileHandleManager", () => {
  let manager: FileHandleManager

  beforeEach(() => {
    manager = new FileHandleManager()
  })

  describe("openFile", () => {
    it("should register a file handle and store file size", async () => {
      const fileSize = 1024
      const handle = createMockFileHandle("test.bin", fileSize)

      await manager.openFile("file1", handle)

      expect(manager.hasFile("file1")).toBe(true)
      const info = manager.getFileInfo("file1")
      expect(info).toBeDefined()
      expect(info?.size).toBe(fileSize)
      expect(info?.handle).toBe(handle)
    })

    it("should handle multiple files", async () => {
      const handle1 = createMockFileHandle("file1.bin", 100)
      const handle2 = createMockFileHandle("file2.bin", 200)

      await manager.openFile("file1", handle1)
      await manager.openFile("file2", handle2)

      expect(manager.hasFile("file1")).toBe(true)
      expect(manager.hasFile("file2")).toBe(true)
      expect(manager.getOpenFileIds()).toHaveLength(2)
    })

    it("should update lastAccessed timestamp", async () => {
      const handle = createMockFileHandle("test.bin", 100)
      const beforeTime = Date.now()

      await manager.openFile("file1", handle)

      const info = manager.getFileInfo("file1")
      expect(info?.lastAccessed).toBeGreaterThanOrEqual(beforeTime)
    })
  })

  describe("hasFile", () => {
    it("should return false for non-existent file", () => {
      expect(manager.hasFile("nonexistent")).toBe(false)
    })

    it("should return true for open file", async () => {
      const handle = createMockFileHandle("test.bin", 100)
      await manager.openFile("file1", handle)
      expect(manager.hasFile("file1")).toBe(true)
    })
  })

  describe("getFileSize", () => {
    it("should return file size", async () => {
      const fileSize = 2048
      const handle = createMockFileHandle("test.bin", fileSize)
      await manager.openFile("file1", handle)

      const size = await manager.getFileSize("file1")
      expect(size).toBe(fileSize)
    })

    it("should update cached file size if file changed", async () => {
      const handle = createMockFileHandle("test.bin", 100)
      await manager.openFile("file1", handle)

      // Simulate file size change by creating new file with different size
      const newHandle = createMockFileHandle("test.bin", 200)
      await manager.openFile("file1", newHandle)

      const size = await manager.getFileSize("file1")
      expect(size).toBe(200)
    })

    it("should throw error for non-existent file", async () => {
      await expect(manager.getFileSize("nonexistent")).rejects.toThrow(
        "File nonexistent is not open"
      )
    })

    it("should update lastAccessed timestamp", async () => {
      const handle = createMockFileHandle("test.bin", 100)
      await manager.openFile("file1", handle)

      const info1 = manager.getFileInfo("file1")
      const lastAccessed1 = info1!.lastAccessed

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10))

      await manager.getFileSize("file1")

      const info2 = manager.getFileInfo("file1")
      expect(info2!.lastAccessed).toBeGreaterThan(lastAccessed1)
    })
  })

  describe("readByteRange", () => {
    it("should read byte range from file", async () => {
      const fileSize = 1000
      const testData = createTestData(fileSize)
      const handle = createMockFileHandle("test.bin", fileSize, testData)
      await manager.openFile("file1", handle)

      const data = await manager.readByteRange("file1", 0, 100)
      expect(data).toBeInstanceOf(Uint8Array)
      expect(data.length).toBe(100)
      expect(Array.from(data)).toEqual(Array.from(testData.slice(0, 100)))
    })

    it("should read middle range", async () => {
      const fileSize = 1000
      const testData = createTestData(fileSize)
      const handle = createMockFileHandle("test.bin", fileSize, testData)
      await manager.openFile("file1", handle)

      const data = await manager.readByteRange("file1", 100, 200)
      expect(data.length).toBe(100)
      expect(Array.from(data)).toEqual(Array.from(testData.slice(100, 200)))
    })

    it("should clamp range to file bounds", async () => {
      const fileSize = 100
      const testData = createTestData(fileSize)
      const handle = createMockFileHandle("test.bin", fileSize, testData)
      await manager.openFile("file1", handle)

      // Request range beyond file size
      const data = await manager.readByteRange("file1", 50, 200)
      expect(data.length).toBe(50) // Clamped to file size
      expect(Array.from(data)).toEqual(Array.from(testData.slice(50, 100)))
    })

    it("should handle negative start offset", async () => {
      const fileSize = 100
      const testData = createTestData(fileSize)
      const handle = createMockFileHandle("test.bin", fileSize, testData)
      await manager.openFile("file1", handle)

      const data = await manager.readByteRange("file1", -10, 50)
      expect(data.length).toBe(50)
      expect(Array.from(data)).toEqual(Array.from(testData.slice(0, 50)))
    })

    it("should return empty array if start >= file size", async () => {
      const fileSize = 100
      const handle = createMockFileHandle("test.bin", fileSize)
      await manager.openFile("file1", handle)

      const data = await manager.readByteRange("file1", 100, 200)
      expect(data.length).toBe(0)
    })

    it("should update lastAccessed timestamp", async () => {
      const handle = createMockFileHandle("test.bin", 100)
      await manager.openFile("file1", handle)

      const info1 = manager.getFileInfo("file1")
      const lastAccessed1 = info1!.lastAccessed

      await new Promise((resolve) => setTimeout(resolve, 10))

      await manager.readByteRange("file1", 0, 50)

      const info2 = manager.getFileInfo("file1")
      expect(info2!.lastAccessed).toBeGreaterThan(lastAccessed1)
    })

    it("should throw error for non-existent file", async () => {
      await expect(
        manager.readByteRange("nonexistent", 0, 100)
      ).rejects.toThrow("File nonexistent is not open")
    })
  })

  describe("closeFile", () => {
    it("should remove file handle", async () => {
      const handle = createMockFileHandle("test.bin", 100)
      await manager.openFile("file1", handle)

      manager.closeFile("file1")

      expect(manager.hasFile("file1")).toBe(false)
      expect(manager.getFileInfo("file1")).toBeUndefined()
    })

    it("should handle closing non-existent file gracefully", () => {
      expect(() => manager.closeFile("nonexistent")).not.toThrow()
    })
  })

  describe("closeAll", () => {
    it("should close all files", async () => {
      const handle1 = createMockFileHandle("file1.bin", 100)
      const handle2 = createMockFileHandle("file2.bin", 200)

      await manager.openFile("file1", handle1)
      await manager.openFile("file2", handle2)

      manager.closeAll()

      expect(manager.hasFile("file1")).toBe(false)
      expect(manager.hasFile("file2")).toBe(false)
      expect(manager.getOpenFileIds()).toHaveLength(0)
    })
  })

  describe("getOpenFileIds", () => {
    it("should return empty array when no files open", () => {
      expect(manager.getOpenFileIds()).toEqual([])
    })

    it("should return all open file IDs", async () => {
      const handle1 = createMockFileHandle("file1.bin", 100)
      const handle2 = createMockFileHandle("file2.bin", 200)

      await manager.openFile("file1", handle1)
      await manager.openFile("file2", handle2)

      const ids = manager.getOpenFileIds()
      expect(ids).toContain("file1")
      expect(ids).toContain("file2")
      expect(ids).toHaveLength(2)
    })
  })

  describe("getFileInfo", () => {
    it("should return file info", async () => {
      const fileSize = 500
      const handle = createMockFileHandle("test.bin", fileSize)
      await manager.openFile("file1", handle)

      const info = manager.getFileInfo("file1")
      expect(info).toBeDefined()
      expect(info?.size).toBe(fileSize)
      expect(info?.handle).toBe(handle)
      expect(info?.lastAccessed).toBeTypeOf("number")
    })

    it("should return undefined for non-existent file", () => {
      expect(manager.getFileInfo("nonexistent")).toBeUndefined()
    })
  })
})
