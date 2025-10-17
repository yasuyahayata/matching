import React, { useState, useEffect } from 'react';

// 基本的な通知型（簡略版）
interface SimpleNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SimpleNotification[]>([
    {
      id: '1',
      title: 'ウェルカム通知',
      message: '通知システムが正常に動作しています！',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: 'システム更新',
      message: '新機能が追加されました。',
      type: 'success',
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    }
  ]);

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

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
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
        title="通知"
      >
        🔔
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
            fontWeight: 'bold'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
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
            width: '320px',
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
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                通知 {unreadCount > 0 && `(${unreadCount})`}
              </h3>
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

            {/* 通知リスト */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  通知はありません
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => {
                  const typeStyles = getTypeStyles(notification.type);
                  return (
                    <div
                      key={notification.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        backgroundColor: !notification.isRead ? '#f8fafc' : 'white'
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

            {/* フッター */}
            {notifications.length > 5 && (
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center'
              }}>
                <a
                  href="/notification-system-test"
                  style={{
                    color: '#3b82f6',
                    fontSize: '0.8rem',
                    textDecoration: 'none'
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  全ての通知を表示 →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;