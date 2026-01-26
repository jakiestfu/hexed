// React integration (for React users)
export { HexCanvasReact, type HexCanvasReactRef } from "./hex-canvas-react"
export {
  useHexedCanvas,
  useHexCanvasEvent,
  type HexCanvasHandle,
  type HexCanvasEventMap,
  type UseHexedCanvasOptions,
  type UseHexedCanvasReturn,
  type HexCanvasEventCallbacks
} from "./use-hexed-canvas"

// Re-export SelectionRange from core package for convenience
export type { SelectionRange } from "@hexed/canvas"
