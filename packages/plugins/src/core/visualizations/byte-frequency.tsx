import { BarChart } from "lucide-react"

import { createHexedEditorPlugin } from "../.."
import type { ChartCalculationFunction } from "../../types"
import type { ChartConfiguration } from "@hexed/worker/chart-worker"

/**
 * Calculate byte frequency and return chart configuration
 */
export const calculateByteFrequency: ChartCalculationFunction = async (
  file,
  workerClient,
  onProgress,
  startOffset,
  endOffset
) => {
  // Calculate byte frequency
  const frequencies = await workerClient.calculateByteFrequency(
    file,
    onProgress,
    startOffset,
    endOffset
  )

  // Create chart configuration
  const labels = Array.from({ length: 256 }, (_, i) => {
    const hex = i.toString(16).padStart(2, "0").toUpperCase()
    return `0x${hex}`
  })
  return {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Frequency",
          data: frequencies,
          backgroundColor: "hsl(var(--primary))"
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
        decimation: {
          enabled: true,
          algorithm: "lttb",
          samples: 256
        }
      },
      scales: {
        x: {
          type: "category",
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            maxTicksLimit: 64
          }
        },
        y: {
          type: "linear",
          beginAtZero: true
        }
      }
    }
  } satisfies ChartConfiguration
}

export const byteFrequencyPlugin = createHexedEditorPlugin({
  type: "visualization",
  id: "byte-frequency",
  title: "Byte Frequency",
  icon: BarChart,
  chart: calculateByteFrequency
})
