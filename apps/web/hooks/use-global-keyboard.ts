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
  /** Callback to toggle ASCII visibility */
  onToggleAscii?: () => void;
  /** Callback to toggle checksums visibility */
  onToggleChecksums?: () => void;
  /** Callback to toggle histogram dialog */
  onToggleHistogram?: () => void;
  /** Callback to toggle interpreter sidebar */
  onToggleInterpreter?: () => void;
  /** Callback to toggle templates sidebar */
  onToggleTemplates?: () => void;
  /** Callback to toggle strings sidebar */
  onToggleStrings?: () => void;
  /** Callback to toggle sidebar position */
  onToggleSidebarPosition?: () => void;
}

/**
 * Hook for handling global keyboard shortcuts in the hex editor
 * - Ctrl+C/meta+C: Copy selected bytes as hex string
 * - Escape: Cascading logic (close find input → close sidebars → deselect)
 * - Ctrl+F/meta+F: Toggle search input
 * - Ctrl+Shift+A/meta+Shift+A: Toggle ASCII visibility
 * - Ctrl+Shift+C/meta+Shift+C: Toggle checksums visibility
 * - Ctrl+Shift+H/meta+Shift+H: Toggle histogram dialog
 * - Ctrl+1/meta+1: Toggle interpreter sidebar
 * - Ctrl+2/meta+2: Toggle templates sidebar
 * - Ctrl+3/meta+3: Toggle strings sidebar
 * - Ctrl+Shift+P/meta+Shift+P: Toggle sidebar position
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
  onToggleAscii,
  onToggleChecksums,
  onToggleHistogram,
  onToggleInterpreter,
  onToggleTemplates,
  onToggleStrings,
  onToggleSidebarPosition,
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

  // Toggle ASCII: Ctrl+Shift+A or meta+Shift+A
  useHotkeys(
    "ctrl+shift+a, meta+shift+a",
    (event) => {
      if (isTypingInInput()) return;
      if (!onToggleAscii) return;

      event.preventDefault();
      onToggleAscii();
    },
    {
      enabled: isClient && !!onToggleAscii,
      enableOnFormTags: false,
    },
    [isClient, onToggleAscii, isTypingInInput]
  );

  // Toggle checksums: Ctrl+Shift+C or meta+Shift+C
  useHotkeys(
    "ctrl+shift+c, meta+shift+c",
    (event) => {
      if (isTypingInInput()) return;
      if (!onToggleChecksums) return;

      event.preventDefault();
      onToggleChecksums();
    },
    {
      enabled: isClient && !!onToggleChecksums,
      enableOnFormTags: false,
    },
    [isClient, onToggleChecksums, isTypingInInput]
  );

  // Toggle histogram: Ctrl+Shift+H or meta+Shift+H
  useHotkeys(
    "ctrl+shift+h, meta+shift+h",
    (event) => {
      if (isTypingInInput()) return;
      if (!onToggleHistogram) return;

      event.preventDefault();
      onToggleHistogram();
    },
    {
      enabled: isClient && !!onToggleHistogram,
      enableOnFormTags: false,
    },
    [isClient, onToggleHistogram, isTypingInInput]
  );

  // Toggle interpreter: Ctrl+1 or meta+1
  useHotkeys(
    "ctrl+1, meta+1",
    (event) => {
      if (isTypingInInput()) return;
      if (!onToggleInterpreter) return;

      event.preventDefault();
      onToggleInterpreter();
    },
    {
      enabled: isClient && !!onToggleInterpreter,
      enableOnFormTags: false,
    },
    [isClient, onToggleInterpreter, isTypingInInput]
  );

  // Toggle templates: Ctrl+2 or meta+2
  useHotkeys(
    "ctrl+2, meta+2",
    (event) => {
      if (isTypingInInput()) return;
      if (!onToggleTemplates) return;

      event.preventDefault();
      onToggleTemplates();
    },
    {
      enabled: isClient && !!onToggleTemplates,
      enableOnFormTags: false,
    },
    [isClient, onToggleTemplates, isTypingInInput]
  );

  // Toggle strings: Ctrl+3 or meta+3
  useHotkeys(
    "ctrl+3, meta+3",
    (event) => {
      if (isTypingInInput()) return;
      if (!onToggleStrings) return;

      event.preventDefault();
      onToggleStrings();
    },
    {
      enabled: isClient && !!onToggleStrings,
      enableOnFormTags: false,
    },
    [isClient, onToggleStrings, isTypingInInput]
  );

  // Toggle sidebar position: Ctrl+Shift+P or meta+Shift+P
  useHotkeys(
    "ctrl+shift+p, meta+shift+p",
    (event) => {
      if (isTypingInInput()) return;
      if (!onToggleSidebarPosition) return;

      event.preventDefault();
      onToggleSidebarPosition();
    },
    {
      enabled: isClient && !!onToggleSidebarPosition,
      enableOnFormTags: false,
    },
    [isClient, onToggleSidebarPosition, isTypingInInput]
  );
}
