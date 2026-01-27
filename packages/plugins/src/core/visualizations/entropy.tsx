import { Activity } from "lucide-react"

import { createHexedEditorPlugin } from "../.."
import type { ChartCalculationFunction } from "../../types"
import type { ChartConfiguration } from "@hexed/worker/chart-worker"
import { formatAddress } from "@hexed/file"

/**
 * Calculate entropy and return chart configuration
 */
export const calculateEntropy: ChartCalculationFunction = async (
  file,
  workerClient,
  onProgress,
  startOffset,
  endOffset
) => {
  // Calculate entropy
  const { entropyValues, offsets, blockSize } =
    await workerClient.charts.calculateEntropy(
      file,
      onProgress,
      startOffset,
      endOffset
    )

  // Create chart configuration
  // Format offsets as hex addresses
  const labels = offsets.map((offset) => {
    return formatAddress(offset)//`0x${offset.toString(16).padStart(8, "0").toUpperCase()}`
  })

  // For small datasets, show points and disable decimation
  const dataPointCount = entropyValues.length
  const showPoints = dataPointCount < 10
  const enableDecimation = dataPointCount >= 10

  return {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Entropy",
          data: entropyValues,
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
          max: 8,
          title: {
            display: true,
            text: "Entropy (bits)"
          },
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  } satisfies ChartConfiguration
}

export const entropyPlugin = createHexedEditorPlugin({
  type: "visualization",
  id: "entropy",
  title: "Entropy",
  info: (
    <div className="space-y-2">
      <p>
        This visualization measures <strong>how random or structured</strong> the selected bytes are.
        Higher entropy means the data looks more random; lower entropy suggests patterns,
        repetition, or human-readable structure.
      </p>
      <p>
        Entropy is computed using the <strong>Shannon entropy</strong> formula, commonly used in
        compression, cryptography, and binary analysis.
      </p>
      <p>
        <a
          href="https://en.wikipedia.org/wiki/Entropy_(information_theory)"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary"
        >
          Learn more about Shannon entropy
        </a>
      </p>
    </div>
  ),
  icon: Activity,
  chart: calculateEntropy
})
