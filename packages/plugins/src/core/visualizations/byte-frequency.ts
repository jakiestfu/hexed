import { BarChart } from "lucide-react"

import type { ChartConfiguration, HexedVisualization } from "@hexed/worker"
import type { VisualizationPreset } from "../../types"

/**
 * Pure function to calculate byte frequency distribution and return chart configuration
 * This function runs in the worker context via $task
 */
export const calculateByteFrequency: HexedVisualization = async (file, api) => {
  const STREAM_CHUNK_SIZE = 1024 * 1024
  const fileSize = file.size
  const endOffset = fileSize
  const searchRange = endOffset

  const frequencies = new Array(256).fill(0)
  let bytesRead = 0

  while (bytesRead < searchRange) {
    api.throwIfAborted()
    const chunkEnd = Math.min(
      bytesRead + STREAM_CHUNK_SIZE,
      searchRange
    )

    // Ensure range is loaded and read chunk
    await file.ensureRange({ start: bytesRead, end: chunkEnd })
    const chunk = file.readBytes(bytesRead, chunkEnd - bytesRead)

    if (chunk) {
      // Count byte frequencies in this chunk
      for (let i = 0; i < chunk.length; i++) {
        frequencies[chunk[i]]++
      }
    }

    const chunkSize = chunkEnd - bytesRead
    bytesRead += chunkSize

    // Emit progress
    api.emitProgress({ processed: bytesRead, size: searchRange })

    // Yield to event loop to keep UI responsive
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

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

export const byteFrequencyPreset: VisualizationPreset = {
  id: "byte-frequency",
  title: "Byte Frequency",
  icon: BarChart,
  visualization: calculateByteFrequency
}
