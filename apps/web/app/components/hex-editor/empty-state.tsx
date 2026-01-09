import type { FunctionComponent } from "react";
import type { RecentFile } from "~/hooks/use-recent-files";
import type { BinarySnapshot } from "@hexed/types";
import { DataPicker } from "./data-picker";

type EmptyStateProps = {
  onFileSelect: (filePath: string | BinarySnapshot) => void;
  recentFiles: RecentFile[];
};

export const EmptyState: FunctionComponent<EmptyStateProps> = ({
  onFileSelect,
  recentFiles,
}) => (
  <div className="flex items-center justify-center h-full">
    <DataPicker onFileSelect={onFileSelect} recentFiles={recentFiles} />
  </div>
);
