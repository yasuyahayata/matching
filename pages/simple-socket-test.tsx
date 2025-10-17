import React, { useState, useEffect } from 'react';
import Head from 'next/head';

const SimpleSocketTest = () => {
  const [status, setStatus] = useState('初期化中...');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setStatus('模擬モードで動作中');
    
    // 5秒後に模擬通知を追加
    const timer = setTimeout(() => {
      const mockNotification = {
        id: '1',
        title: 'テスト通知',
        message: 'システムが正常に動作しています',
        type: 'info',
        createdAt: new Date().toISOString()
      };
      setNotifications([mockNotification]);
      setStatus('✅ 動作確認完了');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const addTestNotification = () => {
    const newNotification = {
      id: Date.now().toString(),
      title: 'マニュアル通知',
      message: `${new Date().toLocaleTimeString()} に作成された通知`,
      type: 'success',
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  return (
    <>
      <Head>
        <title>シンプルSocket.IOテスト</title>
      </Head>

      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          🧪 シンプルSocket.IOテスト
        </h1>
        
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem' 
        }}>
          <p><strong>状態:</strong> {status}</p>
        </div>

        <button
          onClick={addTestNotification}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          テスト通知を追加
        </button>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            通知一覧 ({notifications.length})
          </h2>
          
          {notifications.length === 0 ? (
            <p style={{ color: '#6b7280' }}>通知はありません</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                    {notification.title}
                  </h3>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}>
                    {notification.message}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a href="/realtime-notification-test" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
            → リアルタイム通知テストページ
          </a>
        </div>
      </div>
    </>
  );
};

export default SimpleSocketTest;
