'use client';

import * as React from 'react';

import { FileSource } from '~/components/hex-editor/types';
import { isUrlPath } from '~/utils/path-encoding';
import {
  saveFileHandle,
  getFileHandle,
  deleteFileHandle,
  getAllFileHandles,
  clearAllFileHandles,
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
            path: handle.path,
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
      filePath: string,
      source: FileSource = 'disk',
      handle?: FileSystemFileHandle
    ) => {
      if (typeof window === 'undefined') return;

      try {
        // If handle is provided, save it to IndexedDB
        let handleId: string | undefined;
        if (handle && source === 'upload') {
          handleId = await saveFileHandle(handle, { path: filePath, source });
        }

        // Update state with new file
        const newFile: RecentFile = {
          path: filePath,
          timestamp: Date.now(),
          source,
          handleId
        };

        setRecentFiles((prev) => {
          // Remove if already exists (to avoid duplicates)
          const filtered = prev.filter((file) => file.path !== filePath);

          // Add new file at the beginning
          const updated = [newFile, ...filtered].slice(0, MAX_RECENT_FILES);
          return updated;
        });
      } catch (error) {
        console.error('Failed to save recent file:', error);
      }
    },
    []
  );

  const removeRecentFile = React.useCallback(
    async (filePath: string) => {
      if (typeof window === 'undefined') return;

      try {
        // Find the file to get its handleId
        const file = recentFiles.find((f) => f.path === filePath);
        if (file?.handleId) {
          await deleteFileHandle(file.handleId);
        }

        // Update state
        setRecentFiles((prev) => prev.filter((file) => file.path !== filePath));
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
