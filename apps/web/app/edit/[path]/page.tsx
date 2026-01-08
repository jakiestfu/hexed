"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { HexEditor } from "~/components/hex-editor";
import { Button, Card, CardContent } from "@hexed/ui";
import { useFileWatcher } from "~/utils/use-file-watcher";
import { useRecentFiles } from "~/hooks/use-recent-files";
import { decodeFilePath } from "~/utils/path-encoding";
import { AlertCircle } from "lucide-react";

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const { addRecentFile } = useRecentFiles();

  // Decode the file path from the URL parameter
  const encodedPath = params.path as string;
  const filePath = React.useMemo(() => {
    const decoded = decodeFilePath(encodedPath);
    if (decoded) {
      addRecentFile(decoded);
    }
    return decoded;
  }, [encodedPath, addRecentFile]);

  const { snapshots, isConnected, error } = useFileWatcher(filePath);

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
      isConnected={isConnected}
      loading={snapshots.length === 0 && !error}
      onClose={handleClose}
    />
  );
}
