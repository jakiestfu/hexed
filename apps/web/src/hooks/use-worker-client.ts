import { useEffect, useRef, useState } from "react"

import { createWorkerClient, type WorkerClient } from "@hexed/worker"

import WorkerConstructor from "../worker"

/**
 * Hook to get a singleton worker client instance
 * The worker client is shared across all components using this hook
 */
let globalWorkerClient: WorkerClient | null = null

/**
 * Get or create the global worker client
 */
function getWorkerClient(): WorkerClient {
  if (globalWorkerClient) {
    return globalWorkerClient
  }

  // Use Vite's worker constructor from query suffix import
  // Vite handles bundling and module type automatically
  globalWorkerClient = createWorkerClient(WorkerConstructor)
  return globalWorkerClient
}

/**
 * React hook to access the worker client
 * Returns the singleton worker client instance
 */
export function useWorkerClient(): WorkerClient | null {
  const [client, setClient] = useState<WorkerClient | null>(null)
  const clientRef = useRef<WorkerClient | null>(null)

  useEffect(() => {
    // Initialize worker client on mount
    try {
      const workerClient = getWorkerClient()
      clientRef.current = workerClient
      setClient(workerClient)
    } catch (error) {
      console.error("Failed to initialize worker client:", error)
      setClient(null)
    }

    // Cleanup: Don't disconnect the global client as it's shared
    // The client will be reused across component mounts/unmounts
    return () => {
      // No cleanup needed for shared client
    }
  }, [])

  return client
}
