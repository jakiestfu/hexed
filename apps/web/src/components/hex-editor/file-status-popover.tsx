'use client';

import { FunctionComponent, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

import { Button, Popover, PopoverContent, PopoverTrigger } from '@hexed/ui';

import { FileSource } from './types';

export type FileStatusPopoverProps = {
  fileSource: FileSource;
  originalSource: string;
  isConnected?: boolean;
  error?: string | null;
  onRestartWatching?: () => void;
  children: ReactNode;
};

export const FileStatusPopover: FunctionComponent<FileStatusPopoverProps> = ({
  fileSource: _fileSource,
  originalSource,
  isConnected = false,
  error = null,
  onRestartWatching,
  children
}) => {
  const getDotColor = () => {
    return isConnected ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusText = () => {
    if (error) {
      return 'Error watching file';
    }
    return isConnected
      ? 'Watching for changes'
      : 'File System Access API (not watching)';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        className="w-md"
      >
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`inline-flex h-2 w-2 rounded-full ${getDotColor()}`}
              />
              <span className="text-sm font-medium">
                {getStatusText()}
                {error ? `: ${error}` : ''}
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-mono break-all">
            <span className="font-semibold">File:</span> {originalSource}
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              This file was opened using the File System Access API.
              {isConnected ? (
                <>
                  {' '}
                  Changes to the file will automatically appear in the editor
                  when saved. Each save will create a new snapshot for
                  comparison.
                </>
              ) : (
                <>
                  {' '}
                  File watching is not available in this browser. You can reopen
                  it from recent files. Drag and drop a file to add it as a new
                  snapshot for comparison.
                </>
              )}
            </p>
          </div>
          {error && onRestartWatching && (
            <div className="space-y-2">
              <Button
                onClick={onRestartWatching}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Restart Watching
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
