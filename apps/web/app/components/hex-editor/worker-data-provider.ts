/**
 * Worker-based virtual data provider
 * Uses Service Worker to read byte ranges on-demand
 */

import type { WorkerClient } from "@hexed/worker";
import type { VirtualDataProvider } from "./virtual-data-provider";

/**
 * Cached byte range
 */
interface CachedRange {
  start: number;
  end: number;
  data: Uint8Array;
  lastAccessed: number;
}

/**
 * Worker-based data provider that loads byte ranges on-demand
 */
export class WorkerDataProvider implements VirtualDataProvider {
  private workerClient: WorkerClient;
  private fileId: string;
  private fileSize: number | null = null;
  private cache = new Map<string, CachedRange>();
  private readonly maxCacheSize = 10 * 1024 * 1024; // 10MB cache limit
  private pendingRequests = new Map<string, Promise<Uint8Array>>();

  constructor(workerClient: WorkerClient, fileId: string) {
    this.workerClient = workerClient;
    this.fileId = fileId;
  }

  /**
   * Initialize the provider by getting file size
   */
  async initialize(): Promise<void> {
    if (this.fileSize === null) {
      this.fileSize = await this.workerClient.getFileSize(this.fileId);
    }
  }

  async getByteRange(start: number, end: number): Promise<Uint8Array> {
    // Ensure initialized
    if (this.fileSize === null) {
      await this.initialize();
    }

    // Clamp to valid range
    const clampedStart = Math.max(0, Math.min(start, this.fileSize!));
    const clampedEnd = Math.max(clampedStart, Math.min(end, this.fileSize!));

    if (clampedStart >= this.fileSize!) {
      return new Uint8Array(0);
    }

    const cacheKey = `${clampedStart}-${clampedEnd}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.data;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Create new request
    const requestPromise = this.workerClient
      .readByteRange(this.fileId, clampedStart, clampedEnd)
      .then((data) => {
        // Cache the result
        this.cacheRange(clampedStart, clampedEnd, data);
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  async getFileSize(): Promise<number> {
    if (this.fileSize === null) {
      await this.initialize();
    }
    return this.fileSize!;
  }

  isVirtual(): boolean {
    return true;
  }

  /**
   * Cache a byte range
   */
  private cacheRange(start: number, end: number, data: Uint8Array): void {
    const cacheKey = `${start}-${end}`;
    const now = Date.now();

    // Check if we need to evict
    this.evictIfNeeded(data.length);

    // Add to cache
    this.cache.set(cacheKey, {
      start,
      end,
      data,
      lastAccessed: now,
    });
  }

  /**
   * Evict least recently used ranges if cache exceeds limit
   */
  private evictIfNeeded(newDataSize: number): void {
    let totalSize = 0;
    for (const range of this.cache.values()) {
      totalSize += range.data.length;
    }

    totalSize += newDataSize;

    if (totalSize <= this.maxCacheSize) {
      return;
    }

    // Sort by last accessed time
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove oldest entries until under limit
    let currentSize = totalSize - newDataSize;
    for (const [key, range] of entries) {
      if (currentSize <= this.maxCacheSize) {
        break;
      }
      currentSize -= range.data.length;
      this.cache.delete(key);
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.cache.clear();
    this.pendingRequests.clear();
    // Note: We don't close the file here as it might be used by other components
    // File closing should be handled at a higher level
  }
}
