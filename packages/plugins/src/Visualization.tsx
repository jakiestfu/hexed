import {
  useEffect,
  useRef,
  useState,
  type FunctionComponent,
  type ReactNode
} from "react"
import { AlertCircle, type LucideIcon } from "lucide-react"

import { useHexedFileContext } from "@hexed/editor"
import {
  cn,
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  Progress
} from "@hexed/ui"
import type { HexedVisualization } from "@hexed/worker"

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

export const Visualization: FunctionComponent<{
  id: string
  title: string
  icon: LucideIcon
  info?: ReactNode
  visualization: HexedVisualization | string
}> = ({ id, visualization }) => {
  const {
    input: { hexedFile }
  } = useHexedFileContext()

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const offscreenRef = useRef<OffscreenCanvas | null>(null)
  const canvasDeferredRef = useRef<Deferred<OffscreenCanvas> | null>(null)

  const lastSuccessfulKeyRef = useRef<string | null>(null)
  const runIdRef = useRef(0)
  const [canvasKey, setCanvasKey] = useState(0)

  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  if (!hexedFile?.worker) return null

  // Transfer canvas to OffscreenCanvas when canvas element is created/recreated.
  // This effect runs when canvasKey changes, which forces React to recreate the canvas element.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Skip if we already transferred this canvas (prevents double-transfer)
    if (offscreenRef.current) return

    if (typeof OffscreenCanvas === "undefined") {
      setError(new Error("OffscreenCanvas is not supported in this browser"))
      return
    }

    const container = containerRef.current
    const rect = container?.getBoundingClientRect()
    const displayWidth = rect?.width || 800
    const displayHeight = rect?.height || 600

    // Keep CSS size == display size. Offscreen render uses DPR passed to worker.
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(displayWidth / dpr)
    canvas.height = Math.floor(displayHeight / dpr)

    try {
      const offscreen = canvas.transferControlToOffscreen()
      offscreenRef.current = offscreen

      if (!canvasDeferredRef.current)
        canvasDeferredRef.current = createDeferred<OffscreenCanvas>()
      canvasDeferredRef.current.resolve(offscreen)
    } catch (e) {
      const err =
        e instanceof Error
          ? e
          : new Error("Failed to transfer canvas to OffscreenCanvas")
      setError(err)
    }
  }, [canvasKey])

  useEffect(() => {
    const file = hexedFile.getFile()
    if (!file) return
    if (!canvasRef.current) return

    const runId = ++runIdRef.current
    const dpr = window.devicePixelRatio || 1

    const currentKey = `${file.name}-${file.size}-${file.lastModified}-viz:${id}`

    // If we already rendered this exact file+visualization successfully, skip.
    if (lastSuccessfulKeyRef.current === currentKey) return

    // Recreate canvas if we need a new render (file or visualization changed)
    // This ensures we have a fresh canvas that can be transferred
    if (
      lastSuccessfulKeyRef.current !== null &&
      lastSuccessfulKeyRef.current !== currentKey
    ) {
      // Reset canvas refs to force recreation
      offscreenRef.current = null
      canvasDeferredRef.current = null
      setCanvasKey((prev) => prev + 1)
    }

    const run = async () => {
      try {
        setError(null)
        setIsProcessing(true)
        setProgress(0)

        // Wait for canvas to be transferred if needed
        const offscreen =
          offscreenRef.current ??
          (canvasDeferredRef.current
            ? await canvasDeferredRef.current.promise
            : await (canvasDeferredRef.current =
                createDeferred<OffscreenCanvas>()).promise)

        // Evaluate visualization and render chart in a single operation
        await hexedFile.$chart(visualization, offscreen, dpr, {
          onProgress: (p) => {
            // Ignore late progress from stale runs
            if (runIdRef.current !== runId) return
            const v = Math.min(100, Math.round((p.processed / p.size) * 100))
            setProgress(v)
          }
        })

        // If a newer run started, drop this result
        if (runIdRef.current !== runId) return

        // Still current? mark success + finish UI
        if (runIdRef.current === runId) {
          lastSuccessfulKeyRef.current = currentKey
          setProgress(100)
        }
      } catch (e) {
        if (runIdRef.current !== runId) return
        const err = e instanceof Error ? e : new Error("Failed to render chart")
        console.error(err)
        setError(err)
        // allow retry on next effect run
        lastSuccessfulKeyRef.current = null
      } finally {
        if (runIdRef.current === runId) setIsProcessing(false)
      }
    }

    run()
  }, [hexedFile, id, visualization])

  return (
    <div className="flex flex-col h-full w-full relative">
      {error ? (
        <div className="flex-1 flex items-center justify-center m-4">
          <Empty>
            <EmptyMedia variant="icon">
              <AlertCircle className="text-destructive" />
            </EmptyMedia>
            <EmptyTitle>Failed to render chart</EmptyTitle>
            <EmptyDescription>{error.message}</EmptyDescription>
          </Empty>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 relative min-h-0 m-4"
        >
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
            key={`${id}-${canvasKey}`}
            ref={canvasRef}
            className={cn(
              "w-full h-full transition-opacity duration-300",
              isProcessing ? "opacity-0" : "opacity-100"
            )}
            style={{ display: "block" }}
          />
        </div>
      )}
    </div>
  )
}
