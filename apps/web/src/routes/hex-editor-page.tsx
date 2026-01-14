import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

import type { BinarySnapshot } from '@hexed/types';
import { Button, Card, CardContent } from '@hexed/ui';

import { useDragDrop } from '~/components/hex-editor/drag-drop-provider';
import { HexEditor } from '~/components/hex-editor/hex-editor';
import { useFileHandleWatcher } from '~/hooks/use-file-handle-watcher';
import { useRecentFiles } from '~/hooks/use-recent-files';
import { decodeHandleId } from '~/utils/path-encoding';

export function HexEditorPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { recentFiles, addRecentFile, getFileHandleById } = useRecentFiles();
  const { setOnFileSelect } = useDragDrop();

  // Get handle ID from URL parameter
  const hasIdParam = !!params.id;
  const handleId = React.useMemo(() => {
    const idParam = params.id;
    if (!idParam) return null;
    return decodeHandleId(idParam);
  }, [params.id]);

  // State for handle file path and loading
  const [handleFilePath, setHandleFilePath] = React.useState<string | null>(
    null
  );
  const [handleFileHandle, setHandleFileHandle] =
    React.useState<FileSystemFileHandle | null>(null);
  const [handleInitialLoading, setHandleInitialLoading] = React.useState(false);

  // Load handle metadata and set up watcher
  React.useEffect(() => {
    if (!handleId) {
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

        setHandleFilePath(handleData.handle.name);
        setHandleFileHandle(handleData.handle);

        // Update recent files (will check for duplicates internally)
        addRecentFile(handleData.handle.name, 'file-system', handleData.handle);
      } catch (error) {
        console.error('Failed to load handle metadata:', error);
        setHandleFilePath(null);
        setHandleFileHandle(null);
      } finally {
        setHandleInitialLoading(false);
      }
    };

    loadHandleMetadata();
  }, [handleId, getFileHandleById, addRecentFile]);

  // Use file handle watcher for handle-based files
  const {
    snapshots,
    isConnected,
    error,
    restart: handleRestart
  } = useFileHandleWatcher(handleFileHandle, handleFilePath);

  const loading = snapshots.length === 0 && !error && handleInitialLoading;

  const handleFileSelect = React.useCallback(
    (input: string | BinarySnapshot) => {
      // BinarySnapshot - this should only happen from drag-drop
      // For drag-drop, we don't have a FileSystemFileHandle, so we can't watch it
      // Just show it in the editor without navigation
      // TODO: Consider if drag-drop should also save handles somehow
      if (handleId) {
        // If we're on edit page, navigate to home
        navigate('/');
      } else {
        console.warn('Drag-drop files cannot be watched. Consider using File System Access API picker.');
      }
    },
    [handleId, navigate]
  );

  // Register the file select handler with drag-drop provider
  React.useEffect(() => {
    setOnFileSelect(handleFileSelect);
    return () => {
      setOnFileSelect(null);
    };
  }, [handleFileSelect, setOnFileSelect]);

  const handleClose = () => {
    navigate('/');
  };

  // Home page (no id param) - show empty state
  if (!hasIdParam) {
    return (
      <HexEditor
        snapshots={[]}
        filePath={null}
        isConnected={false}
        onFileSelect={handleFileSelect}
        recentFiles={recentFiles}
      />
    );
  }

  // Invalid handle ID error (id param exists but decode failed)
  if (hasIdParam && !handleId) {
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
                  Invalid file handle
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The file handle ID in the URL is invalid.
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
                  {handleFilePath}
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
      filePath={handleFilePath}
      isConnected={isConnected}
      loading={loading}
      onClose={handleClose}
      fileSource="file-system"
      originalSource={handleFilePath || ''}
      error={error}
      onRestartWatching={handleRestart}
    />
  );
}
