// Main hex editor component
export * from "./components/hex-editor"

// Components
export * from "./components/diff-viewer"
export * from "./components/empty-state"
export * from "./components/file-source-icon"
export * from "./components/file-status-popover"
export * from "./components/find-input"
export * from "./components/hex-footer"
export * from "./components/hex-toolbar"
export * from "./components/histogram"
export * from "./components/interpreter"
export * from "./components/memory-profiler"
export * from "./components/strings"
export * from "./components/templates"
export * from "./components/worker-status"
export * from "./components/drag-drop-provider"

// Types
export * from "./types"

// Utils
export * from "./utils"
export type { FileHandleMetadata } from "./utils/file-handle-storage"

// Hooks
export * from "./hooks/use-global-keyboard"
export * from "./hooks/use-settings"
export * from "./hooks/use-local-storage"
export * from "./hooks/use-hex-input"
export * from "./hooks/use-performance-metrics"
export * from "./hooks/use-recent-files"
export * from "./hooks/use-hex-editor-file"
export * from "./hooks/use-file-handle-watcher"

// Providers
export * from "./providers/file-manager-provider"
