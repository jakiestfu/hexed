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
import { Search, X } from "lucide-react";
import { searchHex, searchText } from "@hexed/binary-utils/search";

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
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || data.length === 0) {
      return;
    }

    let match: { offset: number; length: number } | null = null;

    if (searchMode === "hex") {
      match = searchHex(data, searchQuery);
    } else {
      match = searchText(data, searchQuery);
    }

    if (match) {
      onMatchFound?.(match.offset, match.length);
    }
  }, [searchQuery, searchMode, data, onMatchFound]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSearchQuery("");
      inputRef.current?.blur();
      onClose?.();
    }
  };

  const handleClose = () => {
    setSearchQuery("");
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
        {/* <InputGroupAddon align="inline-end">
          <ToggleGroup
            type="single"
            value={searchMode}
            onValueChange={(value) => {
              if (value === "hex" || value === "text") {
                setSearchMode(value);
              }
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="hex" aria-label="Hex mode">
              Hex
            </ToggleGroupItem>
            <ToggleGroupItem value="text" aria-label="Text mode">
              Text
            </ToggleGroupItem>
          </ToggleGroup>
        </InputGroupAddon> */}
        <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
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
