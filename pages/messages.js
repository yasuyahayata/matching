import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import styles from '../styles/Messages.module.css'

export default function MessagesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [chatRooms, setChatRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadByRoom, setUnreadByRoom] = useState({})

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
      return
    }

    fetchChatRooms()
    fetchUnreadCount()
  }, [status])

  const fetchChatRooms = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/chat-rooms')
      
      if (!res.ok) {
        throw new Error('チャットルームの取得に失敗しました')
      }

      const data = await res.json()
      setChatRooms(data)
    } catch (err) {
      console.error('チャットルーム取得エラー:', err)
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
        <h1>💬 メッセージ</h1>
        <p>読み込み中...</p>
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

  return (
    <div className={styles.container}>
      <h1>💬 メッセージ</h1>

      {chatRooms.length === 0 ? (
        <div className={styles.emptyState}>
          <p>まだメッセージがありません</p>
          <p className={styles.hint}>
            案件詳細ページから💬ボタンを押してチャットを開始できます
          </p>
        </div>
      ) : (
        <div className={styles.chatList}>
          {chatRooms.map((room) => {
            const otherUser = getOtherUser(room)
            const unreadCount = unreadByRoom[room.id] || 0
            
            return (
              <div
                key={room.id}
                className={styles.chatItem}
                onClick={() => router.push(`/chat/${room.id}`)}
              >
                <div className={styles.chatInfo}>
                  <div className={styles.chatHeader}>
                    <h3>{otherUser.name}</h3>
                    {unreadCount > 0 && (
                      <span className={styles.unreadBadge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <p className={styles.email}>{otherUser.email}</p>
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
    </div>
  )
}
