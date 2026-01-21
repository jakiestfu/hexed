// Core vanilla JS class
export { HexCanvas, type HexCanvasOptions } from "./hex-canvas"

// React wrapper component
export {
  HexCanvasReact,
  type HexCanvasReactProps,
  type HexCanvasReactRef
} from "./hex-canvas-react"

// Utility functions (for advanced use cases)
export * from "./utils/canvas"
export * from "./utils/coordinates"
export * from "./utils/colors"
export * from "./utils/constants"
export * from "./utils/file-scroll-manager"

// Legacy hooks (deprecated - use HexCanvas class or HexCanvasReact component instead)
// Kept for backward compatibility during migration
export * from "./hooks/use-calculate-editor-layout"
export * from "./hooks/use-dimensions"
export * from "./hooks/use-format-data"
export * from "./hooks/use-virtual-scroll-top"
