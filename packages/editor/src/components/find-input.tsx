import { useCallback, useEffect, useRef, useState } from "react"
import type { FunctionComponent, RefObject } from "react"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"

import { toAsciiString, toHexString } from "@hexed/binary-utils/formatter"
import {
  Button,
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from "@hexed/ui"

import { useHexInput } from "../hooks/use-hex-input"
import { useLocalStorage } from "../hooks/use-local-storage"
import { useWorkerClient } from "../providers/worker-provider"

export type FindInputProps = {
  fileId: string | null | undefined
  fileHandle: FileSystemFileHandle | null
  onMatchFound?: (offset: number, length: number) => void
  onClose?: () => void
  inputRef?: RefObject<HTMLInputElement | null>
  syncRangeToFindInput?: { start: number; end: number } | null
}

export const FindInput: FunctionComponent<FindInputProps> = ({
  fileId,
  fileHandle,
  onMatchFound,
  onClose,
  inputRef: externalInputRef,
  syncRangeToFindInput
}) => {
  const workerClient = useWorkerClient()
  const [searchMode, setSearchMode] = useLocalStorage<"hex" | "text">(
    "hexed:find-input-mode",
    "text"
  )
  const [matches, setMatches] = useState<
    Array<{ offset: number; length: number }>
  >([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const internalInputRef = useRef<HTMLInputElement>(null)
  const inputRef = externalInputRef || internalInputRef
  const onMatchFoundRef = useRef(onMatchFound)
  const currentSearchRequestIdRef = useRef<string | null>(null)
  const cancelledRequestIdsRef = useRef<Set<string>>(new Set())

  // Use the hex input hook for formatted input
  const {
    value: searchQuery,
    bytes,
    handleChange,
    handleKeyDown: handleHexKeyDown,
    handlePaste,
    clear,
    setValue
  } = useHexInput({
    mode: searchMode,
    setMode: setSearchMode,
    onChange: () => {
      // Search will be triggered by useEffect watching searchQuery
    }
  })

  // Keep ref updated with latest callback
  useEffect(() => {
    onMatchFoundRef.current = onMatchFound
  }, [onMatchFound])

  // Track the last synced range to prevent unnecessary updates
  const lastSyncedRangeRef = useRef<{ start: number; end: number } | null>(null)

  // Sync with syncRangeToFindInput when it changes (from link clicks)
  // Note: This requires reading bytes from the file, which we'll skip for now
  // since we're using worker-based search. The sync feature can be enhanced later
  // to read bytes from the worker when needed.
  useEffect(() => {
    if (!syncRangeToFindInput) {
      lastSyncedRangeRef.current = null
      return
    }

    const start = Math.min(syncRangeToFindInput.start, syncRangeToFindInput.end)
    const end = Math.max(syncRangeToFindInput.start, syncRangeToFindInput.end)

    // Check if this is the same range we already synced
    if (
      lastSyncedRangeRef.current &&
      lastSyncedRangeRef.current.start === start &&
      lastSyncedRangeRef.current.end === end
    ) {
      return
    }

    // Check if any current match already covers this range (meaning search already found it)
    const rangeAlreadyMatches = matches.some((match) => {
      const matchStart = match.offset
      const matchEnd = match.offset + match.length - 1
      return matchStart === start && matchEnd === end
    })

    // Update the ref to track this range
    lastSyncedRangeRef.current = { start, end }

    // If the range matches a current search result, we don't need to update the input
    // This prevents loops when clicking on search results
    if (rangeAlreadyMatches) {
      return
    }

    // For now, we'll skip syncing the input value from the range
    // This can be enhanced later to read bytes from the worker
  }, [syncRangeToFindInput, searchMode, searchQuery, matches])

  // Find all matches when query or mode changes using worker
  useEffect(() => {
    // Cancel previous search if it exists
    if (currentSearchRequestIdRef.current) {
      cancelledRequestIdsRef.current.add(currentSearchRequestIdRef.current)
      currentSearchRequestIdRef.current = null
    }

    if (!searchQuery.trim() || !fileId || !fileHandle || !workerClient || bytes.length === 0) {
      setMatches([])
      setCurrentMatchIndex(0)
      setIsSearching(false)
      return
    }

    // Generate a unique request ID for this search
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    currentSearchRequestIdRef.current = requestId

    setIsSearching(true)
    setMatches([])
    setCurrentMatchIndex(0)

    const performSearch = async () => {
      try {
        // Ensure file is open in worker
        try {
          await workerClient.openFile(fileId, fileHandle)
        } catch (error) {
          // File might already be open, which is fine
          console.log("File may already be open:", error)
        }

        // Convert search query to pattern bytes
        let pattern: Uint8Array
        if (searchMode === "hex") {
          // For hex mode, use the bytes from the hook
          pattern = bytes
        } else {
          // For text mode, convert text to UTF-8 bytes
          const encoder = new TextEncoder()
          pattern = encoder.encode(searchQuery)
        }

        if (pattern.length === 0) {
          setMatches([])
          setCurrentMatchIndex(0)
          setIsSearching(false)
          return
        }

        // Accumulate matches as they stream in
        const accumulatedMatches: Array<{ offset: number; length: number }> = []

        // Perform search with streaming matches
        await workerClient.search(
          fileId,
          pattern,
          undefined, // onProgress - not needed for now
          (streamedMatches) => {
            // Check if this search was cancelled
            if (cancelledRequestIdsRef.current.has(requestId)) {
              return
            }

            // Add new matches to accumulated list
            accumulatedMatches.push(...streamedMatches)
            setMatches([...accumulatedMatches])

            // Highlight first match if this is the first batch
            if (accumulatedMatches.length === streamedMatches.length && streamedMatches.length > 0) {
              onMatchFoundRef.current?.(streamedMatches[0].offset, streamedMatches[0].length)
            }
          }
        )

        // Check if search was cancelled before updating state
        if (cancelledRequestIdsRef.current.has(requestId)) {
          setIsSearching(false)
          return
        }

        // Search completed - final matches are already in state from streaming
        setIsSearching(false)
      } catch (error) {
        // Check if search was cancelled
        if (cancelledRequestIdsRef.current.has(requestId)) {
          setIsSearching(false)
          return
        }

        console.error("Search failed:", error)
        setMatches([])
        setCurrentMatchIndex(0)
        setIsSearching(false)
      } finally {
        // Clean up cancelled request tracking
        cancelledRequestIdsRef.current.delete(requestId)
        // Ensure isSearching is false if this was the current search
        if (currentSearchRequestIdRef.current === requestId) {
          currentSearchRequestIdRef.current = null
          // Only set isSearching to false if this is still the active search
          // (not cancelled by a newer search)
          setIsSearching(false)
        }
      }
    }

    performSearch()

    // Cleanup: cancel search if component unmounts or query changes
    return () => {
      if (currentSearchRequestIdRef.current === requestId) {
        cancelledRequestIdsRef.current.add(requestId)
        currentSearchRequestIdRef.current = null
        setIsSearching(false)
      }
    }
  }, [searchQuery, searchMode, fileId, fileHandle, workerClient, bytes])

  // Navigate to match at current index
  useEffect(() => {
    if (
      matches.length > 0 &&
      currentMatchIndex >= 0 &&
      currentMatchIndex < matches.length
    ) {
      const match = matches[currentMatchIndex]
      onMatchFoundRef.current?.(match.offset, match.length)
    }
  }, [currentMatchIndex, matches])

  const handleNext = () => {
    if (matches.length === 0) return
    const nextIndex = (currentMatchIndex + 1) % matches.length
    setCurrentMatchIndex(nextIndex)
  }

  const handlePrevious = () => {
    if (matches.length === 0) return
    const prevIndex =
      currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1
    setCurrentMatchIndex(prevIndex)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter and Escape before the hex hook processes them
    if (event.key === "Enter") {
      event.preventDefault()
      if (matches.length > 0) {
        // Cycle to next match, wrapping around
        handleNext()
      }
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      clear()
      setMatches([])
      setCurrentMatchIndex(0)
      inputRef.current?.blur()
      onClose?.()
      return
    }

    // Let the hex input hook handle its own keys
    handleHexKeyDown(event)
  }

  const handleClose = () => {
    clear()
    setMatches([])
    setCurrentMatchIndex(0)
    inputRef.current?.blur()
    onClose?.()
  }

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
              setSearchMode(searchMode === "hex" ? "text" : "hex")
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
              isSearching ? (
                <span className="text-xs text-muted-foreground">Searching...</span>
              ) : (
                <span className="text-xs text-muted-foreground">No results</span>
              )
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
  )
}
