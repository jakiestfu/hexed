'use client';

import * as React from 'react';

import { FileSource } from '~/components/hex-editor/types';
import {
  clearAllFileHandles,
  deleteFileHandle,
  getAllFileHandles,
  getFileHandle,
  getFileHandleByName,
  saveFileHandle,
  updateFileHandleTimestamp,
  verifyHandlePermission,
  type FileHandleMetadata
} from '~/utils/file-handle-storage';

const MAX_RECENT_FILES = 10;

export interface RecentFile {
  path: string;
  timestamp: number;
  source?: FileSource;
  handleId?: string; // IndexedDB ID for FileSystemFileHandle
}

/**
 * Hook for managing recently opened files in IndexedDB
 */
export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = React.useState<RecentFile[]>([]);

  // Load recent files from IndexedDB on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadRecentFiles = async () => {
      try {
        const handles = await getAllFileHandles();
        const files: RecentFile[] = handles
          .slice(0, MAX_RECENT_FILES)
          .map((handle) => ({
            path: handle.handle.name,
            timestamp: handle.timestamp,
            source: handle.source,
            handleId: handle.id
          }));

        setRecentFiles(files);
      } catch (error) {
        console.error('Failed to load recent files from IndexedDB:', error);
      }
    };

    loadRecentFiles();
  }, []);

  const addRecentFile = React.useCallback(
    async (
      fileName: string,
      source: FileSource = 'file-system',
      handle?: FileSystemFileHandle
    ): Promise<string | undefined> => {
      if (typeof window === 'undefined') return undefined;

      if (!handle) {
        console.error('addRecentFile requires a FileSystemFileHandle');
        return undefined;
      }

      try {
        const now = Date.now();
        let handleId: string | undefined;

        // Check if file already exists in IndexedDB by name
        const existingHandle = await getFileHandleByName(fileName);

        if (existingHandle) {
          // File exists - update timestamp instead of creating duplicate
          handleId = existingHandle.id;

          // Check if we need to update the handle (e.g., if permission was lost)
          const hasPermission = await verifyHandlePermission(
            existingHandle.handle
          );
          if (!hasPermission) {
            // Old handle lost permission, save new one
            await deleteFileHandle(existingHandle.id);
            handleId = await saveFileHandle(handle, {
              source
            });
          } else {
            // Just update timestamp
            await updateFileHandleTimestamp(existingHandle.id, now);
          }
        } else {
          // File doesn't exist - create new entry
          handleId = await saveFileHandle(handle, {
            source
          });
        }

        // Update state with file (move to top)
        const updatedFile: RecentFile = {
          path: fileName,
          timestamp: now,
          source,
          handleId
        };

        setRecentFiles((prev) => {
          // Remove if already exists (to avoid duplicates)
          const filtered = prev.filter((file) => file.path !== fileName);

          // Add updated file at the beginning
          const updated = [updatedFile, ...filtered].slice(0, MAX_RECENT_FILES);
          return updated;
        });

        return handleId;
      } catch (error) {
        console.error('Failed to save recent file:', error);
        return undefined;
      }
    },
    []
  );

  const removeRecentFile = React.useCallback(
    async (fileName: string) => {
      if (typeof window === 'undefined') return;

      try {
        // Find the file to get its handleId
        const file = recentFiles.find((f) => f.path === fileName);
        if (file?.handleId) {
          await deleteFileHandle(file.handleId);
        }

        // Update state
        setRecentFiles((prev) => prev.filter((file) => file.path !== fileName));
      } catch (error) {
        console.error('Failed to remove recent file:', error);
      }
    },
    [recentFiles]
  );

  const clearRecentFiles = React.useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      await clearAllFileHandles();
      setRecentFiles([]);
    } catch (error) {
      console.error('Failed to clear recent files:', error);
    }
  }, []);

  /**
   * Get a file handle from a recent file by handleId
   */
  const getFileHandleById = React.useCallback(
    async (handleId: string): Promise<FileHandleMetadata | null> => {
      if (typeof window === 'undefined') return null;

      try {
        const handleData = await getFileHandle(handleId);
        if (!handleData) return null;

        // Verify permission
        const hasPermission = await verifyHandlePermission(handleData.handle);
        if (!hasPermission) {
          return null;
        }

        return handleData;
      } catch (error) {
        console.error('Failed to get file handle:', error);
        return null;
      }
    },
    []
  );

  return {
    recentFiles,
    addRecentFile,
    removeRecentFile,
    clearRecentFiles,
    getFileHandleById
  };
}
