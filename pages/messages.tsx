import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface Match {
  id: string;
  jobTitle: string;
  clientName: string;
  freelancerName: string;
  status: string;
}

const MessagesPage: React.FC = () => {
  const router = useRouter();
  const { match: matchId } = router.query;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState({
    id: 'user1',
    name: '田中太郎',
    type: 'freelancer'
  });
  const [matchInfo, setMatchInfo] = useState<Match | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setMounted(true);
  }, []);

  // Socket.IO接続（オプショナル）
  useEffect(() => {
    if (!mounted) return;
    
    // Socket.IOの動的インポート
    import('socket.io-client').then((io) => {
      const socketConnection = io.default('http://localhost:3002');
      setSocket(socketConnection);

      // 認証
      socketConnection.emit('authenticate', {
        userId: currentUser.id,
        token: 'mock_token_123'
      });

      // 接続状態の管理
      socketConnection.on('authenticated', (data) => {
        console.log('認証成功:', data);
        setIsConnected(true);
      });

      socketConnection.on('connect', () => {
        console.log('Socket接続成功');
        setIsConnected(true);
      });

      socketConnection.on('disconnect', () => {
        console.log('Socket切断');
        setIsConnected(false);
      });

      // メッセージ受信
      socketConnection.on('newMessage', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socketConnection.disconnect();
      };
    }).catch((error) => {
      console.warn('Socket.IO connection failed:', error);
      // Socket.IOが使用できない場合でもチャット機能は動作
    });
  }, [currentUser.id, mounted]);

  // 模擬データの読み込み
  useEffect(() => {
    if (!mounted) return;
    
    // 模擬マッチング情報
    setMatchInfo({
      id: matchId as string || 'match1',
      jobTitle: 'Webサイト制作プロジェクト',
      clientName: '株式会社サンプル',
      freelancerName: '田中太郎',
      status: 'active'
    });

    // 模擬メッセージ履歴
    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: 'client1',
        senderName: '株式会社サンプル',
        message: 'はじめまして！Webサイト制作の件でご連絡いたします。',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        isRead: true
      },
      {
        id: '2',
        senderId: 'user1',
        senderName: '田中太郎',
        message: 'こんにちは！よろしくお願いいたします。プロジェクトの詳細について教えていただけますでしょうか？',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        isRead: true
      },
      {
        id: '3',
        senderId: 'client1',
        senderName: '株式会社サンプル',
        message: 'コーポレートサイトのリニューアルを予定しています。現在のサイトの問題点を解決し、よりモダンなデザインにしたいと考えています。',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        isRead: true
      }
    ];
    setMessages(mockMessages);
  }, [matchId, mounted]);

  // メッセージ送信（Socket.IO無しでも動作）
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      message: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // ローカルに追加（必ず実行）
    setMessages(prev => [...prev, messageData]);

    // Socket.IOで送信（利用可能な場合のみ）
    if (socket && isConnected) {
      try {
        socket.emit('sendMessage', {
          targetUserId: currentUser.type === 'freelancer' ? 'client1' : 'user1',
          message: newMessage,
          matchId: matchId
        });
        console.log('Socket.IOでメッセージ送信');
      } catch (error) {
        console.warn('Socket.IO送信エラー:', error);
      }
    } else {
      console.log('ローカルモードでメッセージ送信');
    }

    setNewMessage('');
  };

  // Enterキーでメッセージ送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // メッセージ時間のフォーマット
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ← 戻る
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {matchInfo?.jobTitle}
                </h1>
                <p className="text-sm text-gray-600">
                  {currentUser.type === 'freelancer' 
                    ? `クライアント: ${matchInfo?.clientName}`
                    : `フリーランサー: ${matchInfo?.freelancerName}`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? 'リアルタイム' : 'ローカルモード'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex h-[calc(100vh-120px)]">
          {/* メッセージエリア */}
          <div className="flex-1 flex flex-col bg-white">
            {/* メッセージ一覧 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === currentUser.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}>
                    {message.senderId !== currentUser.id && (
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === currentUser.id 
                        ? 'text-blue-100' 
                        : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* メッセージ入力エリア */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  送信
                </button>
              </div>
              
              {/* 状態表示 */}
              <div className="mt-2 text-xs">
                {isConnected ? (
                  <p className="text-green-600">✅ リアルタイム通信が有効です</p>
                ) : (
                  <p className="text-yellow-600">📱 ローカルモードで動作中（メッセージ送信は可能）</p>
                )}
              </div>
            </div>
          </div>

          {/* サイドバー */}
          <div className="w-80 bg-gray-50 border-l">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">プロジェクト情報</h3>
              
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">案件名</h4>
                  <p className="text-sm text-gray-600">{matchInfo?.jobTitle}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">ステータス</h4>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    進行中
                  </span>
                </div>
                
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">参加者</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                        C
                      </div>
                      <span className="text-sm">{matchInfo?.clientName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                        F
                      </div>
                      <span className="text-sm">{matchInfo?.freelancerName}</span>
                    </div>
                  </div>
                </div>

                {/* テスト用デバッグ */}
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">デバッグ情報</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>メッセージ数: {messages.length}</p>
                    <p>入力文字数: {newMessage.length}</p>
                    <p>Socket接続: {isConnected ? '✅' : '❌'}</p>
                    <p>送信可能: {newMessage.trim() ? '✅' : '❌'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
