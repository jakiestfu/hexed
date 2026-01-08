import type { BinarySnapshot, SnapshotStorage } from "@hexed/types";

/**
 * In-memory implementation of SnapshotStorage
 * This can be easily swapped for IndexedDB, filesystem, or other storage backends
 */
export class InMemoryStorage implements SnapshotStorage {
  private snapshots = new Map<string, BinarySnapshot[]>();

  async save(fileId: string, snapshot: BinarySnapshot): Promise<void> {
    const existing = this.snapshots.get(fileId) || [];
    existing.push(snapshot);
    this.snapshots.set(fileId, existing);
  }

  async getSnapshots(fileId: string): Promise<BinarySnapshot[]> {
    return this.snapshots.get(fileId) || [];
  }

  async getSnapshot(
    fileId: string,
    snapshotId: string
  ): Promise<BinarySnapshot | null> {
    const snapshots = this.snapshots.get(fileId) || [];
    return snapshots.find((s) => s.id === snapshotId) || null;
  }

  async clear(fileId: string): Promise<void> {
    this.snapshots.delete(fileId);
  }

  /**
   * Clear all stored snapshots (useful for cleanup)
   */
  async clearAll(): Promise<void> {
    this.snapshots.clear();
  }
}

/**
 * Factory function to create a storage adapter
 * This makes it easy to swap implementations
 */
export function createStorageAdapter(
  type: "memory" = "memory"
): SnapshotStorage {
  switch (type) {
    case "memory":
      return new InMemoryStorage();
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
}
