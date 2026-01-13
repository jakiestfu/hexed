"use client";

import * as React from "react";

/**
 * Custom event detail for localStorage change events
 */
interface LocalStorageChangeEventDetail<T> {
  key: string;
  value: T | null;
  oldValue: T | null;
}

/**
 * Custom event type for localStorage changes
 */
class LocalStorageChangeEvent<T> extends CustomEvent<LocalStorageChangeEventDetail<T>> {
  constructor(detail: LocalStorageChangeEventDetail<T>) {
    super("localStorageChange", { detail });
  }
}

/**
 * Singleton event emitter for localStorage changes within the same tab
 */
class LocalStorageEventEmitter extends EventTarget {
  private static instance: LocalStorageEventEmitter | null = null;

  private constructor() {
    super();
  }

  static getInstance(): LocalStorageEventEmitter {
    if (!LocalStorageEventEmitter.instance) {
      LocalStorageEventEmitter.instance = new LocalStorageEventEmitter();
    }
    return LocalStorageEventEmitter.instance;
  }

  /**
   * Emit a localStorage change event
   */
  emitChange<T>(key: string, value: T | null, oldValue: T | null): void {
    const event = new LocalStorageChangeEvent<T>({ key, value, oldValue });
    this.dispatchEvent(event);
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
  const [storedValue, setStoredValue] = React.useState<T>(defaultValue);
  const emitterRef = React.useRef<LocalStorageEventEmitter | null>(null);

  // Initialize emitter singleton
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    emitterRef.current = LocalStorageEventEmitter.getInstance();
  }, []);

  // Load initial value from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        const parsed = JSON.parse(item) as T;
        setStoredValue(parsed);
      } else {
        // Store default value if key doesn't exist
        localStorage.setItem(key, JSON.stringify(defaultValue));
        setStoredValue(defaultValue);
      }
    } catch (error) {
      console.error(`Failed to load value from localStorage for key "${key}":`, error);
      setStoredValue(defaultValue);
    }
  }, [key, defaultValue]);

  // Listen for changes from other components
  React.useEffect(() => {
    if (typeof window === "undefined" || !emitterRef.current) return;

    const emitter = emitterRef.current;

    const handleChange = (event: Event) => {
      const customEvent = event as LocalStorageChangeEvent<T>;
      if (customEvent.detail.key === key) {
        // Update state if value changed externally
        if (customEvent.detail.value !== null) {
          setStoredValue(customEvent.detail.value);
        } else {
          // Key was removed, reset to default
          setStoredValue(defaultValue);
        }
      }
    };

    emitter.addEventListener("localStorageChange", handleChange);

    return () => {
      emitter.removeEventListener("localStorageChange", handleChange);
    };
  }, [key, defaultValue]);

  // Setter function that updates both localStorage and emits events
  const setValue = React.useCallback(
    (value: T | ((prev: T) => T)) => {
      if (typeof window === "undefined") return;

      try {
        // Support functional updates
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Get old value before updating
        const oldItem = localStorage.getItem(key);
        const oldValue = oldItem !== null ? (JSON.parse(oldItem) as T) : null;

        // Update localStorage
        localStorage.setItem(key, JSON.stringify(valueToStore));

        // Update local state
        setStoredValue(valueToStore);

        // Emit event to notify other components
        if (emitterRef.current) {
          emitterRef.current.emitChange(key, valueToStore, oldValue);
        }
      } catch (error) {
        console.error(`Failed to save value to localStorage for key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
