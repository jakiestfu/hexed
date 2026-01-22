/// <reference types="vite/client" />

/**
 * Type declarations for Vite's worker query suffix
 */
declare module "*?worker" {
  const WorkerConstructor: new () => Worker
  export default WorkerConstructor
}

/**
 * Type declaration for @hexed/worker/worker?worker import
 */
declare module "@hexed/worker/worker?worker" {
  const WorkerConstructor: new () => Worker
  export default WorkerConstructor
}
