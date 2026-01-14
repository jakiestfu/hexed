/// <reference types="vite/client" />

/**
 * Type declarations for Vite's worker query suffix
 */
declare module "*?worker" {
  const WorkerConstructor: new () => Worker;
  export default WorkerConstructor;
}
