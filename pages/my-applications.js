import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ユーティリティ関数
const getApplications = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('crowdwork_applications');
  return data ? JSON.parse(data) : [];
};

const getJobs = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('crowdwork_jobs');
  return data ? JSON.parse(data) : [];
};

const getMessages = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('crowdwork_messages');
  return data ? JSON.parse(data) : [];
};

const saveMessages = (messages) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('crowdwork_messages', JSON.stringify(messages));
};

const getConversationMessages = (jobId, applicationId) => {
  const messages = getMessages();
  return messages.filter(msg => 
    String(msg.jobId) === String(jobId) && 
    String(msg.applicationId) === String(applicationId)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

const sendMessage = (messageData) => {
  const messages = getMessages();
  const newMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...messageData,
    createdAt: new Date().toISOString(),
    isRead: false
  };
  
  const updatedMessages = [...messages, newMessage];
  saveMessages(updatedMessages);
  return newMessage;
};

export default function MyApplications() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // 金額を正しくフォーマットする関数
  const formatBudget = (budget) => {
    if (!budget) return '未設定'
    
    // 既に正しい形式の場合はそのまま返す
    if (typeof budget === 'string' && budget.includes('¥') && !budget.includes('¥¥')) {
      return budget
    }
    
    // 数値や文字列から¥と円を除去して数値部分のみ取得
    const numericValue = budget.toString().replace(/[¥,円]/g, '')
    
    // 数値でない場合は元の値を返す
    if (isNaN(numericValue)) return budget
    
    // 3桁区切りで表示
    return `¥${parseInt(numericValue).toLocaleString()}`
  }

  useEffect(() => {
    const loadData = () => {
      try {
        const allApplications = getApplications();
        const allJobs = getJobs();
        
        // 現在のユーザーの応募のみフィルタ
        const userEmail = session?.user?.email || 'freelancer1@example.com'; // テスト用デフォルト
        const userApplications = allApplications.filter(app => 
          app.applicantEmail === userEmail
        );

        setApplications(userApplications);
        setJobs(allJobs);
        setLoading(false);
        
        console.log('読み込んだ応募データ:', userApplications);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [session]);

  // チャット表示時のメッセージ読み込み
  useEffect(() => {
    if (activeChat) {
      const conversationMessages = getConversationMessages(activeChat.jobId, activeChat.id);
      setMessages(conversationMessages);
    }
  }, [activeChat]);

  // チャット開始
  const startChat = (application) => {
    const job = jobs.find(j => String(j.id) === String(application.jobId));
    setActiveChat({ ...application, job });
    const conversationMessages = getConversationMessages(application.jobId, application.id);
    setMessages(conversationMessages);
  };

  // メッセージ送信
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat || sendingMessage) return;

    try {
      setSendingMessage(true);

      const messageData = {
        jobId: activeChat.jobId,
        applicationId: activeChat.id,
        senderId: session?.user?.email || activeChat.applicantEmail,
        senderName: session?.user?.name || activeChat.applicantName,
        senderType: 'applicant',
        receiverId: activeChat.job?.clientId || activeChat.job?.clientEmail || 'client1@example.com',
        receiverName: activeChat.job?.clientName || 'クライアント',
        message: newMessage.trim()
      };

      const sentMessage = sendMessage(messageData);
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      alert('メッセージの送信に失敗しました');
    } finally {
      setSendingMessage(false);
    }
  };

  // Enterキーでメッセージ送信
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            応募履歴・メッセージ
          </h1>
          <p className="text-gray-600">
            あなたの応募状況とクライアントとのメッセージを確認できます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 応募一覧 */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">
              応募一覧 ({applications.length}件)
            </h3>

            {applications.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-xl text-center">
                <p className="text-gray-600">まだ応募していません</p>
                <Link 
                  href="/"
                  className="mt-4 inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  案件を探す
                </Link>
              </div>
            ) : (
              applications.map((application) => {
                const job = jobs.find(j => String(j.id) === String(application.jobId));
                
                return (
                  <div 
                    key={application.id} 
                    className="bg-white p-6 rounded-xl shadow-xl border-2 border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-800 mb-2">
                          {job?.title || '案件タイトル不明'}
                        </h4>
                        <p className="text-gray-600 mb-2">
                          予算: {formatBudget(job?.budget)}
                        </p>
                        <p className="text-gray-600">
                          期限: {job?.deadline ? new Date(job.deadline).toLocaleDateString('ja-JP') : '未設定'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                          application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'approved' ? 'bg-green-100 text-green-800' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {application.status === 'pending' ? '審査中' :
                           application.status === 'approved' ? '承認済み' :
                           application.status === 'rejected' ? '却下済み' : application.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">あなたの提案：</h5>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {application.proposalText || '提案内容なし'}
                      </p>
                    </div>

                    <div className="mb-4 text-sm text-gray-500">
                      応募日時: {new Date(application.createdAt).toLocaleString('ja-JP')}
                    </div>

                    {/* アクションボタン */}
                    <div className="flex space-x-4">
                      <Link
                        href={`/job/${application.jobId}`}
                        className="flex-1 text-center bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg"
                      >
                        案件詳細を見る
                      </Link>

                      {/* 承認済みの場合のメッセージボタン */}
                      {application.status === 'approved' && (
                        <button
                          onClick={() => startChat(application)}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
                        >
                          💬 メッセージ
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* チャット機能 */}
          <div className="lg:col-span-1">
            {activeChat ? (
              <div className="bg-white rounded-xl shadow-xl p-6 sticky top-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      クライアントとのチャット
                    </h4>
                    <p className="text-sm text-gray-600">
                      {activeChat.job?.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveChat(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* メッセージ履歴 */}
                <div className="h-64 overflow-y-auto mb-4 border rounded-lg p-3 bg-gray-50">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center">まだメッセージがありません</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-3 ${
                          msg.senderType === 'applicant' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-block p-3 rounded-lg max-w-xs ${
                            msg.senderType === 'applicant'
                              ? 'bg-green-500 text-white'
                              : 'bg-white border'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.senderType === 'applicant' ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* メッセージ入力 */}
                <div className="flex space-x-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="メッセージを入力..."
                    className="flex-1 border rounded-lg p-2 text-sm resize-none"
                    rows="2"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? '送信中...' : '送信'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-xl p-6 text-center text-gray-500">
                承認済みの案件を選択してメッセージを開始してください
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}