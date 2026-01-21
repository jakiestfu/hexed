// Core vanilla JS class (primary API - framework agnostic)
export { HexCanvas, type HexCanvasOptions } from "./hex-canvas"

// React integration (optional - for React users)
export {
  HexCanvasReact,
  type HexCanvasReactRef
} from "./hex-canvas-react"
export {
  useHexCanvas,
  useHexCanvasEvent,
  type HexCanvasHandle,
  type HexCanvasEventMap,
  type UseHexCanvasOptions,
  type UseHexCanvasReturn
} from "./use-hex-canvas"

// Utility functions (for advanced use cases)
export * from "./utils/canvas"
export * from "./utils/coordinates"
export * from "./utils/colors"
export * from "./utils/constants"
export * from "./utils/file-scroll-manager"
