import { Activity } from "lucide-react"

import { createHexedEditorPlugin } from "../.."
import type { ChartCalculationFunction } from "../../types"
import type { ChartConfiguration, EvaluateAPI } from "@hexed/worker"
import { formatAddress, HexedFile } from "@hexed/file"

/**
 * Pure function to calculate entropy
 * This function runs in the worker context via $evaluate
 */
const calculateEntropyImpl: EvaluateAPI<
  { entropyValues: number[]; offsets: number[]; blockSize: number },
  { startOffset?: number; endOffset?: number; blockSize?: number }
> = async (hexedFile, api) => {
  // Chunk size for streaming (1MB)
  const STREAM_CHUNK_SIZE = 1024 * 1024
  // Block size calculation constants
  const TARGET_POINTS = 512
  const MIN_BLOCK = 32
  const MAX_BLOCK = 1024 * 1024

  /**
   * Determine optimal block size based on file size for block-based calculations
   * Smaller files use smaller blocks to get more data points for visualization
   */
  const getBlockSize = (fileSize: number): number => {
    const raw = Math.floor(fileSize / TARGET_POINTS)

    // round to nice powers of two
    const pow2 = Math.pow(2, Math.round(Math.log2(raw)))

    return Math.max(MIN_BLOCK, Math.min(pow2, MAX_BLOCK))
  }

  /**
   * Calculate entropy for a block of data using Shannon entropy formula
   */
  const calculateBlockEntropy = (
    data: Uint8Array,
    start: number = 0,
    end?: number
  ): number => {
    const blockLength = (end ?? data.length) - start
    if (blockLength === 0) return 0

    // Count byte frequencies
    const frequencies = new Array(256).fill(0)
    for (let i = start; i < (end ?? data.length); i++) {
      frequencies[data[i]]++
    }

    // Calculate entropy
    let entropy = 0
    for (let i = 0; i < 256; i++) {
      if (frequencies[i] > 0) {
        const probability = frequencies[i] / blockLength
        entropy -= probability * Math.log2(probability)
      }
    }

    return entropy
  }

  const fileSize = hexedFile.size
  const startOffset = api.context?.startOffset ?? 0
  const endOffset = api.context?.endOffset ?? fileSize
  const searchRange = endOffset - startOffset

  // Determine block size based on file size (or use provided blockSize)
  const blockSize = api.context?.blockSize ?? getBlockSize(searchRange)

  const entropyValues: number[] = []
  const offsets: number[] = []

  // For large files (>= 1MB), use efficient chunk-based processing
  // For small files, process in smaller blocks for better visualization
  if (blockSize >= STREAM_CHUNK_SIZE) {
    // Large file: process in 1MB chunks (same pattern as byte frequency)
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
        // Calculate entropy for entire chunk
        const entropy = calculateBlockEntropy(chunk)
        entropyValues.push(entropy)
        offsets.push(chunkStart)
      }

      const chunkSize = chunkEnd - chunkStart
      bytesRead += chunkSize

      // Emit progress
      api.emitProgress({ processed: bytesRead, size: searchRange })

      // Yield to event loop to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  } else {
    // Small file: process in smaller blocks for better visualization
    let currentOffset = startOffset
    let blocksProcessed = 0

    while (currentOffset < endOffset) {
      api.throwIfAborted()
      const blockEnd = Math.min(currentOffset + blockSize, endOffset)

      // Ensure range is loaded and read block
      await hexedFile.ensureRange({ start: currentOffset, end: blockEnd })
      const block = hexedFile.readBytes(currentOffset, blockEnd - currentOffset)

      if (block) {
        // Calculate entropy for this block
        const entropy = calculateBlockEntropy(block)
        entropyValues.push(entropy)
        offsets.push(currentOffset)
      }

      blocksProcessed++
      currentOffset = blockEnd

      // Emit progress periodically (every 10 blocks or at end)
      if (blocksProcessed % 10 === 0 || currentOffset >= endOffset) {
        api.emitProgress({
          processed: currentOffset - startOffset,
          size: searchRange
        })
      }

      // Yield to event loop periodically to keep UI responsive
      if (blocksProcessed % 100 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }
  }

  return { entropyValues, offsets, blockSize }
}

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
  // Calculate entropy using $evaluate
  const { entropyValues, offsets, blockSize } = await workerClient.$evaluate(
    file,
    calculateEntropyImpl,
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
