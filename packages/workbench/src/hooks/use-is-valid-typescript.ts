"use client"

import { useEffect, useState } from "react"
import { validateTypeScript } from "../utils/typescript"

/**
 * Hook that validates TypeScript code with debouncing.
 * Returns whether the code is valid (has no TypeScript errors).
 *
 * @param value - The TypeScript code to validate
 * @param delay - Debounce delay in milliseconds (default: 300)
 * @returns `true` if the code is valid, `false` if it has errors or is being validated
 *
 * @example
 * ```tsx
 * const isValid = useIsValidTypeScript(code, 300)
 * ```
 */
export const useIsValidTypeScript = (
  value: string,
  delay: number = 300
): boolean => {
  const [isValid, setIsValid] = useState<boolean>(false)
  console.log("VALIDATING", { code: value, result: validateTypeScript(value) })
  useEffect(() => {
    // Clear validation state immediately when value changes
    setIsValid(false)

    // Set up debounced validation
    const timeoutId = setTimeout(() => {
      const result = validateTypeScript(value)
      setIsValid(result)
    }, delay)

    // Cleanup timeout on unmount or value change
    return () => {
      clearTimeout(timeoutId)
    }
  }, [value, delay])

  return isValid
}
