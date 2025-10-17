import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.socket = io(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket接続しました');
      this.reconnectAttempts = 0;
      this.emit('socketConnected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket切断しました:', reason);
      this.emit('socketDisconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket接続エラー:', error);
      this.handleReconnect();
    });

    this.socket.on('connected', (data) => {
      console.log('通知システム接続確認:', data);
    });

    this.socket.on('newNotification', (notification) => {
      console.log('新しい通知:', notification);
      this.emit('newNotification', notification);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`再接続試行 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  emit(event: string, data?: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Socket listener error:', error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }
}

export default new SocketService();
