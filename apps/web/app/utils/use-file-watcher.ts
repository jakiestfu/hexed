import { useState, useEffect, useRef } from 'react';
import type { BinarySnapshot, SSEMessage } from '@binspector/types';

export function useFileWatcher(filePath: string | null) {
  const [snapshots, setSnapshots] = useState<BinarySnapshot[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!filePath) {
      setSnapshots([]);
      setIsConnected(false);
      setError(null);
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Reset state
    setSnapshots([]);
    setError(null);

    // Create new SSE connection
    const url = `/api/watch?file=${encodeURIComponent(filePath)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'connected':
            setIsConnected(true);
            break;

          case 'snapshot':
            if (message.data) {
              // Convert array back to Uint8Array
              const snapshot: BinarySnapshot = {
                ...message.data,
                data: new Uint8Array(message.data.data as any),
              };
              setSnapshots((prev) => [...prev, snapshot]);
            }
            break;

          case 'error':
            setError(message.error || 'Unknown error');
            break;

          case 'disconnected':
            setIsConnected(false);
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Connection lost');
    };

    // Cleanup
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [filePath]);

  return { snapshots, isConnected, error };
}

