import { BarChart } from "lucide-react"

import { createHexedEditorPlugin } from "../.."
import type { ChartCalculationFunction } from "../../types"
import type { ChartConfiguration } from "@hexed/worker"
import { HexedFile } from "@hexed/file"

// Chunk size for streaming (1MB)

/**
 * Pure function to calculate byte frequency distribution
 * This function runs in the worker context via $evaluate
*/
const calculateByteFrequencyImpl = async (
  hexedFile: HexedFile,
  api: {
    throwIfAborted: () => void
    emitProgress: (data: { processed: number; size: number }) => void
    context: { startOffset?: number; endOffset?: number }
  }
): Promise<number[]> => {
  const STREAM_CHUNK_SIZE = 1024 * 1024
  const fileSize = hexedFile.size
  const startOffset = api.context?.startOffset ?? 0
  const endOffset = api.context?.endOffset ?? fileSize
  const searchRange = endOffset - startOffset

  // Initialize frequency array (256 elements for bytes 0-255)
  const frequencies = new Array(256).fill(0)
  let bytesRead = 0

  while (bytesRead < searchRange) {
    api.throwIfAborted()
    const chunkStart = startOffset + bytesRead
    const chunkEnd = Math.min(
      chunkStart + STREAM_CHUNK_SIZE,
      startOffset + searchRange
    )

    // Ensure range is loaded and read chunk
    await hexedFile.ensureRange({ start: chunkStart, end: chunkEnd })
    const chunk = hexedFile.readBytes(chunkStart, chunkEnd - chunkStart)

    if (chunk) {
      // Count byte frequencies in this chunk
      for (let i = 0; i < chunk.length; i++) {
        frequencies[chunk[i]]++
      }
    }

    const chunkSize = chunkEnd - chunkStart
    bytesRead += chunkSize

    // Emit progress
    api.emitProgress({ processed: bytesRead, size: searchRange })

    // Yield to event loop to keep UI responsive
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return frequencies
}

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
  // Calculate byte frequency using $evaluate
  const frequencies = await workerClient.$evaluate(
    file,
    calculateByteFrequencyImpl,
    {
      context: { startOffset, endOffset },
      onProgress: onProgress
        ? (progress) => {
          const percentage = Math.round(
            (progress.processed / progress.size) * 100
          )
          onProgress(percentage)
        }
        : undefined
    }
  )

  // const frequencies = await calculateByteFrequencyImpl(file, {
  //   throwIfAborted: () => { },
  //   emitProgress: (progress) => {
  //     onProgress(Math.round((progress.processed / progress.size) * 100))
  //   },
  //   context: { startOffset, endOffset }
  // })

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
