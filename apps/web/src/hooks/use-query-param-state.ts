import { useCallback, useMemo } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

export type QueryParams = Record<string, string>

export function useQueryParams() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  console.log("searchParams", {
    location,
    searchParams
  })
  // Stable string representation
  const searchParamsString = useMemo(
    () => searchParams.toString(),
    [searchParams]
  )

  /**
   * Object literal of all params
   * ?foo=bar&baz=qux -> { foo: "bar", baz: "qux" }
   */
  const params = useMemo<QueryParams>(() => {
    // console.log('searchParamsString', searchParamsString)
    const out: QueryParams = {}
    for (const [key, value] of new URLSearchParams(searchParamsString)) {
      out[key] = value
    }
    return out
  }, [searchParamsString])

  const setParam = useCallback(
    (
      key: string,
      value: string | null | undefined,
      opts?: { removeIf?: string }
    ) => {
      const sp = new URLSearchParams(searchParamsString)

      const shouldRemove =
        value == null ||
        value === "" ||
        (opts?.removeIf != null && value === opts.removeIf)

      if (shouldRemove) sp.delete(key)
      else sp.set(key, value)

      const newSearch = sp.toString()
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`
      navigate(newUrl, { replace: true })
    },
    [searchParamsString, location.pathname, navigate]
  )

  const deleteParam = useCallback(
    (key: string) => setParam(key, null),
    [setParam]
  )

  return {
    ...params, // 👈 magic line
    params, // also expose full object if you want it grouped
    setParam,
    deleteParam
  }
}

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
  const { params, setParam } = useQueryParams()

  const value = ((params[key] as T | undefined) ?? defaultValue) as T

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const resolvedValue =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(value)
          : newValue

      setParam(key, resolvedValue, { removeIf: defaultValue })
    },
    [key, defaultValue, setParam, value]
  )

  return [value, setValue]
}
