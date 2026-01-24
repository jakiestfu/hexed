export const supportsFileSystemAccess = () =>
  typeof window !== "undefined" && "showOpenFilePicker" in window