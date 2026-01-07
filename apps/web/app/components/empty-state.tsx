import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@binspector/ui';
import { FileIcon, Upload, Clock } from 'lucide-react';
import type { RecentFile } from '~/hooks/use-recent-files';

interface EmptyStateProps {
  onFileSelect: (filePath: string) => void;
  recentFiles: RecentFile[];
}

export function EmptyState({ onFileSelect, recentFiles }: EmptyStateProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [filePath, setFilePath] = React.useState('');

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For browser file selection, we need to handle this differently
    // In a real implementation, we'd upload the file to the server
    // For now, we'll just use a manual path input
    alert('Please use the manual path input below to specify a file on your filesystem.');
  };

  const handleManualPathSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (filePath.trim()) {
      onFileSelect(filePath.trim());
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncatePath = (path: string, maxLength: number = 50): string => {
    if (path.length <= maxLength) return path;
    return `...${path.slice(-maxLength + 3)}`;
  };

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Binspector</CardTitle>
          <CardDescription>
            Select a binary file to begin inspecting. The file will be monitored for changes and displayed in a hex editor view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recent Files Section */}
          {recentFiles.length > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Recent Files</label>
                </div>
                <div className="space-y-1">
                  {recentFiles.map((file) => (
                    <Button
                      key={file.path}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2 px-3"
                      onClick={() => onFileSelect(file.path)}
                    >
                      <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                        <span className="font-mono text-sm truncate w-full">
                          {truncatePath(file.path)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(file.timestamp)}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
            </>
          )}

          {/* Manual path input (server-side files) */}
          <form onSubmit={handleManualPathSubmit} className="space-y-2">
            <label htmlFor="filePath" className="text-sm font-medium">
              Enter file path
            </label>
            <div className="flex gap-2">
              <input
                id="filePath"
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="/path/to/binary/file"
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
              />
              <Button type="submit">
                Open File
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the full path to a file on your server filesystem
            </p>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* File upload (for future implementation) */}
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File (Coming Soon)
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Upload a file to temporarily watch (not yet implemented)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

