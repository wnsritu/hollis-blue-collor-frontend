import { notificationService } from "./notification.service";
import { env } from "@/config/env";

/**
 * Converts a base64 string to a Uint8Array for VAPID applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if Service Worker, Push API, and Notification API are supported by this browser
 */
export const isPushSupported = (): boolean => {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

/**
 * Get current browser notification permission
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
};

/**
 * Registers the Service Worker (/sw.js)
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) {
    console.warn("[WebPush] Push notifications are not supported in this browser.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error("[WebPush] Service Worker registration failed:", error);
    return null;
  }
};

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushSupported()) return "denied";

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("[WebPush] Permission request failed:", error);
    return "denied";
  }
};

/**
 * Get existing PushSubscription if available
 */
export const getExistingSubscription = async (): Promise<PushSubscription | null> => {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.warn("[WebPush] Failed to get existing subscription:", error);
    return null;
  }
};

/**
 * Subscribes the browser to Web Push and sends the subscription to the backend
 */
export const subscribeToPush = async (
  vapidPublicKeyOverride?: string
): Promise<PushSubscription | null> => {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported by your browser.");
  }

  // 1) Ensure permission is granted
  let permission = getNotificationPermission();
  if (permission === "default") {
    permission = await requestNotificationPermission();
  }

  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notification permission was blocked in your browser settings."
        : "Notification permission was not granted."
    );
  }

  // 2) Ensure service worker is registered
  const registration = await registerServiceWorker();
  if (!registration) {
    throw new Error("Could not register background Service Worker.");
  }

  // 3) Resolve VAPID public key
  let publicKey = vapidPublicKeyOverride || env.vapidPublicKey;
  if (!publicKey) {
    try {
      publicKey = await notificationService.getVapidPublicKey();
    } catch {
      // ignore
    }
  }

  if (!publicKey) {
    throw new Error("Server VAPID public key is not configured.");
  }

  // 4) Check for existing subscription or create new
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const convertedKey = urlBase64ToUint8Array(publicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });
  }

  // 5) Send subscription to Express backend
  const subscriptionJSON = subscription.toJSON();
  await notificationService.subscribePush(subscriptionJSON);

  console.log("[WebPush] Successfully subscribed to background push notifications.");
  return subscription;
};

/**
 * Unsubscribes the browser and notifies backend
 */
export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;

  try {
    const subscription = await getExistingSubscription();
    if (!subscription) return true;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await notificationService.unsubscribePush(endpoint).catch(() => {});
    console.log("[WebPush] Successfully unsubscribed from push notifications.");
    return true;
  } catch (error) {
    console.error("[WebPush] Failed to unsubscribe:", error);
    return false;
  }
};

export default {
  isPushSupported,
  getNotificationPermission,
  registerServiceWorker,
  requestNotificationPermission,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
};
