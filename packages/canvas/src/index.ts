// Core vanilla JS class (primary API - framework agnostic)
export { HexCanvas, type HexCanvasOptions } from "./hex-canvas"

// React integration (optional - for React users)
export { HexCanvasReact, type HexCanvasReactRef } from "./hex-canvas-react"
export {
  useHexedCanvas,
  useHexCanvasEvent,
  type HexCanvasHandle,
  type HexCanvasEventMap,
  type UseHexedCanvasOptions,
  type UseHexedCanvasReturn
} from "./use-hexed-canvas"

// Utility functions (for advanced use cases)
export * from "./utils/canvas"
export * from "./utils/coordinates"
export * from "./utils/colors"
export * from "./utils/constants"
export * from "./utils/file-scroll-manager"
