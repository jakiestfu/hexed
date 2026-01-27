import { TrendingUp } from "lucide-react"

import { createHexedEditorPlugin } from "../.."
import type { ChartCalculationFunction } from "../../types"
import type { ChartConfiguration } from "@hexed/worker/chart-worker"
import { formatAddress } from "@hexed/file"

/**
 * Calculate chi-square and return chart configuration
 */
export const calculateChiSquare: ChartCalculationFunction = async (
  file,
  workerClient,
  onProgress,
  startOffset,
  endOffset
) => {
  // Calculate chi-square
  const { chiSquareValues, offsets, blockSize } =
    await workerClient.calculateChiSquare(
      file,
      onProgress,
      startOffset,
      endOffset
    )

  // Create chart configuration
  // Format offsets as hex addresses
  const labels = offsets.map((offset) => {
    return formatAddress(offset)
  })

  // For small datasets, show points and disable decimation
  const dataPointCount = chiSquareValues.length
  const showPoints = dataPointCount < 10
  const enableDecimation = dataPointCount >= 10

  return {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Chi-square",
          data: chiSquareValues,
          borderColor: "hsl(var(--primary))",
          backgroundColor: "hsl(var(--primary) / 0.1)",
          pointRadius: showPoints ? 3 : 0,
          pointHoverRadius: 3,
          borderWidth: 1.5,
          fill: true,
          tension: 0.1
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
        legend: { display: false },
        decimation: {
          enabled: enableDecimation,
          algorithm: "lttb",
          samples: 1000
        }
      },
      scales: {
        x: {
          type: "category",
          title: {
            display: true,
            text: "File Offset"
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            maxTicksLimit: 20
          }
        },
        y: {
          type: "linear",
          beginAtZero: true,
          title: {
            display: true,
            text: "Chi-square"
          }
        }
      }
    }
  } satisfies ChartConfiguration
}

export const chiSquarePlugin = createHexedEditorPlugin({
  type: "visualization",
  id: "chi-square",
  title: "Chi-square",
  info: (
    <div className="space-y-2">
      <p>
        This visualization measures how well the byte distribution matches a{" "}
        <strong>uniform (random) distribution</strong> using the chi-square
        statistical test. Lower values indicate randomness; higher values
        indicate structure, patterns, or non-random data.
      </p>
      <p>
        Chi-square is calculated as χ² = Σ((observed - expected)² / expected),
        where expected frequency assumes uniform distribution. This test is
        commonly used in binary analysis and forensics to identify encrypted,
        compressed, or structured data regions.
      </p>
      <p>
        <a
          href="https://en.wikipedia.org/wiki/Chi-squared_test"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary"
        >
          Learn more about chi-square test
        </a>
      </p>
    </div>
  ),
  icon: TrendingUp,
  chart: calculateChiSquare
})
