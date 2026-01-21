import { forwardRef, useEffect, useRef } from "react"
import {
  HexCanvasEventCallbacks,
  useHexCanvas,
  useHexCanvasEvent,
  UseHexCanvasOptions,
  type HexCanvasHandle
} from "./use-hex-canvas"
export type HexCanvasReactRef = HexCanvasHandle

export const HexCanvasReact = forwardRef<HexCanvasReactRef, UseHexCanvasOptions & HexCanvasEventCallbacks & { className?: string }>(
  ({ className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvas = useHexCanvas(containerRef, props, ref)
    useHexCanvasEvent(canvas, "selectionChange", props.onSelectionChange)
    return (
      <div
        ref={containerRef}
        className={`h-full w-full overflow-auto relative ${className}`}
      />
    )
  }
)

HexCanvasReact.displayName = "HexCanvasReact"
