import type { FunctionComponent } from "react";

import { useRecentFiles } from "../hooks/use-recent-files";
import type { FileHandleMetadata } from "../utils/file-handle-storage";
import type { FileManager } from "../utils";
import { DataPicker } from "./data-picker";

type EmptyStateProps = {
  onHandleReady?: (handleData: FileHandleMetadata, handleId: string) => Promise<void>;
  fileManager?: FileManager | null;
};

export const EmptyState: FunctionComponent<EmptyStateProps> = ({
  onHandleReady,
  fileManager,
}) => {
  const { recentFiles } = useRecentFiles();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <DataPicker
        recentFiles={recentFiles}
        onHandleReady={onHandleReady}
        fileManager={fileManager}
      />
    </div>
  );
};
