const jwt = require('jsonwebtoken');

class SocketHandler {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId のマッピング
  }

  initialize(server) {
    this.io = require('socket.io')(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.use(this.authenticateSocket);
    this.io.on('connection', this.handleConnection.bind(this));
  }

  authenticateSocket(socket, next) {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('認証が必要です'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('無効なトークンです'));
    }
  }

  handleConnection(socket) {
    console.log(`ユーザー ${socket.userId} が接続しました`);
    
    // ユーザーとソケットのマッピングを保存
    this.userSockets.set(socket.userId, socket.id);
    
    // ユーザー専用ルームに参加
    socket.join(`user_${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`ユーザー ${socket.userId} が切断しました`);
      this.userSockets.delete(socket.userId);
    });
  }

  sendToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = new SocketHandler();