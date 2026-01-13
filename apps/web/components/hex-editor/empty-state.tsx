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
  <div className="flex flex-col items-center justify-center h-full gap-8">
    <DataPicker onFileSelect={onFileSelect} recentFiles={recentFiles} />
  </div>
);
