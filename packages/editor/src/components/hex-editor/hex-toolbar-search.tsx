import type { FunctionComponent, RefObject } from "react"

import { useHexedStateContext } from "../../providers/hexed-state-provider"
import { FindInput } from "../toolbar/find-input"

export type HexToolbarSearchProps = {
  inputRef?: RefObject<HTMLInputElement | null>
}

export const HexToolbarSearch: FunctionComponent<HexToolbarSearchProps> = ({
  inputRef
}) => {
  const {
    showSearch,
    rangeToSyncToFindInput,
    handleMatchFound,
    handleCloseSearch
  } = useHexedStateContext()

  if (!showSearch) {
    return null
  }

  return (
    <div className="border-b">
      <div className="p-4">
        <FindInput
          inputRef={inputRef}
          syncRangeToFindInput={showSearch ? rangeToSyncToFindInput : null}
          onMatchFound={handleMatchFound}
          onClose={handleCloseSearch}
        />
      </div>
    </div>
  )
}
