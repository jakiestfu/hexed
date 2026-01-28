import { FunctionComponent, useEffect, useRef, useState } from "react"
import { Info, X } from "lucide-react"

import {
  useHexedFileContext,
  useHexedSettingsContext,
  useHexedStateContext
} from "@hexed/editor"
import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress
} from "@hexed/ui"

import { HexedPluginOptionsForVisualization } from "./types"

export const VisualizationPlugin: FunctionComponent<
  HexedPluginOptionsForVisualization
> = ({ type, title, icon: Icon, chart: chartFunction, info }) => {
  const settings = useHexedSettingsContext()
  const {
    input: { hexedFile }
  } = useHexedFileContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fileProcessedRef = useRef<string | null>(null)
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null)
  const canvasReadyResolveRef = useRef<
    ((canvas: OffscreenCanvas) => void) | null
  >(null)
  const canvasReadyPromiseRef = useRef<Promise<OffscreenCanvas>>(
    new Promise<OffscreenCanvas>((resolve) => {
      canvasReadyResolveRef.current = resolve
    })
  )

  if (!hexedFile || type !== "visualization" || !hexedFile.worker) return null

  // Transfer canvas to chart worker once it's mounted
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !hexedFile?.worker || offscreenCanvasRef.current) return

    if (typeof OffscreenCanvas === "undefined") {
      setError(new Error("OffscreenCanvas is not supported"))
      return
    }

    // Set dimensions
    const container = containerRef?.current
    let displayWidth: number
    let displayHeight: number

    if (container) {
      const rect = container.getBoundingClientRect()
      displayWidth = rect.width || 800
      displayHeight = rect.height || 600
    } else {
      displayWidth = 800
      displayHeight = 600
    }

    // Set canvas size to display dimensions
    // Chart.js will handle devicePixelRatio scaling internally
    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = displayWidth / devicePixelRatio
    canvas.height = displayHeight / devicePixelRatio

    // Set CSS size to maintain correct display size
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    // Transfer canvas
    try {
      const offscreen = canvas.transferControlToOffscreen()
      offscreenCanvasRef.current = offscreen
      // Resolve the promise if it hasn't been resolved yet
      if (canvasReadyResolveRef.current) {
        canvasReadyResolveRef.current(offscreen)
        canvasReadyResolveRef.current = null
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to transfer canvas")
      setError(error)
    }
  }, [hexedFile?.worker])

  // Calculate and render chart when file changes
  useEffect(() => {
    const file = hexedFile?.getFile()
    if (!file || !hexedFile?.worker || isProcessing) return

    const loadData = async () => {
      try {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`

        // Skip if already processed
        if (fileProcessedRef.current === fileKey) return

        fileProcessedRef.current = fileKey
        setIsProcessing(true)
        setProgress(0)
        setError(null)

        // Wait for canvas to be ready (if not already ready)
        const canvasPromise = offscreenCanvasRef.current
          ? Promise.resolve(offscreenCanvasRef.current)
          : canvasReadyPromiseRef.current

        // Call chart function to get chart config
        const chartConfigPromise = chartFunction(
          hexedFile,
          hexedFile.worker!,
          (progressValue) => {
            setProgress(progressValue)
          }
        )

        // Wait for both chart config and canvas to be ready
        const [chartConfig, offscreenCanvas] = await Promise.all([
          chartConfigPromise,
          canvasPromise
        ])

        // Get devicePixelRatio for Chart.js config
        const dpr = window.devicePixelRatio || 1

        // Render chart using unified worker client
        await hexedFile.worker!.render(offscreenCanvas, chartConfig, dpr)
        setProgress(100)
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to render chart")
        console.error("Failed to render chart:", err)
        setError(error)
        fileProcessedRef.current = null
      } finally {
        setIsProcessing(false)
      }
    }

    loadData()
  }, [hexedFile, chartFunction, isProcessing])

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">{title}</h2>
          {info ? (
            // Create a popover
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <Info className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="text-sm text-muted-foreground"
              >
                {info}
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
        <Button
          onClick={() => settings.setVisualization(null)}
          variant="ghost"
          size="icon-lg"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border-b bg-destructive/10 text-destructive">
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Chart Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative min-h-0 m-4 mt-0"
      >
        {/* Progress Bar */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-10",
            isProcessing ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="space-y-2 w-full max-w-lg px-4">
            <Progress
              value={progress}
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="animate-pulse">Calculating chart data...</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className={cn(
            "w-full h-full transition-opacity duration-300",
            isProcessing ? "opacity-0" : "opacity-100"
          )}
          style={{ display: "block" }}
        />
      </div>
    </div>
  )
}
