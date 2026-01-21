import { forwardRef, useRef } from "react"
import {
  useHexCanvas,
  useHexCanvasEvent,
  UseHexCanvasOptions,
  type HexCanvasHandle
} from "./use-hex-canvas"
export type HexCanvasReactRef = HexCanvasHandle

export const HexCanvasReact = forwardRef<HexCanvasReactRef, UseHexCanvasOptions & { className?: string }>(
  ({ className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null)

    const { canvasRef } = useHexCanvas(containerRef, props, ref)

    useHexCanvasEvent(canvasRef, "selectionChange", props.onSelectedOffsetRangeChange)

    return (
      <div
        ref={containerRef}
        className={`h-full w-full overflow-auto relative ${className}`}
        style={{ position: "relative" }}
      />
    )
  }
)

HexCanvasReact.displayName = "HexCanvasReact"
