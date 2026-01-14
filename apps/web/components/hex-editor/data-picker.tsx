import { useEffect, useState } from 'react';
import type { FunctionComponent } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, FolderOpen, Loader2 } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@hexed/ui';

import type { RecentFile } from '~/hooks/use-recent-files';
import { useRecentFiles } from '~/hooks/use-recent-files';
import { encodeHandleId } from '~/utils/path-encoding';
import { createSnapshotFromFile, formatTimestamp, getBasename } from './utils';

type DataPickerProps = {
  recentFiles: RecentFile[];
};

// Recent Files Component
const RecentFilesDropdown: FunctionComponent<{
  recentFiles: RecentFile[];
  onSelect: (path: string) => void;
}> = ({ recentFiles, onSelect }) => {
  if (recentFiles.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-2"
        align="end"
      >
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Recent Files
          </div>
          {recentFiles.map((file) => (
            <Button
              key={file.path}
              type="button"
              variant="ghost"
              className="w-full justify-start text-left h-auto py-2 px-2"
              onClick={() => onSelect(file.path)}
            >
              <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                <span className="font-mono text-sm truncate w-full">
                  {getBasename(file.path)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(file.timestamp)}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const DataPicker: FunctionComponent<DataPickerProps> = ({
  recentFiles
}) => {
  const router = useRouter();
  const { addRecentFile, getFileHandleById } = useRecentFiles();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const supportsFileSystemAccess =
    typeof window !== 'undefined' && 'showOpenFilePicker' in window;

  useEffect(() => {
    // Wait for component mount and local storage restoration
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRecentFileSelect = async (path: string) => {
    // Find the recent file - it should have a handleId for file-system files
    const recentFile = recentFiles.find((file) => file.path === path);

    if (!recentFile?.handleId) {
      console.error('Recent file does not have a handle ID');
      alert('Could not reopen file. Please select it again.');
      return;
    }

    setIsLoading(true);
    try {
      const handleData = await getFileHandleById(recentFile.handleId);
      if (handleData) {
        // Create snapshot and store in sessionStorage as fallback
        const snapshot = await createSnapshotFromFile(handleData.handle);
        const snapshotKey = `hexed:pending-handle-${recentFile.handleId}`;
        try {
          // Store snapshot data (convert Uint8Array to array for JSON)
          const snapshotData = {
            ...snapshot,
            data: Array.from(snapshot.data)
          };
          sessionStorage.setItem(snapshotKey, JSON.stringify(snapshotData));
        } catch (storageError) {
          console.warn(
            'Failed to store snapshot in sessionStorage:',
            storageError
          );
        }

        // Navigate to edit page with handleId
        const encodedHandleId = encodeHandleId(recentFile.handleId);
        router.push(`/edit/${encodedHandleId}`);
      } else {
        console.error('Failed to reopen file handle');
        alert('Could not reopen file. Please select it again.');
      }
    } catch (error) {
      console.error('Error reopening file handle:', error);
      alert('Could not reopen file. Please select it again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSystemAccessPicker = async () => {
    if (!supportsFileSystemAccess || !window.showOpenFilePicker) {
      alert('File System Access API is not supported in this browser');
      return;
    }

    setIsLoading(true);
    try {
      const [handle] = await window.showOpenFilePicker({
        excludeAcceptAllOption: false,
        multiple: false
      });

      const file = await handle.getFile();
      // Save handle and get handleId
      const handleId = await addRecentFile(file.name, 'file-system', handle);

      if (handleId) {
        // Navigate to edit page with handleId
        const encodedHandleId = encodeHandleId(handleId);
        router.push(`/edit/${encodedHandleId}`);
      } else {
        console.error('Failed to save file handle');
        alert('Failed to save file handle. Please try again.');
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof DOMException && error.name !== 'AbortError') {
        console.error('Error opening file picker:', error);
        alert('Failed to open file. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`w-full max-w-lg border-none h-[250px] transition-opacity duration-300 ${
        isMounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <CardContent className="space-y-4">
        <div className="space-y-2 mt-4">
          <label className="text-sm font-medium">Select a file</label>
          <div className="flex gap-2">
            <Button
              onClick={handleFileSystemAccessPicker}
              disabled={isLoading || !supportsFileSystemAccess}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FolderOpen className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Opening...' : 'Choose File'}
            </Button>
            <RecentFilesDropdown
              recentFiles={recentFiles}
              onSelect={handleRecentFileSelect}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {supportsFileSystemAccess
              ? 'Choose a file using the File System Access API'
              : 'File System Access API is not supported in this browser'}
            {recentFiles.length > 0 && ' or select from recent files'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
