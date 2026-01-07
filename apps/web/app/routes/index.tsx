import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { EmptyState } from '~/components/empty-state';
import { HexEditor } from '~/components/hex-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, Card, CardContent } from '@binspector/ui';
import type { BinarySnapshot } from '@binspector/types';
import { useFileWatcher } from '~/utils/use-file-watcher';
import { Loader2, AlertCircle, X } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>('0');
  const { snapshots, isConnected, error } = useFileWatcher(selectedFile);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    setActiveTab('0');
  };

  const handleClose = () => {
    setSelectedFile(null);
    setActiveTab('0');
  };

  if (!selectedFile) {
    return (
      <div className="container py-8">
        <EmptyState onFileSelect={handleFileSelect} />
      </div>
    );
  }

  // Loading state
  if (snapshots.length === 0 && !error) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
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
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
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
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Watching: <span className="font-mono">{selectedFile}</span>
          </span>
          <div
            className={`inline-flex h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="h-4 w-4 mr-1" />
          Close
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {snapshots.map((snapshot, index) => (
            <TabsTrigger key={snapshot.id} value={index.toString()}>
              {snapshot.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {snapshots.map((snapshot, index) => (
          <TabsContent key={snapshot.id} value={index.toString()}>
            <HexEditor
              snapshot={snapshot}
              previousSnapshot={index > 0 ? snapshots[index - 1] : undefined}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
