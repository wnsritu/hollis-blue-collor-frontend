import Pusher, { type Channel } from "pusher-js";
import { env } from "@/config/env";
import { tokenStorage } from "@/utils/tokenStorage";

let pusherClient: Pusher | null = null;
const activeSubscriptions = new Map<string, Channel>();

/**
 * Returns true if Pusher key is configured in frontend environment
 */
export const isPusherAvailable = (): boolean => {
  return Boolean(env.pusherKey && env.pusherKey.length > 5);
};

/**
 * Get or create singleton Pusher connection
 */
export const getPusherClient = (): Pusher | null => {
  if (!isPusherAvailable()) {
    return null;
  }

  if (!pusherClient) {
    pusherClient = new Pusher(env.pusherKey, {
      cluster: env.pusherCluster || "ap2",
      forceTLS: true,
      channelAuthorization: {
        endpoint: `${env.apiBaseUrl}/notifications/pusher/auth`,
        transport: "ajax",
        headersProvider: () => {
          const token = tokenStorage.getAccessToken();
          return {
            Authorization: token ? `Bearer ${token}` : "",
            Accept: "application/json",
          };
        },
      },
    });

    pusherClient.connection.bind("connected", () => {
      console.log("[Pusher] Real-time connection established.");
    });

    pusherClient.connection.bind("disconnected", () => {
      console.log("[Pusher] Real-time connection closed.");
    });

    pusherClient.connection.bind("error", (err: any) => {
      console.warn("[Pusher] Connection warning/error:", err?.error?.data?.message || err?.message || err);
    });
  }

  return pusherClient;
};

/**
 * Subscribe to the authenticated user's private channel (private-user-{userId})
 */
export const subscribeUserChannel = (
  userId: number | string,
  onNotification: (data: any) => void
): Channel | null => {
  const client = getPusherClient();
  if (!client) return null;

  const channelName = `private-user-${userId}`;

  // If already subscribed, bind listener and return existing channel
  if (activeSubscriptions.has(channelName)) {
    const existing = activeSubscriptions.get(channelName)!;
    existing.unbind("notification", onNotification);
    existing.bind("notification", onNotification);
    return existing;
  }

  const channel = client.subscribe(channelName);
  channel.bind("notification", onNotification);

  channel.bind("pusher:subscription_error", (error: any) => {
    console.error(`[Pusher] Subscription error on channel ${channelName}:`, error);
  });

  activeSubscriptions.set(channelName, channel);
  return channel;
};

/**
 * Unsubscribe from a user's private channel
 */
export const unsubscribeUserChannel = (userId: number | string) => {
  const channelName = `private-user-${userId}`;
  if (pusherClient && activeSubscriptions.has(channelName)) {
    pusherClient.unsubscribe(channelName);
    activeSubscriptions.delete(channelName);
  }
};

/**
 * Disconnect Pusher completely (e.g. on logout)
 */
export const disconnectPusher = () => {
  if (pusherClient) {
    activeSubscriptions.forEach((_, channelName) => {
      pusherClient?.unsubscribe(channelName);
    });
    activeSubscriptions.clear();
    pusherClient.disconnect();
    pusherClient = null;
  }
};

export default {
  getPusherClient,
  isPusherAvailable,
  subscribeUserChannel,
  unsubscribeUserChannel,
  disconnectPusher,
};
