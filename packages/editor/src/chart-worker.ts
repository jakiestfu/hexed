/**
 * Chart Worker entry point for the web app
 * This file imports the Chart Worker constructor from @hexed/worker using Vite's ?worker query suffix
 * Vite will bundle this as a separate Worker file and provide a Worker constructor
 */

// Import the chart worker constructor using Vite's ?worker query suffix
// This provides a Worker constructor as the default export
import ChartWorkerConstructor from "@hexed/worker/chart-worker?worker"

export default ChartWorkerConstructor
