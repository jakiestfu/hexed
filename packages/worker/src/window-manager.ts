import type { WindowConfig } from "./types";
import { DEFAULT_WINDOW_CONFIG } from "./types";

/**
 * Represents a cached window of file data
 */
interface CachedWindow {
  start: number;
  end: number;
  data: Uint8Array;
  lastAccessed: number;
}

/**
 * Manages sliding windows with LRU caching
 */
export class WindowManager {
  private windows = new Map<string, Map<string, CachedWindow>>();
  private configs = new Map<string, WindowConfig>();

  /**
   * Get or create window configuration for a file
   */
  private getConfig(fileId: string): WindowConfig {
    if (!this.configs.has(fileId)) {
      this.configs.set(fileId, { ...DEFAULT_WINDOW_CONFIG });
    }
    return this.configs.get(fileId)!;
  }

  /**
   * Generate a cache key for a window
   */
  private getWindowKey(start: number, end: number): string {
    return `${start}-${end}`;
  }

  /**
   * Get a window, loading it if not cached
   */
  async getWindow(
    fileId: string,
    start: number,
    end: number,
    readFn: (start: number, end: number) => Promise<Uint8Array>
  ): Promise<Uint8Array> {
    const config = this.getConfig(fileId);
    const now = Date.now();

    // Calculate window boundaries aligned to window size
    const windowStart = Math.floor(start / config.size) * config.size;
    const windowEnd = Math.min(
      windowStart + config.size + config.overlap,
      end
    );

    const key = this.getWindowKey(windowStart, windowEnd);

    // Initialize file cache if needed
    if (!this.windows.has(fileId)) {
      this.windows.set(fileId, new Map());
    }
    const fileCache = this.windows.get(fileId)!;

    // Check if window is cached
    const cached = fileCache.get(key);
    if (cached) {
      cached.lastAccessed = now;
      // Extract the requested range from the cached window
      const offset = start - windowStart;
      const length = end - start;
      return cached.data.slice(offset, offset + length);
    }

    // Load new window
    const data = await readFn(windowStart, windowEnd);
    const window: CachedWindow = {
      start: windowStart,
      end: windowEnd,
      data,
      lastAccessed: now,
    };

    // Evict old windows if cache is full
    this.evictIfNeeded(fileId, config.maxCacheSize);

    // Cache the new window
    fileCache.set(key, window);

    // Extract the requested range from the loaded window
    const offset = start - windowStart;
    const length = end - start;
    return data.slice(offset, offset + length);
  }

  /**
   * Evict least recently used windows if cache exceeds limit
   */
  private evictIfNeeded(fileId: string, maxSize: number): void {
    const fileCache = this.windows.get(fileId);
    if (!fileCache || fileCache.size <= maxSize) {
      return;
    }

    // Sort windows by last accessed time
    const entries = Array.from(fileCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove oldest windows until under limit
    const toRemove = entries.length - maxSize;
    for (let i = 0; i < toRemove; i++) {
      fileCache.delete(entries[i][0]);
    }
  }

  /**
   * Set window size for a file
   */
  setWindowSize(fileId: string, size: number): void {
    const config = this.getConfig(fileId);
    config.size = size;
    // Clear cache when window size changes
    this.clearCache(fileId);
  }

  /**
   * Clear cache for a specific file
   */
  clearCache(fileId: string): void {
    this.windows.delete(fileId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.windows.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(fileId: string): {
    windowCount: number;
    totalBytes: number;
  } {
    const fileCache = this.windows.get(fileId);
    if (!fileCache) {
      return { windowCount: 0, totalBytes: 0 };
    }

    let totalBytes = 0;
    for (const window of fileCache.values()) {
      totalBytes += window.data.length;
    }

    return {
      windowCount: fileCache.size,
      totalBytes,
    };
  }
}
