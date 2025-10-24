import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import styles from '../styles/Messages.module.css'

export default function Messages() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [chatRooms, setChatRooms] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
      return
    }

    fetchData()
    
    // 5秒ごとに更新
    const interval = setInterval(() => {
      fetchData()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [status])

  const fetchData = async () => {
    try {
      if (loading && chatRooms.length > 0) {
        setLoading(false)
      } else {
        setLoading(true)
      }

      // チャットルームと応募情報を並行取得
      const [chatRoomsRes, applicationsRes] = await Promise.all([
        fetch('/api/chat-rooms'),
        fetch('/api/applications/my-applications')
      ])
      
      if (!chatRoomsRes.ok) {
        throw new Error('チャットルームの取得に失敗しました')
      }

      const chatRoomsData = await chatRoomsRes.json()
      setChatRooms(chatRoomsData)

      // 応募情報を取得（エラーでも続行）
      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json()
        setApplications(applicationsData)
      } else {
        setApplications([])
      }
    } catch (err) {
      console.error('データ取得エラー:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChatRoomClick = (roomId) => {
    router.push(`/chat/${roomId}`)
  }

  const getStatusInfo = (room) => {
    // job_id がある場合、そのjob_idの応募ステータスを確認
    if (room.job_id) {
      // このチャットルームに紐づく応募を探す
      const relatedApplication = applications.find(app => 
        app.job_id?.toString() === room.job_id?.toString() &&
        app.status === 'pending'
      )

      if (relatedApplication) {
        // 応募が審査中なら「審査中」
        return {
          text: '審査中',
          color: 'yellow'
        }
      } else {
        // 承認済みなら「マッチング」
        return {
          text: 'マッチング',
          color: 'green'
        }
      }
    }
    
    // job_id がない場合は「お問い合わせ」
    return {
      text: 'お問い合わせ',
      color: 'blue'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
      return 'たった今'
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分前`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}時間前`
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}日前`
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  if (loading && chatRooms.length === 0) {
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
        <div className={styles.error}>
          <p>エラー: {error}</p>
          <button onClick={() => window.location.reload()}>再読み込み</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>💬 メッセージ</h1>
      </div>

      <div className={styles.content}>
        {chatRooms.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>チャットルームがありません</h3>
            <p>案件に応募して承認されると、チャットルームが作成されます。</p>
            <Link href="/" className={styles.emptyButton}>
              案件を探す
            </Link>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {chatRooms.map((room) => {
              const otherUser = 
                room.user1_email === session?.user?.email
                  ? { email: room.user2_email, name: room.user2_name }
                  : { email: room.user1_email, name: room.user1_name }

              const hasUnread = room.unread_count > 0
              const statusInfo = getStatusInfo(room)

              return (
                <div
                  key={room.id}
                  className={`${styles.messageCard} ${hasUnread ? styles.unread : ''}`}
                  onClick={() => handleChatRoomClick(room.id)}
                >
                  <div className={styles.messageAvatar}>
                    {otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className={styles.messageContent}>
                    <div className={styles.messageHeader}>
                      <div className={styles.messageHeaderLeft}>
                        <h3 className={styles.messageUserName}>{otherUser.name}</h3>
                        <span className={`${styles.statusBadge} ${styles[`status${statusInfo.color}`]}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    </div>
                    
                    <p className={styles.messageJobTitle}>
                      📋 {room.jobs?.title || 'お問い合わせ'}
                    </p>
                    
                    {room.last_message && (
                      <p className={styles.messageText}>
                        {room.last_message}
                      </p>
                    )}

                    <span className={styles.messageTime}>
                      {formatDate(room.last_message_at || room.created_at)}
                    </span>
                  </div>

                  {hasUnread && (
                    <div className={styles.unreadIndicator}>
                      {room.unread_count}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
