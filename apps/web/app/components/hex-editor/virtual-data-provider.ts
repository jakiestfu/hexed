/**
 * Virtual data provider interface for on-demand byte range loading
 */

/**
 * Interface for providing virtual data access
 * Supports both full data (synchronous) and virtual data (asynchronous)
 */
export interface VirtualDataProvider {
  /**
   * Get a byte range from the data source
   * @param start - Start byte offset (inclusive)
   * @param end - End byte offset (exclusive)
   * @returns Promise resolving to the byte range
   */
  getByteRange(start: number, end: number): Promise<Uint8Array>;

  /**
   * Get the total file size
   * @returns Promise resolving to file size in bytes
   */
  getFileSize(): Promise<number>;

  /**
   * Check if this provider uses virtual loading
   * @returns true if data is loaded on-demand, false if all data is available
   */
  isVirtual(): boolean;
}

/**
 * Full data provider that wraps existing BinarySnapshot
 * Provides synchronous access to full data
 */
export class FullDataProvider implements VirtualDataProvider {
  private data: Uint8Array;
  private size: number;

  constructor(data: Uint8Array) {
    this.data = data;
    this.size = data.length;
  }

  async getByteRange(start: number, end: number): Promise<Uint8Array> {
    // Clamp to valid range
    const clampedStart = Math.max(0, Math.min(start, this.size));
    const clampedEnd = Math.max(clampedStart, Math.min(end, this.size));

    if (clampedStart >= this.size) {
      return new Uint8Array(0);
    }

    // Return slice synchronously (wrapped in Promise for interface compatibility)
    return Promise.resolve(this.data.slice(clampedStart, clampedEnd));
  }

  async getFileSize(): Promise<number> {
    return Promise.resolve(this.size);
  }

  isVirtual(): boolean {
    return false;
  }

  /**
   * Get the full data array (for backward compatibility)
   */
  getFullData(): Uint8Array {
    return this.data;
  }
}
