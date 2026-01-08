import { useCallback } from "react";

interface UseSelectionParams {
  selectedOffset?: number | null;
  onSelectedOffsetChange?: (offset: number | null) => void;
}

interface UseSelectionReturn {
  selectedOffset: number | null;
  handleClick: (offset: number | null) => void;
}

/**
 * Hook for managing byte selection state
 * Supports both controlled and uncontrolled modes
 */
export function useSelection({
  selectedOffset: propSelectedOffset,
  onSelectedOffsetChange,
}: UseSelectionParams): UseSelectionReturn {
  const selectedOffset = propSelectedOffset ?? null;

  const handleClick = useCallback(
    (offset: number | null) => {
      if (onSelectedOffsetChange) {
        onSelectedOffsetChange(offset);
      }
    },
    [onSelectedOffsetChange]
  );

  return {
    selectedOffset,
    handleClick,
  };
}
