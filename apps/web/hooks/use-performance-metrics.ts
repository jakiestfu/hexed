"use client"

import { useEffect, useState } from "react"

/**
 * Extended Performance interface for memory API (Chrome/Edge)
 */
interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory
}

/**
 * Performance metrics returned by the hook
 */
export interface PerformanceMetrics {
  usedHeapBytes: number | null
  totalHeapBytes: number | null
  heapLimitBytes: number | null
}

/**
 * Hook for tracking browser memory usage and performance metrics
 * Uses native browser APIs (performance.memory for Chrome/Edge)
 *
 * @param updateInterval - Update interval in milliseconds (default: 2000ms)
 * @returns Performance metrics object with raw byte values
 */
export function usePerformanceMetrics(
  updateInterval: number = 2000
): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    usedHeapBytes: null,
    totalHeapBytes: null,
    heapLimitBytes: null
  })

  useEffect(() => {
    // Check if performance.memory API is available
    const perf = performance as PerformanceWithMemory
    if (!perf.memory) {
      // API not available, return null metrics
      setMetrics({
        usedHeapBytes: null,
        totalHeapBytes: null,
        heapLimitBytes: null
      })
      return
    }

    // Function to update metrics
    const updateMetrics = () => {
      const memory = perf.memory
      if (!memory) {
        setMetrics({
          usedHeapBytes: null,
          totalHeapBytes: null,
          heapLimitBytes: null
        })
        return
      }

      // Return raw byte values
      setMetrics({
        usedHeapBytes: memory.usedJSHeapSize,
        totalHeapBytes: memory.totalJSHeapSize,
        heapLimitBytes: memory.jsHeapSizeLimit
      })
    }

    // Initial update
    updateMetrics()

    // Set up interval for periodic updates
    const intervalId = setInterval(updateMetrics, updateInterval)

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId)
    }
  }, [updateInterval])

  return metrics
}
