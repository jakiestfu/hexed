import { describe, it, expect, beforeEach, vi } from "vitest";
import { WindowManager } from "./window-manager";
import { DEFAULT_WINDOW_CONFIG } from "./types";
import { createTestData } from "./test-utils";

describe("WindowManager", () => {
  let manager: WindowManager;
  const fileId = "test-file";

  beforeEach(() => {
    manager = new WindowManager();
  });

  describe("getWindow", () => {
    it("should load and cache a window", async () => {
      const readFn = vi.fn().mockResolvedValue(createTestData(1000));
      const windowSize = DEFAULT_WINDOW_CONFIG.size;

      const data = await manager.getWindow(fileId, 0, 100, readFn);

      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBe(100);
      expect(readFn).toHaveBeenCalledTimes(1);
      expect(readFn).toHaveBeenCalledWith(0, windowSize + DEFAULT_WINDOW_CONFIG.overlap);
    });

    it("should align window start to window size boundary", async () => {
      const windowSize = DEFAULT_WINDOW_CONFIG.size;
      const readFn = vi.fn().mockResolvedValue(createTestData(windowSize + 100));

      // Request range that doesn't align to window boundary
      await manager.getWindow(fileId, windowSize + 100, windowSize + 200, readFn);

      // Should align start to windowSize boundary (windowSize)
      expect(readFn).toHaveBeenCalledWith(
        windowSize,
        windowSize + windowSize + DEFAULT_WINDOW_CONFIG.overlap
      );
    });

    it("should extract requested range from cached window", async () => {
      const windowSize = DEFAULT_WINDOW_CONFIG.size;
      const fullWindowData = createTestData(windowSize + DEFAULT_WINDOW_CONFIG.overlap);
      const readFn = vi.fn().mockResolvedValue(fullWindowData);

      // Request middle portion of window
      const offset = 100;
      const length = 50;
      const data = await manager.getWindow(fileId, offset, offset + length, readFn);

      expect(data.length).toBe(length);
      // Data should match the slice from the full window
      expect(Array.from(data)).toEqual(
        Array.from(fullWindowData.slice(offset, offset + length))
      );
    });

    it("should use cached window on second request", async () => {
      const readFn = vi.fn().mockResolvedValue(createTestData(1000));

      await manager.getWindow(fileId, 0, 100, readFn);
      await manager.getWindow(fileId, 50, 150, readFn);

      // Should only call readFn once (second request uses cache)
      expect(readFn).toHaveBeenCalledTimes(1);
    });

    it("should update lastAccessed on cache hit", async () => {
      const readFn = vi.fn().mockResolvedValue(createTestData(1000));

      await manager.getWindow(fileId, 0, 100, readFn);
      const stats1 = manager.getCacheStats(fileId);

      await new Promise((resolve) => setTimeout(resolve, 10));

      await manager.getWindow(fileId, 0, 100, readFn);
      const stats2 = manager.getCacheStats(fileId);

      // Cache should still exist
      expect(stats2.windowCount).toBe(stats1.windowCount);
    });

    it("should load different windows for different ranges", async () => {
      const windowSize = DEFAULT_WINDOW_CONFIG.size;
      const readFn = vi.fn().mockResolvedValue(createTestData(windowSize + 100));

      // Request two different windows
      await manager.getWindow(fileId, 0, 100, readFn);
      await manager.getWindow(fileId, windowSize + 100, windowSize + 200, readFn);

      expect(readFn).toHaveBeenCalledTimes(2);
    });

    it("should handle window overlap", async () => {
      const windowSize = DEFAULT_WINDOW_CONFIG.size;
      const overlap = DEFAULT_WINDOW_CONFIG.overlap;
      const readFn = vi.fn().mockResolvedValue(createTestData(windowSize + overlap));

      await manager.getWindow(fileId, 0, 100, readFn);

      // Window should include overlap
      expect(readFn).toHaveBeenCalledWith(0, windowSize + overlap);
    });

    it("should clamp window end to requested end", async () => {
      const windowSize = DEFAULT_WINDOW_CONFIG.size;
      const requestedEnd = windowSize - 100;
      const readFn = vi.fn().mockResolvedValue(createTestData(1000));

      await manager.getWindow(fileId, 0, requestedEnd, readFn);

      // Window end should be clamped to requested end, not windowSize + overlap
      expect(readFn).toHaveBeenCalledWith(0, requestedEnd);
    });
  });

  describe("LRU cache eviction", () => {
    it("should evict least recently used windows when cache is full", async () => {
      const windowSize = DEFAULT_WINDOW_CONFIG.size;
      const maxCacheSize = DEFAULT_WINDOW_CONFIG.maxCacheSize;
      const readFn = vi.fn().mockResolvedValue(createTestData(windowSize + 100));

      // Load more windows than cache size
      for (let i = 0; i < maxCacheSize + 2; i++) {
        const start = i * windowSize;
        await manager.getWindow(fileId, start, start + 100, readFn);
      }

      const stats = manager.getCacheStats(fileId);
      // Should not exceed max cache size
      expect(stats.windowCount).toBeLessThanOrEqual(maxCacheSize);
    });

    it("should evict oldest windows first", async () => {
      const windowSize = DEFAULT_WINDOW_CONFIG.size;
      const maxCacheSize = DEFAULT_WINDOW_CONFIG.maxCacheSize;
      const readFn = vi.fn().mockResolvedValue(createTestData(windowSize + 100));

      // Load initial windows
      for (let i = 0; i < maxCacheSize; i++) {
        const start = i * windowSize;
        await manager.getWindow(fileId, start, start + 100, readFn);
      }

      // Access first window to update its lastAccessed
      await manager.getWindow(fileId, 0, 100, readFn);

      // Load one more window (should evict second window, not first)
      await manager.getWindow(fileId, maxCacheSize * windowSize, maxCacheSize * windowSize + 100, readFn);

      // First window should still be cached
      const readFn2 = vi.fn().mockResolvedValue(createTestData(windowSize + 100));
      await manager.getWindow(fileId, 0, 100, readFn2);
      // Should use cache, not call readFn2
      expect(readFn2).not.toHaveBeenCalled();
    });
  });

  describe("setWindowSize", () => {
    it("should update window size for a file", async () => {
      const newWindowSize = 512 * 1024; // 512KB
      const readFn = vi.fn().mockResolvedValue(createTestData(newWindowSize + 100));

      manager.setWindowSize(fileId, newWindowSize);

      await manager.getWindow(fileId, 0, 100, readFn);

      // Should use new window size
      expect(readFn).toHaveBeenCalledWith(0, newWindowSize + DEFAULT_WINDOW_CONFIG.overlap);
    });

    it("should clear cache when window size changes", async () => {
      const readFn = vi.fn().mockResolvedValue(createTestData(1000));

      // Load a window
      await manager.getWindow(fileId, 0, 100, readFn);
      expect(manager.getCacheStats(fileId).windowCount).toBeGreaterThan(0);

      // Change window size
      manager.setWindowSize(fileId, 512 * 1024);

      // Cache should be cleared
      expect(manager.getCacheStats(fileId).windowCount).toBe(0);
    });
  });

  describe("clearCache", () => {
    it("should clear cache for specific file", async () => {
      const readFn = vi.fn().mockResolvedValue(createTestData(1000));

      await manager.getWindow(fileId, 0, 100, readFn);
      await manager.getWindow("other-file", 0, 100, readFn);

      manager.clearCache(fileId);

      expect(manager.getCacheStats(fileId).windowCount).toBe(0);
      expect(manager.getCacheStats("other-file").windowCount).toBeGreaterThan(0);
    });
  });

  describe("clearAllCaches", () => {
    it("should clear all file caches", async () => {
      const readFn = vi.fn().mockResolvedValue(createTestData(1000));

      await manager.getWindow(fileId, 0, 100, readFn);
      await manager.getWindow("file2", 0, 100, readFn);

      manager.clearAllCaches();

      expect(manager.getCacheStats(fileId).windowCount).toBe(0);
      expect(manager.getCacheStats("file2").windowCount).toBe(0);
    });
  });

  describe("getCacheStats", () => {
    it("should return zero stats for non-existent file", () => {
      const stats = manager.getCacheStats("nonexistent");
      expect(stats.windowCount).toBe(0);
      expect(stats.totalBytes).toBe(0);
    });

    it("should return correct window count", async () => {
      const readFn = vi.fn().mockResolvedValue(createTestData(1000));

      await manager.getWindow(fileId, 0, 100, readFn);
      await manager.getWindow(fileId, 100, 200, readFn);

      const stats = manager.getCacheStats(fileId);
      expect(stats.windowCount).toBeGreaterThan(0);
    });

    it("should return correct total bytes", async () => {
      const windowSize = DEFAULT_WINDOW_CONFIG.size;
      const overlap = DEFAULT_WINDOW_CONFIG.overlap;
      const readFn = vi.fn().mockResolvedValue(createTestData(windowSize + overlap));

      await manager.getWindow(fileId, 0, 100, readFn);

      const stats = manager.getCacheStats(fileId);
      expect(stats.totalBytes).toBeGreaterThan(0);
      expect(stats.totalBytes).toBe(windowSize + overlap);
    });
  });
});
