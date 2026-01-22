import { describe, expect, it } from "vitest"

import { FileHandleManager } from "./file-handle-manager"
import { createMockFileHandle, createTestData } from "./test-utils"

describe("FileHandleManager", () => {
  it("should open a file and read a byte range", async () => {
    const manager = new FileHandleManager()
    const testData = createTestData(100)
    const handle = createMockFileHandle("test.bin", 100, testData)

    await manager.openFile("file1", handle)
    const data = await manager.readByteRange("file1", 0, 50)

    expect(data.length).toBe(50)
    expect(Array.from(data)).toEqual(Array.from(testData.slice(0, 50)))
  })
})
