import { forwardRef, useEffect, useRef, useState } from "react"
import type { FunctionComponent, MutableRefObject } from "react"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"

import { useLocalStorage, useWorkerClient } from "@hexed/editor"
import { HexedFile } from "@hexed/file"
import {
  Button,
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Progress
} from "@hexed/ui"

import { useHexadecimalFormatting } from "./use-hexadecimal-formatting"
import { searchImpl } from "./search-impl"
import type { SearchMatch } from "./types"

export const FindInput = forwardRef<
  HTMLInputElement,
  {
    file: HexedFile
    onMatchFound?: (offset: number, length: number) => void
    onClose?: () => void
  }
>(({ onMatchFound, onClose, file: hexedFile }, ref) => {
  const workerClient = useWorkerClient()
  const [searchMode, setSearchMode] = useLocalStorage<"hex" | "text">(
    "hexed:find-input-mode",
    "text"
  )
  const [matches, setMatches] = useState<SearchMatch[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)
  const internalInputRef = useRef<HTMLInputElement>(null)
  const onMatchFoundRef = useRef(onMatchFound)

  // Handle ref forwarding - use callback ref to support both callback and RefObject
  const setRef = (element: HTMLInputElement | null) => {
    internalInputRef.current = element
    if (typeof ref === "function") {
      ref(element)
    } else if (ref) {
      ; (ref as MutableRefObject<HTMLInputElement | null>).current = element
    }
  }

  const inputRef = internalInputRef
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
  } = useHexadecimalFormatting({
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

  // Find all matches when query or mode changes using worker
  useEffect(() => {
    // Cancel previous search if it exists
    if (currentSearchRequestIdRef.current) {
      cancelledRequestIdsRef.current.add(currentSearchRequestIdRef.current)
      currentSearchRequestIdRef.current = null
    }

    if (
      !searchQuery.trim() ||
      !hexedFile ||
      !workerClient ||
      bytes.length === 0
    ) {
      setMatches([])
      setCurrentMatchIndex(0)
      setIsSearching(false)
      setSearchProgress(0)
      return
    }

    // Generate a unique request ID for this search
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    currentSearchRequestIdRef.current = requestId

    setIsSearching(true)
    setMatches([])
    setCurrentMatchIndex(0)
    setSearchProgress(0)

    const performSearch = async () => {
      try {
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
          setSearchProgress(0)
          return
        }

        // Accumulate matches as they stream in
        const accumulatedMatches: SearchMatch[] = []

        // Perform search with streaming matches using $evaluate
        await workerClient.$evaluate(
          hexedFile,
          searchImpl,
          {
            context: {
              pattern
            },
            onProgress: (progress) => {
              // Check if this search was cancelled
              if (cancelledRequestIdsRef.current.has(requestId)) {
                return
              }

              // Calculate percentage
              const percentage = Math.round(
                (progress.processed / progress.size) * 100
              )
              setSearchProgress(percentage)
            },
            onResult: (streamedMatches: SearchMatch[]) => {
              // Check if this search was cancelled
              if (cancelledRequestIdsRef.current.has(requestId)) {
                return
              }

              // Add new matches to accumulated list
              accumulatedMatches.push(...streamedMatches)
              setMatches([...accumulatedMatches])

              // Highlight first match if this is the first batch
              if (
                accumulatedMatches.length === streamedMatches.length &&
                streamedMatches.length > 0
              ) {
                onMatchFoundRef.current?.(
                  streamedMatches[0].offset,
                  streamedMatches[0].length
                )
              }
            }
          }
        )

        // Check if search was cancelled before updating state
        if (cancelledRequestIdsRef.current.has(requestId)) {
          setIsSearching(false)
          setSearchProgress(0)
          return
        }

        // Search completed - final matches are already in state from streaming
        setIsSearching(false)
        setSearchProgress(100)
      } catch (error) {
        // Check if search was cancelled
        if (cancelledRequestIdsRef.current.has(requestId)) {
          setIsSearching(false)
          setSearchProgress(0)
          return
        }

        console.error("Search failed:", error)
        setMatches([])
        setCurrentMatchIndex(0)
        setIsSearching(false)
        setSearchProgress(0)
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
        setSearchProgress(0)
      }
    }
  }, [searchQuery, searchMode, hexedFile, workerClient, bytes])

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
    <>
      <div
        className={cn(
          "absolute top-[-2px] left-0 right-0 transition-opacity duration-300 bg-background",
          searchProgress === 100 || searchProgress === 0 ? "opacity-0" : "opacity-100"
        )}
      >
        <Progress value={searchProgress} className="h-[3px] rounded-none" />
      </div>
      <div className="flex flex-col gap-2 w-full relative">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full relative">
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
              ref={setRef}
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
                      {(currentMatchIndex + 1).toLocaleString()} of {matches.length.toLocaleString()} result
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
                    <span className="text-xs text-muted-foreground">
                      Searching...
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No results
                    </span>
                  )
                ) : null}
              </div>
            </InputGroupAddon>
          </InputGroup>
          {/* <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-9 w-9 shrink-0"
          aria-label="Close find"
        >
          <X className="h-4 w-4" />
        </Button> */}
        </div>
      </div>
    </>
  )
})

FindInput.displayName = "FindInput"
