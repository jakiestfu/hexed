import { useState } from "react";
import type { FunctionComponent, FormEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hexed/ui";
import { FileIcon, Clock, ChevronDown, Ghost } from "lucide-react";
import type { RecentFile } from "~/hooks/use-recent-files";
import { Logo } from "~/components/logo";

type EmptyStateProps = {
  onFileSelect: (filePath: string) => void;
  recentFiles: RecentFile[];
};

export const EmptyState: FunctionComponent<EmptyStateProps> = ({
  onFileSelect,
  recentFiles,
}) => {
  const [filePath, setFilePath] = useState("");

  const handleManualPathSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (filePath.trim()) {
      onFileSelect(filePath.trim());
    }
  };

  const handleRecentFileSelect = (path: string) => {
    setFilePath(path);
    onFileSelect(path);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncatePath = (path: string, maxLength: number = 50): string => {
    if (path.length <= maxLength) return path;
    return `...${path.slice(-maxLength + 3)}`;
  };

  const pathBasename = (path: string): string => {
    return path.split("/").pop() || "";
  };

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-lg border-none">
        {/* <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Ghost className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-mono mb-4">hexed</CardTitle>
          <CardDescription>
            Select a binary file to begin inspecting. The file will be monitored
            for changes and displayed in a hex editor view.
          </CardDescription>
        </CardHeader> */}
        <CardContent className="space-y-4">
          {/* Manual path input with recent files dropdown */}
          <form onSubmit={handleManualPathSubmit} className="space-y-2">
            <label htmlFor="filePath" className="text-sm font-medium">
              Enter file path
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <input
                  id="filePath"
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="/path/to/binary/file"
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                />
                {recentFiles.length > 0 && (
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
                    <PopoverContent className="w-[400px] p-2" align="end">
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
                            onClick={() => handleRecentFileSelect(file.path)}
                          >
                            <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                              <span className="font-mono text-sm truncate w-full">
                                {pathBasename(file.path)}
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
                )}
              </div>
              <Button type="submit">Open File</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the full path to a file on your server filesystem
              {recentFiles.length > 0 && " or select from recent files"}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
