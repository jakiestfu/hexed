// import { useCallback } from "react"
// import { useHotkeys } from "react-hotkeys-hook"

// import { toHexString } from "@hexed/file/formatter"

// import { useHexedSettingsContext } from "../providers/hexed-settings-provider"
// import { useHexedStateContext } from "../providers/hexed-state-provider"

// export interface UseGlobalKeyboardOptions {
//   /** Current snapshot data */
//   data: Uint8Array
//   /** Optional callback when bytes are copied (for notifications, etc.) */
//   onCopy?: (hexString: string) => void
// }

// /**
//  * Hook for handling global keyboard shortcuts in the hex editor
//  * - Ctrl+C/meta+C: Copy selected bytes as hex string
//  * - Escape: Cascading logic (close find input → close sidebars → deselect)
//  * - Ctrl+F/meta+F: Toggle search input
//  * - Ctrl+Shift+A/meta+Shift+A: Toggle ASCII visibility
//  * - Ctrl+Shift+C/meta+Shift+C: Toggle checksums visibility
//  * - Ctrl+Shift+H/meta+Shift+H: Toggle histogram dialog
//  * - Ctrl+1/meta+1: Toggle interpreter sidebar
//  * - Ctrl+2/meta+2: Toggle templates sidebar
//  * - Ctrl+3/meta+3: Toggle strings sidebar
//  * - Ctrl+Shift+P/meta+Shift+P: Toggle sidebar position
//  */
// export function useGlobalKeyboard({
//   data,
//   onCopy
// }: UseGlobalKeyboardOptions): void {
//   // Get settings from context
//   const {
//     setShowAscii,
//     setShowChecksums,
//     toggleSidebarPosition,
//     sidebar,
//     setSidebar
//   } = useHexedSettingsContext()
  
//   // Get state from context
//   const {
//     selectedOffsetRange,
//     showSearch,
//     handleToggleSearch,
//     handleCloseSearch,
//     handleDeselectBytes,
//     handleToggleHistogram
//   } = useHexedStateContext()

//   /**
//    * Check if user is currently typing in an input field
//    */
//   const isTypingInInput = useCallback((): boolean => {
//     // Check if we're in a browser environment (Next.js SSR)
//     if (typeof document === "undefined") {
//       return false
//     }

//     const activeElement = document.activeElement
//     if (!activeElement) return false

//     const tagName = activeElement.tagName
//     const isContentEditable =
//       activeElement.getAttribute("contenteditable") === "true"

//     return tagName === "INPUT" || tagName === "TEXTAREA" || isContentEditable
//   }, [])

//   /**
//    * Copy selected bytes to clipboard as hex string
//    */
//   const handleCopyBytes = useCallback((): void => {
//     // Check if we're in a browser environment (Next.js SSR)
//     if (typeof window === "undefined" || typeof navigator === "undefined") {
//       return
//     }

//     if (!selectedOffsetRange || data.length === 0) return

//     try {
//       const start = Math.min(selectedOffsetRange.start, selectedOffsetRange.end)
//       const end = Math.max(selectedOffsetRange.start, selectedOffsetRange.end)

//       // Ensure indices are within bounds
//       const clampedStart = Math.max(0, Math.min(start, data.length - 1))
//       const clampedEnd = Math.max(0, Math.min(end, data.length - 1))

//       if (clampedStart > clampedEnd) return

//       // Extract bytes and format as hex string
//       const selectedBytes = data.slice(clampedStart, clampedEnd + 1)
//       const hexString = toHexString(selectedBytes, " ")

//       // Copy to clipboard
//       if (navigator.clipboard && navigator.clipboard.writeText) {
//         navigator.clipboard.writeText(hexString).then(() => {
//           onCopy?.(hexString)
//         })
//       }
//     } catch (error) {
//       // Silently fail if clipboard API is not available or permission denied
//       console.error("Failed to copy bytes to clipboard:", error)
//     }
//   }, [selectedOffsetRange, data, onCopy])

//   /**
//    * Handle cascading Escape key logic
//    * Priority: find input → sidebars → deselect bytes
//    */
//   const handleEscape = useCallback((): void => {
//     if (showSearch) {
//       // First priority: close find input
//       handleCloseSearch()
//     } else if (sidebar !== null) {
//       // Second priority: close sidebars
//       setSidebar(null)
//     } else if (selectedOffsetRange !== null) {
//       // Third priority: deselect bytes
//       handleDeselectBytes()
//     }
//   }, [
//     showSearch,
//     sidebar,
//     selectedOffsetRange,
//     handleCloseSearch,
//     setSidebar,
//     handleDeselectBytes
//   ])

//   // Copy shortcut: Ctrl+C or meta+C
//   useHotkeys(
//     "ctrl+c, meta+c",
//     (event) => {
//       // Don't interfere if user is typing in an input
//       if (isTypingInInput()) return

//       // Only copy if there's a selection
//       if (selectedOffsetRange !== null) {
//         event.preventDefault()
//         handleCopyBytes()
//       }
//     },
//     {
//       enabled: selectedOffsetRange !== null,
//       enableOnFormTags: false
//     },
//     [selectedOffsetRange, handleCopyBytes, isTypingInInput]
//   )

//   // Escape key: Cascading logic
//   useHotkeys(
//     "esc",
//     (event) => {
//       // Don't interfere if user is typing in an input (let input handle its own Escape)
//       if (isTypingInInput()) return

//       event.preventDefault()
//       handleEscape()
//     },
//     {
//       enabled: showSearch || sidebar !== null || selectedOffsetRange !== null,
//       enableOnFormTags: false
//     },
//     [showSearch, sidebar, selectedOffsetRange, handleEscape, isTypingInInput]
//   )

//   // Toggle search: Ctrl+F or meta+F
//   useHotkeys(
//     "ctrl+f, meta+f",
//     (event) => {
//       // Don't interfere if user is typing in an input
//       if (isTypingInInput()) return

//       event.preventDefault()
//       handleToggleSearch()
//     },
//     {
//       enabled: true,
//       enableOnFormTags: false
//     },
//     [handleToggleSearch, isTypingInInput]
//   )

//   // Toggle ASCII: Ctrl+Shift+A or meta+Shift+A
//   useHotkeys(
//     "ctrl+shift+a, meta+shift+a",
//     (event) => {
//       if (isTypingInInput()) return

//       event.preventDefault()
//       setShowAscii((prev) => !prev)
//     },
//     {
//       enabled: true,
//       enableOnFormTags: false
//     },
//     [setShowAscii, isTypingInInput]
//   )

//   // Toggle checksums: Ctrl+Shift+C or meta+Shift+C
//   useHotkeys(
//     "ctrl+shift+c, meta+shift+c",
//     (event) => {
//       if (isTypingInInput()) return

//       event.preventDefault()
//       setShowChecksums((prev) => !prev)
//     },
//     {
//       enabled: true,
//       enableOnFormTags: false
//     },
//     [setShowChecksums, isTypingInInput]
//   )

//   // Toggle histogram: Ctrl+Shift+H or meta+Shift+H
//   useHotkeys(
//     "ctrl+shift+h, meta+shift+h",
//     (event) => {
//       if (isTypingInInput()) return

//       event.preventDefault()
//       handleToggleHistogram()
//     },
//     {
//       enabled: true,
//       enableOnFormTags: false
//     },
//     [handleToggleHistogram, isTypingInInput]
//   )

//   // Toggle interpreter: Ctrl+1 or meta+1
//   useHotkeys(
//     "ctrl+1, meta+1",
//     (event) => {
//       if (isTypingInInput()) return

//       event.preventDefault()
//       setSidebar((prev) => (prev === "interpreter" ? null : "interpreter"))
//     },
//     {
//       enabled: true,
//       enableOnFormTags: false
//     },
//     [setSidebar, isTypingInInput]
//   )

//   // Toggle templates: Ctrl+2 or meta+2
//   useHotkeys(
//     "ctrl+2, meta+2",
//     (event) => {
//       if (isTypingInInput()) return

//       event.preventDefault()
//       setSidebar((prev) => (prev === "templates" ? null : "templates"))
//     },
//     {
//       enabled: true,
//       enableOnFormTags: false
//     },
//     [setSidebar, isTypingInInput]
//   )

//   // Toggle strings: Ctrl+3 or meta+3
//   useHotkeys(
//     "ctrl+3, meta+3",
//     (event) => {
//       if (isTypingInInput()) return

//       event.preventDefault()
//       setSidebar((prev) => (prev === "strings" ? null : "strings"))
//     },
//     {
//       enabled: true,
//       enableOnFormTags: false
//     },
//     [setSidebar, isTypingInInput]
//   )

//   // Toggle sidebar position: Ctrl+Shift+P or meta+Shift+P
//   useHotkeys(
//     "ctrl+shift+p, meta+shift+p",
//     (event) => {
//       if (isTypingInInput()) return

//       event.preventDefault()
//       toggleSidebarPosition()
//     },
//     {
//       enabled: true,
//       enableOnFormTags: false
//     },
//     [toggleSidebarPosition, isTypingInInput]
//   )
// }
