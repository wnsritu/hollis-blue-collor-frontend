import { useEffect, useState } from "react";

/**
 * Common reusable debounce hook for any input or filter value.
 * Delays updating the debounced value until after the specified delay has elapsed
 * since the last time the value changed.
 *
 * @param value Value to debounce (string, number, array, object)
 * @param delay Delay in milliseconds (default: 350ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
