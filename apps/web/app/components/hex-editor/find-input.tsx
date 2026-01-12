"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { FunctionComponent, RefObject } from "react";
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  ToggleGroup,
  ToggleGroupItem,
} from "@hexed/ui";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { searchHexAll, searchTextAll } from "@hexed/binary-utils/search";

export type FindInputProps = {
  data: Uint8Array;
  onMatchFound?: (offset: number, length: number) => void;
  onClose?: () => void;
  inputRef?: RefObject<HTMLInputElement>;
};

export const FindInput: FunctionComponent<FindInputProps> = ({
  data,
  onMatchFound,
  onClose,
  inputRef: externalInputRef,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"hex" | "text">("text");
  const [matches, setMatches] = useState<
    Array<{ offset: number; length: number }>
  >([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const onMatchFoundRef = useRef(onMatchFound);

  // Keep ref updated with latest callback
  useEffect(() => {
    onMatchFoundRef.current = onMatchFound;
  }, [onMatchFound]);

  // Find all matches when query or mode changes
  useEffect(() => {
    if (!searchQuery.trim() || data.length === 0) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    let allMatches: Array<{ offset: number; length: number }> = [];

    if (searchMode === "hex") {
      allMatches = searchHexAll(data, searchQuery);
    } else {
      allMatches = searchTextAll(data, searchQuery);
    }

    setMatches(allMatches);
    setCurrentMatchIndex(0);

    // Highlight first match if available
    if (allMatches.length > 0) {
      onMatchFoundRef.current?.(allMatches[0].offset, allMatches[0].length);
    }
  }, [searchQuery, searchMode, data]);

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
    if (event.key === "Enter") {
      event.preventDefault();
      if (matches.length > 0) {
        // Cycle to next match, wrapping around
        handleNext();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSearchQuery("");
      setMatches([]);
      setCurrentMatchIndex(0);
      inputRef.current?.blur();
      onClose?.();
    }
  };

  const handleClose = () => {
    setSearchQuery("");
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
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
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
