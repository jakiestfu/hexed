import type { FunctionComponent } from "react";

import { useRecentFiles } from "../hooks/use-recent-files";
import { DataPicker } from "./data-picker";

type EmptyStateProps = {
  onRecentFileSelect?: (handleId: string) => Promise<void>;
  onFilePickerOpen?: () => Promise<string | null>;
};

export const EmptyState: FunctionComponent<EmptyStateProps> = ({
  onRecentFileSelect,
  onFilePickerOpen,
}) => {
  const { recentFiles } = useRecentFiles();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <DataPicker
        recentFiles={recentFiles}
        onRecentFileSelect={onRecentFileSelect}
        onFilePickerOpen={onFilePickerOpen}
      />
    </div>
  );
};
