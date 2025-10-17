import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import RealtimeNotificationBell from '../components/notifications/RealtimeNotificationBell';
import socketService from '../lib/socketService';

const RealtimeNotificationTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('未接続');
  const [testLog, setTestLog] = useState<string[]>([]);
  const [autoTestEnabled, setAutoTestEnabled] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    addLog('リアルタイム通知テストページが読み込まれました');

    // Socket接続状態監視
    const handleSocketConnected = () => {
      setConnectionStatus('接続済み');
      addLog('✅ Socket.IO接続成功');
    };

    const handleSocketDisconnected = (reason: string) => {
      setConnectionStatus('切断');
      addLog(`❌ Socket.IO切断: ${reason}`);
    };

    const handleNewNotification = (notification: any) => {
      addLog(`🔔 新しい通知受信: ${notification.title}`);
    };

    socketService.on('socketConnected', handleSocketConnected);
    socketService.on('socketDisconnected', handleSocketDisconnected);
    socketService.on('newNotification', handleNewNotification);

    return () => {
      socketService.off('socketConnected', handleSocketConnected);
      socketService.off('socketDisconnected', handleSocketDisconnected);  
      socketService.off('newNotification', handleNewNotification);
    };
  }, []);

  // 自動テスト機能
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoTestEnabled) {
      addLog('🔄 自動テスト開始（30秒間隔）');
      interval = setInterval(() => {
        socketService.simulateNotification();
        addLog('🧪 自動テスト通知を送信');
      }, 30000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoTestEnabled]);

  const runBasicTest = () => {
    addLog('=== 基本機能テスト開始 ===');
    addLog(`接続状態: ${connectionStatus}`);
    addLog(`Socket接続中: ${socketService.isConnected()}`);
    socketService.testConnection();
    addLog('基本機能テスト完了');
  };

  const sendTestNotifications = () => {
    addLog('📨 複数テスト通知送信開始');
    
    const testNotifications = [
      { title: 'システム通知', message: 'システムが正常に動作しています', type: 'info' },
      { title: '警告通知', message: 'メンテナンスが予定されています', type: 'warning' },
      { title: '成功通知', message: 'データの同期が完了しました', type: 'success' },
      { title: 'エラー通知', message: '一時的なエラーが発生しましたが解決しました', type: 'error' }
    ];

    testNotifications.forEach((notification, index) => {
      setTimeout(() => {
        socketService.simulateNotification();
        addLog(`📤 ${notification.title}を送信`);
      }, index * 1000);
    });
  };

  return (
    <>
      <Head>
        <title>リアルタイム通知システム - テスト</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* ヘッダー */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px'
          }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                🔔 リアルタイム通知テスト
              </h1>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ 
                fontSize: '0.8rem', 
                color: connectionStatus === '接続済み' ? '#16a34a' : '#dc2626' 
              }}>
                {connectionStatus === '接続済み' ? '🟢' : '🔴'} {connectionStatus}
              </span>
              <RealtimeNotificationBell />
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main style={{ padding: '2rem 1rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* 操作パネル */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                テスト操作パネル
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  onClick={runBasicTest}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  🧪 基本機能テスト
                </button>
                
                <button
                  onClick={() => socketService.simulateNotification()}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  📤 単一通知送信
                </button>
                
                <button
                  onClick={sendTestNotifications}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  📨 複数通知送信
                </button>
                
                <button
                  onClick={() => socketService.testConnection()}
                  style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  🔧 接続テスト
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="auto-test"
                  checked={autoTestEnabled}
                  onChange={(e) => setAutoTestEnabled(e.target.checked)}
                />
                <label htmlFor="auto-test" style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                  自動テスト（30秒間隔で通知送信）
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* 機能説明 */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '1.5rem'
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  🚀 リアルタイム機能
                </h3>
                
                <div style={{ space: '1rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                      ✅ 実装済み機能
                    </h4>
                    <ul style={{ fontSize: '0.8rem', color: '#4b5563', margin: 0, paddingLeft: '1.2rem' }}>
                      <li>Socket.IO リアルタイム接続</li>
                      <li>通知の即座受信・表示</li>
                      <li>ブラウザ通知連携</li>
                      <li>接続状態監視</li>
                      <li>自動再接続機能</li>
                      <li>未読バッジアニメーション</li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                      🧪 テスト方法
                    </h4>
                    <ol style={{ fontSize: '0.8rem', color: '#4b5563', margin: 0, paddingLeft: '1.2rem' }}>
                      <li>右上の通知ベルを確認</li>
                      <li>「単一通知送信」ボタンをクリック</li>
                      <li>通知ベルのバッジが増加することを確認</li>
                      <li>通知ベルをクリックして詳細を確認</li>
                      <li>ブラウザ通知が表示されることを確認</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* テストログ */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                    📊 テストログ
                  </h3>
                  <button
                    onClick={() => setTestLog([])}
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
                    クリア
                  </button>
                </div>
                
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  padding: '1rem',
                  height: '300px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb'
                }}>
                  {testLog.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>
                      ログはありません
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {testLog.map((log, index) => (
                        <div key={index} style={{
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                          color: '#374151',
                          padding: '2px 0'
                        }}>
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ナビゲーション */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="/notification-integration-test" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  ← 統合テスト
                </a>
                <a href="/notification-system-test" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  基本機能テスト
                </a>
                <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  ホーム
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default RealtimeNotificationTest;
