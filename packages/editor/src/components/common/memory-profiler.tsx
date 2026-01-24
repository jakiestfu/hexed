import type { FunctionComponent } from "react"

import { formatBytes } from "@hexed/binary-utils/formatter"
import { Popover, PopoverContent, PopoverTrigger } from "@hexed/ui"

import { usePerformanceMetrics } from "../../hooks/use-performance-metrics"

/**
 * Memory profiler component that displays browser memory usage
 * Shows a compact label with detailed information in a popover
 */
export const MemoryProfiler: FunctionComponent = () => {
  const performanceMetrics = usePerformanceMetrics()

  if (
    performanceMetrics.heapLimitBytes === null ||
    performanceMetrics.usedHeapBytes === null
  ) {
    return null
  }

  const heap = {
    used: performanceMetrics.usedHeapBytes,
    limit: performanceMetrics.heapLimitBytes,
    total: performanceMetrics.totalHeapBytes ?? 0
  }

  const pct = heap.limit ? heap.used / heap.limit : 0
  const label = `Mem: ${formatBytes(heap.used)} / ${formatBytes(
    heap.limit
  )} (${Math.round(pct * 100)}%)`

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <span
            className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            title={label}
          >
            {label}
          </span>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-3"
          align="center"
        >
          <div className="space-y-2 font-mono text-xs">
            <div className="font-semibold text-sm mt-1 mb-2 text-foreground">
              Memory Usage
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Used:</span>
                <span className="block text-foreground">
                  {formatBytes(heap.used)} ({heap.used.toLocaleString()} bytes)
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Total:</span>
                <span className="block text-foreground">
                  {formatBytes(heap.total)} ({heap.total.toLocaleString()}{" "}
                  bytes)
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Limit:</span>
                <span className="block text-foreground">
                  {formatBytes(heap.limit)} ({heap.limit.toLocaleString()}{" "}
                  bytes)
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-4 pb-1 border-t">
                <span className="text-muted-foreground">Usage:</span>
                <span className="text-foreground font-semibold">
                  {Math.round(pct * 100)}%
                </span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
