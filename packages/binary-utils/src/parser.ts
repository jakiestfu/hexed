/**
 * Binary file parser utilities
 */

/**
 * Read a binary file and return as Uint8Array
 */
export async function readBinaryFile(filePath: string): Promise<Uint8Array> {
  if (typeof window !== 'undefined') {
    // Browser environment
    throw new Error('readBinaryFile should only be called on the server');
  }
  
  // Node.js environment
  const fs = await import('fs/promises');
  const buffer = await fs.readFile(filePath);
  return new Uint8Array(buffer);
}

/**
 * Read a binary file from a File object (browser)
 */
export async function readBinaryFromFile(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Get file size without reading entire file
 */
export async function getFileSize(filePath: string): Promise<number> {
  if (typeof window !== 'undefined') {
    throw new Error('getFileSize should only be called on the server');
  }
  
  const fs = await import('fs/promises');
  const stats = await fs.stat(filePath);
  return stats.size;
}

