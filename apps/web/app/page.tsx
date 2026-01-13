"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HexEditor } from "~/components/hex-editor/hex-editor";
import { useRecentFiles } from "~/hooks/use-recent-files";
import { encodeFilePath, isUrlPath } from "~/utils/path-encoding";
import type { BinarySnapshot } from "@hexed/types";
import { useDragDrop } from "~/components/hex-editor/drag-drop-provider";
import { FileSource } from "~/components/hex-editor/types";

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
  const [fileSource, setFileSource] = React.useState<FileSource>("upload");
  const [originalSource, setOriginalSource] = React.useState<string>("");
  const [fileHandle, setFileHandle] =
    React.useState<FileSystemFileHandle | null>(null);
  const [fileId, setFileId] = React.useState<string | null>(null);

  const handleAddSnapshot = React.useCallback((snapshot: BinarySnapshot) => {
    setDirectSnapshots((prev) => [...prev, snapshot]);
  }, []);

  const handleFileSelect = React.useCallback(
    (input: string | BinarySnapshot) => {
      if (typeof input === "string") {
        // String path - use existing flow with file watcher
        addRecentFile(input, "disk");
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
          const currentFileSource: FileSource = "upload";

          // If we already have snapshots and the current file is upload based, add as snapshot
          if (directSnapshots.length > 0 && fileSource === "upload") {
            handleAddSnapshot(input);
          } else {
            // Otherwise, replace
            addRecentFile(input.filePath, "upload");
            setDirectSnapshots([input]);
            setDirectFilePath(input.filePath);
            setFileSource(currentFileSource);
            setOriginalSource(input.filePath);
          }
        }
      }
    },
    [
      addRecentFile,
      router,
      directSnapshots.length,
      fileSource,
      handleAddSnapshot,
    ]
  );

  // Register the file select handler with drag-drop provider
  React.useEffect(() => {
    setOnFileSelect(handleFileSelect);
    return () => {
      setOnFileSelect(null);
    };
  }, [handleFileSelect, setOnFileSelect]);

  const handleFileHandleSelect = React.useCallback(
    (handle: FileSystemFileHandle, id: string) => {
      // Get file name for display
      handle.getFile().then((file) => {
        setFileHandle(handle);
        setFileId(id);
        setDirectSnapshots([]); // Clear snapshots when using file handle
        setDirectFilePath(file.name);
        setFileSource("upload");
        setOriginalSource(file.name);
        addRecentFile(file.name, "upload");
      });
    },
    [addRecentFile]
  );

  const handleClose = () => {
    setDirectSnapshots([]);
    setDirectFilePath(null);
    setFileSource("upload");
    setOriginalSource("");
    setFileHandle(null);
    setFileId(null);
  };

  // If we have direct snapshots or file handle, render editor
  if ((directSnapshots.length > 0 || fileHandle) && directFilePath) {
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
        fileHandle={fileHandle}
        fileId={fileId}
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
      onFileHandleSelect={handleFileHandleSelect}
    />
  );
}
