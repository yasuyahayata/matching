export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  data?: Record<string, any>;
}
