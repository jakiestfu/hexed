import type { FunctionComponent } from "react"

import type { RecentFile } from "~/hooks/use-recent-files"
import { DataPicker } from "./data-picker"

type EmptyStateProps = {
  recentFiles: RecentFile[]
}

export const EmptyState: FunctionComponent<EmptyStateProps> = ({
  recentFiles
}) => (
  <div className="flex flex-col items-center justify-center h-full gap-8">
    <DataPicker
      recentFiles={recentFiles}
    />
  </div>
)
