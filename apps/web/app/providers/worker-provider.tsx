"use client";

import { createContext, useContext } from "react";
import { useWorkerClient } from "~/hooks/use-worker-client";
import type { WorkerClient } from "@hexed/worker";

/**
 * Context for the worker client
 */
const WorkerClientContext = createContext<WorkerClient | null>(null);

/**
 * Provider component that initializes the worker client and makes it available via context
 */
export function WorkerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const workerClient = useWorkerClient();

  return (
    <WorkerClientContext.Provider value={workerClient}>
      {children}
    </WorkerClientContext.Provider>
  );
}

/**
 * Hook to access the worker client from context
 * @throws Error if used outside WorkerProvider
 */
export function useWorkerClientContext(): WorkerClient | null {
  const context = useContext(WorkerClientContext);
  
  // Return null if context is not available (allows graceful fallback)
  // Components can check for null and create their own client if needed
  return context;
}
