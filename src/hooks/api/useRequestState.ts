import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/api/errors";

export type RequestState<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
};

const initialState = <T>(): RequestState<T> => ({
  data: null,
  error: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
});

/**
 * Imperative request helper for pages that are not on React Query yet.
 * Keeps loading/error/data DRY across forms and one-shot fetches.
 */
export function useRequestState<T = unknown>() {
  const [state, setState] = useState<RequestState<T>>(initialState<T>());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setState(initialState<T>());
  }, []);

  const run = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    setState((s) => ({ ...s, isLoading: true, error: null, isError: false }));
    try {
      const data = await fn();
      if (mounted.current) {
        setState({
          data,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        });
      }
      return data;
    } catch (err) {
      const message = getErrorMessage(err);
      if (mounted.current) {
        setState({
          data: null,
          error: message,
          isLoading: false,
          isSuccess: false,
          isError: true,
        });
      }
      return null;
    }
  }, []);

  return { ...state, run, reset, setState };
}

export default useRequestState;
