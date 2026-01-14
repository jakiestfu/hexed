import { useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import { Clock, FolderOpen, Loader2 } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hexed/ui";

import type { RecentFile } from "../types";
import { formatTimestamp, getBasename } from "../utils";

type DataPickerProps = {
  recentFiles: RecentFile[];
  onRecentFileSelect?: (handleId: string) => Promise<void>;
  onFilePickerOpen?: () => Promise<string | null>; // Returns handleId or null
};

// Recent Files Component
const RecentFilesDropdown: FunctionComponent<{
  recentFiles: RecentFile[];
  onSelect: (handleId: string) => void;
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
              onClick={() => {
                if (file.handleId) {
                  onSelect(file.handleId);
                }
              }}
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
  recentFiles,
  onRecentFileSelect,
  onFilePickerOpen,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const supportsFileSystemAccess =
    typeof window !== "undefined" && "showOpenFilePicker" in window;

  useEffect(() => {
    // Wait for component mount and local storage restoration
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRecentFileSelect = async (handleId: string) => {
    if (!onRecentFileSelect) {
      console.warn("onRecentFileSelect callback not provided");
      return;
    }

    setIsLoading(true);
    try {
      await onRecentFileSelect(handleId);
    } catch (error) {
      console.error("Error reopening file handle:", error);
      alert("Could not reopen file. Please select it again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSystemAccessPicker = async () => {
    if (!supportsFileSystemAccess || !window.showOpenFilePicker) {
      alert("File System Access API is not supported in this browser");
      return;
    }

    if (!onFilePickerOpen) {
      console.warn("onFilePickerOpen callback not provided");
      return;
    }

    setIsLoading(true);
    try {
      const handleId = await onFilePickerOpen();
      if (!handleId) {
        // User cancelled or error occurred - callback should handle it
        return;
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof DOMException && error.name !== "AbortError") {
        console.error("Error opening file picker:", error);
        alert("Failed to open file. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`w-full max-w-lg border-none h-[250px] transition-all duration-300 ${
        isMounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <CardContent className="space-y-4">
        <div className="space-y-2 mt-4">
          <label className="text-sm font-medium">Select a file</label>
          <div className="flex gap-2">
            <Button
              onClick={handleFileSystemAccessPicker}
              disabled={
                isLoading || !supportsFileSystemAccess || !onFilePickerOpen
              }
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FolderOpen className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Opening..." : "Choose File"}
            </Button>
            {onRecentFileSelect && (
              <RecentFilesDropdown
                recentFiles={recentFiles}
                onSelect={handleRecentFileSelect}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {supportsFileSystemAccess
              ? "Choose a file using the File System Access API"
              : "File System Access API is not supported in this browser"}
            {recentFiles.length > 0 &&
              onRecentFileSelect &&
              " or select from recent files"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
