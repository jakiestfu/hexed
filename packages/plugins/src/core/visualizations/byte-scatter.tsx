import { Grid3x3 } from "lucide-react"

import { createHexedEditorPlugin } from "../.."
import type { ChartCalculationFunction } from "../../types"
import type { ChartConfiguration } from "@hexed/worker"
import { HexedFile } from "@hexed/file"

/**
 * Pure function to calculate byte scatter
 * This function runs in the worker context via $evaluate
 */
const calculateByteScatterImpl = async (
  hexedFile: HexedFile,
  api: {
    throwIfAborted: () => void
    emitProgress: (data: { processed: number; size: number }) => void
    context: { startOffset?: number; endOffset?: number; maxPoints?: number }
  }
): Promise<{ points: Array<{ x: number; y: number }> }> => {
  // Chunk size for streaming (1MB)
  const STREAM_CHUNK_SIZE = 1024 * 1024
  // Maximum points to display in scatter plot (default 10000)
  const DEFAULT_MAX_SCATTER_POINTS = 10000

  const fileSize = hexedFile.size
  const startOffset = api.context?.startOffset ?? 0
  const endOffset = api.context?.endOffset ?? fileSize
  const searchRange = endOffset - startOffset
  const maxPoints = api.context?.maxPoints ?? DEFAULT_MAX_SCATTER_POINTS

  // Determine if we need to sample the data
  const needsSampling = searchRange > maxPoints
  const targetPoints = Math.min(searchRange, maxPoints)
  const sampleStep = needsSampling
    ? Math.floor(searchRange / targetPoints)
    : 1

  // Collect points
  const points: Array<{ x: number; y: number }> = []
  let bytesRead = 0
  let nextSamplePosition = 0 // Absolute position for next sample

  while (bytesRead < searchRange && points.length < targetPoints) {
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
      if (needsSampling) {
        // Sample uniformly across the entire file range
        const chunkStartAbsolute = chunkStart - startOffset
        const chunkEndAbsolute = chunkEnd - startOffset

        // Find the first sample position in or after this chunk
        while (
          nextSamplePosition < chunkStartAbsolute &&
          points.length < targetPoints
        ) {
          nextSamplePosition += sampleStep
        }

        // Sample bytes in this chunk
        while (
          nextSamplePosition >= chunkStartAbsolute &&
          nextSamplePosition < chunkEndAbsolute &&
          points.length < targetPoints
        ) {
          const offsetInChunk = nextSamplePosition - chunkStartAbsolute
          if (offsetInChunk < chunk.length) {
            const absoluteOffset = startOffset + nextSamplePosition
            points.push({
              x: absoluteOffset,
              y: chunk[offsetInChunk]
            })
          }
          nextSamplePosition += sampleStep
        }
      } else {
        // Use all data
        for (let i = 0; i < chunk.length && points.length < targetPoints; i++) {
          const absoluteOffset = chunkStart + i
          points.push({
            x: absoluteOffset,
            y: chunk[i]
          })
        }
      }
    }

    const chunkSize = chunkEnd - chunkStart
    bytesRead += chunkSize

    // Emit progress
    api.emitProgress({ processed: bytesRead, size: searchRange })

    // Yield to event loop to keep UI responsive
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return { points }
}

/**
 * Calculate byte scatter and return chart configuration
 */
export const calculateByteScatter: ChartCalculationFunction = async (
  file,
  workerClient,
  onProgress,
  startOffset,
  endOffset
) => {
  // Calculate byte scatter using $evaluate
  const { points } = await workerClient.$evaluate(
    file,
    calculateByteScatterImpl,
    {
      context: { startOffset, endOffset, maxPoints: 10000 },
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

  return {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Byte Value",
          data: points,
          backgroundColor: "hsl(var(--primary))",
          pointRadius: 1,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "hsl(var(--primary))",
          pointHoverBorderColor: "hsl(var(--primary))",
          pointHoverBorderWidth: 2
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          enabled: true
        },
        legend: { display: false }
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "File Offset"
          }
        },
        y: {
          type: "linear",
          min: 0,
          max: 255,
          title: {
            display: true,
            text: "Byte Value"
          },
          ticks: {
            stepSize: 32
          }
        }
      }
    }
  } satisfies ChartConfiguration
}

export const byteScatterPlugin = createHexedEditorPlugin({
  type: "visualization",
  id: "byte-scatter",
  title: "Offset vs Bytes",
  info: (
    <div className="space-y-2">
      <p>
        This visualization displays a <strong>scatter plot</strong> of file offset (X-axis) versus byte value (Y-axis).
        Each point represents a byte at a specific position in the file, helping reveal binary file structure,
        patterns, headers, and data organization.
      </p>
      <p>
        The scatter plot can reveal:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li><strong>File headers</strong> - Distinct byte patterns at the beginning</li>
        <li><strong>Data structures</strong> - Clustered byte values indicating structured data</li>
        <li><strong>Patterns</strong> - Repeating sequences or regular byte distributions</li>
        <li><strong>Transitions</strong> - Changes between different data regions</li>
        <li><strong>Empty regions</strong> - Areas with consistent zero or padding values</li>
      </ul>
      <p>
        For large files, the data is automatically sampled to maintain performance while preserving
        pattern visibility. Hover over points to see the exact offset and byte value.
      </p>
    </div>
  ),
  icon: Grid3x3,
  chart: calculateByteScatter
})
