import type { FunctionComponent } from "react"
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react"

import type { DiffResult } from "@hexed/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator
} from "@hexed/ui"

type DiffViewerProps = {
  diff: DiffResult
  onScrollToOffset: (offset: number) => void
}

function formatOffset(offset: number): string {
  return `0x${offset.toString(16).toUpperCase().padStart(8, "0")}`
}

export const DiffViewer: FunctionComponent<DiffViewerProps> = ({
  diff,
  onScrollToOffset
}) => {
  const added = diff.diffs.filter((d) => d.type === "added")
  const removed = diff.diffs.filter((d) => d.type === "removed")
  const modified = diff.diffs.filter((d) => d.type === "modified")

  const addedOffsets = added.map((d) => d.offset).toSorted((a, b) => a - b)
  const removedOffsets = removed.map((d) => d.offset).toSorted((a, b) => a - b)
  const modifiedOffsets = modified
    .map((d) => d.offset)
    .toSorted((a, b) => a - b)

  return (
    <div className="flex divide-x border-b">
      <div className="flex-1 p-4">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="text-sm font-medium">Added</h3>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-green-500">{added.length}</div>
        <p className="text-xs text-muted-foreground mb-2">bytes added</p>
        {addedOffsets.length > 0 ? (
          <Select
            onValueChange={(value) => {
              onScrollToOffset(parseInt(value, 16))
            }}
          >
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue placeholder="Jump to offset..." />
            </SelectTrigger>
            <SelectContent>
              {addedOffsets.map((offset) => (
                <SelectItem
                  key={offset}
                  value={offset.toString(16)}
                >
                  {formatOffset(offset)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="flex-1 p-4">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="text-sm font-medium">Removed</h3>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </div>
        <div className="text-2xl font-bold text-red-500">{removed.length}</div>
        <p className="text-xs text-muted-foreground mb-2">bytes removed</p>
        {removedOffsets.length > 0 ? (
          <Select
            onValueChange={(value) => {
              onScrollToOffset(parseInt(value, 16))
            }}
          >
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue placeholder="Jump to offset..." />
            </SelectTrigger>
            <SelectContent>
              {removedOffsets.map((offset) => (
                <SelectItem
                  key={offset}
                  value={offset.toString(16)}
                >
                  {formatOffset(offset)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="flex-1 p-4">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="text-sm font-medium">Modified</h3>
          <RefreshCw className="h-4 w-4 text-yellow-500" />
        </div>
        <div className="text-2xl font-bold text-yellow-500">
          {modified.length}
        </div>
        <p className="text-xs text-muted-foreground mb-2">bytes modified</p>
        {modifiedOffsets.length > 0 ? (
          <Select
            onValueChange={(value) => {
              onScrollToOffset(parseInt(value, 16))
            }}
          >
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue placeholder="Jump to offset..." />
            </SelectTrigger>
            <SelectContent>
              {modifiedOffsets.map((offset) => (
                <SelectItem
                  key={offset}
                  value={offset.toString(16)}
                >
                  {formatOffset(offset)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </div>
  )
}
