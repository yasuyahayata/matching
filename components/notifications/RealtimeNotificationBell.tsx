import React, { useState, useEffect } from 'react';
import socketService from '../../lib/socketService';

// 基本的な通知型
interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
}

const RealtimeNotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([
    {
      id: '1',
      title: 'システム起動通知',
      message: 'リアルタイム通知システムが正常に起動しました。',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    }
  ]);
  
  const [socketStatus, setSocketStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connectionLog, setConnectionLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLog(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    addLog('リアルタイム通知システム初期化開始');

    // ブラウザ通知の許可を求める
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        addLog(`ブラウザ通知許可: ${permission}`);
      });
    }

    // Socket.IOイベントリスナーを設定
    const handleSocketConnected = () => {
      setSocketStatus('connected');
      addLog('✅ Socket.IO接続成功');
    };

    const handleSocketDisconnected = (reason: string) => {
      setSocketStatus('disconnected');
      addLog(`❌ Socket.IO切断: ${reason}`);
    };

    const handleNewNotification = (notification: RealtimeNotification) => {
      addLog(`🔔 新しい通知受信: ${notification.title}`);
      setNotifications(prev => [notification, ...prev]);
      
      // 未読通知のカウント更新のため、既読状態をfalseに設定
      const newNotification = { ...notification, isRead: false };
      setNotifications(prev => [newNotification, ...prev.slice(0, 19)]); // 最大20件まで保持
    };

    const handleNotificationClicked = (notification: RealtimeNotification) => {
      addLog(`👆 通知クリック: ${notification.title}`);
      markAsRead(notification.id);
    };

    // イベントリスナーを登録
    socketService.on('socketConnected', handleSocketConnected);
    socketService.on('socketDisconnected', handleSocketDisconnected);
    socketService.on('newNotification', handleNewNotification);
    socketService.on('notificationClicked', handleNotificationClicked);

    // Socket接続を試行
    setSocketStatus('connecting');
    addLog('Socket.IO接続試行中...');
    socketService.connect('demo-user-token');

    // クリーンアップ
    return () => {
      socketService.off('socketConnected', handleSocketConnected);
      socketService.off('socketDisconnected', handleSocketDisconnected);
      socketService.off('newNotification', handleNewNotification);
      socketService.off('notificationClicked', handleNotificationClicked);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'たった今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'error':
        return { backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' };
      case 'warning':
        return { backgroundColor: '#fffbeb', borderColor: '#fed7aa', color: '#d97706' };
      case 'success':
        return { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' };
      default:
        return { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' };
    }
  };

  const getStatusIcon = () => {
    switch (socketStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      default: return '🔴';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    addLog(`📖 通知を既読: ${notificationId}`);
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    addLog('📚 全通知を既読にしました');
  };

  const simulateNotification = () => {
    addLog('🧪 模擬通知を送信');
    socketService.simulateNotification();
  };

  const testConnection = () => {
    addLog('🔧 接続テスト実行');
    socketService.testConnection();
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* 通知ベルボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '50%',
          fontSize: '1.2rem'
        }}
        title={`通知 (${socketStatus})`}
      >
        🔔
        
        {/* 未読バッジ */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* 接続状態インジケーター */}
        <span style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          fontSize: '0.6rem'
        }}>
          {getStatusIcon()}
        </span>
      </button>

      {/* 通知ドロップダウン */}
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* 通知パネル */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            width: '380px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 20,
            marginTop: '8px'
          }}>
            {/* ヘッダー */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                  リアルタイム通知 {unreadCount > 0 && `(${unreadCount})`}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#6b7280' }}>
                  {getStatusIcon()} {socketStatus === 'connected' ? '接続中' : socketStatus === 'connecting' ? '接続中...' : '切断'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    simulateNotification();
                  }}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                  title="模擬通知を送信"
                >
                  テスト
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#3b82f6',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    全て既読
                  </button>
                )}
              </div>
            </div>

            {/* 通知リスト */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  通知はありません
                </div>
              ) : (
                notifications.slice(0, 6).map((notification) => {
                  const typeStyles = getTypeStyles(notification.type);
                  return (
                    <div
                      key={notification.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        backgroundColor: !notification.isRead ? '#f8fafc' : 'white',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '1rem', marginTop: '2px' }}>
                          {getTypeIcon(notification.type)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h4 style={{
                              margin: 0,
                              fontSize: '0.9rem',
                              fontWeight: !notification.isRead ? '600' : 'normal',
                              color: '#111827'
                            }}>
                              {notification.title}
                            </h4>
                            <span style={{
                              ...typeStyles,
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${typeStyles.borderColor}`
                            }}>
                              {notification.type}
                            </span>
                          </div>
                          <p style={{
                            margin: '4px 0',
                            fontSize: '0.8rem',
                            color: '#4b5563',
                            lineHeight: '1.4'
                          }}>
                            {notification.message}
                          </p>
                          <p style={{
                            margin: 0,
                            fontSize: '0.7rem',
                            color: '#9ca3af'
                          }}>
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '50%',
                            marginTop: '6px'
                          }} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 接続ログ（開発用） */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <details>
                <summary style={{ fontSize: '0.8rem', color: '#6b7280', cursor: 'pointer' }}>
                  接続ログ ({connectionLog.length})
                </summary>
                <div style={{
                  marginTop: '8px',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  color: '#4b5563'
                }}>
                  {connectionLog.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </details>
            </div>

            {/* フッター */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  testConnection();
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
              >
                接続テスト
              </button>
              <a
                href="/realtime-notification-test"
                style={{
                  color: '#3b82f6',
                  fontSize: '0.8rem',
                  textDecoration: 'none'
                }}
                onClick={() => setIsOpen(false)}
              >
                詳細ページ →
              </a>
            </div>
          </div>
        </>
      )}

      {/* CSSアニメーション */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default RealtimeNotificationBell;
