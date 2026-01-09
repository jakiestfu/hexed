"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HexEditor } from "~/components/hex-editor/hex-editor";
import { useRecentFiles } from "~/hooks/use-recent-files";
import { encodeFilePath } from "~/utils/path-encoding";
import type { BinarySnapshot } from "@hexed/types";
import { useDragDrop } from "~/components/hex-editor/drag-drop-provider";

export default function Home() {
  const router = useRouter();
  const { recentFiles, addRecentFile } = useRecentFiles();
  const { setOnFileSelect } = useDragDrop();
  const [directSnapshots, setDirectSnapshots] = React.useState<
    BinarySnapshot[]
  >([]);
  const [directFilePath, setDirectFilePath] = React.useState<string | null>(
    null
  );

  const handleFileSelect = React.useCallback(
    (input: string | BinarySnapshot) => {
      if (typeof input === "string") {
        // String path - use existing flow with file watcher
        addRecentFile(input);
        const encodedPath = encodeFilePath(input);
        router.push(`/edit/${encodedPath}`);
      } else {
        // BinarySnapshot - load directly without file watcher
        addRecentFile(input.filePath);
        setDirectSnapshots([input]);
        setDirectFilePath(input.filePath);
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
    setDirectSnapshots([]);
    setDirectFilePath(null);
  };

  // If we have direct snapshots, render editor with them
  if (directSnapshots.length > 0 && directFilePath) {
    return (
      <HexEditor
        snapshots={directSnapshots}
        filePath={directFilePath}
        isConnected={false}
        onClose={handleClose}
        recentFiles={recentFiles}
      />
    );
  }

  // Otherwise, show empty state
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
