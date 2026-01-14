'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import type { BinarySnapshot } from '@hexed/types';
import { Button, Card, CardContent } from '@hexed/ui';

import { useDragDrop } from '~/components/hex-editor/drag-drop-provider';
import { HexEditor } from '~/components/hex-editor/hex-editor';
import { createSnapshotFromURL } from '~/components/hex-editor/utils';
import { useFileHandleWatcher } from '~/hooks/use-file-handle-watcher';
import { useFileWatcher } from '~/hooks/use-file-watcher';
import { useRecentFiles } from '~/hooks/use-recent-files';
import {
  decodeFilePath,
  decodeHandleId,
  encodeFilePath,
  isHandleId,
  isUrlPath
} from '~/utils/path-encoding';

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const { addRecentFile, recentFiles, getFileHandleById } = useRecentFiles();
  const { setOnFileSelect } = useDragDrop();

  // Decode the file path from the URL parameter
  const encodedPath = params.path as string;
  const decodedPath = React.useMemo(() => {
    return decodeFilePath(encodedPath);
  }, [encodedPath]);

  // Check if it's a handleId
  const handleId = React.useMemo(() => {
    if (!decodedPath) return null;
    return decodeHandleId(encodedPath);
  }, [decodedPath, encodedPath]);

  // Determine file path and source
  const filePath = React.useMemo(() => {
    if (!decodedPath) return null;

    // If it's a handleId, we'll get the path from the handle metadata
    if (handleId) {
      return null; // Will be set when handle is loaded
    }

    // Check if file already exists in recent files to avoid duplicates
    const existsInRecent = recentFiles.some(
      (file) => file.path === decodedPath
    );
    if (!existsInRecent) {
      // Determine source type: URL or path
      const source = isUrlPath(decodedPath) ? 'url' : 'disk';
      addRecentFile(decodedPath, source);
    }

    return decodedPath;
  }, [decodedPath, handleId, recentFiles, addRecentFile]);

  const isUrl = React.useMemo(() => {
    return filePath ? isUrlPath(filePath) : false;
  }, [filePath]);

  const isHandle = React.useMemo(() => {
    return handleId !== null;
  }, [handleId]);

  // State for URL-based snapshots
  const [urlSnapshots, setUrlSnapshots] = React.useState<BinarySnapshot[]>([]);
  const [urlLoading, setUrlLoading] = React.useState(false);
  const [urlError, setUrlError] = React.useState<string | null>(null);

  // State for handle file path and loading
  const [handleFilePath, setHandleFilePath] = React.useState<string | null>(
    null
  );
  const [handleFileHandle, setHandleFileHandle] =
    React.useState<FileSystemFileHandle | null>(null);
  const [handleInitialLoading, setHandleInitialLoading] = React.useState(false);

  // Load handle metadata and set up watcher if it's a handleId
  React.useEffect(() => {
    if (!isHandle || !handleId) {
      setHandleFilePath(null);
      setHandleFileHandle(null);
      setHandleInitialLoading(false);
      return;
    }

    const loadHandleMetadata = async () => {
      setHandleInitialLoading(true);

      try {
        // First check sessionStorage for cached snapshot (for initial fast load)
        const snapshotKey = `hexed:pending-handle-${handleId}`;
        const cachedSnapshot = sessionStorage.getItem(snapshotKey);
        if (cachedSnapshot) {
          try {
            const snapshotData = JSON.parse(cachedSnapshot);
            setHandleFilePath(snapshotData.filePath);
            // Clean up sessionStorage
            sessionStorage.removeItem(snapshotKey);
          } catch (parseError) {
            console.warn('Failed to parse cached snapshot:', parseError);
          }
        }

        // Load from IndexedDB handle
        const handleData = await getFileHandleById(handleId);
        if (!handleData) {
          throw new Error('File handle not found or permission denied');
        }

        setHandleFilePath(handleData.path);
        setHandleFileHandle(handleData.handle);

        // Update recent files (will check for duplicates internally)
        addRecentFile(handleData.path, 'upload', handleData.handle);
      } catch (error) {
        console.error('Failed to load handle metadata:', error);
        setHandleFilePath(null);
        setHandleFileHandle(null);
      } finally {
        setHandleInitialLoading(false);
      }
    };

    loadHandleMetadata();
  }, [isHandle, handleId, getFileHandleById, addRecentFile]);

  // Use file handle watcher for handle-based files
  const {
    snapshots: handleSnapshots,
    isConnected: handleIsConnected,
    error: handleError,
    restart: handleRestart
  } = useFileHandleWatcher(handleFileHandle, handleFilePath);

  console.log({
    handleSnapshots,
    handleIsConnected,
    handleError,
    handleRestart
  });

  // Fetch URL if it's a URL source
  React.useEffect(() => {
    if (isUrl && filePath) {
      setUrlLoading(true);
      setUrlError(null);
      createSnapshotFromURL(filePath)
        .then((snapshot) => {
          setUrlSnapshots([snapshot]);
          setUrlLoading(false);
        })
        .catch((error) => {
          setUrlError(
            error instanceof Error ? error.message : 'Failed to fetch URL'
          );
          setUrlLoading(false);
        });
    } else {
      setUrlSnapshots([]);
      setUrlError(null);
    }
  }, [isUrl, filePath]);

  // Use file watcher for file paths (not for URLs or handles)
  const {
    snapshots: fileSnapshots,
    isConnected: fileIsConnected,
    error: fileError,
    restart
  } = useFileWatcher(isUrl || isHandle ? null : filePath);

  // Determine which snapshots and error to use
  const snapshots = isHandle
    ? handleSnapshots
    : isUrl
      ? urlSnapshots
      : fileSnapshots;
  const error = isHandle ? handleError : isUrl ? urlError : fileError;
  const displayFilePath = isHandle ? handleFilePath : filePath;
  const isConnected = isHandle
    ? handleIsConnected
    : isUrl
      ? false
      : fileIsConnected;
  const loading =
    snapshots.length === 0 &&
    !error &&
    (isHandle ? handleInitialLoading : isUrl ? urlLoading : true);

  const handleFileSelect = React.useCallback(
    (input: string | BinarySnapshot) => {
      if (typeof input === 'string') {
        // String path - determine source type and navigate
        const source = isUrlPath(input) ? 'url' : 'disk';
        addRecentFile(input, source);
        const encodedPath = encodeFilePath(input);
        router.push(`/edit/${encodedPath}`);
      } else {
        // BinarySnapshot - navigate to home with snapshot (FileSystemFileHandle upload)
        // Note: addRecentFile with handle should be called from the picker component
        router.push('/');
        // The home page will handle the snapshot via its own state
      }
    },
    [addRecentFile, router]
  );

  // Register the file select handler with drag-drop provider
  React.useEffect(() => {
    setOnFileSelect(handleFileSelect);
    return () => {
      setOnFileSelect(null);
    };
  }, [handleFileSelect, setOnFileSelect]);

  const handleClose = () => {
    router.push('/');
  };

  // Invalid path error
  if (!decodedPath && !handleId) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8 px-4">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">
                  Invalid file path
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The file path in the URL could not be decoded.
                </p>
              </div>
              <Button
                onClick={handleClose}
                variant="outline"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show full-page error if we have no snapshots (initial load error)
  // Watching errors will be shown in the popover
  if (error && snapshots.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8 px-4">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">
                  Error loading file
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {filePath}
                </p>
              </div>
              <Button
                onClick={handleClose}
                variant="outline"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <HexEditor
      snapshots={snapshots}
      filePath={displayFilePath}
      isConnected={isUrl ? false : isConnected}
      loading={loading}
      onClose={handleClose}
      fileSource={isHandle ? 'upload' : isUrl ? 'url' : 'disk'}
      originalSource={displayFilePath || ''}
      error={error}
      onRestartWatching={isUrl ? undefined : isHandle ? handleRestart : restart}
    />
  );
}
