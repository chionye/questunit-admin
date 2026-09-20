import { useEffect, useState } from 'react';

/**
 * Returns a copy of `value` that only updates after `delayMs`
 * have elapsed without `value` changing. Keeps typing responsive
 * while avoiding an API request per keystroke.
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
