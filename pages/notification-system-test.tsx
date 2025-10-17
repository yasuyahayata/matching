import React, { useState, useEffect } from 'react';
import Head from 'next/head';

// 基本的な通知型定義
interface TestNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
}

const NotificationSystemTest = () => {
  const [notifications, setNotifications] = useState<TestNotification[]>([
    {
      id: '1',
      title: 'ウェルカム通知',
      message: '通知システムへようこそ！システムが正常に動作しています。',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: 'システムメンテナンス',
      message: '明日の午前2時からシステムメンテナンスを実施します。',
      type: 'warning',
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      title: 'データ処理完了',
      message: 'バックグラウンドでのデータ処理が正常に完了しました。',
      type: 'success',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const [testLog, setTestLog] = useState<string[]>([]);
  const [socketStatus, setSocketStatus] = useState('未接続');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    addLog('通知システムテストページ読み込み完了');
    addLog(`初期通知数: ${notifications.length}`);
    addLog(`未読通知数: ${notifications.filter(n => !n.isRead).length}`);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalCount = notifications.length;

  const toggleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, isRead: !n.isRead } : n
      )
    );
    addLog(`通知 ${id} の既読状態を切り替えました`);
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    addLog('全ての通知を既読にしました');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    addLog(`通知 ${id} を削除しました`);
  };

  const addTestNotification = () => {
    const newNotification: TestNotification = {
      id: Date.now().toString(),
      title: 'テスト通知',
      message: `${new Date().toLocaleTimeString()} に作成されたテスト通知です。`,
      type: ['info', 'warning', 'error', 'success'][Math.floor(Math.random() * 4)] as any,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    addLog('新しいテスト通知を作成しました');
  };

  const testSocketConnection = () => {
    addLog('Socket.IO接続テスト開始');
    setSocketStatus('接続中...');
    
    // 模擬接続テスト
    setTimeout(() => {
      setSocketStatus('接続成功（模擬）');
      addLog('Socket.IO接続テスト完了');
    }, 1000);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'たった今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <>
      <Head>
        <title>通知システム - 機能テスト</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          {/* ヘッダー */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
            padding: '1.5rem', 
            marginBottom: '1.5rem' 
          }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
              🔔 通知システム機能テスト
            </h1>
            
            {/* 統計情報 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                <h3 style={{ fontWeight: '600', color: '#1e40af', margin: '0 0 0.5rem 0' }}>総通知数</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1d4ed8', margin: 0 }}>{totalCount}</p>
              </div>
              <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '6px', border: '1px solid #fecaca' }}>
                <h3 style={{ fontWeight: '600', color: '#b91c1c', margin: '0 0 0.5rem 0' }}>未読</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>{unreadCount}</p>
              </div>
              <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <h3 style={{ fontWeight: '600', color: '#166534', margin: '0 0 0.5rem 0' }}>既読</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>{totalCount - unreadCount}</p>
              </div>
              <div style={{ backgroundColor: '#fefce8', padding: '1rem', borderRadius: '6px', border: '1px solid #fde047' }}>
                <h3 style={{ fontWeight: '600', color: '#a16207', margin: '0 0 0.5rem 0' }}>Socket状態</h3>
                <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#ca8a04', margin: 0 }}>{socketStatus}</p>
              </div>
            </div>

            {/* アクションボタン */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                onClick={addTestNotification}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                テスト通知追加
              </button>
              <button
                onClick={markAllAsRead}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                disabled={unreadCount === 0}
              >
                全て既読
              </button>
              <button
                onClick={testSocketConnection}
                style={{
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Socket接続テスト
              </button>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* 通知リスト */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
              padding: '1.5rem' 
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                通知一覧
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.map((notification) => {
                  const typeStyles = getTypeStyles(notification.type);
                  return (
                    <div
                      key={notification.id}
                      style={{
                        ...typeStyles,
                        padding: '1rem',
                        borderRadius: '6px',
                        border: `1px solid ${typeStyles.borderColor}`,
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1rem' }}>{getTypeIcon(notification.type)}</span>
                            <h3 style={{ 
                              fontWeight: notification.isRead ? 'normal' : 'bold', 
                              margin: 0,
                              fontSize: '0.9rem'
                            }}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.5rem',
                                borderRadius: '999px'
                              }}>
                                未読
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.8rem', margin: '0.25rem 0', lineHeight: '1.4' }}>
                            {notification.message}
                          </p>
                          <p style={{ fontSize: '0.7rem', margin: 0, opacity: 0.7 }}>
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                          <button
                            onClick={() => toggleRead(notification.id)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '0.25rem'
                            }}
                            title={notification.isRead ? '未読にする' : '既読にする'}
                          >
                            {notification.isRead ? '📖' : '📧'}
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '0.25rem'
                            }}
                            title="削除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* テストログ */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
              padding: '1.5rem' 
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                テストログ
              </h2>
              
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                padding: '1rem',
                height: '400px',
                overflowY: 'auto',
                border: '1px solid #e5e7eb'
              }}>
                {testLog.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>ログはありません</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {testLog.map((log, index) => (
                      <div key={index} style={{ 
                        fontSize: '0.8rem', 
                        fontFamily: 'monospace', 
                        color: '#374151' 
                      }}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setTestLog([])}
                style={{
                  marginTop: '0.75rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                ログをクリア
              </button>
            </div>
          </div>

          {/* ナビゲーション */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>← ホームページ</a>
              <a href="/simple-test" style={{ color: '#3b82f6', textDecoration: 'underline' }}>基本テストページ</a>
              <a href="/login" style={{ color: '#3b82f6', textDecoration: 'underline' }}>ログインページ</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationSystemTest;
