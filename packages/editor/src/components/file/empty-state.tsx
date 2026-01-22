import type { FunctionComponent } from "react"

import { useRecentFiles } from "../../hooks/use-recent-files"
import { DataPicker } from "./data-picker"
import { OnHexedInputChange } from "../../hooks/use-hexed-input"

type EmptyStateProps = {
  onChangeInput: OnHexedInputChange
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
