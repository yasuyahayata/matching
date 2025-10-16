import { useState, useEffect, useRef } from 'react'
import { useSession, getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { jobId, with: withUserId } = router.query
  const [job, setJob] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [otherUser, setOtherUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // ログインチェック
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  useEffect(() => {
    if (jobId && withUserId && session) {
      loadChatData()
      // ポーリングでメッセージを定期的に更新
      const interval = setInterval(loadMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [jobId, withUserId, session])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatData = async () => {
    try {
      // 案件データを読み込み
      const savedJobs = localStorage.getItem('crowdwork_jobs')
      if (savedJobs) {
        const jobs = JSON.parse(savedJobs)
        const foundJob = jobs.find(j => j.id.toString() === jobId)
        if (foundJob) {
          setJob(foundJob)
        } else {
          router.push('/messages')
          return
        }
      }

      // 相手ユーザーの情報を取得
      const savedProfiles = localStorage.getItem(`profile_${withUserId}`)
      if (savedProfiles) {
        const profile = JSON.parse(savedProfiles)
        setOtherUser({
          id: withUserId,
          name: profile.name || withUserId,
          email: withUserId
        })
      } else {
        setOtherUser({
          id: withUserId,
          name: withUserId,
          email: withUserId
        })
      }

      // メッセージを読み込み
      loadMessages()
    } catch (error) {
      console.error('チャットデータの読み込みエラー:', error)
      router.push('/messages')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = () => {
    try {
      const savedMessages = localStorage.getItem('crowdwork_messages')
      if (savedMessages) {
        const allMessages = JSON.parse(savedMessages)
        const chatMessages = allMessages.filter(message => 
          message.jobId.toString() === jobId &&
          ((message.senderId === session.user?.email && message.receiverId === withUserId) ||
           (message.senderId === withUserId && message.receiverId === session.user?.email))
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        
        setMessages(chatMessages)
      }
    } catch (error) {
      console.error('メッセージ読み込みエラー:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const message = {
        id: Date.now(),
        jobId: parseInt(jobId),
        senderId: session.user?.email,
        senderName: session.user?.name || session.user?.email,
        receiverId: withUserId,
        receiverName: otherUser?.name || withUserId,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        type: 'text'
      }

      // 既存のメッセージを取得
      const savedMessages = localStorage.getItem('crowdwork_messages')
      let allMessages = []
      if (savedMessages) {
        allMessages = JSON.parse(savedMessages)
      }

      // 新しいメッセージを追加
      allMessages.push(message)
      localStorage.setItem('crowdwork_messages', JSON.stringify(allMessages))

      // 画面を更新
      setMessages(prev => [...prev, message])
      setNewMessage('')
      
    } catch (error) {
      console.error('メッセージ送信エラー:', error)
      alert('メッセージの送信に失敗しました。')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return '今日'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨日'
    }
    
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    })
  }

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.createdAt).toDateString()
    const previousDate = new Date(previousMessage.createdAt).toDateString()
    
    return currentDate !== previousDate
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job || !otherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">チャットが見つかりません</h2>
          <p className="text-gray-600 mb-6">指定されたチャットは存在しないか、アクセス権限がありません。</p>
          <Link
            href="/messages"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700"
          >
            メッセージ一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              クラウドソーシング MVP
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm">{session.user?.email}</span>
              <Link href="/messages" className="text-gray-600 hover:text-gray-900">メッセージ一覧</Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900">ホーム</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* チャットヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/messages" className="text-blue-600 hover:text-blue-700">
            ← 戻る
          </Link>
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {otherUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{otherUser.name}</h2>
            <Link href={`/job/${jobId}`} className="text-sm text-blue-600 hover:text-blue-700">
              {job.title}
            </Link>
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">会話を始めましょう</h3>
            <p className="text-gray-600">案件について質問や相談をしてみてください。</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id}>
              {/* 日付セパレーター */}
              {shouldShowDateSeparator(message, messages[index - 1]) && (
                <div className="flex justify-center my-4">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              )}
              
              {/* メッセージ */}
              <div className={`flex ${message.senderId === session.user?.email ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.senderId === session.user?.email
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === session.user?.email ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* メッセージ入力エリア */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              '送信'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// サーバーサイドでセッション確認
export async function getServerSideProps(context) {
  const session = await getSession(context)
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: { session },
  }
}
