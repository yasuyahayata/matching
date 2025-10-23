import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import styles from '../styles/Messages.module.css'

export default function MessagesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeMainTab, setActiveMainTab] = useState('matched') // 'matched' or 'inquiry'
  const [activeSubTab, setActiveSubTab] = useState('client') // 'client' or 'freelancer'
  
  const [matchedChats, setMatchedChats] = useState([])
  const [inquiryChats, setInquiryChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadByRoom, setUnreadByRoom] = useState({})

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
      return
    }

    fetchAllChats()
    fetchUnreadCount()
  }, [status])

  const fetchAllChats = async () => {
    try {
      setLoading(true)
      
      // マッチング済みチャットを取得
      const matchedRes = await fetch('/api/messages/matched')
      if (matchedRes.ok) {
        const matchedData = await matchedRes.json()
        setMatchedChats(matchedData)
      }

      // 問い合わせチャットを取得
      const inquiryRes = await fetch('/api/chat-rooms')
      if (inquiryRes.ok) {
        const inquiryData = await inquiryRes.json()
        setInquiryChats(inquiryData)
      }

    } catch (err) {
      console.error('チャット取得エラー:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/chat-rooms/unread-count')
      if (res.ok) {
        const data = await res.json()
        setUnreadByRoom(data.unreadByRoom)
      }
    } catch (err) {
      console.error('未読数取得エラー:', err)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1>💬 メッセージ</h1>
        <div className={styles.error}>
          <p>エラー: {error}</p>
        </div>
      </div>
    )
  }

  const getOtherUser = (room) => {
    if (room.user1_email === session?.user?.email) {
      return { email: room.user2_email, name: room.user2_name }
    }
    return { email: room.user1_email, name: room.user1_name }
  }

  // マッチング済みチャットをフィルタリング
  const filteredMatchedChats = matchedChats.filter(chat => {
    if (activeSubTab === 'client') {
      return chat.isClient // 発注側
    } else {
      return !chat.isClient // 受注側
    }
  })

  // 各タブの件数を計算
  const clientCount = matchedChats.filter(c => c.isClient).length
  const freelancerCount = matchedChats.filter(c => !c.isClient).length

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>💬 メッセージ</h1>
        <p className={styles.subtitle}>案件のやり取りを管理</p>
      </div>

      {/* メインタブ */}
      <div className={styles.mainTabs}>
        <button
          className={`${styles.mainTab} ${activeMainTab === 'matched' ? styles.mainTabActive : ''}`}
          onClick={() => setActiveMainTab('matched')}
        >
          <span className={styles.tabIcon}>🤝</span>
          <span className={styles.tabLabel}>マッチング</span>
          {matchedChats.length > 0 && (
            <span className={styles.tabCount}>{matchedChats.length}</span>
          )}
        </button>
        <button
          className={`${styles.mainTab} ${activeMainTab === 'inquiry' ? styles.mainTabActive : ''}`}
          onClick={() => setActiveMainTab('inquiry')}
        >
          <span className={styles.tabIcon}>💭</span>
          <span className={styles.tabLabel}>問い合わせ</span>
          {inquiryChats.length > 0 && (
            <span className={styles.tabCount}>{inquiryChats.length}</span>
          )}
        </button>
      </div>

      {/* マッチングタブの内容 */}
      {activeMainTab === 'matched' && (
        <>
          {/* サブタブ */}
          <div className={styles.subTabs}>
            <button
              className={`${styles.subTab} ${activeSubTab === 'client' ? styles.subTabActive : ''}`}
              onClick={() => setActiveSubTab('client')}
            >
              <span className={styles.subTabIcon}>📤</span>
              <span className={styles.subTabLabel}>発注側</span>
              {clientCount > 0 && (
                <span className={styles.subTabCount}>{clientCount}</span>
              )}
            </button>
            <button
              className={`${styles.subTab} ${activeSubTab === 'freelancer' ? styles.subTabActive : ''}`}
              onClick={() => setActiveSubTab('freelancer')}
            >
              <span className={styles.subTabIcon}>📥</span>
              <span className={styles.subTabLabel}>受注側</span>
              {freelancerCount > 0 && (
                <span className={styles.subTabCount}>{freelancerCount}</span>
              )}
            </button>
          </div>

          {/* マッチング済みチャット一覧 */}
          {filteredMatchedChats.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                {activeSubTab === 'client' ? '📤' : '📥'}
              </div>
              <p className={styles.emptyText}>
                {activeSubTab === 'client' 
                  ? 'まだ発注した案件はありません' 
                  : 'まだ受注した案件はありません'}
              </p>
              <p className={styles.hint}>
                案件を承認するとここに表示されます
              </p>
            </div>
          ) : (
            <div className={styles.chatList}>
              {filteredMatchedChats.map((chat) => {
                const otherUserName = chat.isClient ? chat.freelancerName : chat.clientName
                const unreadCount = chat.unreadCount || 0
                
                return (
                  <div
                    key={chat.chatRoomId}
                    className={styles.chatItem}
                    onClick={() => router.push(`/chat/${chat.chatRoomId}`)}
                  >
                    <div className={styles.chatInfo}>
                      {/* 案件情報 */}
                      <div className={styles.jobBadge}>
                        {chat.jobCategory && (
                          <span className={styles.category}>{chat.jobCategory}</span>
                        )}
                        <span className={styles.jobTitle}>📋 {chat.jobTitle}</span>
                      </div>

                      {/* ユーザー情報 */}
                      <div className={styles.chatHeader}>
                        <div className={styles.userInfo}>
                          <div className={styles.avatar}>
                            {otherUserName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className={styles.userName}>{otherUserName}</h3>
                            <span className={styles.roleBadge}>
                              {chat.isClient ? '📥 受注企業' : '📤 発注企業'}
                            </span>
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <span className={styles.unreadBadge}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>

                      {/* 最新メッセージ */}
                      {chat.latestMessage && (
                        <p className={styles.latestMessage}>
                          {chat.latestMessage.message.length > 50
                            ? `${chat.latestMessage.message.substring(0, 50)}...`
                            : chat.latestMessage.message}
                        </p>
                      )}
                    </div>

                    <div className={styles.chatMeta}>
                      <span className={styles.timestamp}>
                        {new Date(chat.updatedAt).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className={styles.arrow}>→</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* 問い合わせタブの内容 */}
      {activeMainTab === 'inquiry' && (
        <>
          {inquiryChats.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💭</div>
              <p className={styles.emptyText}>まだ問い合わせはありません</p>
              <p className={styles.hint}>
                案件詳細ページから💬ボタンを押して質問・提案できます
              </p>
            </div>
          ) : (
            <div className={styles.chatList}>
              {inquiryChats.map((room) => {
                const otherUser = getOtherUser(room)
                const unreadCount = unreadByRoom[room.id] || 0
                const jobTitle = room.jobs?.title || '案件情報なし'
                const jobCategory = room.jobs?.category || ''
                
                return (
                  <div
                    key={room.id}
                    className={styles.chatItem}
                    onClick={() => router.push(`/chat/${room.id}`)}
                  >
                    <div className={styles.chatInfo}>
                      {/* 案件情報 */}
                      <div className={styles.jobBadge}>
                        {jobCategory && (
                          <span className={styles.category}>{jobCategory}</span>
                        )}
                        <span className={styles.jobTitle}>📋 {jobTitle}</span>
                      </div>

                      {/* ユーザー情報 */}
                      <div className={styles.chatHeader}>
                        <div className={styles.userInfo}>
                          <div className={styles.avatar}>
                            {otherUser.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className={styles.userName}>{otherUser.name}</h3>
                            <p className={styles.email}>{otherUser.email}</p>
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <span className={styles.unreadBadge}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>

                      {/* 最新メッセージ */}
                      {room.latestMessage && (
                        <p className={styles.latestMessage}>
                          {room.latestMessage.message.length > 50
                            ? `${room.latestMessage.message.substring(0, 50)}...`
                            : room.latestMessage.message}
                        </p>
                      )}
                    </div>

                    <div className={styles.chatMeta}>
                      <span className={styles.timestamp}>
                        {new Date(room.updated_at).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className={styles.arrow}>→</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}