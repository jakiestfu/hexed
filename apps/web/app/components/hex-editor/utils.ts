import type { BinarySnapshot } from "@hexed/types";

/**
 * Get the basename from a file path
 */
export function getBasename(filePath: string): string {
  return filePath.split("/").pop() || filePath.split("\\").pop() || filePath;
}

/**
 * Calculate checksum using SHA-256 (browser-friendly)
 */
export async function calculateChecksum(data: Uint8Array): Promise<string> {
  const buffer = new Uint8Array(data).buffer;
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create snapshot from ArrayBuffer
 */
export function createSnapshotFromArrayBuffer(
  buffer: ArrayBuffer,
  source: string
): BinarySnapshot {
  const data = new Uint8Array(buffer);
  const timestamp = Date.now();
  return {
    id: `${timestamp}-0`,
    filePath: source,
    data,
    timestamp,
    index: 0,
    label: "Baseline",
  };
}

/**
 * Create snapshot from File object
 */
export async function createSnapshotFromFile(
  file: File
): Promise<BinarySnapshot> {
  const arrayBuffer = await file.arrayBuffer();
  const snapshot = createSnapshotFromArrayBuffer(
    arrayBuffer,
    file.name || "file"
  );
  snapshot.md5 = await calculateChecksum(snapshot.data);
  return snapshot;
}

/**
 * Create snapshot from URL
 */
export async function createSnapshotFromURL(
  url: string
): Promise<BinarySnapshot> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const snapshot = createSnapshotFromArrayBuffer(arrayBuffer, url);
  snapshot.md5 = await calculateChecksum(snapshot.data);
  return snapshot;
}

/**
 * Format timestamp for recent files display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
