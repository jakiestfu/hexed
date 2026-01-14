import type { FunctionComponent } from "react";

import type { RecentFile } from "../types";
import { DataPicker } from "./data-picker";

type EmptyStateProps = {
  recentFiles: RecentFile[];
  onRecentFileSelect?: (handleId: string) => Promise<void>;
  onFilePickerOpen?: () => Promise<string | null>;
};

export const EmptyState: FunctionComponent<EmptyStateProps> = ({
  recentFiles,
  onRecentFileSelect,
  onFilePickerOpen,
}) => (
  <div className="flex flex-col items-center justify-center h-full gap-8">
    <DataPicker
      recentFiles={recentFiles}
      onRecentFileSelect={onRecentFileSelect}
      onFilePickerOpen={onFilePickerOpen}
    />
  </div>
);
