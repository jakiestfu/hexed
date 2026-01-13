/**
 * Hook for managing virtual data providers
 * Handles both full data (BinarySnapshot) and virtual data (FileSystemFileHandle)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { BinarySnapshot } from "@hexed/types";
import { createWorkerClient, type WorkerClient } from "@hexed/worker";
import type { VirtualDataProvider } from "~/components/hex-editor/virtual-data-provider";
import { FullDataProvider } from "~/components/hex-editor/virtual-data-provider";
import { WorkerDataProvider } from "~/components/hex-editor/worker-data-provider";

export type VirtualDataInput =
  | { type: "snapshot"; snapshot: BinarySnapshot }
  | { type: "fileHandle"; fileHandle: FileSystemFileHandle; fileId: string };

/**
 * Get the worker URL for the SharedWorker
 * Uses the worker file from public/workers/worker.js
 */
async function getWorkerUrl(): Promise<string | URL> {
  if (typeof window === "undefined") {
    // SSR fallback - shouldn't happen but TypeScript needs it
    return "/workers/worker.js";
  }

  // The worker is built by packages/worker and copied to public/workers/worker.js
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${basePath}/workers/worker.js`;
}

/**
 * Hook for managing virtual data provider
 */
export function useVirtualData(
  input: VirtualDataInput | null
): VirtualDataProvider | null {
  const [provider, setProvider] = useState<VirtualDataProvider | null>(null);
  const workerClientRef = useRef<WorkerClient | null>(null);
  const workerDataProviderRef = useRef<WorkerDataProvider | null>(null);

  // Initialize provider based on input type
  useEffect(() => {
    if (!input) {
      setProvider(null);
      return;
    }

    if (input.type === "snapshot") {
      // Use full data provider for snapshots
      const fullProvider = new FullDataProvider(input.snapshot.data);
      setProvider(fullProvider);
      return;
    }

    // For FileSystemFileHandle, use worker provider
    if (input.type === "fileHandle") {
      const initializeWorkerProvider = async () => {
        try {
          // Create or reuse worker client
          if (!workerClientRef.current) {
            const workerUrl = await getWorkerUrl();
            workerClientRef.current = createWorkerClient(workerUrl);
          }

          // Open file in worker
          await workerClientRef.current.openFile(
            input.fileId,
            input.fileHandle
          );

          // Create worker data provider
          const workerProvider = new WorkerDataProvider(
            workerClientRef.current,
            input.fileId
          );

          // Initialize (get file size)
          await workerProvider.initialize();

          workerDataProviderRef.current = workerProvider;
          setProvider(workerProvider);
        } catch (error) {
          console.error("Failed to initialize worker provider:", error);
          // Fallback: try to read file and create full provider
          try {
            const file = await input.fileHandle.getFile();
            const arrayBuffer = await file.arrayBuffer();
            const fullProvider = new FullDataProvider(
              new Uint8Array(arrayBuffer)
            );
            setProvider(fullProvider);
          } catch (fallbackError) {
            console.error("Failed to create fallback provider:", fallbackError);
            setProvider(null);
          }
        }
      };

      initializeWorkerProvider();
    }
  }, [input]);

  // Cleanup on unmount or input change
  useEffect(() => {
    return () => {
      // Cleanup worker data provider
      if (workerDataProviderRef.current) {
        workerDataProviderRef.current.cleanup().catch(console.error);
        workerDataProviderRef.current = null;
      }

      // Note: We don't close the worker client here as it might be shared
      // The worker client should be closed at a higher level if needed
    };
  }, [input]);

  return provider;
}

/**
 * Hook for closing a file in the worker
 * Should be called when switching files or unmounting
 */
export function useWorkerFileCleanup(
  fileId: string | null,
  workerClient: WorkerClient | null
) {
  const cleanup = useCallback(async () => {
    if (fileId && workerClient) {
      try {
        await workerClient.closeFile(fileId);
      } catch (error) {
        console.error("Failed to close file in worker:", error);
      }
    }
  }, [fileId, workerClient]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
}
