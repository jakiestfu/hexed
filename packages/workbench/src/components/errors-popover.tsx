import { AlertCircle, ChevronRight } from "lucide-react"
import type * as monaco from "monaco-editor"
import { Button, cn, Popover, PopoverContent, PopoverTrigger } from "@hexed/ui"

export const ErrorsPopover = (props: {
  errors: monaco.editor.IMarkerData[]
  onSelectError?: (err: monaco.editor.IMarkerData) => void
  className?: string
}) => {
  const { errors, onSelectError, className } = props

  if (!errors.length) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "gap-2",
            "hover:bg-destructive/10 hover:text-destructive",
            className
          )}
        >
          <span className="text-xs font-medium tabular-nums text-destructive">
            {errors.length}
          </span>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="sr-only">Open TypeScript errors</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[420px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <div className="text-sm font-medium">
              Errors <span className="text-muted-foreground font-normal">({errors.length})</span>
            </div>
          </div>

          {/* Optional: put a “Copy” button or “Dismiss” here later */}
        </div>

        {/* List */}
        <div className="max-h-[320px] overflow-auto py-1">
          {errors.map((err, index) => {
            const pos = `${err.startLineNumber}:${err.startColumn}`
            const code = typeof err.code === "string" || typeof err.code === "number" ? String(err.code) : null

            return (
              <button
                key={`${pos}-${code ?? "no-code"}-${index}`}
                type="button"
                onClick={() => onSelectError?.(err)}
                className={cn(
                  "w-full text-left px-3 py-2",
                  "bg-transparent transition-colors hover:bg-muted/60 focus:outline-none focus:bg-muted/60"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-[2px] shrink-0">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1 gap-1 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono tabular-nums text-muted-foreground">
                        {pos}
                      </span>
                      {code ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {code}
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs leading-snug text-primary opacity-80 break-words font-mono">
                      {err.message}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-2 border-t text-xs text-muted-foreground">
          Click an error to jump to its location.
        </div>
      </PopoverContent>
    </Popover>
  )
}