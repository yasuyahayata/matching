import { useState, useEffect } from 'react';
import { Notification } from '../types/notification';

interface NotificationHistoryProps {}

const NotificationHistory: React.FC<NotificationHistoryProps> = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // 模擬通知データの生成
  const generateMockNotifications = (): Notification[] => {
    const mockData: Notification[] = [
      {
        id: '1',
        title: 'プロジェクト更新',
        message: '新しいタスクが追加されました',
        type: 'info',
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分前
        userId: 'user1'
      },
      {
        id: '2',
        title: 'システムメンテナンス',
        message: '明日の午前2時〜4時にメンテナンスを実施します',
        type: 'warning',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2時間前
        userId: 'user1'
      },
      {
        id: '3',
        title: 'チームメンバーが参加',
        message: '田中さんがプロジェクトに参加しました',
        type: 'success',
        isRead: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4時間前
        userId: 'user1'
      },
      {
        id: '4',
        title: 'セキュリティアラート',
        message: '不審なログイン試行を検出しました',
        type: 'error',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1日前
        userId: 'user1'
      },
      {
        id: '5',
        title: 'タスク期限通知',
        message: '「UI設計」の期限が明日です',
        type: 'warning',
        isRead: false,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2日前
        userId: 'user1'
      }
    ];
    return mockData;
  };

  useEffect(() => {
    // 模擬データロード
    const loadNotifications = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); // ロード感の演出
      setNotifications(generateMockNotifications());
      setLoading(false);
    };

    loadNotifications();
  }, []);

  // フィルタリング
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'read') return notification.isRead;
    if (filter === 'unread') return !notification.isRead;
    return true;
  });

  // 時間フォーマット
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  // タイプ別アイコン
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info':
      default: return 'ℹ️';
    }
  };

  // タイプ別色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'info':
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  // 既読/未読切り替え
  const toggleReadStatus = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: !n.isRead } : n
    ));
  };

  // 選択切り替え
  const toggleSelection = (id: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 全選択/全解除
  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  // 一括既読
  const markSelectedAsRead = () => {
    setNotifications(prev => prev.map(n => 
      selectedNotifications.has(n.id) ? { ...n, isRead: true } : n
    ));
    setSelectedNotifications(new Set());
  };

  // 一括削除（模擬）
  const deleteSelected = () => {
    if (confirm(`選択された ${selectedNotifications.size} 件の通知を削除しますか？`)) {
      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
      setSelectedNotifications(new Set());
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">通知履歴</h1>
              <p className="text-gray-600 mt-1">
                全{notifications.length}件 (未読: {unreadCount}件)
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
        {/* フィルターとアクション */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              {/* フィルター */}
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'すべて' },
                  { key: 'unread', label: '未読' },
                  { key: 'read', label: '既読' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter === key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 選択時アクション */}
            {selectedNotifications.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedNotifications.size}件選択中
                </span>
                <button
                  onClick={markSelectedAsRead}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                >
                  既読にする
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                >
                  削除
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 通知一覧 */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* ヘッダー */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={filteredNotifications.length > 0 && selectedNotifications.size === filteredNotifications.length}
                onChange={toggleSelectAll}
                className="mr-3"
              />
              <span className="text-sm font-medium text-gray-700">
                全選択
              </span>
            </div>
          </div>

          {/* 通知リスト */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">読み込み中...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">通知がありません</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => toggleSelection(notification.id)}
                      className="mt-1"
                    />
                    
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                      <span className="text-sm">{getTypeIcon(notification.type)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                          {!notification.isRead && (
                            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          <button
                            onClick={() => toggleReadStatus(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {notification.isRead ? '未読にする' : '既読にする'}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: '全通知', count: notifications.length, color: 'bg-gray-100 text-gray-700' },
            { label: '未読', count: unreadCount, color: 'bg-blue-100 text-blue-700' },
            { label: '既読', count: notifications.length - unreadCount, color: 'bg-green-100 text-green-700' },
            { label: '選択中', count: selectedNotifications.size, color: 'bg-purple-100 text-purple-700' }
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{label}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* デバッグ情報 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <details>
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              デバッグ情報（開発用）
            </summary>
            <div className="mt-2 text-xs text-gray-600">
              <p>フィルター: {filter}</p>
              <p>表示件数: {filteredNotifications.length}/{notifications.length}</p>
              <p>選択件数: {selectedNotifications.size}</p>
              <p>最終更新: {new Date().toLocaleString('ja-JP')}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default NotificationHistory;