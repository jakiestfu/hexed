"use client"

import * as React from "react"

/**
 * Module-level cache for localStorage reads
 * Caches values in memory to avoid expensive synchronous storage API calls
 */
const storageCache = new Map<string, string | null>()

/**
 * Initialize cache invalidation listeners for external changes
 * This handles changes from other tabs/windows and the storage event
 */
if (typeof window !== "undefined") {
  // Invalidate cache when storage changes externally (other tabs)
  window.addEventListener("storage", (e) => {
    if (e.key) {
      storageCache.delete(e.key)
    }
  })

  // Invalidate cache when page becomes visible (may have changed in another tab)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      storageCache.clear()
    }
  })
}

/**
 * Custom event detail for localStorage change events
 */
interface LocalStorageChangeEventDetail<T> {
  key: string
  value: T | null
  oldValue: T | null
}

/**
 * Custom event type for localStorage changes
 */
class LocalStorageChangeEvent<T> extends CustomEvent<
  LocalStorageChangeEventDetail<T>
> {
  constructor(detail: LocalStorageChangeEventDetail<T>) {
    super("localStorageChange", { detail })
  }
}

/**
 * Singleton event emitter for localStorage changes within the same tab
 */
class LocalStorageEventEmitter extends EventTarget {
  private static instance: LocalStorageEventEmitter | null = null

  private constructor() {
    super()
  }

  static getInstance(): LocalStorageEventEmitter {
    if (!LocalStorageEventEmitter.instance) {
      LocalStorageEventEmitter.instance = new LocalStorageEventEmitter()
    }
    return LocalStorageEventEmitter.instance
  }

  /**
   * Emit a localStorage change event
   */
  emitChange<T>(key: string, value: T | null, oldValue: T | null): void {
    const event = new LocalStorageChangeEvent<T>({ key, value, oldValue })
    this.dispatchEvent(event)
  }
}

/**
 * Cached localStorage.getItem with error handling
 */
function getCachedLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null

  // Check cache first
  if (storageCache.has(key)) {
    return storageCache.get(key)!
  }

  try {
    const value = localStorage.getItem(key)
    // Cache the result (even if null)
    storageCache.set(key, value)
    return value
  } catch (error) {
    // localStorage may throw in incognito/private browsing or when disabled
    return null
  }
}

/**
 * Cached localStorage.setItem with cache invalidation
 */
function setCachedLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(key, value)
    // Update cache
    storageCache.set(key, value)
  } catch (error) {
    // localStorage may throw in incognito/private browsing or when disabled
    // Invalidate cache on error
    storageCache.delete(key)
    throw error
  }
}

/**
 * Generic hook for managing localStorage state with cross-component synchronization
 *
 * @param key - The localStorage key to manage
 * @param defaultValue - Default value to use if the key doesn't exist
 * @returns A tuple containing the current value and a setter function
 *
 * @example
 * ```tsx
 * const [count, setCount] = useLocalStorage('count', 0);
 * setCount(5); // Updates localStorage and syncs across all components
 * setCount(prev => prev + 1); // Functional updates supported
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Lazy initialization: only runs on initial mount
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    if (typeof window === "undefined") return defaultValue

    try {
      const item = getCachedLocalStorage(key)
      if (item !== null) {
        return JSON.parse(item) as T
      } else {
        // Store default value if key doesn't exist
        const serialized = JSON.stringify(defaultValue)
        setCachedLocalStorage(key, serialized)
        return defaultValue
      }
    } catch (error) {
      console.error(
        `Failed to load value from localStorage for key "${key}":`,
        error
      )
      return defaultValue
    }
  })

  const emitterRef = React.useRef<LocalStorageEventEmitter | null>(null)
  const defaultValueRef = React.useRef(defaultValue)

  // Store defaultValue in ref to avoid dependency issues
  React.useEffect(() => {
    defaultValueRef.current = defaultValue
  }, [defaultValue])

  // Initialize emitter singleton
  React.useEffect(() => {
    if (typeof window === "undefined") return
    emitterRef.current = LocalStorageEventEmitter.getInstance()
  }, [])

  // Sync with localStorage when key changes (rare case)
  React.useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const item = getCachedLocalStorage(key)
      if (item !== null) {
        const parsed = JSON.parse(item) as T
        setStoredValue(parsed)
      } else {
        // Store default value if key doesn't exist
        const serialized = JSON.stringify(defaultValueRef.current)
        setCachedLocalStorage(key, serialized)
        setStoredValue(defaultValueRef.current)
      }
    } catch (error) {
      console.error(
        `Failed to load value from localStorage for key "${key}":`,
        error
      )
      setStoredValue(defaultValueRef.current)
    }
  }, [key])

  // Listen for changes from other components
  React.useEffect(() => {
    if (typeof window === "undefined" || !emitterRef.current) return

    const emitter = emitterRef.current

    const handleChange = (event: Event) => {
      const customEvent = event as LocalStorageChangeEvent<T>
      if (customEvent.detail.key === key) {
        // Invalidate cache when value changes externally
        storageCache.delete(key)
        // Update state if value changed externally
        if (customEvent.detail.value !== null) {
          setStoredValue(customEvent.detail.value)
        } else {
          // Key was removed, reset to default
          setStoredValue(defaultValueRef.current)
        }
      }
    }

    emitter.addEventListener("localStorageChange", handleChange)

    return () => {
      emitter.removeEventListener("localStorageChange", handleChange)
    }
  }, [key])

  // Setter function that updates both localStorage and emits events
  const setValue = React.useCallback(
    (value: T | ((prev: T) => T)) => {
      if (typeof window === "undefined") return
      try {
        // Support functional updates - use functional form to avoid stale closure
        const valueToStore =
          value instanceof Function ? value(storedValue) : value

        // Get old value from cache before updating
        const oldItem = getCachedLocalStorage(key)
        const oldValue = oldItem !== null ? (JSON.parse(oldItem) as T) : null

        // Update localStorage with caching
        const serialized = JSON.stringify(valueToStore)
        setCachedLocalStorage(key, serialized)

        // Update local state
        setStoredValue(valueToStore)

        // Emit event to notify other components
        if (emitterRef.current) {
          emitterRef.current.emitChange(key, valueToStore, oldValue)
        }
      } catch (error) {
        console.error(
          `Failed to save value to localStorage for key "${key}":`,
          error
        )
        // Invalidate cache on error
        storageCache.delete(key)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}
