import type { FunctionComponent } from "react"

import { useRecentFiles } from "../hooks/use-recent-files"
import { DataPicker } from "./data-picker"

type EmptyStateProps = {
  onHandleIdChange?: (handleId: string) => void
}

export const EmptyState: FunctionComponent<EmptyStateProps> = ({
  onHandleIdChange
}) => {
  const { recentFiles } = useRecentFiles()

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <DataPicker
        recentFiles={recentFiles}
        onHandleIdChange={onHandleIdChange}
      />
    </div>
  )
}
