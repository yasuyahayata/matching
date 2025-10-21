import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Layout from '../components/Layout'
import styles from '../styles/Messages.module.css'

export default function MessagesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [chatRooms, setChatRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
      return
    }

    fetchChatRooms()
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

  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1>💬 メッセージ</h1>
          <p>読み込み中...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1>💬 メッセージ</h1>
          <div className={styles.error}>
            <p>エラー: {error}</p>
          </div>
        </div>
      </Layout>
    )
  }

  // 相手のユーザー情報を取得する関数
  const getOtherUser = (room) => {
    if (room.user1_email === session?.user?.email) {
      return { email: room.user2_email, name: room.user2_name }
    }
    return { email: room.user1_email, name: room.user1_name }
  }

  return (
    <Layout>
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
              return (
                <div
                  key={room.id}
                  className={styles.chatItem}
                  onClick={() => router.push(`/chat/${room.id}`)}
                >
                  <div className={styles.chatInfo}>
                    <h3>{otherUser.name}</h3>
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
    </Layout>
  )
}
