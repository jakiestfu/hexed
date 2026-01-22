import { useCallback } from "react"
import type { FunctionComponent } from "react"

import type { DiffResult } from "@hexed/types"

import { DiffViewer } from "../toolbar/diff-viewer"

export type HexToolbarDiffProps = {
  diff: DiffResult | null
  onScrollToOffset: (offset: number) => void
}

export const HexToolbarDiff: FunctionComponent<HexToolbarDiffProps> = ({
  diff,
  onScrollToOffset
}) => {
  const handleScrollToOffset = useCallback(
    (offset: number) => {
      onScrollToOffset(offset)
    },
    [onScrollToOffset]
  )

  if (!diff) {
    return null
  }

  return (
    <DiffViewer
      diff={diff}
      onScrollToOffset={handleScrollToOffset}
    />
  )
}
