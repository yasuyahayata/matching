const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数の読み込み
dotenv.config();

// ルート・コントローラーのインポート
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const matchingRoutes = require('./routes/matching');

// Express アプリケーションの作成
const app = express();
const server = http.createServer(app);

// Socket.IO の設定
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ミドルウェアの設定
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイルの配信
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// APIルートの設定
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/matching', matchingRoutes);

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// チャット用のストレージ
const chatRooms = new Map(); // matchId -> messages[]
const connectedUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId
const userRooms = new Map(); // userId -> Set<roomId>

// Socket.IO接続の管理
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // ユーザー認証・登録
  socket.on('authenticate', (data) => {
    const { userId, token } = data;
    
    if (userId && token) {
      connectedUsers.set(userId, socket.id);
      userSockets.set(socket.id, userId);
      
      socket.join(`user_${userId}`);
      
      console.log(`✅ User ${userId} authenticated and joined room`);
      
      socket.emit('authenticated', { 
        success: true, 
        userId,
        message: 'Successfully authenticated'
      });
      
      // オンライン状態を他のユーザーに通知
      socket.broadcast.emit('userOnline', { userId });
    } else {
      socket.emit('authError', { message: 'Invalid credentials' });
    }
  });

  // チャットルームに参加
  socket.on('joinChatRoom', (data) => {
    const { matchId } = data;
    const userId = userSockets.get(socket.id);
    
    if (userId && matchId) {
      socket.join(`chat_${matchId}`);
      
      // ユーザーのルーム情報を更新
      if (!userRooms.has(userId)) {
        userRooms.set(userId, new Set());
      }
      userRooms.get(userId).add(matchId);
      
      console.log(`👥 User ${userId} joined chat room: ${matchId}`);
      
      // チャット履歴を送信
      const messages = chatRooms.get(matchId) || [];
      socket.emit('chatHistory', { matchId, messages });
    }
  });

  // チャットメッセージ送信
  socket.on('sendMessage', (data) => {
    const { targetUserId, message, matchId } = data;
    const senderUserId = userSockets.get(socket.id);
    
    if (senderUserId && message && matchId) {
      const messageData = {
        id: Date.now().toString(),
        senderId: senderUserId,
        senderName: getSenderName(senderUserId),
        targetUserId,
        matchId,
        message,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      // チャット履歴に保存
      if (!chatRooms.has(matchId)) {
        chatRooms.set(matchId, []);
      }
      chatRooms.get(matchId).push(messageData);
      
      // チャットルームの全参加者にメッセージを送信
      io.to(`chat_${matchId}`).emit('newMessage', messageData);
      
      // 送信者に確認を返す
      socket.emit('messageSent', { 
        success: true, 
        messageId: messageData.id 
      });
      
      console.log(`💬 Message sent in room ${matchId} from ${senderUserId}`);
    }
  });

  // タイピング状態の送信
  socket.on('typing', (data) => {
    const { matchId } = data;
    const userId = userSockets.get(socket.id);
    
    if (userId && matchId) {
      socket.to(`chat_${matchId}`).emit('userTyping', { 
        userId, 
        matchId 
      });
      
      console.log(`⌨️ User ${userId} is typing in room ${matchId}`);
    }
  });

  // テスト通知の送信
  socket.on('sendTestNotification', () => {
    const userId = userSockets.get(socket.id);
    
    if (userId) {
      const testNotification = {
        id: `test_${Date.now()}`,
        title: '🧪 テスト通知',
        message: `送信時刻: ${new Date().toLocaleString('ja-JP')}`,
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { test: true }
      };
      
      socket.emit('newNotification', testNotification);
      console.log(`🧪 Test notification sent to user ${userId}`);
    }
  });

  // 切断処理
  socket.on('disconnect', () => {
    const userId = userSockets.get(socket.id);
    
    if (userId) {
      connectedUsers.delete(userId);
      userSockets.delete(socket.id);
      userRooms.delete(userId);
      
      // オフライン状態を他のユーザーに通知
      socket.broadcast.emit('userOffline', { userId });
      
      console.log(`👋 User ${userId} disconnected`);
    }
    
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });

  // エラーハンドリング
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// ヘルパー関数：送信者名を取得
function getSenderName(userId) {
  const userNames = {
    'user1': '田中太郎',
    'client1': '株式会社サンプル',
    'freelancer1': '佐藤花子'
  };
  return userNames[userId] || `User ${userId}`;
}

// グローバルエラーハンドリング
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 ハンドリング
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// サーバー起動
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`💬 Chat system enabled`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
