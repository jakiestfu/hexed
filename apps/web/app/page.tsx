"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HexEditor } from "~/components/hex-editor";
import { useRecentFiles } from "~/hooks/use-recent-files";
import { encodeFilePath } from "~/utils/path-encoding";

export default function Home() {
  const router = useRouter();
  const { recentFiles, addRecentFile } = useRecentFiles();

  const handleFileSelect = (filePath: string) => {
    addRecentFile(filePath);
    const encodedPath = encodeFilePath(filePath);
    router.push(`/edit/${encodedPath}`);
  };

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
