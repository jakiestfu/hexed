import type { FunctionComponent } from "react"

import type { BinarySnapshot } from "@hexed/types"
import { TabsList, TabsTrigger } from "@hexed/ui"

import { useHexedSettings } from "../../hooks/use-hexed-settings"
import { useHexedSettingsContext } from "../../providers/hexed-settings-provider"

export type HexToolbarTabsProps = {
  snapshots: BinarySnapshot[]
}

export const HexToolbarTabs: FunctionComponent<HexToolbarTabsProps> = ({
  snapshots
}) => {
  const { showChecksums } = useHexedSettingsContext()

  if (snapshots.length <= 1) {
    return null
  }

  return (
    <div className="border-b">
      <div className="p-4">
        <TabsList>
          {snapshots.map((snapshot, index) => (
            <TabsTrigger
              key={snapshot.id}
              value={index.toString()}
            >
              {snapshot.label}
              {showChecksums && (
                <span className="text-xs text-muted-foreground font-mono">
                  {snapshot.md5 ? ` (${snapshot.md5.slice(0, 7)})` : ""}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </div>
  )
}
