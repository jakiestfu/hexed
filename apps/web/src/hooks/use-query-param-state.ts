import { useCallback, useMemo } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Read value directly from URL
  const value = (searchParams.get(key) as T) || defaultValue

  // Use string representation of searchParams for stable dependency
  // This prevents re-creating the callback when searchParams object reference changes
  // but the actual params haven't changed
  const searchParamsString = useMemo(
    () => searchParams.toString(),
    [searchParams]
  )

  // Update URL when setValue is called
  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      // Resolve function updates
      const resolvedValue =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(value)
          : newValue

      // Create new URLSearchParams from current search params
      const params = new URLSearchParams(searchParamsString)

      if (resolvedValue === defaultValue) {
        // Remove param if it matches default value
        params.delete(key)
      } else {
        // Set param to new value
        params.set(key, resolvedValue)
      }

      // Update URL - React Router will cause re-render with new value
      const newSearch = params.toString()
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`
      navigate(newUrl, { replace: true })
    },
    [key, defaultValue, searchParamsString, location.pathname, navigate, value]
  )

  return [value, setValue]
}
