import type { FunctionComponent } from "react"

import { OnHexedFileChange } from "../../hooks/use-hexed-file"
import { useRecentFiles } from "../../hooks/use-recent-files"
import { DataPicker } from "./data-picker"

type EmptyStateProps = {
  onChangeInput: OnHexedFileChange
}

export const EmptyState: FunctionComponent<EmptyStateProps> = ({
  onChangeInput
}) => {
  const { recentFiles } = useRecentFiles()

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <DataPicker
        recentFiles={recentFiles}
        onChangeInput={onChangeInput}
      />
    </div>
  )
}
