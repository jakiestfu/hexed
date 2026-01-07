'use client';

import * as React from 'react';

const STORAGE_KEY = 'binspector:recent-files';
const MAX_RECENT_FILES = 10;

export interface RecentFile {
  path: string;
  timestamp: number;
}

/**
 * Hook for managing recently opened files in localStorage
 */
export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = React.useState<RecentFile[]>([]);

  // Load recent files from localStorage on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentFile[];
        // Sort by most recent first
        const sorted = parsed.sort((a, b) => b.timestamp - a.timestamp);
        setRecentFiles(sorted);
      }
    } catch (error) {
      console.error('Failed to load recent files from localStorage:', error);
    }
  }, []);

  const addRecentFile = React.useCallback((filePath: string) => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing: RecentFile[] = stored ? JSON.parse(stored) : [];

      // Remove if already exists (to avoid duplicates)
      const filtered = existing.filter((file) => file.path !== filePath);

      // Add new file at the beginning
      const updated: RecentFile[] = [
        { path: filePath, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_FILES); // Limit to max files

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setRecentFiles(updated);
    } catch (error) {
      console.error('Failed to save recent file to localStorage:', error);
    }
  }, []);

  const removeRecentFile = React.useCallback((filePath: string) => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const existing: RecentFile[] = JSON.parse(stored);
      const filtered = existing.filter((file) => file.path !== filePath);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      setRecentFiles(filtered);
    } catch (error) {
      console.error('Failed to remove recent file from localStorage:', error);
    }
  }, []);

  const clearRecentFiles = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      setRecentFiles([]);
    } catch (error) {
      console.error('Failed to clear recent files from localStorage:', error);
    }
  }, []);

  return {
    recentFiles,
    addRecentFile,
    removeRecentFile,
    clearRecentFiles,
  };
}

