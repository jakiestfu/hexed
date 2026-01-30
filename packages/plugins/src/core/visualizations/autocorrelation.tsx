import { Repeat } from "lucide-react"

import type { ChartConfiguration, HexedVisualization } from "@hexed/worker"
import type { VisualizationPreset } from "../../types"

/**
 * Pure function to calculate autocorrelation and return chart configuration
 * This function runs in the worker context via $task
 */
export const calculateAutocorrelation: HexedVisualization = async (file, api) => {
  // Chunk size for streaming (1MB)
  const STREAM_CHUNK_SIZE = 1024 * 1024
  // Maximum data size to process for autocorrelation (10MB)
  const MAX_AUTOCORRELATION_SIZE = 10 * 1024 * 1024
  // Maximum lag for autocorrelation calculation
  const MAX_LAG = 256

  /**
   * Pure function to calculate autocorrelation from data array
   */
  const calculateAutocorrelationPure = (
    data: Uint8Array,
    maxLag: number = MAX_LAG
  ): number[] => {
    const n = data.length
    if (n < 2) return []

    // Calculate mean
    let sum = 0
    for (let i = 0; i < n; i++) {
      sum += data[i]
    }
    const mean = sum / n

    // Calculate variance (denominator for normalization)
    let variance = 0
    for (let i = 0; i < n; i++) {
      const diff = data[i] - mean
      variance += diff * diff
    }

    if (variance === 0) {
      // All values are the same, return zeros
      return new Array(Math.min(maxLag, n - 1)).fill(0)
    }

    // Calculate autocorrelation for each lag
    const autocorrelations: number[] = []
    const actualMaxLag = Math.min(maxLag, n - 1)

    for (let k = 1; k <= actualMaxLag; k++) {
      let correlation = 0
      const validPairs = n - k

      for (let i = 0; i < validPairs; i++) {
        correlation += (data[i] - mean) * (data[i + k] - mean)
      }

      // Normalize by variance
      autocorrelations.push(correlation / variance)
    }

    return autocorrelations
  }

  const fileSize = file.size
  const endOffset = fileSize
  const searchRange = endOffset
  const maxLag = MAX_LAG

  // Determine if we need to sample the data
  const needsSampling = searchRange > MAX_AUTOCORRELATION_SIZE
  const targetSize = needsSampling ? MAX_AUTOCORRELATION_SIZE : searchRange
  const sampleStep = needsSampling ? Math.floor(searchRange / targetSize) : 1

  // Read and sample data uniformly across the entire range
  const data = new Uint8Array(targetSize)
  let dataIndex = 0
  let bytesRead = 0
  let nextSamplePosition = 0 // Absolute position for next sample

  while (bytesRead < searchRange && dataIndex < targetSize) {
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
        // Find which bytes in this chunk should be sampled
        const chunkStartAbsolute = chunkStart
        const chunkEndAbsolute = chunkEnd

        // Find the first sample position in or after this chunk
        while (
          nextSamplePosition < chunkStartAbsolute &&
          dataIndex < targetSize
        ) {
          nextSamplePosition += sampleStep
        }

        // Sample bytes in this chunk
        while (
          nextSamplePosition >= chunkStartAbsolute &&
          nextSamplePosition < chunkEndAbsolute &&
          dataIndex < targetSize
        ) {
          const offsetInChunk = nextSamplePosition - chunkStartAbsolute
          if (offsetInChunk < chunk.length) {
            data[dataIndex++] = chunk[offsetInChunk]
          }
          nextSamplePosition += sampleStep
        }
      } else {
        // Use all data
        const copyLength = Math.min(chunk.length, targetSize - dataIndex)
        data.set(chunk.subarray(0, copyLength), dataIndex)
        dataIndex += copyLength
      }
    }

    const chunkSize = chunkEnd - chunkStart
    bytesRead += chunkSize

    // Emit progress
    api.emitProgress({ processed: bytesRead, size: searchRange })

    // Yield to event loop to keep UI responsive
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  // Use only the data we actually filled
  const actualData = data.subarray(0, dataIndex)

  // Calculate autocorrelation
  const autocorrelationValues = calculateAutocorrelationPure(actualData, maxLag)

  // Generate lag array
  const lags = Array.from(
    { length: autocorrelationValues.length },
    (_, i) => i + 1
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

export const autocorrelationPreset: VisualizationPreset = {
  id: "autocorrelation",
  title: "Autocorrelation",
  icon: Repeat,
  info: (
    <div className="space-y-2">
      <p>
        This visualization measures{" "}
        <strong>how correlated the data is with itself</strong> at different lag
        offsets. Autocorrelation helps identify repeating patterns, periodic
        structures, encryption, compression, and structured data regions.
      </p>
      <p>
        Autocorrelation is calculated as the correlation between the data and a
        shifted copy of itself. Values range from <strong>-1 to 1</strong>,
        where:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>
          <strong>1</strong> = perfect positive correlation (repeating pattern)
        </li>
        <li>
          <strong>-1</strong> = perfect negative correlation (alternating
          pattern)
        </li>
        <li>
          <strong>0</strong> = no correlation (random data)
        </li>
      </ul>
      <p>
        High autocorrelation at specific lags indicates repeating patterns at
        those offsets. This is commonly used in binary analysis and forensics to
        detect encryption, compression, or structured data formats.
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
  visualization: calculateAutocorrelation
}
