import { useEffect, useRef, useState } from "react"

import { createWorkerClient, type WorkerClient } from "@hexed/worker"

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

  // Resolve worker URL
  // For Worker, we need a URL string that Vite can resolve
  // In dev, Vite will transform and serve the worker file
  // In production, Vite will bundle it
  let workerUrl: string | URL

  if (import.meta.env.DEV) {
    // In dev, use the worker file path - Vite dev server will handle it
    // The worker.ts file imports the actual worker code
    workerUrl = new URL("./worker.ts", import.meta.url)
  } else {
    // In production, reference the bundled worker
    // Vite will output it with a hash, but we can reference it by base name
    // Note: This may need adjustment based on actual build output
    workerUrl = new URL("/worker.js", window.location.origin)
  }

  globalWorkerClient = createWorkerClient(workerUrl)
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
