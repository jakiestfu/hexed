import * as React from "react"

import { createLogger } from "@hexed/logger"
import { createWorkerClient, type WorkerClient } from "@hexed/worker"

import WorkerConstructor from "../worker"

const logger = createLogger("worker-provider")

/**
 * Context for the worker client
 */
const WorkerContext = React.createContext<WorkerClient | null>(null)

/**
 * Provider component that initializes and provides the worker client
 * The client is initialized once at the root and shared via context
 */
export function WorkerProvider({ children }: { children: React.ReactNode }) {
  const clientRef = React.useRef<WorkerClient | null>(null)
  const [client, setClient] = React.useState<WorkerClient | null>(null)

  React.useEffect(() => {
    // Initialize worker client once on mount
    if (!clientRef.current) {
      logger.log("Initializing worker client")
      try {
        const workerClient = createWorkerClient(WorkerConstructor)
        clientRef.current = workerClient
        setClient(workerClient)
        logger.log("Worker client initialized successfully")
      } catch (error) {
        logger.log("Failed to initialize worker client:", error)
        setClient(null)
      }
    }

    // Cleanup: disconnect worker on unmount
    return () => {
      if (clientRef.current) {
        logger.log("Disconnecting worker client")
        clientRef.current.disconnect()
        clientRef.current = null
        setClient(null)
      }
    }
  }, [])

  return (
    <WorkerContext.Provider value={client}>{children}</WorkerContext.Provider>
  )
}

/**
 * Hook to access the worker client from context
 * Returns the worker client instance or null if not initialized
 */
export function useWorkerClient(): WorkerClient | null {
  const client = React.useContext(WorkerContext)
  return client
}
