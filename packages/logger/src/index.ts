/// <reference types="vite/types/importMeta.d.ts" />

/**
 * Check if we're in development mode
 * Supports both Vite (import.meta.env.DEV) and Node.js (process.env.NODE_ENV)
 */
function isDevMode(): boolean {
  // Vite environment (browser)
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    return true
  }
  // Node.js environment
  // if (
  //   typeof process !== "undefined" &&
  //   process.env?.NODE_ENV !== "production"
  // ) {
  //   return true
  // }
  return false
}

/**
 * Logger interface
 */
export interface Logger {
  log: (...args: unknown[]) => void
}

/**
 * Create a logger with a context prefix
 * @param context - The context name to prefix logs with (e.g., "worker")
 * @returns A logger object with a log method
 *
 * @example
 * const logger = createLogger("worker");
 * logger.log("Hello"); // [worker] Hello (only in dev mode)
 */
export function createLogger(context: string): Logger {
  const isDev = isDevMode()
  const prefix = `[${context}]`

  return {
    log: (...args: unknown[]) => {
      if (isDev) {
        console.log(prefix, ...args)
      }
    }
  }
}
