"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { HexEditor } from "~/components/hex-editor/hex-editor";
import { Button, Card, CardContent } from "@hexed/ui";
import { useFileWatcher } from "~/utils/use-file-watcher";
import { useRecentFiles } from "~/hooks/use-recent-files";
import { decodeFilePath, isUrlPath } from "~/utils/path-encoding";
import { AlertCircle } from "lucide-react";
import { useDragDrop } from "~/components/hex-editor/drag-drop-provider";
import { encodeFilePath } from "~/utils/path-encoding";
import type { BinarySnapshot } from "@hexed/types";
import { createSnapshotFromURL } from "~/components/hex-editor/utils";

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const { addRecentFile } = useRecentFiles();
  const { setOnFileSelect } = useDragDrop();

  // Decode the file path from the URL parameter
  const encodedPath = params.path as string;
  const filePath = React.useMemo(() => {
    const decoded = decodeFilePath(encodedPath);
    if (decoded) {
      // Determine source type: URL or path
      const source = isUrlPath(decoded) ? "url" : "path";
      addRecentFile(decoded, source);
    }
    return decoded;
  }, [encodedPath, addRecentFile]);

  const isUrl = React.useMemo(() => {
    return filePath ? isUrlPath(filePath) : false;
  }, [filePath]);

  // State for URL-based snapshots
  const [urlSnapshots, setUrlSnapshots] = React.useState<BinarySnapshot[]>([]);
  const [urlLoading, setUrlLoading] = React.useState(false);
  const [urlError, setUrlError] = React.useState<string | null>(null);

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
            error instanceof Error ? error.message : "Failed to fetch URL"
          );
          setUrlLoading(false);
        });
    } else {
      setUrlSnapshots([]);
      setUrlError(null);
    }
  }, [isUrl, filePath]);

  // Use file watcher for file paths
  const {
    snapshots: fileSnapshots,
    isConnected,
    error: fileError,
    restart,
  } = useFileWatcher(isUrl ? null : filePath);

  // Determine which snapshots and error to use
  const snapshots = isUrl ? urlSnapshots : fileSnapshots;
  const error = isUrl ? urlError : fileError;

  const handleFileSelect = React.useCallback(
    (input: string | BinarySnapshot) => {
      if (typeof input === "string") {
        // String path - navigate to new file
        addRecentFile(input, "path");
        const encodedPath = encodeFilePath(input);
        router.push(`/edit/${encodedPath}`);
      } else {
        // BinarySnapshot - navigate to home with snapshot (client upload)
        addRecentFile(input.filePath, "client");
        router.push("/");
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
    router.push("/");
  };

  // Invalid path error
  if (!filePath) {
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
              <Button onClick={handleClose} variant="outline">
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
    <HexEditor
      snapshots={snapshots}
      filePath={filePath}
      isConnected={isUrl ? false : isConnected}
      loading={snapshots.length === 0 && !error && (isUrl ? urlLoading : true)}
      onClose={handleClose}
      fileSource={isUrl ? "url" : "path"}
      originalSource={filePath || ""}
      error={error}
      onRestartWatching={isUrl ? undefined : restart}
    />
  );
}
