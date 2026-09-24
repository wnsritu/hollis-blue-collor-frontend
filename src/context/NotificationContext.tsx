import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Bell, X } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuth";
import {
  notificationService,
  type NotificationItem,
} from "@/services/notification.service";
import {
  subscribeUserChannel,
  unsubscribeUserChannel,
  disconnectPusher,
} from "@/lib/pusher";
import {
  isPushSupported,
  getNotificationPermission,
  registerServiceWorker,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/services/webPush.service";

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: number | boolean;
  pushSupported: boolean;
  pushPermission: NotificationPermission | "unsupported";
  isPushSubscribed: boolean;
  isPushLoading: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: number | string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number | string) => Promise<void>;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuthSession();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pushSupported, setPushSupported] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [isPushLoading, setIsPushLoading] = useState<boolean>(false);

  const activeUserIdRef = useRef<number | null>(null);

  // Check Web Push support & existing subscription on load
  useEffect(() => {
    const supported = isPushSupported();
    setPushSupported(supported);
    if (!supported) {
      setPushPermission("unsupported");
      return;
    }

    setPushPermission(getNotificationPermission());

    // Register service worker and check existing subscription
    registerServiceWorker().then(async (reg) => {
      if (reg) {
        const sub = await getExistingSubscription();
        setIsPushSubscribed(Boolean(sub));
      }
    });
  }, []);

  // Fetch notification history
  const fetchNotifications = useCallback(
    async (page = 1) => {
      if (!isAuthenticated || !user?.id) return;
      setIsLoading(true);
      try {
        const res = await notificationService.getNotifications({
          page,
          limit: 15,
        });
        if (res.data) {
          setNotifications(res.data);
        }
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.warn("[NotificationContext] Failed to load notifications:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user?.id]
  );

  // Mark single as read
  const markAsRead = useCallback(async (id: number | string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === Number(id) ? { ...n, is_read: true, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.warn("[NotificationContext] markAsRead error:", err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, isRead: true }))
    );
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (err) {
      console.warn("[NotificationContext] markAllAsRead error:", err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (id: number | string) => {
      const target = notifications.find((n) => n.id === Number(id));
      setNotifications((prev) => prev.filter((n) => n.id !== Number(id)));
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await notificationService.deleteNotification(id);
      } catch (err) {
        console.warn("[NotificationContext] deleteNotification error:", err);
      }
    },
    [notifications]
  );

  // Enable push notifications
  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!pushSupported) {
      toast.error("Push notifications are not supported by this browser.");
      return false;
    }

    setIsPushLoading(true);
    try {
      const sub = await subscribeToPush();
      if (sub) {
        setIsPushSubscribed(true);
        setPushPermission("granted");
        toast.success("Background notifications enabled! You'll stay notified even when tabs are closed.");
        return true;
      }
      return false;
    } catch (error: any) {
      setPushPermission(getNotificationPermission());
      toast.error(error.message || "Could not enable push notifications.");
      return false;
    } finally {
      setIsPushLoading(false);
    }
  }, [pushSupported]);

  // Disable push notifications
  const disablePushNotifications = useCallback(async (): Promise<boolean> => {
    setIsPushLoading(true);
    try {
      await unsubscribeFromPush();
      setIsPushSubscribed(false);
      toast.success("Push notifications disabled for this device.");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to disable push notifications.");
      return false;
    } finally {
      setIsPushLoading(false);
    }
  }, []);

  // Connect Pusher on Login & Subscribe to private-user-{id}
  useEffect(() => {
    const currentUserId = user?.id ? Number(user.id) : null;

    if (!isAuthenticated || !currentUserId) {
      if (activeUserIdRef.current) {
        unsubscribeUserChannel(activeUserIdRef.current);
        disconnectPusher();
        activeUserIdRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    activeUserIdRef.current = currentUserId;

    // Load initial history
    fetchNotifications();

    // Subscribe to Pusher channel
    const channel = subscribeUserChannel(currentUserId, (data: any) => {
      console.log("[Pusher] Real-time notification received:", data);

      const targetUrl = data.url || data.metadata?.url || null;

      // 1) Show rich in-app toast
      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (data.id) {
                markAsRead(data.id);
              }
              if (targetUrl) {
                navigate(targetUrl);
              }
            }}
            className={`max-w-md w-full bg-white dark:bg-zinc-900 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 p-4 cursor-pointer hover:shadow-2xl transition-all duration-200 border-l-4 border-primary ${
              t.visible ? "animate-enter" : "animate-leave"
            }`}
          >
            <div className="flex-1 w-0">
              <div className="flex items-start">
                <div className="shrink-0 pt-0.5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bell size={18} />
                  </span>
                </div>
                <div className="ml-3.5 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {data.title || "New Notification"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {data.message || "You have a new update."}
                  </p>
                </div>
              </div>
            </div>
            <div className="ml-4 flex shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ),
        { duration: 6000, position: "top-right" }
      );

      // 2) Update local state
      const newItem: NotificationItem = {
        id: data.id || Date.now(),
        type: data.type || "notification",
        title: data.title || "Notification",
        message: data.message || "",
        url: targetUrl,
        payload: data.metadata || data.payload || {},
        is_read: false,
        created_at: data.createdAt || new Date().toISOString(),
      };

      setNotifications((prev) => [newItem, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      if (currentUserId) {
        unsubscribeUserChannel(currentUserId);
      }
    };
  }, [isAuthenticated, user?.id, fetchNotifications, markAsRead, navigate]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        pushSupported,
        pushPermission,
        isPushSubscribed,
        isPushLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        enablePushNotifications,
        disablePushNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export default NotificationContext;
