/**
 * Detects if the current platform is macOS
 */
function isMac(): boolean {
  if (typeof window === "undefined") return false;
  return (
    navigator.platform.toUpperCase().indexOf("MAC") >= 0 ||
    navigator.userAgent.toUpperCase().indexOf("MAC") >= 0
  );
}

/**
 * Formats a keyboard shortcut for display, using platform-appropriate modifiers
 * @param keys - Array of keys (e.g., ["shift", "a"] or ["ctrl", "shift", "h"])
 * @returns Formatted string like "⌘⇧A" (Mac) or "Ctrl+Shift+A" (Windows/Linux)
 */
export function formatHotkey(keys: string[]): string {
  const isMacPlatform = isMac();
  const formatted: string[] = [];

  for (const key of keys) {
    const lowerKey = key.toLowerCase();

    if (isMacPlatform) {
      // Mac formatting
      switch (lowerKey) {
        case "meta":
        case "cmd":
          formatted.push("⌘");
          break;
        case "ctrl":
          formatted.push("⌃");
          break;
        case "alt":
          formatted.push("⌥");
          break;
        case "shift":
          formatted.push("⇧");
          break;
        default:
          formatted.push(key.toUpperCase());
      }
    } else {
      // Windows/Linux formatting
      switch (lowerKey) {
        case "meta":
        case "cmd":
          formatted.push("Ctrl");
          break;
        case "ctrl":
          formatted.push("Ctrl");
          break;
        case "alt":
          formatted.push("Alt");
          break;
        case "shift":
          formatted.push("Shift");
          break;
        default:
          formatted.push(key.toUpperCase());
      }
    }
  }

  return isMacPlatform ? formatted.join("") : formatted.join("+");
}

/**
 * Predefined hotkey formatters for common shortcuts
 */
export const Hotkeys = {
  toggleAscii: () => formatHotkey(["meta", "shift", "a"]),
  toggleChecksums: () => formatHotkey(["meta", "shift", "c"]),
  toggleHistogram: () => formatHotkey(["meta", "shift", "h"]),
  toggleInterpreter: () => formatHotkey(["meta", "1"]),
  toggleTemplates: () => formatHotkey(["meta", "2"]),
  toggleStrings: () => formatHotkey(["meta", "3"]),
  toggleSidebarPosition: () => formatHotkey(["meta", "shift", "p"]),
} as const;
