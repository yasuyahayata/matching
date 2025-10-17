const express = require('express');
const router = express.Router();

// 模擬通知データ
let notifications = [
  {
    id: '1',
    title: 'プロジェクト更新',
    message: '新しいタスクが追加されました',
    type: 'info',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    userId: 'user1'
  }
];

// 通知一覧取得
router.get('/', (req, res) => {
  const { userId, filter } = req.query;
  
  let filteredNotifications = notifications;
  
  if (userId) {
    filteredNotifications = filteredNotifications.filter(n => n.userId === userId);
  }
  
  if (filter === 'unread') {
    filteredNotifications = filteredNotifications.filter(n => !n.isRead);
  } else if (filter === 'read') {
    filteredNotifications = filteredNotifications.filter(n => n.isRead);
  }
  
  res.json({
    success: true,
    notifications: filteredNotifications,
    total: filteredNotifications.length,
    unreadCount: filteredNotifications.filter(n => !n.isRead).length
  });
});

// 通知作成
router.post('/', (req, res) => {
  const { title, message, type, userId } = req.body;
  
  if (!title || !message || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Title, message and userId are required'
    });
  }
  
  const newNotification = {
    id: Date.now().toString(),
    title,
    message,
    type: type || 'info',
    isRead: false,
    createdAt: new Date().toISOString(),
    userId
  };
  
  notifications.unshift(newNotification);
  
  res.json({
    success: true,
    notification: newNotification
  });
});

module.exports = router;
