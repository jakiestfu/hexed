import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { BinarySnapshot } from "@hexed/types"

import { calculateChecksum, createSnapshotFromArrayBuffer } from "../utils"
import { useFileData } from "./use-file-data"
import { useHandleToFile } from "./use-handle-to-file"

/**
 * Hook for watching FileSystemFileHandle files for changes
 * Uses FileSystemObserver API if available, otherwise does not watch
 */
export function useFileHandleWatcher(
  handle: FileSystemFileHandle | null,
  snapshotId?: string | number | null
) {
  const [snapshots, setSnapshots] = useState<BinarySnapshot[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const handleRef = useRef<FileSystemFileHandle | null>(handle)
  const observerRef = useRef<FileSystemObserver | null>(null)
  const snapshotIndexRef = useRef<number>(0)

  // Convert handle to File using the new hook
  const {
    file,
    loading: fileLoading,
    error: fileError
  } = useHandleToFile(handle)

  // Read file data using the new hook
  const { data, loading: dataLoading, error: dataError } = useFileData(file)

  // Track previous handle to detect changes
  const previousHandleRef = useRef<FileSystemFileHandle | null>(null)

  // Update refs when handle changes
  useEffect(() => {
    handleRef.current = handle

    // Reset snapshots when handle changes
    if (previousHandleRef.current !== handle) {
      if (handle === null) {
        setSnapshots([])
        snapshotIndexRef.current = 0
      } else {
        // Reset snapshots when switching to a new handle
        setSnapshots([])
        snapshotIndexRef.current = 0
      }
      previousHandleRef.current = handle
    }
  }, [handle])

  // Create initial snapshot from data when it becomes available
  useEffect(() => {
    if (!data || !file || !handle) {
      return
    }

    // Only create initial snapshot if we don't have any yet
    // Subsequent snapshots will be created by FileSystemObserver
    if (snapshots.length === 0 && snapshotIndexRef.current === 0) {
      const createSnapshot = async () => {
        try {
          const index = snapshotIndexRef.current
          const timestamp = Date.now()
          // Ensure we have an ArrayBuffer (not SharedArrayBuffer)
          // Create a new ArrayBuffer by copying the data
          const arrayBuffer =
            data.buffer instanceof ArrayBuffer
              ? data.buffer
              : new Uint8Array(data).buffer.slice(0)
          const snapshot = createSnapshotFromArrayBuffer(
            arrayBuffer as ArrayBuffer,
            handle.name || "file"
          )
          snapshot.index = index
          snapshot.label = index === 0 ? "Baseline" : `Change ${index}`
          snapshot.id = `${timestamp}-${index}`
          snapshot.filePath = handle.name
          snapshot.md5 = await calculateChecksum(data)

          setSnapshots([snapshot])
          snapshotIndexRef.current++
          setError(null)
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to create snapshot"
          setError(errorMessage)
          console.error("Error creating snapshot:", err)
        }
      }

      createSnapshot()
    }
  }, [data, file, handle, snapshots.length])

  const readAndAddSnapshot = useCallback(async () => {
    // Use refs to get latest values for async operations
    const currentHandle = handleRef.current

    if (!currentHandle) {
      return
    }

    try {
      // Get fresh File object and read data
      const fileObj = await currentHandle.getFile()
      const arrayBuffer = await fileObj.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)

      // Create snapshot from data
      const index = snapshotIndexRef.current
      const timestamp = Date.now()
      const snapshot = createSnapshotFromArrayBuffer(
        arrayBuffer,
        currentHandle.name || "file"
      )
      snapshot.index = index
      snapshot.label = index === 0 ? "Baseline" : `Change ${index}`
      snapshot.id = `${timestamp}-${index}`
      snapshot.filePath = currentHandle.name
      snapshot.md5 = await calculateChecksum(data)

      setSnapshots((prev) => [...prev, snapshot])
      snapshotIndexRef.current++

      setError(null)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to read file"
      setError(errorMessage)

      console.error("Error reading file handle:", err)
    }
  }, [])

  const connect = useCallback(() => {
    // Use the current prop values directly, not refs
    // This ensures we react to prop changes immediately
    if (!handle) {
      setSnapshots([])
      setError(null)
      snapshotIndexRef.current = 0
      setIsConnected(false)
      return
    }
    // Disconnect existing observer
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    // Check if FileSystemObserver is available (experimental API)
    // @ts-expect-error - FileSystemObserver is experimental and may not be in types
    if (typeof FileSystemObserver === "undefined") {
      // FileSystemObserver not available - initial snapshot will be created via useEffect
      setIsConnected(false)
      return
    }
    try {
      // Create FileSystemObserver with callback
      // @ts-expect-error - FileSystemObserver is experimental and may not be in types
      const observer = new FileSystemObserver(
        (records: FileSystemChangeRecord[]) => {
          // When file changes are detected, read and add new snapshot
          if (records && records.length > 0) {
            readAndAddSnapshot()
          }
        }
      )
      // Start observing the file handle
      observer.observe(handle).then(() => {
        observerRef.current = observer
        setIsConnected(true)
      })
    } catch (observerError) {
      console.warn(
        "FileSystemObserver not available or failed to initialize:",
        observerError
      )
      setIsConnected(false)
    }
  }, [handle, readAndAddSnapshot])

  useEffect(() => {
    connect()

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [connect])

  const restart = useCallback(() => {
    connect()
  }, [connect])

  // Combine errors from hooks and watcher
  const combinedError = error || fileError || dataError

  // Find specific snapshot if snapshotId is provided
  const snapshot = useMemo(() => {
    if (snapshotId === null || snapshotId === undefined) {
      return null
    }

    // Try to find by id (string)
    if (typeof snapshotId === "string") {
      return snapshots.find((s) => s.id === snapshotId) || null
    }

    // Try to find by index (number)
    if (typeof snapshotId === "number") {
      return snapshots[snapshotId] || null
    }

    return null
  }, [snapshots, snapshotId])

  return {
    snapshots,
    snapshot,
    isConnected,
    error: combinedError,
    restart
  }
}

// Types for FileSystemObserver (experimental API)
// These may not be in TypeScript types yet
interface FileSystemObserver {
  disconnect(): void
  observe(
    handle: FileSystemFileHandle | FileSystemDirectoryHandle
  ): Promise<void>
}

interface FileSystemChangeRecord {
  changedHandle: FileSystemHandle
  type: "created" | "modified" | "deleted" | "moved"
}
