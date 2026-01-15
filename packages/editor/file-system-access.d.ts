/**
 * Type declarations for File System Access API methods
 * These methods are part of the spec but not yet in TypeScript's DOM lib types
 */

interface FileSystemHandlePermissionDescriptor {
  mode?: "read" | "readwrite"
}

interface FileSystemFileHandle {
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor
  ): Promise<PermissionState>
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor
  ): Promise<PermissionState>
}

interface FileSystemDirectoryHandle {
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor
  ): Promise<PermissionState>
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor
  ): Promise<PermissionState>
}
