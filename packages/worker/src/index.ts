/**
 * @hexed/worker - Worker-based file reading with windowed loading
 */

// Client API (unified client for both main and chart workers)
export { createWorkerClient, type WorkerClient } from "./client"

export * from "./types"
// Note: worker.ts is the Worker entry point
// It should be bundled separately and served as a static asset
// Import path: "./worker" or "@hexed/worker/worker"
// Note: chart-worker.ts is the Chart Worker entry point
// Import path: "./chart-worker" or "@hexed/worker/chart-worker"
