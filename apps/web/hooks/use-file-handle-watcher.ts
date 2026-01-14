import { useCallback, useEffect, useRef, useState } from 'react';

import type { BinarySnapshot } from '@hexed/types';

import { createSnapshotFromFile } from '~/components/hex-editor/utils';

/**
 * Hook for watching FileSystemFileHandle files for changes
 * Uses FileSystemObserver API if available, otherwise does not watch
 */
export function useFileHandleWatcher(
  handle: FileSystemFileHandle | null,
  filePath: string | null
) {
  const [snapshots, setSnapshots] = useState<BinarySnapshot[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleRef = useRef<FileSystemFileHandle | null>(handle);
  const filePathRef = useRef<string | null>(filePath);
  const observerRef = useRef<FileSystemObserver | null>(null);
  const snapshotIndexRef = useRef<number>(0);

  // Update refs when handle or filePath changes
  useEffect(() => {
    handleRef.current = handle;
    filePathRef.current = filePath;
  }, [handle, filePath]);

  const readAndAddSnapshot = useCallback(async () => {
    // Use refs to get latest values for async operations
    const currentHandle = handleRef.current;
    const currentFilePath = filePathRef.current;

    if (!currentHandle || !currentFilePath) {
      return;
    }

    try {
      const snapshot = await createSnapshotFromFile(currentHandle);

      // Update snapshot with proper index, label, and filePath
      const index = snapshotIndexRef.current;
      snapshot.index = index;
      snapshot.label = index === 0 ? 'Baseline' : `Change ${index}`;
      snapshot.id = `${Date.now()}-${index}`;
      snapshot.filePath = currentFilePath;

      setSnapshots((prev) => [...prev, snapshot]);
      snapshotIndexRef.current++;

      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to read file';
      setError(errorMessage);
      setIsConnected(false);
      console.error('Error reading file handle:', err);
    }
  }, []);

  const connect = useCallback(() => {
    // Use the current prop values directly, not refs
    // This ensures we react to prop changes immediately
    if (!handle || !filePath) {
      setSnapshots([]);
      setIsConnected(false);
      setError(null);
      snapshotIndexRef.current = 0;
      return;
    }

    // Disconnect existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Reset state
    setSnapshots([]);
    setError(null);
    snapshotIndexRef.current = 0;

    // Read initial snapshot
    readAndAddSnapshot().then(() => {
      // Check if FileSystemObserver is available (experimental API)
      // @ts-expect-error - FileSystemObserver is experimental and may not be in types
      if (typeof FileSystemObserver === 'undefined') {
        // FileSystemObserver not available - just loaded initial snapshot without watching
        setIsConnected(false); // Not watching, just loaded
        return;
      }

      try {
        // Create FileSystemObserver with callback
        // @ts-expect-error - FileSystemObserver is experimental and may not be in types
        const observer = new FileSystemObserver(
          (records: FileSystemChangeRecord[]) => {
            // When file changes are detected, read and add new snapshot
            if (records && records.length > 0) {
              readAndAddSnapshot();
            }
          }
        );

        // Start observing the file handle
        observer.observe(handle).then(() => {
          observerRef.current = observer;
          setIsConnected(true);
        });
      } catch (observerError) {
        console.warn(
          'FileSystemObserver not available or failed to initialize:',
          observerError
        );
        setIsConnected(false);
      }
    });
  }, [handle, filePath, readAndAddSnapshot]);

  useEffect(() => {
    connect();

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      setIsConnected(false);
    };
  }, [connect]);

  const restart = useCallback(() => {
    connect();
  }, [connect]);

  return { snapshots, isConnected, error, restart };
}

// Types for FileSystemObserver (experimental API)
// These may not be in TypeScript types yet
interface FileSystemObserver {
  disconnect(): void;
  observe(
    handle: FileSystemFileHandle | FileSystemDirectoryHandle
  ): Promise<void>;
}

interface FileSystemChangeRecord {
  changedHandle: FileSystemHandle;
  type: 'created' | 'modified' | 'deleted' | 'moved';
}
