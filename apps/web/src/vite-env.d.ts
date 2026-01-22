/// <reference types="vite/client" />

/**
 * Type declarations for Vite's worker query suffix
 */
declare module "*?worker" {
  const WorkerConstructor: new () => Worker
  export default WorkerConstructor
}

/**
 * Extend Window interface to include File System Access API methods
 */
interface Window {
  showOpenFilePicker?: (
    options?: OpenFilePickerOptions
  ) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (
    options?: SaveFilePickerOptions
  ) => Promise<FileSystemFileHandle>
  showDirectoryPicker?: (
    options?: DirectoryPickerOptions
  ) => Promise<FileSystemDirectoryHandle>
}

/**
 * Ensure FileSystemFileHandle has permission methods
 * These are part of the WICG File System Access API
 */
interface FileSystemFileHandle {
  queryPermission?(
    descriptor?: FileSystemHandlePermissionDescriptor
  ): Promise<PermissionState>
  requestPermission?(
    descriptor?: FileSystemHandlePermissionDescriptor
  ): Promise<PermissionState>
}
