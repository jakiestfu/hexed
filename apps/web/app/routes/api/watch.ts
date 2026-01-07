import { createAPIFileRoute } from '@tanstack/start/api';
import * as chokidar from 'chokidar';
import { readBinaryFile } from '@binspector/binary-utils';
import { createStorageAdapter } from '@binspector/binary-utils';
import type { BinarySnapshot, SSEMessage } from '@binspector/types';

export const Route = createAPIFileRoute('/api/watch')({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const filePath = url.searchParams.get('file');

    if (!filePath) {
      return new Response('File path is required', { status: 400 });
    }

    // Set up SSE
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const storage = createStorageAdapter('memory');
        let snapshotIndex = 0;

        const sendMessage = (message: SSEMessage) => {
          const data = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        // Send connected message
        sendMessage({
          type: 'connected',
          timestamp: Date.now(),
        });

        // Read initial file
        const processFile = async () => {
          try {
            const data = await readBinaryFile(filePath);
            const snapshot: BinarySnapshot = {
              id: `${Date.now()}-${snapshotIndex}`,
              filePath,
              data,
              timestamp: Date.now(),
              index: snapshotIndex,
              label: snapshotIndex === 0 ? 'Baseline' : `Change ${snapshotIndex}`,
            };

            await storage.save(filePath, snapshot);
            snapshotIndex++;

            // Convert Uint8Array to regular array for JSON serialization
            const serializableSnapshot = {
              ...snapshot,
              data: Array.from(snapshot.data),
            };

            sendMessage({
              type: 'snapshot',
              data: serializableSnapshot as any,
              timestamp: Date.now(),
            });
          } catch (error) {
            sendMessage({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: Date.now(),
            });
          }
        };

        // Process initial file
        processFile();

        // Watch for changes
        const watcher = chokidar.watch(filePath, {
          persistent: true,
          ignoreInitial: true,
        });

        watcher.on('change', () => {
          processFile();
        });

        watcher.on('error', (error) => {
          sendMessage({
            type: 'error',
            error: error.message,
            timestamp: Date.now(),
          });
        });

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          watcher.close();
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  },
});

