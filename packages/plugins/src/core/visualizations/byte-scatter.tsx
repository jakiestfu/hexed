import { Grid3x3 } from "lucide-react"

import type { ChartConfiguration, HexedVisualization } from "@hexed/worker"
import type { VisualizationPreset } from "../../types"

/**
 * Pure function to calculate byte scatter and return chart configuration
 * This function runs in the worker context via $task
 */
export const calculateByteScatter: HexedVisualization = async (file, api) => {
  // Chunk size for streaming (1MB)
  const STREAM_CHUNK_SIZE = 1024 * 1024
  // Maximum points to display in scatter plot (default 10000)
  const MAX_SCATTER_POINTS = 10000

  const fileSize = file.size
  const endOffset = fileSize
  const searchRange = endOffset
  const maxPoints = MAX_SCATTER_POINTS

  // Determine if we need to sample the data
  const needsSampling = searchRange > maxPoints
  const targetPoints = Math.min(searchRange, maxPoints)
  const sampleStep = needsSampling ? Math.floor(searchRange / targetPoints) : 1

  // Collect points
  const points: Array<{ x: number; y: number }> = []
  let bytesRead = 0
  let nextSamplePosition = 0 // Absolute position for next sample

  while (bytesRead < searchRange && points.length < targetPoints) {
    api.throwIfAborted()
    const chunkStart = bytesRead
    const chunkEnd = Math.min(
      chunkStart + STREAM_CHUNK_SIZE,
      searchRange
    )

    // Ensure range is loaded and read chunk
    await file.ensureRange({ start: chunkStart, end: chunkEnd })
    const chunk = file.readBytes(chunkStart, chunkEnd - chunkStart)

    if (chunk) {
      if (needsSampling) {
        // Sample uniformly across the entire file range
        const chunkStartAbsolute = chunkStart
        const chunkEndAbsolute = chunkEnd

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
            const absoluteOffset = nextSamplePosition
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

export const byteScatterPreset: VisualizationPreset = {
  id: "byte-scatter",
  title: "Offset vs Bytes",
  icon: Grid3x3,
  info: (
    <div className="space-y-2">
      <p>
        This visualization displays a <strong>scatter plot</strong> of file
        offset (X-axis) versus byte value (Y-axis). Each point represents a byte
        at a specific position in the file, helping reveal binary file
        structure, patterns, headers, and data organization.
      </p>
      <p>The scatter plot can reveal:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>
          <strong>File headers</strong> - Distinct byte patterns at the
          beginning
        </li>
        <li>
          <strong>Data structures</strong> - Clustered byte values indicating
          structured data
        </li>
        <li>
          <strong>Patterns</strong> - Repeating sequences or regular byte
          distributions
        </li>
        <li>
          <strong>Transitions</strong> - Changes between different data regions
        </li>
        <li>
          <strong>Empty regions</strong> - Areas with consistent zero or padding
          values
        </li>
      </ul>
      <p>
        For large files, the data is automatically sampled to maintain
        performance while preserving pattern visibility. Hover over points to
        see the exact offset and byte value.
      </p>
    </div>
  ),
  visualization: calculateByteScatter
}
