/**
 * @hexed/worker - SharedWorker-based file reading with windowed loading
 */

// Client API
export { createWorkerClient, type WorkerClient } from "./client";

export * from "./types";
// Note: worker.ts is the SharedWorker entry point
// It should be bundled separately and served as a static asset
// Import path: "./worker" or "@hexed/worker/worker"
