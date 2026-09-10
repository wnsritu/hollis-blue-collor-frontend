/**
 * lib/milestoneGate.ts
 *
 * Frontend-side handling for backend's MILESTONE_LOCKED responses.
 * Ensures UI screens stay visible/clickable in every build; when a user
 * taps a feature whose API isn't live yet in this milestone, they get a friendly toast.
 */

import type { AxiosInstance, AxiosError } from "axios";
import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

export interface MilestoneLockedPayload {
  success: false;
  code: "MILESTONE_LOCKED";
  message: string;
  milestoneRequired: number;
}

type ToastFn = (message: string) => void;

/** Simple in-memory event bus so any component can react to a lock event. */
type Listener = (payload: MilestoneLockedPayload) => void;
const listeners = new Set<Listener>();

export function onMilestoneLocked(cb: Listener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function isMilestoneLockedError(
  error: AxiosError
): error is AxiosError<MilestoneLockedPayload> {
  const data = error.response?.data as Partial<MilestoneLockedPayload> | undefined;
  return error.response?.status === 403 && data?.code === "MILESTONE_LOCKED";
}

/**
 * Attach once to your axios instance. Swallows MILESTONE_LOCKED errors into
 * a toast + broadcast event instead of letting them reject as generic failures.
 */
export function attachMilestoneGateInterceptor(
  apiClient: AxiosInstance,
  showToast: ToastFn = (msg) => toast.error(msg)
) {
  apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (isMilestoneLockedError(error)) {
        const payload = error.response!.data;
        showToast(
          `Feature Coming Soon ✨ (Requires Milestone ${payload.milestoneRequired})`
        );
        listeners.forEach((cb) => cb(payload));

        const lockedError = new Error(payload.message);
        (lockedError as any).isMilestoneLocked = true;
        (lockedError as any).milestoneRequired = payload.milestoneRequired;
        return Promise.reject(lockedError);
      }
      return Promise.reject(error);
    }
  );
}

/**
 * Hook to track which feature areas are currently locked.
 */
export function useMilestoneGate() {
  const [lockedFeatures, setLockedFeatures] = useState<Record<string, number>>({});

  useEffect(() => {
    return onMilestoneLocked((payload) => {
      setLockedFeatures((prev) => ({
        ...prev,
        __lastLocked: payload.milestoneRequired,
      }));
    });
  }, []);

  const isLocked = useCallback(
    (featureKey: string) => Boolean(lockedFeatures[featureKey]),
    [lockedFeatures]
  );

  return { lockedFeatures, isLocked };
}
