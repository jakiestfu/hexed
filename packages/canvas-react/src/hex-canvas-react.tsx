import { forwardRef, useEffect, useRef } from "react"

import {
  HexCanvasEventCallbacks,
  useHexCanvasEvent,
  useHexedCanvas,
  UseHexedCanvasOptions,
  type HexCanvasHandle
} from "./use-hexed-canvas"

export type HexCanvasReactRef = HexCanvasHandle

export const HexCanvasReact = forwardRef<
  HexCanvasReactRef,
  UseHexedCanvasOptions & HexCanvasEventCallbacks & { className?: string }
>(({ className, ...props }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvas = useHexedCanvas(containerRef, props, ref)
  useHexCanvasEvent(canvas, "selectionChange", props.onSelectionChange)
  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-auto relative ${className}`}
    />
  )
})

HexCanvasReact.displayName = "HexCanvasReact"
