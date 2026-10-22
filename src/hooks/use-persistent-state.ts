import { useCallback, useEffect, useState } from "react";

/**
 * State mirrored to localStorage. Reads after mount (SSR-safe) and reports
 * `hydrated` so callers can avoid writing defaults over saved data.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  validate?: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (!validate || validate(parsed)) setValue(parsed as T);
      }
    } catch {
      // Ignore corrupt storage and keep the default.
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or blocked: the app still works for this session.
    }
  }, [key, value, hydrated]);

  const update = useCallback((next: T | ((prev: T) => T)) => setValue(next), []);
  return [value, update, hydrated] as const;
}
