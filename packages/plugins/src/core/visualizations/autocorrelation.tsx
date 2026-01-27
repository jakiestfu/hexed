import { Repeat } from "lucide-react"

import { createHexedEditorPlugin } from "../.."
import type { ChartCalculationFunction } from "../../types"
import type { ChartConfiguration } from "@hexed/worker/chart-worker"

/**
 * Calculate autocorrelation and return chart configuration
 */
export const calculateAutocorrelation: ChartCalculationFunction = async (
  file,
  workerClient,
  onProgress,
  startOffset,
  endOffset
) => {
  // Calculate autocorrelation
  const { autocorrelationValues, lags } =
    await workerClient.calculateAutocorrelation(
      file,
      onProgress,
      startOffset,
      endOffset
    )

  // Create chart configuration
  // Format lag labels
  const labels = lags.map((lag) => `Lag ${lag}`)

  // For small datasets, show points and disable decimation
  const dataPointCount = autocorrelationValues.length
  const showPoints = dataPointCount < 50
  const enableDecimation = dataPointCount >= 50

  return {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Autocorrelation",
          data: autocorrelationValues,
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
            text: "Lag"
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            maxTicksLimit: 20
          }
        },
        y: {
          type: "linear",
          min: -1,
          max: 1,
          title: {
            display: true,
            text: "Autocorrelation"
          },
          ticks: {
            stepSize: 0.2
          }
        }
      }
    }
  } satisfies ChartConfiguration
}

export const autocorrelationPlugin = createHexedEditorPlugin({
  type: "visualization",
  id: "autocorrelation",
  title: "Autocorrelation",
  info: (
    <div className="space-y-2">
      <p>
        This visualization measures <strong>how correlated the data is with itself</strong> at different lag offsets.
        Autocorrelation helps identify repeating patterns, periodic structures, encryption, compression, and structured data regions.
      </p>
      <p>
        Autocorrelation is calculated as the correlation between the data and a shifted copy of itself.
        Values range from <strong>-1 to 1</strong>, where:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li><strong>1</strong> = perfect positive correlation (repeating pattern)</li>
        <li><strong>-1</strong> = perfect negative correlation (alternating pattern)</li>
        <li><strong>0</strong> = no correlation (random data)</li>
      </ul>
      <p>
        High autocorrelation at specific lags indicates repeating patterns at those offsets.
        This is commonly used in binary analysis and forensics to detect encryption, compression,
        or structured data formats.
      </p>
      <p>
        <a
          href="https://en.wikipedia.org/wiki/Autocorrelation"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary"
        >
          Learn more about autocorrelation
        </a>
      </p>
    </div>
  ),
  icon: Repeat,
  chart: calculateAutocorrelation
})
