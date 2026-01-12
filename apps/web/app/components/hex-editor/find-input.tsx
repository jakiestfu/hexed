"use client";

import { useState, useRef, useEffect } from "react";
import type { FunctionComponent, RefObject } from "react";
import {
  Button,
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@hexed/ui";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { searchHexAll, searchTextAll } from "@hexed/binary-utils/search";
import { useHexInput } from "~/hooks/use-hex-input";
import { useLocalStorage } from "~/hooks/use-local-storage";

export type FindInputProps = {
  data: Uint8Array;
  onMatchFound?: (offset: number, length: number) => void;
  onClose?: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
};

export const FindInput: FunctionComponent<FindInputProps> = ({
  data,
  onMatchFound,
  onClose,
  inputRef: externalInputRef,
}) => {
  const [searchMode, setSearchMode] = useLocalStorage<"hex" | "text">(
    "hexed:find-input-mode",
    "text"
  );
  const [matches, setMatches] = useState<
    Array<{ offset: number; length: number }>
  >([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const onMatchFoundRef = useRef(onMatchFound);

  // Use the hex input hook for formatted input
  const {
    value: searchQuery,
    bytes,
    handleChange,
    handleKeyDown: handleHexKeyDown,
    handlePaste,
    clear,
  } = useHexInput({
    mode: searchMode,
    setMode: setSearchMode,
    onChange: () => {
      // Search will be triggered by useEffect watching searchQuery
    },
  });

  // Keep ref updated with latest callback
  useEffect(() => {
    onMatchFoundRef.current = onMatchFound;
  }, [onMatchFound]);

  // Find all matches when query or mode changes
  useEffect(() => {
    if (!searchQuery.trim() || data.length === 0 || bytes.length === 0) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    let allMatches: Array<{ offset: number; length: number }> = [];

    if (searchMode === "hex") {
      // Use the formatted hex string from the hook
      allMatches = searchHexAll(data, searchQuery);
    } else {
      // For text mode, use the hook's value directly (already converted to text)
      allMatches = searchTextAll(data, searchQuery);
    }

    setMatches(allMatches);
    setCurrentMatchIndex(0);

    // Highlight first match if available
    if (allMatches.length > 0) {
      onMatchFoundRef.current?.(allMatches[0].offset, allMatches[0].length);
    }
  }, [searchQuery, searchMode, data, bytes]);

  // Navigate to match at current index
  useEffect(() => {
    if (
      matches.length > 0 &&
      currentMatchIndex >= 0 &&
      currentMatchIndex < matches.length
    ) {
      const match = matches[currentMatchIndex];
      onMatchFoundRef.current?.(match.offset, match.length);
    }
  }, [currentMatchIndex, matches]);

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
  };

  const handlePrevious = () => {
    if (matches.length === 0) return;
    const prevIndex =
      currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter and Escape before the hex hook processes them
    if (event.key === "Enter") {
      event.preventDefault();
      if (matches.length > 0) {
        // Cycle to next match, wrapping around
        handleNext();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clear();
      setMatches([]);
      setCurrentMatchIndex(0);
      inputRef.current?.blur();
      onClose?.();
      return;
    }

    // Let the hex input hook handle its own keys
    handleHexKeyDown(event);
  };

  const handleClose = () => {
    clear();
    setMatches([]);
    setCurrentMatchIndex(0);
    inputRef.current?.blur();
    onClose?.();
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <InputGroup className="flex-1">
        <InputGroupAddon align="inline-start">
          <InputGroupButton
            variant="ghost"
            className={cn(
              "w-12",
              searchMode === "text"
                ? "bg-sky-100 text-sky-600 hover:bg-sky-200 hover:text-sky-700"
                : "bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700"
            )}
            onClick={() => {
              setSearchMode(searchMode === "hex" ? "text" : "hex");
            }}
          >
            {searchMode === "text" ? "Text" : "Hex"}
          </InputGroupButton>
          <Search className="h-4 w-4" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          placeholder={
            searchMode === "hex" ? "Search hex..." : "Search text..."
          }
          value={searchQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className={cn(searchMode === "hex" ? "font-mono" : "")}
        />
        <InputGroupAddon align="inline-end">
          <div className="flex items-center gap-1">
            {matches.length > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  disabled={matches.length === 0}
                  className="h-6 w-6"
                  aria-label="Previous match"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[80px] text-center">
                  {currentMatchIndex + 1} of {matches.length} result
                  {matches.length !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={matches.length === 0}
                  className="h-6 w-6"
                  aria-label="Next match"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </>
            ) : searchQuery.trim() ? (
              <span className="text-xs text-muted-foreground">No results</span>
            ) : null}
          </div>
        </InputGroupAddon>
      </InputGroup>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="h-9 w-9 shrink-0"
        aria-label="Close find"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
