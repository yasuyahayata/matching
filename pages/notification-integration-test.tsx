import React from 'react';
import Head from 'next/head';
import NotificationBell from '../components/notifications/NotificationBell';

const NotificationIntegrationTest = () => {
  return (
    <>
      <Head>
        <title>通知システム統合テスト</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* ヘッダーナビゲーション */}
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
                Crowd MVP
              </h1>
            </div>
            
            {/* 右側のナビゲーション */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <a href="/" style={{ color: '#4b5563', textDecoration: 'none' }}>ホーム</a>
              <a href="/login" style={{ color: '#4b5563', textDecoration: 'none' }}>ログイン</a>
              
              {/* 通知ベル */}
              <NotificationBell />
              
              <button style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer'
              }}>
                アカウント
              </button>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main style={{ padding: '2rem 1rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '2rem'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
                🎉 通知システム統合完了！
              </h2>
              
              <div style={{
                backgroundColor: '#d1fae5',
                border: '1px solid #a7f3d0',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{ color: '#065f46', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                  ✅ 統合テスト成功
                </h3>
                <p style={{ color: '#047857', margin: 0 }}>
                  通知ベルが正常にヘッダーに統合されました。右上の🔔アイコンをクリックして動作を確認してください。
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div style={{
                  backgroundColor: '#eff6ff',
                  padding: '1.5rem',
                  borderRadius: '6px',
                  border: '1px solid #bfdbfe'
                }}>
                  <h3 style={{ color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
                    基本機能
                  </h3>
                  <ul style={{ color: '#1d4ed8', margin: 0, paddingLeft: '1.2rem' }}>
                    <li>通知数バッジ表示</li>
                    <li>ポップオーバー表示</li>
                    <li>既読/未読管理</li>
                    <li>通知タイプ別アイコン</li>
                  </ul>
                </div>

                <div style={{
                  backgroundColor: '#f0fdf4',
                  padding: '1.5rem',
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0'
                }}>
                  <h3 style={{ color: '#166534', fontWeight: '600', marginBottom: '0.5rem' }}>
                    次のステップ
                  </h3>
                  <ul style={{ color: '#15803d', margin: 0, paddingLeft: '1.2rem' }}>
                    <li>Socket.IO リアルタイム通知</li>
                    <li>サーバーAPI統合</li>
                    <li>通知履歴ページ</li>
                    <li>設定とカスタマイズ</li>
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <a
                    href="/notification-system-test"
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    詳細テストページ
                  </a>
                  <a
                    href="/simple-test"
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    基本テストページ
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default NotificationIntegrationTest;