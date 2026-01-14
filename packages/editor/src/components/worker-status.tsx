import type { FunctionComponent } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@hexed/ui"

export type WorkerStatusProps = {
  isActive?: boolean
}

/**
 * Worker status component that displays worker connection status
 * Shows a compact label with detailed information in a popover
 */
export const WorkerStatus: FunctionComponent<WorkerStatusProps> = ({
  isActive = false
}) => {
  const status = isActive ? "Active" : "Inactive"
  const label = `Worker ${status}`

  return (
    <>
      <span className="text-xs text-muted-foreground/50">•</span>
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
              Worker Status
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Status:</span>
                <span
                  className={`block font-semibold ${
                    isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Connection:</span>
                <span className="block text-foreground">
                  {isActive ? "Connected" : "Not Connected"}
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-4 pb-1 border-t">
                <span className="text-muted-foreground">Initialization:</span>
                <span className="block text-foreground">
                  {isActive
                    ? "Worker client initialized and ready"
                    : "Worker client not available"}
                </span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
