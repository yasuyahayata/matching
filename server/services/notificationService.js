const Notification = require('../models/Notification');
const socketHandler = require('../socket/socketHandler');

class NotificationService {
  async createNotification(userId, title, message, type = 'info', data = {}) {
    try {
      const notification = new Notification({
        userId,
        title,
        message,
        type,
        data
      });
      
      await notification.save();
      
      // リアルタイム送信
      socketHandler.sendToUser(userId, 'newNotification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt
      });
      
      return notification;
    } catch (error) {
      console.error('通知作成エラー:', error);
      throw error;
    }
  }

  async getNotifications(userId, page = 1, limit = 20) {
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      return notifications;
    } catch (error) {
      console.error('通知取得エラー:', error);
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true }
      );
      return true;
    } catch (error) {
      console.error('既読更新エラー:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        userId,
        isRead: false
      });
      return count;
    } catch (error) {
      console.error('未読数取得エラー:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();