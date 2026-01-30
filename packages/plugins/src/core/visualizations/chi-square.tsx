import { TrendingUp } from "lucide-react"

import type { ChartConfiguration, HexedVisualization } from "@hexed/worker"
import type { VisualizationPreset } from "../../types"

/**
 * Pure function to calculate chi-square and return chart configuration
 * This function runs in the worker context via $task
 */
export const calculateChiSquare: HexedVisualization = async (file, api) => {
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
   * Calculate chi-square statistic for a block of bytes
   * Formula: χ² = Σ((observed - expected)² / expected)
   * Tests how well the byte distribution matches a uniform distribution
   */
  const calculateBlockChiSquare = (
    data: Uint8Array,
    start: number = 0,
    end?: number
  ): number => {
    const blockLength = (end ?? data.length) - start
    if (blockLength === 0) return 0

    // Expected frequency for uniform distribution: blockLength / 256
    const expected = blockLength / 256

    // Count byte frequencies
    const frequencies = new Array(256).fill(0)
    for (let i = start; i < (end ?? data.length); i++) {
      frequencies[data[i]]++
    }

    // Calculate chi-square statistic
    let chiSquare = 0
    for (let i = 0; i < 256; i++) {
      const observed = frequencies[i]
      const diff = observed - expected
      chiSquare += (diff * diff) / expected
    }

    return chiSquare
  }

  const fileSize = file.size
  const endOffset = fileSize
  const searchRange = endOffset

  // Determine block size based on file size
  const blockSize = getBlockSize(searchRange)

  const chiSquareValues: number[] = []
  const offsets: number[] = []

  // For large files (>= 1MB), use efficient chunk-based processing
  // For small files, process in smaller blocks for better visualization
  if (blockSize >= STREAM_CHUNK_SIZE) {
    // Large file: process in 1MB chunks (same pattern as entropy)
    let bytesRead = 0
    while (bytesRead < searchRange) {
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
        // Calculate chi-square for entire chunk
        const chiSquare = calculateBlockChiSquare(chunk)
        chiSquareValues.push(chiSquare)
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
    let currentOffset = 0
    let blocksProcessed = 0

    while (currentOffset < endOffset) {
      api.throwIfAborted()
      const blockEnd = Math.min(currentOffset + blockSize, endOffset)

      // Ensure range is loaded and read block
      await file.ensureRange({ start: currentOffset, end: blockEnd })
      const block = file.readBytes(currentOffset, blockEnd - currentOffset)

      if (block) {
        // Calculate chi-square for this block
        const chiSquare = calculateBlockChiSquare(block)
        chiSquareValues.push(chiSquare)
        offsets.push(currentOffset)
      }

      blocksProcessed++
      currentOffset = blockEnd

      // Emit progress periodically (every 10 blocks or at end)
      if (blocksProcessed % 10 === 0 || currentOffset >= endOffset) {
        api.emitProgress({
          processed: currentOffset,
          size: searchRange
        })
      }

      // Yield to event loop periodically to keep UI responsive
      if (blocksProcessed % 100 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }
  }

  // Create chart configuration
  // Format offsets as hex addresses
  const labels = chiSquareValues.map((_, index) => {
    return file.format.address(offsets[index])
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

export const chiSquarePreset: VisualizationPreset = {
  id: "chi-square",
  title: "Chi-square",
  icon: TrendingUp,
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
  visualization: calculateChiSquare
}
