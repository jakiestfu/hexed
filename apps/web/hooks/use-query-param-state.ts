"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * Hook that syncs state with URL query parameters
 * Has the same signature as useState but accepts a key parameter
 *
 * @example
 * const [val, setVal] = useQueryParamState("key", "defaultValue")
 */
export function useQueryParamState<T extends string>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Read value directly from URL
  const value = (searchParams.get(key) as T) || defaultValue

  // Update URL when setValue is called
  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      // Resolve function updates
      const resolvedValue =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(value)
          : newValue

      // Create new URLSearchParams from current search params
      const params = new URLSearchParams(searchParams.toString())

      if (resolvedValue === defaultValue) {
        // Remove param if it matches default value
        params.delete(key)
      } else {
        // Set param to new value
        params.set(key, resolvedValue)
      }

      // Update URL - React Router will cause re-render with new value
      const newSearch = params.toString()
      const newUrl = `${pathname}${newSearch ? `?${newSearch}` : ""}`
      router.replace(newUrl, { scroll: false })
    },
    [key, defaultValue, searchParams, pathname, router, value]
  )

  return [value, setValue]
}
