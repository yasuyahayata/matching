import { useState, useEffect } from 'react'
import { useSession, getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Messages() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

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
    if (session) {
      loadConversations()
    }
  }, [session])

  const loadConversations = () => {
    try {
      const savedMessages = localStorage.getItem('crowdwork_messages')
      const savedJobs = localStorage.getItem('crowdwork_jobs')
      
      if (savedMessages && savedJobs) {
        const messages = JSON.parse(savedMessages)
        const jobs = JSON.parse(savedJobs)
        
        // ユーザーが参加している会話を取得
        const userConversations = {}
        
        messages.forEach(message => {
          const conversationKey = `${message.jobId}_${message.senderId}_${message.receiverId}`
          const normalizedKey = [message.jobId, message.senderId, message.receiverId].sort().join('_')
          
          // ユーザーが送信者または受信者の場合のみ
          if (message.senderId === session.user?.email || message.receiverId === session.user?.email) {
            if (!userConversations[normalizedKey]) {
              // 相手のIDを取得
              const otherUserId = message.senderId === session.user?.email ? message.receiverId : message.senderId
              const job = jobs.find(j => j.id.toString() === message.jobId.toString())
              
              userConversations[normalizedKey] = {
                id: normalizedKey,
                jobId: message.jobId,
                jobTitle: job?.title || '案件が削除されました',
                otherUserId: otherUserId,
                otherUserName: message.senderId === session.user?.email ? message.receiverName : message.senderName,
                lastMessage: message.content,
                lastMessageTime: message.createdAt,
                unreadCount: 0,
                messages: []
              }
            }
            
            // より新しいメッセージの場合は更新
            if (new Date(message.createdAt) > new Date(userConversations[normalizedKey].lastMessageTime)) {
              userConversations[normalizedKey].lastMessage = message.content
              userConversations[normalizedKey].lastMessageTime = message.createdAt
            }
            
            userConversations[normalizedKey].messages.push(message)
          }
        })
        
        // 配列に変換して時間順でソート
        const conversationList = Object.values(userConversations).sort((a, b) => 
          new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        )
        
        setConversations(conversationList)
      }
    } catch (error) {
      console.error('会話データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return '今'
    if (diffInMinutes < 60) return `${diffInMinutes}分前`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}日前`
    
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              クラウドソーシング MVP
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm">{session.user?.email}</span>
              <Link href="/profile" className="text-gray-600 hover:text-gray-900">プロフィール</Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900">ホーム</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl">
          {/* ヘッダー */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">メッセージ</h1>
            <p className="text-gray-600 mt-1">クライアントやフリーランサーとのやり取り</p>
          </div>

          {/* 会話一覧 */}
          <div className="divide-y divide-gray-100">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.jobId}?with=${encodeURIComponent(conversation.otherUserId)}`}
                  className="block hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="px-8 py-6 flex items-center space-x-4">
                    {/* アバター */}
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {conversation.otherUserName.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* 会話情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {conversation.otherUserName}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-blue-600 mb-1 truncate">
                        {conversation.jobTitle}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    
                    {/* 未読バッジ */}
                    {conversation.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-8 py-16 text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">メッセージがありません</h3>
                <p className="text-gray-600 mb-6">案件に応募したり、応募を受けたりするとメッセージのやり取りができます。</p>
                <div className="space-y-3">
                  <Link
                    href="/"
                    className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    案件を探す
                  </Link>
                  <div className="text-gray-500">または</div>
                  <Link
                    href="/post-job"
                    className="inline-block bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200"
                  >
                    案件を投稿する
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
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
