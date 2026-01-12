"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HexEditor } from "~/components/hex-editor/hex-editor";
import { useRecentFiles } from "~/hooks/use-recent-files";
import { encodeFilePath, isUrlPath } from "~/utils/path-encoding";
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
  const [fileSource, setFileSource] = React.useState<"client" | "url">("client");
  const [originalSource, setOriginalSource] = React.useState<string>("");

  const handleAddSnapshot = React.useCallback(
    (snapshot: BinarySnapshot) => {
      setDirectSnapshots((prev) => [...prev, snapshot]);
    },
    []
  );

  const handleFileSelect = React.useCallback(
    (input: string | BinarySnapshot) => {
      if (typeof input === "string") {
        // String path - use existing flow with file watcher
        addRecentFile(input, "path");
        const encodedPath = encodeFilePath(input);
        router.push(`/edit/${encodedPath}`);
      } else {
        // BinarySnapshot - check if it's a URL or client upload
        const isUrl = isUrlPath(input.filePath);
        
        // If it's a URL, encode and navigate to edit route
        if (isUrl) {
          addRecentFile(input.filePath, "url");
          const encodedUrl = encodeFilePath(input.filePath);
          router.push(`/edit/${encodedUrl}`);
        } else {
          // Client upload - check if we should add as snapshot or replace
          const currentFileSource = "client";
          
          // If we already have snapshots and the current file is client based, add as snapshot
          if (directSnapshots.length > 0 && fileSource === "client") {
            handleAddSnapshot(input);
          } else {
            // Otherwise, replace
            addRecentFile(input.filePath, "client");
            setDirectSnapshots([input]);
            setDirectFilePath(input.filePath);
            setFileSource(currentFileSource);
            setOriginalSource(input.filePath);
          }
        }
      }
    },
    [addRecentFile, router, directSnapshots.length, fileSource, handleAddSnapshot]
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
    setFileSource("client");
    setOriginalSource("");
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
        fileSource={fileSource}
        originalSource={originalSource}
        onAddSnapshot={handleAddSnapshot}
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
