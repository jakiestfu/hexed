import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

/**
 * Return type for the usePIP hook
 */
export interface UsePIPReturn {
  /** Whether the PIP window is currently active/open */
  isPIPActive: boolean
  /** Whether styles have finished loading in the PIP window */
  stylesLoaded: boolean
  /** Function to open the PIP window */
  openPIP: () => Promise<void>
  /** Function to close the PIP window */
  closePIP: () => void
  /** Function to toggle the PIP window state */
  togglePIP: () => Promise<void>
  /** Whether the browser supports documentPictureInPicture API */
  isSupported: boolean
}

/**
 * Custom hook that uses the native documentPictureInPicture API to display
 * content from an HTMLElement ref in a separate Picture-in-Picture window.
 *
 * @param elementRef - React ref to the HTMLElement to display in PIP
 * @returns Object containing PIP state and control functions
 *
 * @example
 * ```tsx
 * const elementRef = useRef<HTMLDivElement>(null);
 * const { isPIPActive, openPIP, closePIP, togglePIP, isSupported } = usePIP(elementRef);
 *
 * return (
 *   <div>
 *     <div ref={elementRef}>Content to show in PIP</div>
 *     {isSupported && (
 *       <button onClick={togglePIP}>
 *         {isPIPActive ? "Close PIP" : "Open PIP"}
 *       </button>
 *     )}
 *   </div>
 * );
 * ```
 */
export function usePIP(elementRef: RefObject<HTMLElement>): UsePIPReturn {
  const [isPIPActive, setIsPIPActive] = useState(false)
  const [stylesLoaded, setStylesLoaded] = useState(false)
  const pipWindowRef = useRef<Window | null>(null)

  // Feature detection
  const isSupported =
    typeof window !== "undefined" &&
    "documentPictureInPicture" in window &&
    (window as unknown as { documentPictureInPicture?: unknown })
      .documentPictureInPicture !== undefined

  /**
   * Waits for all stylesheets in the target window to load
   */
  const waitForStylesheets = useCallback(
    (targetWindow: Window): Promise<void> => {
      return new Promise((resolve) => {
        const targetDoc = targetWindow.document
        const stylesheets = Array.from(targetDoc.styleSheets)
        const linkElements = Array.from(
          targetDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
        )

        // If no external stylesheets, resolve immediately
        if (linkElements.length === 0) {
          resolve()
          return
        }

        let loadedCount = 0
        const totalLinks = linkElements.length

        const checkComplete = () => {
          loadedCount++
          if (loadedCount >= totalLinks) {
            resolve()
          }
        }

        // Check if stylesheets are already loaded
        linkElements.forEach((link) => {
          if (link.sheet) {
            // Already loaded
            checkComplete()
          } else {
            // Wait for load
            link.addEventListener("load", checkComplete)
            link.addEventListener("error", checkComplete) // Resolve even on error
          }
        })

        // Fallback timeout
        setTimeout(() => {
          resolve()
        }, 2000)
      })
    },
    []
  )

  /**
   * Copies all stylesheets from the main window to the PIP window
   */
  const copyStylesheets = useCallback((targetWindow: Window) => {
    const targetDoc = targetWindow.document
    const sourceDoc = window.document

    // Check if stylesheets have already been copied by looking for existing style/link tags
    const hasStylesheets = targetDoc.head.querySelector(
      "style, link[rel='stylesheet']"
    )
    if (hasStylesheets) {
      // Stylesheets already copied, skip
      return
    }

    // Copy all stylesheets
    Array.from(sourceDoc.styleSheets).forEach((sourceSheet) => {
      try {
        // For stylesheets with href (external stylesheets)
        if (sourceSheet.href) {
          const link = targetDoc.createElement("link")
          link.rel = "stylesheet"
          link.href = sourceSheet.href
          targetDoc.head.appendChild(link)
        } else {
          // For inline stylesheets
          const style = targetDoc.createElement("style")
          try {
            // Try to get CSS rules
            Array.from(sourceSheet.cssRules || []).forEach((rule) => {
              style.textContent += rule.cssText + "\n"
            })
          } catch (e) {
            // If we can't access rules (cross-origin), try to get the text content
            if (sourceSheet.ownerNode) {
              const ownerNode = sourceSheet.ownerNode as HTMLElement
              if (ownerNode.textContent) {
                style.textContent = ownerNode.textContent
              }
            }
          }
          if (style.textContent) {
            targetDoc.head.appendChild(style)
          }
        }
      } catch (e) {
        // Skip stylesheets that can't be accessed (e.g., cross-origin)
        console.warn("Could not copy stylesheet:", e)
      }
    })
  }, [])

  /**
   * Copies CSS variables from :root to the PIP window
   */
  const copyCSSVariables = useCallback((targetWindow: Window) => {
    const sourceRoot = window.document.documentElement
    const targetRoot = targetWindow.document.documentElement
    const sourceStyles = window.getComputedStyle(sourceRoot)

    // Copy all CSS custom properties by iterating through all style properties
    // We need to check both the style declaration and computed styles
    const cssVariables = new Set<string>()

    // Get CSS variables from computed styles
    for (let i = 0; i < sourceStyles.length; i++) {
      const prop = sourceStyles[i]
      if (prop.startsWith("--")) {
        cssVariables.add(prop)
      }
    }

    // Also check inline styles on the root element
    if (sourceRoot.style) {
      for (let i = 0; i < sourceRoot.style.length; i++) {
        const prop = sourceRoot.style[i]
        if (prop.startsWith("--")) {
          cssVariables.add(prop)
        }
      }
    }

    // Copy all found CSS variables
    cssVariables.forEach((prop) => {
      const value = sourceStyles.getPropertyValue(prop).trim()
      if (value) {
        targetRoot.style.setProperty(prop, value)
      }
    })

    // Copy theme class from html element
    const themeClass = sourceRoot.className
    if (themeClass) {
      targetRoot.className = themeClass
    }

    // Copy data attributes that might affect styling
    Array.from(sourceRoot.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-")) {
        targetRoot.setAttribute(attr.name, attr.value)
      }
    })
  }, [])

  /**
   * Clones the element and its styles into the PIP window
   */
  const cloneElementToWindow = useCallback(
    (targetWindow: Window, element: HTMLElement) => {
      const targetDoc = targetWindow.document

      // Set up the PIP window document structure
      if (!targetDoc.head) {
        const head = targetDoc.createElement("head")
        targetDoc.documentElement.appendChild(head)
      }
      if (!targetDoc.body) {
        const body = targetDoc.createElement("body")
        targetDoc.documentElement.appendChild(body)
      }

      // Copy all stylesheets first
      copyStylesheets(targetWindow)

      // Copy CSS variables and theme
      copyCSSVariables(targetWindow)

      // Set body styles to match the main window
      const sourceBodyStyles = window.getComputedStyle(window.document.body)
      targetDoc.body.style.cssText = sourceBodyStyles.cssText
      targetDoc.body.className = window.document.body.className

      // Clone the element
      const clonedElement = element.cloneNode(true) as HTMLElement

      // Copy computed styles
      const computedStyles = window.getComputedStyle(element)
      const styleProps = [
        "width",
        "height",
        "padding",
        "margin",
        "border",
        "backgroundColor",
        "color",
        "fontSize",
        "fontFamily",
        "display",
        "flexDirection",
        "alignItems",
        "justifyContent",
        "overflow"
      ]

      styleProps.forEach((prop) => {
        const value = computedStyles.getPropertyValue(prop)
        if (value) {
          clonedElement.style.setProperty(prop, value)
        }
      })

      // Set up the PIP window document
      targetDoc.body.innerHTML = ""
      targetDoc.body.appendChild(clonedElement)

      // Copy any inline styles from the original element
      if (element.style.cssText) {
        clonedElement.style.cssText = element.style.cssText
      }
    },
    [copyStylesheets, copyCSSVariables]
  )

  /**
   * Opens the Picture-in-Picture window
   */
  const openPIP = useCallback(async () => {
    if (!isSupported) {
      console.warn(
        "documentPictureInPicture API is not supported in this browser"
      )
      return
    }

    if (!elementRef.current) {
      console.warn("Element ref is not available")
      return
    }

    try {
      // Request PIP window
      const pipAPI = (
        window as unknown as {
          documentPictureInPicture?: {
            requestWindow(options: {
              width: number
              height: number
            }): Promise<Window>
          }
        }
      ).documentPictureInPicture

      if (!pipAPI) {
        throw new Error("documentPictureInPicture API not available")
      }

      const pipWindow = await pipAPI.requestWindow({
        width: elementRef.current.offsetWidth || 800,
        height: elementRef.current.offsetHeight || 600
      })

      pipWindowRef.current = pipWindow
      setIsPIPActive(true)
      setStylesLoaded(false)

      // Clone element content to PIP window
      cloneElementToWindow(pipWindow, elementRef.current)

      // Wait for stylesheets to load, then re-render content to ensure styles are applied
      await waitForStylesheets(pipWindow)

      // Use requestAnimationFrame to ensure styles are applied before re-rendering
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Re-clone content after stylesheets are loaded
            if (pipWindow && !pipWindow.closed && elementRef.current) {
              cloneElementToWindow(pipWindow, elementRef.current)
            }
            // Mark styles as loaded
            setStylesLoaded(true)
            resolve(undefined)
          })
        })
      })

      // Handle window close event (user closes PIP manually)
      pipWindow.addEventListener("pagehide", () => {
        setIsPIPActive(false)
        setStylesLoaded(false)
        pipWindowRef.current = null
      })
    } catch (error) {
      console.error("Failed to open Picture-in-Picture window:", error)
      setIsPIPActive(false)
      setStylesLoaded(false)
      pipWindowRef.current = null
    }
  }, [isSupported, elementRef, cloneElementToWindow, waitForStylesheets])

  /**
   * Closes the Picture-in-Picture window
   */
  const closePIP = useCallback(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close()
    }
    setIsPIPActive(false)
    setStylesLoaded(false)
    pipWindowRef.current = null
  }, [])

  /**
   * Toggles the Picture-in-Picture window state
   */
  const togglePIP = useCallback(async () => {
    if (isPIPActive) {
      closePIP()
    } else {
      await openPIP()
    }
  }, [isPIPActive, openPIP, closePIP])

  // Watch for content changes and update PIP window
  useEffect(() => {
    if (!isPIPActive || !elementRef.current || !pipWindowRef.current) {
      return
    }

    const element = elementRef.current
    const pipWindow = pipWindowRef.current

    // Create MutationObserver to watch for DOM changes
    const observer = new MutationObserver(() => {
      // Update PIP window content when changes are detected
      if (pipWindow && !pipWindow.closed && element) {
        cloneElementToWindow(pipWindow, element)
      }
    })

    // Start observing the element and its subtree
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style"]
    })

    // Cleanup observer
    return () => {
      observer.disconnect()
    }
  }, [isPIPActive, elementRef, cloneElementToWindow])

  // Cleanup: close PIP window on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close()
      }
    }
  }, [])

  return {
    isPIPActive,
    stylesLoaded,
    openPIP,
    closePIP,
    togglePIP,
    isSupported
  }
}
