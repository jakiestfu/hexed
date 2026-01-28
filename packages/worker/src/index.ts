/**
 * @hexed/worker - Worker-based file reading with windowed loading
 */

// Client API
export { createWorkerClient, type WorkerClient } from "./client"

export * from "./types"

// Export ChartConfiguration type for use by plugins
export type { ChartConfiguration } from "./worker"

// Note: worker.ts is the Worker entry point
// It should be bundled separately and served as a static asset
// Import path: "./worker" or "@hexed/worker/worker"
// Chart rendering is now handled by the main worker
