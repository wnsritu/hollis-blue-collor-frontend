import apiClient from "@/services/axios";

export interface NotificationItem {
  id: number;
  user_id?: number;
  userId?: number;
  type: string;
  title: string;
  message: string;
  payload?: {
    referenceId?: number | string;
    bookingId?: number | string;
    booking_id?: number | string;
    projectId?: number | string;
    project_id?: number | string;
    proposalId?: number | string;
    url?: string;
    metadata?: Record<string, any>;
    [key: string]: any;
  } | null;
  is_read: boolean;
  isRead?: boolean;
  read_at?: string | null;
  created_at?: string;
  createdAt?: string;
  url?: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface VapidKeyResponse {
  success: boolean;
  data: {
    publicKey: string;
  };
}

export const notificationService = {
  /**
   * Fetch paginated notification history for current user
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unread_only?: boolean;
  }): Promise<NotificationListResponse> {
    const res = await apiClient.get<NotificationListResponse>("/notifications", {
      params,
    });
    return res.data;
  },

  /**
   * Fetch count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<UnreadCountResponse>("/notifications/unread-count");
    return res.data?.data?.count ?? 0;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: number | string): Promise<void> {
    await apiClient.post(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.post("/notifications/read-all");
  },

  /**
   * Delete / archive a notification
   */
  async deleteNotification(id: number | string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Fetch server VAPID public key
   */
  async getVapidPublicKey(): Promise<string> {
    const res = await apiClient.get<VapidKeyResponse>("/notifications/push/public-key");
    return res.data?.data?.publicKey || "";
  },

  /**
   * Register Web Push subscription to backend
   */
  async subscribePush(subscription: PushSubscriptionJSON): Promise<void> {
    await apiClient.post("/notifications/push/subscribe", subscription);
  },

  /**
   * Remove Web Push subscription from backend
   */
  async unsubscribePush(endpoint: string): Promise<void> {
    await apiClient.post("/notifications/push/unsubscribe", { endpoint });
  },
};

export default notificationService;
