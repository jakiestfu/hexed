/**
 * Chart.js rendering utilities for offscreen canvas in worker
 */

import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Decimation,
  ChartConfiguration
} from "chart.js"

export type { ChartConfiguration } from "chart.js"

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, BarController, Decimation)

/**
 * Generic chart rendering function
 * @param canvas - Offscreen canvas to render on
 * @param config - Chart.js configuration object
 * @returns Chart instance
 */
export function renderChart(
  canvas: OffscreenCanvas,
  config: ChartConfiguration
): Chart {
  // Validate config structure
  if (!config || typeof config !== "object") {
    throw new Error("Invalid chart configuration")
  }

  return new Chart(canvas, config)
}
