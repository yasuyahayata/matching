import { useState, useEffect } from 'react';
import { pushNotificationService } from '../lib/pushNotificationService';
import type { NotificationPermissionState } from '../lib/pushNotificationService';

const AdvancedNotificationTest: React.FC = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 初期化
  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    try {
      const permission = pushNotificationService.getPermissionState();
      setPermissionState(permission);

      const debug = await pushNotificationService.getDebugInfo();
      setDebugInfo(debug);
      setIsSubscribed(debug.isSubscribed);
    } catch (error) {
      console.error('Error loading initial state:', error);
    }
  };

  // ログを追加
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    const logEntry = `[${timestamp}] ${message}`;
    setTestResults(prev => [logEntry, ...prev].slice(0, 20)); // 最新20件を保持
    console.log(logEntry);
  };

  // 通知権限をリクエスト
  const requestPermission = async () => {
    setLoading(true);
    try {
      addLog('通知権限をリクエスト中...');
      const permission = await pushNotificationService.requestPermission();
      
      if (permission === 'granted') {
        addLog('✅ 通知権限が許可されました');
      } else {
        addLog('❌ 通知権限が拒否されました');
      }
      
      await loadInitialState();
    } catch (error) {
      addLog(`❌ 権限リクエストエラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // プッシュ通知に登録
  const subscribeToPush = async () => {
    setLoading(true);
    try {
      addLog('プッシュ通知購読中...');
      const subscription = await pushNotificationService.subscribeToPush();
      
      if (subscription) {
        addLog('✅ プッシュ通知購読成功');
        setIsSubscribed(true);
      } else {
        addLog('❌ プッシュ通知購読失敗');
      }
      
      await loadInitialState();
    } catch (error) {
      addLog(`❌ プッシュ購読エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // プッシュ通知の購読解除
  const unsubscribeFromPush = async () => {
    setLoading(true);
    try {
      addLog('プッシュ通知購読解除中...');
      const result = await pushNotificationService.unsubscribeFromPush();
      
      if (result) {
        addLog('✅ プッシュ通知購読解除成功');
        setIsSubscribed(false);
      } else {
        addLog('❌ プッシュ通知購読解除失敗');
      }
      
      await loadInitialState();
    } catch (error) {
      addLog(`❌ プッシュ購読解除エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 単発テスト通知
  const sendSingleNotification = async () => {
    try {
      addLog('単発通知送信中...');
      const success = await pushNotificationService.showNotification({
        title: '🔔 テスト通知',
        body: `送信時刻: ${new Date().toLocaleString('ja-JP')}`,
        icon: '/favicon.ico',
        tag: 'test-single',
        data: { test: true, timestamp: Date.now() }
      });
      
      if (success) {
        addLog('✅ 単発通知送信成功');
      } else {
        addLog('❌ 単発通知送信失敗');
      }
    } catch (error) {
      addLog(`❌ 単発通知エラー: ${error}`);
    }
  };

  // 複数テスト通知
  const sendBulkNotifications = async () => {
    setLoading(true);
    try {
      addLog('複数通知送信中...');
      await pushNotificationService.sendTestNotifications();
      addLog('✅ 複数通知送信完了');
    } catch (error) {
      addLog(`❌ 複数通知エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // アクティブ通知を取得
  const getActiveNotifications = async () => {
    try {
      addLog('アクティブ通知取得中...');
      const notifications = await pushNotificationService.getActiveNotifications();
      addLog(`ℹ️ アクティブ通知: ${notifications.length}件`);
      
      notifications.forEach((notification, index) => {
        addLog(`  ${index + 1}. ${notification.title} (tag: ${notification.tag || 'なし'})`);
      });
    } catch (error) {
      addLog(`❌ アクティブ通知取得エラー: ${error}`);
    }
  };

  // 通知をクリア
  const clearNotifications = async () => {
    try {
      addLog('通知クリア中...');
      const success = await pushNotificationService.clearNotifications();
      
      if (success) {
        addLog('✅ 通知クリア成功');
      } else {
        addLog('❌ 通知クリア失敗');
      }
    } catch (error) {
      addLog(`❌ 通知クリアエラー: ${error}`);
    }
  };

  // デバッグ情報を更新
  const refreshDebugInfo = async () => {
    try {
      addLog('デバッグ情報更新中...');
      const debug = await pushNotificationService.getDebugInfo();
      setDebugInfo(debug);
      addLog('✅ デバッグ情報更新完了');
    } catch (error) {
      addLog(`❌ デバッグ情報エラー: ${error}`);
    }
  };

  // 全機能テスト
  const runFullTest = async () => {
    setLoading(true);
    addLog('🚀 全機能テスト開始');
    
    try {
      // 1. 権限確認
      await requestPermission();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. プッシュ購読
      if (permissionState?.permission === 'granted') {
        await subscribeToPush();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // 3. テスト通知送信
      if (isSubscribed || permissionState?.permission === 'granted') {
        await sendSingleNotification();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await sendBulkNotifications();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // 4. アクティブ通知確認
      await getActiveNotifications();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. デバッグ情報更新
      await refreshDebugInfo();
      
      addLog('🎉 全機能テスト完了');
    } catch (error) {
      addLog(`❌ 全機能テストエラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ログをクリア
  const clearLogs = () => {
    setTestResults([]);
    addLog('ログをクリアしました');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">高度な通知機能テスト</h1>
              <p className="text-gray-600 mt-1">
                プッシュ通知、Service Worker、権限管理の統合テスト
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← 戻る
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左カラム: 操作パネル */}
          <div className="space-y-6">
            {/* 権限管理 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🔐 権限管理
              </h2>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>通知サポート:</span>
                      <span className={permissionState?.isSupported ? 'text-green-600' : 'text-red-600'}>
                        {permissionState?.isSupported ? '✅ サポート' : '❌ 未サポート'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Worker:</span>
                      <span className={permissionState?.isServiceWorkerSupported ? 'text-green-600' : 'text-red-600'}>
                        {permissionState?.isServiceWorkerSupported ? '✅ サポート' : '❌ 未サポート'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>通知権限:</span>
                      <span className={
                        permissionState?.permission === 'granted' ? 'text-green-600' :
                        permissionState?.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                      }>
                        {permissionState?.permission === 'granted' ? '✅ 許可済み' :
                         permissionState?.permission === 'denied' ? '❌ 拒否済み' : '⚠️ 未設定'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={requestPermission}
                  disabled={loading || permissionState?.permission === 'granted'}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {permissionState?.permission === 'granted' ? '権限許可済み' : '通知権限をリクエスト'}
                </button>
              </div>
            </div>

            {/* プッシュ通知管理 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📱 プッシュ通知管理
              </h2>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>購読状態:</span>
                      <span className={isSubscribed ? 'text-green-600' : 'text-gray-600'}>
                        {isSubscribed ? '✅ 購読中' : '❌ 未購読'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={subscribeToPush}
                    disabled={loading || isSubscribed || permissionState?.permission !== 'granted'}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    購読開始
                  </button>
                  <button
                    onClick={unsubscribeFromPush}
                    disabled={loading || !isSubscribed}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    購読解除
                  </button>
                </div>
              </div>
            </div>

            {/* テスト操作 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🧪 テスト操作
              </h2>
              
              <div className="space-y-3">
                <button
                  onClick={sendSingleNotification}
                  disabled={loading || permissionState?.permission !== 'granted'}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  単発通知送信
                </button>
                
                <button
                  onClick={sendBulkNotifications}
                  disabled={loading || permissionState?.permission !== 'granted'}
                  className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  複数通知送信（3件）
                </button>
                
                <button
                  onClick={getActiveNotifications}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                >
                  アクティブ通知確認
                </button>
                
                <button
                  onClick={clearNotifications}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  通知をクリア
                </button>
                
                <div className="pt-2 border-t">
                  <button
                    onClick={runFullTest}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {loading ? '実行中...' : '🚀 全機能テスト実行'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右カラム: 結果表示 */}
          <div className="space-y-6">
            {/* テスト結果ログ */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  📋 テスト結果ログ
                </h2>
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  クリア
                </button>
              </div>
              
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-80 overflow-y-auto">
                {testResults.length === 0 ? (
                  <div className="text-gray-500">テスト実行前...</div>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="mb-1">
                      {result}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* デバッグ情報 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  🔧 デバッグ情報
                </h2>
                <button
                  onClick={refreshDebugInfo}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  更新
                </button>
              </div>
              
              {debugInfo ? (
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-60">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  デバッグ情報を読み込み中...
                </div>
              )}
            </div>

            {/* 機能リンク */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🔗 関連機能
              </h2>
              
              <div className="space-y-2">
                <a
                  href="/notification-history"
                  className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  📜 通知履歴
                </a>
                <a
                  href="/notification-settings"
                  className="block px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  ⚙️ 通知設定
                </a>
                <a
                  href="/realtime-notification-test"
                  className="block px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  ⚡ リアルタイム通知テスト
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedNotificationTest;