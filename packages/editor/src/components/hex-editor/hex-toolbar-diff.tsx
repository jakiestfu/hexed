import type { FunctionComponent } from "react"

import type { DiffResult } from "@hexed/types"

import { useHexedStateContext } from "../../providers/hexed-state-provider"
import { DiffViewer } from "../toolbar/diff-viewer"

export type HexToolbarDiffProps = {
  diff: DiffResult | null
}

export const HexToolbarDiff: FunctionComponent<HexToolbarDiffProps> = ({
  diff
}) => {
  const { handleScrollToOffset } = useHexedStateContext()

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
