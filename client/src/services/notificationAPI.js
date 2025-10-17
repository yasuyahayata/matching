import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class NotificationAPI {
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/notifications`,
    });

    // リクエストインターセプター（認証トークン付与）
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getNotifications(page = 1, limit = 20) {
    return this.client.get('/', {
      params: { page, limit }
    });
  }

  async getUnreadCount() {
    return this.client.get('/unread-count');
  }

  async markAsRead(notificationId) {
    return this.client.put(`/${notificationId}/read`);
  }

  async createNotification(title, message, type = 'info') {
    return this.client.post('/create', {
      title,
      message,
      type
    });
  }
}

export default new NotificationAPI();