'use client';

import * as React from 'react';
import { EmptyState } from '~/components/empty-state';
import { HexEditor } from '~/components/hex-editor';
import { Button, Card, CardContent } from '@binspector/ui';
import { useFileWatcher } from '~/utils/use-file-watcher';
import { useRecentFiles } from '~/hooks/use-recent-files';
import { Loader2, AlertCircle, X } from 'lucide-react';

export default function Home() {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const { snapshots, isConnected, error } = useFileWatcher(selectedFile);
  const { recentFiles, addRecentFile } = useRecentFiles();

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    addRecentFile(filePath);
  };

  const handleClose = () => {
    setSelectedFile(null);
  };

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8 px-4">
        <div className="w-full max-w-lg">
          <EmptyState onFileSelect={handleFileSelect} recentFiles={recentFiles} />
        </div>
      </div>
    );
  }

  // Loading state
  if (snapshots.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <h3 className="font-semibold">Loading file...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Reading {selectedFile}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8 px-4">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Error loading file</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {selectedFile}
                </p>
              </div>
              <Button onClick={handleClose} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center min-h-screen py-8 px-4">
      <HexEditor
        snapshots={snapshots}
        filePath={selectedFile}
        isConnected={isConnected}
        onClose={handleClose}
      />
    </div>
  );
}

