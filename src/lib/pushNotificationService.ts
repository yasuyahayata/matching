// プッシュ通知サービス
// Service Worker、Notification API、FCM統合準備

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  tag?: string;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isServiceWorkerSupported: boolean;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string = ''; // FCM VAPID公開キー（本番では環境変数から取得）

  private constructor() {
    this.init();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // 初期化
  private async init() {
    if (typeof window !== 'undefined') {
      await this.registerServiceWorker();
    }
  }

  // Service Worker登録
  private async registerServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker is not supported');
      return false;
    }

    try {
      // 本番では実際のService Workerファイルを使用
      // 開発環境では模擬実装
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      }).catch(() => {
        // Service Workerファイルが存在しない場合の模擬処理
        console.log('Service Worker file not found, using mock implementation');
        return null;
      });

      if (registration) {
        this.serviceWorkerRegistration = registration;
        console.log('Service Worker registered successfully');
        
        // Service Workerからのメッセージリスナー
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Service Workerメッセージハンドラー
  private handleServiceWorkerMessage = (event: MessageEvent) => {
    console.log('Message from Service Worker:', event.data);
    
    if (event.data.type === 'NOTIFICATION_CLICK') {
      this.handleNotificationClick(event.data.notification);
    }
  };

  // 通知クリック処理
  private handleNotificationClick(notification: any) {
    console.log('Notification clicked:', notification);
    
    // アプリケーション内の適切なページに移動
    if (notification.data?.url) {
      window.open(notification.data.url, '_self');
    }
    
    // カスタムイベントを発火
    window.dispatchEvent(new CustomEvent('notificationClick', {
      detail: notification
    }));
  }

  // 通知権限の状態を取得
  public getPermissionState(): NotificationPermissionState {
    const isSupported = 'Notification' in window;
    const isServiceWorkerSupported = 'serviceWorker' in navigator;
    
    return {
      permission: isSupported ? Notification.permission : 'denied',
      isSupported,
      isServiceWorkerSupported
    };
  }

  // 通知権限をリクエスト
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission was denied');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // プッシュ通知購読
  public async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.error('Service Worker not registered');
      return null;
    }

    if (!('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return null;
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }

      // 既存の購読を確認
      const existingSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      // 新しい購読を作成
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.vapidPublicKey || undefined
      });

      console.log('Push subscription created:', subscription);
      
      // サーバーに購読情報を送信（実装時）
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }

  // プッシュ通知購読解除
  public async unsubscribeFromPush(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        const result = await subscription.unsubscribe();
        console.log('Push subscription cancelled:', result);
        
        // サーバーから購読情報を削除（実装時）
        await this.removeSubscriptionFromServer(subscription);
        
        return result;
      }
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    }
  }

  // ローカル通知を表示
  public async showNotification(options: PushNotificationOptions): Promise<boolean> {
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      if (this.serviceWorkerRegistration) {
        // Service Worker経由で通知を表示
        await this.serviceWorkerRegistration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          badge: options.badge || '/badge.png',
          image: options.image,
          data: options.data,
          tag: options.tag,
          actions: options.actions,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false
        });
      } else {
        // 直接通知を表示
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          data: options.data,
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false
        });

        // 通知クリック処理
        notification.onclick = () => {
          this.handleNotificationClick({
            title: options.title,
            body: options.body,
            data: options.data
          });
          notification.close();
        };

        // 自動閉じる
        if (!options.requireInteraction) {
          setTimeout(() => notification.close(), 5000);
        }
      }

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // 複数の通知を一括表示
  public async showBulkNotifications(notifications: PushNotificationOptions[]): Promise<number> {
    let successCount = 0;
    
    for (const notification of notifications) {
      const success = await this.showNotification(notification);
      if (success) successCount++;
      
      // 通知間隔を設ける
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return successCount;
  }

  // アクティブな通知を取得
  public async getActiveNotifications(): Promise<Notification[]> {
    if (!this.serviceWorkerRegistration) {
      return [];
    }

    try {
      const notifications = await this.serviceWorkerRegistration.getNotifications();
      return notifications;
    } catch (error) {
      console.error('Error getting active notifications:', error);
      return [];
    }
  }

  // 通知をクリア
  public async clearNotifications(tag?: string): Promise<boolean> {
    try {
      const notifications = await this.getActiveNotifications();
      
      for (const notification of notifications) {
        if (!tag || notification.tag === tag) {
          notification.close();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }

  // 購読情報をサーバーに送信（模擬実装）
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // 実際のサーバー実装時に使用
      console.log('Sending subscription to server:', subscription);
      
      // 模擬API呼び出し
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        console.log('Push subscription API not available (development mode)');
        return { ok: true };
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  // 購読情報をサーバーから削除（模擬実装）
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      console.log('Removing subscription from server:', subscription);
      
      // 模擬API呼び出し
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      }).catch(() => {
        console.log('Push unsubscribe API not available (development mode)');
        return { ok: true };
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  // テスト通知群を送信
  public async sendTestNotifications(): Promise<void> {
    const testNotifications: PushNotificationOptions[] = [
      {
        title: '📋 プロジェクト更新',
        body: '新しいタスクが追加されました',
        icon: '📋',
        tag: 'project-update',
        data: { type: 'project', id: 'proj-1' }
      },
      {
        title: '⚠️ 期限通知',
        body: 'タスクの期限が明日です',
        icon: '⚠️',
        tag: 'deadline-warning',
        data: { type: 'deadline', taskId: 'task-1' },
        requireInteraction: true
      },
      {
        title: '✅ タスク完了',
        body: 'チームメンバーがタスクを完了しました',
        icon: '✅',
        tag: 'task-completed',
        data: { type: 'completion', taskId: 'task-2' }
      }
    ];

    const successCount = await this.showBulkNotifications(testNotifications);
    console.log(`${successCount}/${testNotifications.length} notifications sent successfully`);
  }

  // デバッグ情報を取得
  public async getDebugInfo(): Promise<any> {
    const permissionState = this.getPermissionState();
    const activeNotifications = await this.getActiveNotifications();
    
    let subscription = null;
    if (this.serviceWorkerRegistration) {
      try {
        subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      } catch (error) {
        console.error('Error getting subscription:', error);
      }
    }

    return {
      permissionState,
      serviceWorkerRegistered: !!this.serviceWorkerRegistration,
      activeNotificationCount: activeNotifications.length,
      isSubscribed: !!subscription,
      subscriptionEndpoint: subscription?.endpoint || null,
      vapidKeyConfigured: !!this.vapidPublicKey,
      timestamp: new Date().toISOString()
    };
  }
}

// シングルトンインスタンスをエクスポート
export const pushNotificationService = PushNotificationService.getInstance();

export default PushNotificationService;
export type { PushNotificationOptions, NotificationPermissionState };