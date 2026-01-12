import { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toHexString } from "@hexed/binary-utils/formatter";

export interface UseGlobalKeyboardOptions {
  /** Current selection range */
  selectedOffsetRange: { start: number; end: number } | null;
  /** Current snapshot data */
  data: Uint8Array;
  /** Whether search input is visible */
  showSearch: boolean;
  /** Whether interpreter sidebar is visible */
  showInterpreter: boolean;
  /** Whether templates sidebar is visible */
  showTemplates: boolean;
  /** Whether strings sidebar is visible */
  showStrings: boolean;
  /** Callback to toggle search input */
  onToggleSearch: () => void;
  /** Callback to close search input */
  onCloseSearch: () => void;
  /** Callback to close all sidebars */
  onCloseSidebars: () => void;
  /** Callback to deselect bytes */
  onDeselectBytes: () => void;
  /** Optional callback when bytes are copied (for notifications, etc.) */
  onCopy?: (hexString: string) => void;
}

/**
 * Hook for handling global keyboard shortcuts in the hex editor
 * - Ctrl+C/meta+C: Copy selected bytes as hex string
 * - Escape: Cascading logic (close find input → close sidebars → deselect)
 * - Ctrl+F/meta+F: Toggle search input
 */
export function useGlobalKeyboard({
  selectedOffsetRange,
  data,
  showSearch,
  showInterpreter,
  showTemplates,
  showStrings,
  onToggleSearch,
  onCloseSearch,
  onCloseSidebars,
  onDeselectBytes,
  onCopy,
}: UseGlobalKeyboardOptions): void {
  // Ensure we're on the client side
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * Check if user is currently typing in an input field
   */
  const isTypingInInput = useCallback((): boolean => {
    // Check if we're in a browser environment (Next.js SSR)
    if (!isClient || typeof document === "undefined") {
      return false;
    }

    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName;
    const isContentEditable =
      activeElement.getAttribute("contenteditable") === "true";

    return tagName === "INPUT" || tagName === "TEXTAREA" || isContentEditable;
  }, [isClient]);

  /**
   * Copy selected bytes to clipboard as hex string
   */
  const handleCopyBytes = useCallback((): void => {
    // Check if we're in a browser environment (Next.js SSR)
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    if (!selectedOffsetRange || data.length === 0) return;

    try {
      const start = Math.min(
        selectedOffsetRange.start,
        selectedOffsetRange.end
      );
      const end = Math.max(selectedOffsetRange.start, selectedOffsetRange.end);

      // Ensure indices are within bounds
      const clampedStart = Math.max(0, Math.min(start, data.length - 1));
      const clampedEnd = Math.max(0, Math.min(end, data.length - 1));

      if (clampedStart > clampedEnd) return;

      // Extract bytes and format as hex string
      const selectedBytes = data.slice(clampedStart, clampedEnd + 1);
      const hexString = toHexString(selectedBytes, " ");

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hexString).then(() => {
          onCopy?.(hexString);
        });
      }
    } catch (error) {
      // Silently fail if clipboard API is not available or permission denied
      console.error("Failed to copy bytes to clipboard:", error);
    }
  }, [selectedOffsetRange, data, onCopy]);

  /**
   * Handle cascading Escape key logic
   * Priority: find input → sidebars → deselect bytes
   */
  const handleEscape = useCallback((): void => {
    if (showSearch) {
      // First priority: close find input
      onCloseSearch();
    } else if (showInterpreter || showTemplates || showStrings) {
      // Second priority: close sidebars
      onCloseSidebars();
    } else if (selectedOffsetRange !== null) {
      // Third priority: deselect bytes
      onDeselectBytes();
    }
  }, [
    showSearch,
    showInterpreter,
    showTemplates,
    showStrings,
    selectedOffsetRange,
    onCloseSearch,
    onCloseSidebars,
    onDeselectBytes,
  ]);

  // Copy shortcut: Ctrl+C or meta+C
  useHotkeys(
    "ctrl+c, meta+c",
    (event) => {
      // Don't interfere if user is typing in an input
      if (isTypingInInput()) return;

      // Only copy if there's a selection
      if (selectedOffsetRange !== null) {
        event.preventDefault();
        handleCopyBytes();
      }
    },
    {
      enabled: isClient && selectedOffsetRange !== null,
      enableOnFormTags: false,
    },
    [isClient, selectedOffsetRange, handleCopyBytes, isTypingInInput]
  );

  // Escape key: Cascading logic
  useHotkeys(
    "esc",
    (event) => {
      // Don't interfere if user is typing in an input (let input handle its own Escape)
      if (isTypingInInput()) return;

      event.preventDefault();
      handleEscape();
    },
    {
      enabled:
        isClient &&
        (showSearch ||
          showInterpreter ||
          showTemplates ||
          showStrings ||
          selectedOffsetRange !== null),
      enableOnFormTags: false,
    },
    [isClient, handleEscape, isTypingInInput]
  );

  // Toggle search: Ctrl+F or meta+F
  useHotkeys(
    "ctrl+f, meta+f",
    (event) => {
      console.log("toggle search");
      // Don't interfere if user is typing in an input
      if (isTypingInInput()) return;

      event.preventDefault();
      onToggleSearch();
    },
    {
      enabled: isClient,
      enableOnFormTags: false,
    },
    [isClient, onToggleSearch, isTypingInInput]
  );
}
