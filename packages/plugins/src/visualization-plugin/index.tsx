import { FunctionComponent, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

import {
  useHexedFileContext,
  useHexedSettingsContext,
  useHexedStateContext,
  useWorkerClient
} from "@hexed/editor"
import { Button, cn, Progress } from "@hexed/ui"

import { HexedPluginOptionsForVisualization } from "../types"

export const VisualizationPlugin: FunctionComponent<
  HexedPluginOptionsForVisualization
> = ({ type, title, icon: Icon, chart: chartFunction }) => {
  const settings = useHexedSettingsContext()
  const {
    input: { hexedFile }
  } = useHexedFileContext()
  const workerClient = useWorkerClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fileProcessedRef = useRef<string | null>(null)
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null)
  const canvasReadyResolveRef = useRef<((canvas: OffscreenCanvas) => void) | null>(
    null
  )
  const canvasReadyPromiseRef = useRef<Promise<OffscreenCanvas>>(
    new Promise<OffscreenCanvas>((resolve) => {
      canvasReadyResolveRef.current = resolve
    })
  )

  if (!hexedFile || type !== "visualization" || !workerClient) return null

  // Transfer canvas to worker once it's mounted
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !workerClient || offscreenCanvasRef.current) return

    if (typeof OffscreenCanvas === "undefined") {
      setError(new Error("OffscreenCanvas is not supported"))
      return
    }

    // Set dimensions
    const container = containerRef?.current
    if (container) {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width || 800
      canvas.height = rect.height || 600
    } else {
      canvas.width = 800
      canvas.height = 600
    }

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
      const error = err instanceof Error ? err : new Error("Failed to transfer canvas")
      setError(error)
    }
  }, [workerClient])

  // Calculate and render chart when file changes
  useEffect(() => {
    const file = hexedFile?.getFile()
    if (!file || !workerClient || isProcessing) return

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
          file,
          workerClient,
          (progressValue) => {
            setProgress(progressValue)
          }
        )

        // Wait for both chart config and canvas to be ready
        const [chartConfig, offscreenCanvas] = await Promise.all([
          chartConfigPromise,
          canvasPromise
        ])

        // Render chart
        await workerClient.charts.render(offscreenCanvas, chartConfig)
        setProgress(100)
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to render chart")
        console.error("Failed to render chart:", err)
        setError(error)
        fileProcessedRef.current = null
      } finally {
        setIsProcessing(false)
      }
    }

    loadData()
  }, [hexedFile, workerClient, chartFunction, isProcessing])

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-bold">{title}</h2>
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
      <div ref={containerRef} className="flex-1 relative min-h-0 m-4 mt-0">
        {/* Progress Bar */}
        <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-10", isProcessing ? "opacity-100" : "opacity-0")}>
          <div className="space-y-2 w-full max-w-lg px-4">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="animate-pulse">Calculating chart data...</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className={cn("w-full h-full transition-opacity duration-300", isProcessing ? "opacity-0" : "opacity-100")}
          style={{ display: "block" }}
        />
      </div>
    </div>
  )
}
