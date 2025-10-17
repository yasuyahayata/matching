import React, { useState } from 'react';
import Head from 'next/head';

// 基本的な通知型（インポートエラーを避けるため直接定義）
interface SimpleNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
}

const SimpleTestPage = () => {
  const [notifications, setNotifications] = useState<SimpleNotification[]>([
    {
      id: '1',
      title: 'ウェルカム通知',
      message: '通知システムへようこそ！',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5分前
    },
    {
      id: '2',
      title: 'メンテナンス予告',
      message: 'システムメンテナンスを実施します',
      type: 'warning',
      isRead: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1時間前
    },
    {
      id: '3',
      title: '処理完了',
      message: 'データ処理が正常に完了しました',
      type: 'success',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2時間前
    },
    {
      id: '4',
      title: 'エラー発生',
      message: 'システムでエラーが発生しましたが復旧済みです',
      type: 'error',
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1日前
    }
  ]);

  const [testLog, setTestLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
  };

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

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
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

  const runBasicTest = () => {
    addLog('=== 基本機能テスト開始 ===');
    addLog(`総通知数: ${totalCount}`);
    addLog(`未読数: ${unreadCount}`);
    addLog(`既読数: ${totalCount - unreadCount}`);
    addLog('基本機能テスト完了');
  };

  return (
    <>
      <Head>
        <title>通知システム - 基本テスト</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ヘッダー */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              通知システム 基本テスト
            </h1>
            
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900">総通知数</h3>
                <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-medium text-red-900">未読</h3>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-900">既読</h3>
                <p className="text-2xl font-bold text-green-600">{totalCount - unreadCount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900">状態</h3>
                <p className="text-lg font-bold text-green-600">✅ 正常</p>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={runBasicTest}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                基本テスト実行
              </button>
              <button
                onClick={markAllAsRead}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                disabled={unreadCount === 0}
              >
                全て既読
              </button>
              <button
                onClick={() => window.location.href = '/notifications'}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                完全版ページへ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 通知リスト */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">通知一覧</h2>
              
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  通知がありません
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all ${
                        !notification.isRead ? 'ring-2 ring-blue-200' : ''
                      } ${getTypeStyles(notification.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{getTypeIcon(notification.type)}</span>
                            <h3 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                未読
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex space-x-1 ml-4">
                          <button
                            onClick={() => toggleRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded"
                            title={notification.isRead ? '未読にする' : '既読にする'}
                          >
                            {notification.isRead ? '📖' : '📧'}
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded"
                            title="削除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* テストログ */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">テストログ</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                {testLog.length === 0 ? (
                  <p className="text-gray-500 text-sm">ログがありません</p>
                ) : (
                  <div className="space-y-1">
                    {testLog.map((log, index) => (
                      <div key={index} className="text-sm font-mono text-gray-700">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setTestLog([])}
                className="mt-3 text-gray-500 text-sm hover:text-gray-700"
              >
                ログをクリア
              </button>
            </div>
          </div>

          {/* 操作説明 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <h3 className="font-medium text-yellow-800 mb-2">テスト手順:</h3>
            <ol className="list-decimal list-inside text-yellow-700 space-y-1 text-sm">
              <li>「基本テスト実行」ボタンで統計情報をログに出力</li>
              <li>通知の📧ボタンで既読/未読を切り替え</li>
              <li>通知の🗑️ボタンで削除</li>
              <li>「全て既読」ボタンで全通知を既読に</li>
              <li>「完全版ページへ」で高機能な通知履歴ページに移動</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

export default SimpleTestPage;
