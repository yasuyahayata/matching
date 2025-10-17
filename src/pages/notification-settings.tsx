import { useState, useEffect } from 'react';

interface NotificationSettings {
  // リアルタイム通知
  realtimeNotifications: boolean;
  soundEnabled: boolean;
  browserNotifications: boolean;
  
  // 通知タイプ別設定
  projectUpdates: boolean;
  taskDeadlines: boolean;
  teamActivities: boolean;
  systemAlerts: boolean;
  securityAlerts: boolean;
  
  // メール通知
  emailNotifications: boolean;
  emailDigest: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  
  // 通知時間帯
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  
  // その他
  notificationLimit: number;
  autoMarkRead: boolean;
}

const NotificationSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    realtimeNotifications: true,
    soundEnabled: true,
    browserNotifications: true,
    projectUpdates: true,
    taskDeadlines: true,
    teamActivities: true,
    systemAlerts: true,
    securityAlerts: true,
    emailNotifications: false,
    emailDigest: 'daily',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    notificationLimit: 50,
    autoMarkRead: false
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // 設定の読み込み
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (error) {
          console.error('設定の読み込みに失敗:', error);
        }
      }
    };

    loadSettings();
  }, []);

  // 設定の保存
  const saveSettings = async () => {
    setLoading(true);
    try {
      // 実際のAPIコールの代わりにlocalStorageに保存
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      // 保存の演出
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('設定の保存に失敗:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 設定の更新
  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // テスト通知送信
  const sendTestNotification = async () => {
    if (settings.browserNotifications) {
      // ブラウザ通知の権限確認
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      if (Notification.permission === 'granted') {
        new Notification('テスト通知', {
          body: '通知設定が正常に動作しています！',
          icon: '/favicon.ico'
        });
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
      } else {
        alert('ブラウザ通知が許可されていません。ブラウザの設定で通知を許可してください。');
      }
    } else {
      alert('ブラウザ通知が無効になっています。');
    }
  };

  // 設定のリセット
  const resetSettings = () => {
    if (confirm('設定をデフォルトに戻しますか？')) {
      setSettings({
        realtimeNotifications: true,
        soundEnabled: true,
        browserNotifications: true,
        projectUpdates: true,
        taskDeadlines: true,
        teamActivities: true,
        systemAlerts: true,
        securityAlerts: true,
        emailNotifications: false,
        emailDigest: 'daily',
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        notificationLimit: 50,
        autoMarkRead: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">通知設定</h1>
              <p className="text-gray-600 mt-1">
                通知の動作をカスタマイズできます
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

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* リアルタイム通知設定 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🔔 リアルタイム通知
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  リアルタイム通知を有効にする
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  新しい通知をリアルタイムで受信します
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.realtimeNotifications}
                onChange={(e) => updateSetting('realtimeNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  通知音を有効にする
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  通知受信時に音を再生します
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                disabled={!settings.realtimeNotifications}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  ブラウザ通知を有効にする
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  デスクトップ通知を表示します
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.browserNotifications}
                onChange={(e) => updateSetting('browserNotifications', e.target.checked)}
                disabled={!settings.realtimeNotifications}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={sendTestNotification}
                disabled={!settings.realtimeNotifications}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                テスト通知を送信
              </button>
              {testNotificationSent && (
                <span className="ml-2 text-sm text-green-600">✓ 送信完了</span>
              )}
            </div>
          </div>
        </div>

        {/* 通知タイプ設定 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📋 通知タイプ
          </h2>
          
          <div className="space-y-4">
            {[
              { key: 'projectUpdates', label: 'プロジェクト更新', desc: 'プロジェクトの変更や更新通知' },
              { key: 'taskDeadlines', label: 'タスク期限', desc: 'タスクの期限が近づいた時の通知' },
              { key: 'teamActivities', label: 'チーム活動', desc: 'チームメンバーの活動通知' },
              { key: 'systemAlerts', label: 'システムアラート', desc: 'システムの重要な通知' },
              { key: 'securityAlerts', label: 'セキュリティアラート', desc: 'セキュリティ関連の重要通知' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[key as keyof NotificationSettings] as boolean}
                  onChange={(e) => updateSetting(key as keyof NotificationSettings, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* メール通知設定 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📧 メール通知
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  メール通知を有効にする
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  重要な通知をメールでも受信します
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  メール送信頻度
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  まとめメールの送信頻度を選択
                </p>
              </div>
              <select
                value={settings.emailDigest}
                onChange={(e) => updateSetting('emailDigest', e.target.value as any)}
                disabled={!settings.emailNotifications}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                <option value="immediate">即時</option>
                <option value="hourly">1時間毎</option>
                <option value="daily">1日1回</option>
                <option value="weekly">1週間1回</option>
                <option value="never">送信しない</option>
              </select>
            </div>
          </div>
        </div>

        {/* おやすみモード */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🌙 おやすみモード
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  おやすみモードを有効にする
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  指定した時間帯は通知を控えめにします
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.quietHoursEnabled}
                onChange={(e) => updateSetting('quietHoursEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始時刻
                </label>
                <input
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                  disabled={!settings.quietHoursEnabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了時刻
                </label>
                <input
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                  disabled={!settings.quietHoursEnabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* その他設定 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ⚙️ その他設定
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  通知履歴の保存件数
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  保存する通知の最大件数（1-200件）
                </p>
              </div>
              <input
                type="number"
                min="1"
                max="200"
                value={settings.notificationLimit}
                onChange={(e) => updateSetting('notificationLimit', parseInt(e.target.value) || 50)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  自動既読機能
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  通知を表示したら自動的に既読にします
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoMarkRead}
                onChange={(e) => updateSetting('autoMarkRead', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-between">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            デフォルトに戻す
          </button>
          
          <div className="flex space-x-3">
            {saved && (
              <span className="text-green-600 text-sm flex items-center">
                ✓ 保存完了
              </span>
            )}
            <button
              onClick={saveSettings}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>

        {/* デバッグ情報 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <details>
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              設定詳細（開発用）
            </summary>
            <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;