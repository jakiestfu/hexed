import { Grid3x3 } from "lucide-react"

import { createHexedEditorPlugin } from "../.."
import type { ChartCalculationFunction } from "../../types"
import type { ChartConfiguration } from "@hexed/worker/chart-worker"

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
  // Calculate byte scatter
  const { points } = await workerClient.calculateByteScatter(
    file,
    onProgress,
    startOffset,
    endOffset
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
