/**
 * Worker URL utility for resolving Worker path
 */

/**
 * Get the worker URL for the Worker
 * Uses Vite's import.meta.url to resolve the worker module
 */
export function getWorkerUrl(): string | URL {
  // In development, Vite will handle the worker import
  // In production, the worker will be bundled and served as a static asset
  // We use a dynamic import to let Vite handle the bundling
  if (import.meta.env.DEV) {
    // Development: Use the worker source directly
    return new URL("@hexed/worker/worker", import.meta.url)
  } else {
    // Production: Worker will be bundled and available at /worker.js
    // Vite will handle the path resolution during build
    return new URL("/worker.js", window.location.origin)
  }
}

/**
 * Create a worker URL that works in both dev and production
 * This uses Vite's worker import syntax
 */
export async function createWorkerUrl(): Promise<string | URL> {
  // For Worker, we need a URL string
  // Vite will handle bundling the worker separately
  if (import.meta.env.DEV) {
    // In dev, use the worker source path
    // Vite will transform this during dev server
    return new URL("@hexed/worker/worker", import.meta.url)
  }

  // In production, the worker will be at a known path
  return "/worker.js"
}
