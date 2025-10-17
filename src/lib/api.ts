import axios from 'axios';
import { Notification, NotificationResponse, UnreadCountResponse, CreateNotificationRequest } from '@/types/notification';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class NotificationAPI {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/notifications`,
      timeout: 10000
    });

    // リクエストインターセプター
    this.client.interceptors.request.use(
      (config) => {
        // Next-Authのトークンを取得する場合
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // レスポンスインターセプター
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async getNotifications(page = 1, limit = 20): Promise<NotificationResponse> {
    const response = await this.client.get('/', {
      params: { page, limit }
    });
    return response.data;
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await this.client.get('/unread-count');
    return response.data;
  }

  async markAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.put(`/${notificationId}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    const response = await this.client.put('/read-all');
    return response.data;
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.delete(`/${notificationId}`);
    return response.data;
  }

  async createNotification(notification: CreateNotificationRequest): Promise<{ success: boolean; data: Notification }> {
    const response = await this.client.post('/create', notification);
    return response.data;
  }
}

export const notificationAPI = new NotificationAPI();
