// 基本的な通知型定義
interface Notification {
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

class SocketService {
  private listeners: Map<string, Set<Function>> = new Map();
  private connected = false;
  private mockMode = true; // 模擬モードを有効にする

  connect(token?: string) {
    console.log('🔗 Socket接続を開始（模擬モード）');
    
    // 模擬接続の遅延
    setTimeout(() => {
      this.connected = true;
      console.log('✅ 模擬Socket接続が成功しました');
      this.emit('socketConnected');
    }, 1000);
  }

  disconnect() {
    this.connected = false;
    this.listeners.clear();
    console.log('🔌 Socket切断（模擬モード）');
    this.emit('socketDisconnected', 'manual_disconnect');
  }

  // イベントリスナー管理
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
          console.error('イベントリスナーエラー:', error);
        }
      });
    }
  }

  // Socket状態確認
  isConnected(): boolean {
    return this.connected;
  }

  // 模擬通知送信（開発用）
  simulateNotification() {
    const notifications = [
      {
        id: Date.now().toString(),
        userId: 'demo-user',
        title: '📢 模擬通知',
        message: `${new Date().toLocaleTimeString()} に生成された模擬通知です。`,
        type: 'info' as const,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: (Date.now() + 1).toString(),
        userId: 'demo-user',
        title: '🎉 システム更新',
        message: '新機能が追加されました。ご確認ください。',
        type: 'success' as const,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: (Date.now() + 2).toString(),
        userId: 'demo-user',
        title: '⚠️ メンテナンス通知',
        message: '明日午前2時からメンテナンスを実施します。',
        type: 'warning' as const,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: (Date.now() + 3).toString(),
        userId: 'demo-user',
        title: '❌ エラー通知',
        message: '一時的なエラーが発生しましたが、現在は解決済みです。',
        type: 'error' as const,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    
    console.log('🧪 模擬通知を送信:', randomNotification.title);
    
    // リアルな遅延を追加
    setTimeout(() => {
      this.emit('newNotification', randomNotification);
      this.showBrowserNotification(randomNotification);
    }, 300);
  }

  // ブラウザ通知の表示
  private showBrowserNotification(notification: Notification) {
    if (typeof window === 'undefined') return; // サーバーサイド対応
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.type === 'error'
      });

      browserNotification.onclick = () => {
        window.focus();
        this.emit('notificationClicked', notification);
        browserNotification.close();
      };

      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // 接続テスト
  testConnection() {
    console.log('🧪 接続テストを実行（模擬モード）');
    
    if (this.isConnected()) {
      console.log('✅ 接続中 - テスト通知を送信');
      this.simulateNotification();
    } else {
      console.log('❌ 未接続 - 接続を試行');
      this.connect();
      
      // 接続後にテスト通知を送信
      setTimeout(() => {
        this.simulateNotification();
      }, 1500);
    }
  }

  // ブラウザ通知の許可を求める
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined') return 'denied'; // サーバーサイド対応
    
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 ブラウザ通知許可:', permission);
      return permission;
    }
    return 'denied';
  }

  // 複数の模擬通知を順次送信
  sendMultipleTestNotifications() {
    console.log('📨 複数テスト通知送信開始');
    
    const notifications = [
      { title: '📊 データ同期', message: 'データの同期が開始されました', type: 'info' },
      { title: '✅ 処理完了', message: 'バックアップ処理が完了しました', type: 'success' },
      { title: '⚠️ 容量警告', message: 'ストレージ容量が80%に達しました', type: 'warning' },
      { title: '🔄 システム再起動', message: 'システムの再起動が完了しました', type: 'info' }
    ];

    notifications.forEach((notif, index) => {
      setTimeout(() => {
        this.simulateNotification();
        console.log(`📤 ${index + 1}/4: ${notif.title}`);
      }, index * 1200); // 1.2秒間隔で送信
    });
  }
}

// シングルトンインスタンスを作成してエクスポート
export default new SocketService();
