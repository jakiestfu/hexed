// Type definitions for Electron API exposed via preload script
interface ElectronAPI {
  openFileDialog: () => Promise<string | null>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

/**
 * Checks if the app is running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== "undefined" && window.electron !== undefined;
}

/**
 * Opens a native file picker dialog (only works in Electron)
 * @returns Promise resolving to the selected file path, or null if cancelled
 */
export async function openFileDialog(): Promise<string | null> {
  if (!isElectron() || !window.electron) {
    throw new Error("File dialog is only available in Electron");
  }
  return window.electron.openFileDialog();
}

