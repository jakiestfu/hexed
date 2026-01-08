import type { ByteDiff, DiffResult, BinarySnapshot } from "@hexed/types";

/**
 * Compare two binary snapshots and return differences
 */
export function computeDiff(
  previous: BinarySnapshot,
  current: BinarySnapshot
): DiffResult {
  const diffs: ByteDiff[] = [];
  const maxLength = Math.max(previous.data.length, current.data.length);

  for (let offset = 0; offset < maxLength; offset++) {
    const oldByte =
      offset < previous.data.length ? previous.data[offset] : undefined;
    const newByte =
      offset < current.data.length ? current.data[offset] : undefined;

    if (oldByte === undefined && newByte !== undefined) {
      // Byte was added
      diffs.push({
        offset,
        newByte,
        type: "added",
      });
    } else if (oldByte !== undefined && newByte === undefined) {
      // Byte was removed
      diffs.push({
        offset,
        oldByte,
        type: "removed",
      });
    } else if (oldByte !== newByte) {
      // Byte was modified
      diffs.push({
        offset,
        oldByte,
        newByte,
        type: "modified",
      });
    }
  }

  return {
    diffs,
    previousSnapshotId: previous.id,
    currentSnapshotId: current.id,
    totalChanges: diffs.length,
  };
}

/**
 * Check if a byte offset has changes in a diff result
 */
export function hasDiffAtOffset(diff: DiffResult, offset: number): boolean {
  return diff.diffs.some((d) => d.offset === offset);
}

/**
 * Get the diff at a specific offset
 */
export function getDiffAtOffset(
  diff: DiffResult,
  offset: number
): ByteDiff | undefined {
  return diff.diffs.find((d) => d.offset === offset);
}
