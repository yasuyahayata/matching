import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import styles from '../styles/Messages.module.css'

export default function Messages() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'pending', 'matched'

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
      return
    }

    fetchMessages()
  }, [status])

  const fetchMessages = async () => {
    try {
      setLoading(true)

      // チャットルームと通知を並行取得
      const [chatRoomsRes, notificationsRes] = await Promise.all([
        fetch('/api/chat-rooms'),
        fetch('/api/notifications')
      ])

      if (!chatRoomsRes.ok || !notificationsRes.ok) {
        throw new Error('データの取得に失敗しました')
      }

      const chatRooms = await chatRoomsRes.json()
      const notifications = await notificationsRes.json()

      // メッセージリストを作成
      const messageList = []

      // チャットルーム（マッチング済み）を追加
      chatRooms.forEach(room => {
        const otherUser = 
          room.user1_email === session?.user?.email
            ? { email: room.user2_email, name: room.user2_name }
            : { email: room.user1_email, name: room.user1_name }

        messageList.push({
          id: `chat-${room.id}`,
          type: 'chat',
          status: 'matched',
          roomId: room.id,
          jobId: room.jobs?.id,
          jobTitle: room.jobs?.title || '案件情報なし',
          userName: otherUser.name,
          userEmail: otherUser.email,
          lastMessage: room.last_message,
          lastMessageAt: room.last_message_at,
          unreadCount: room.unread_count || 0,
          createdAt: room.last_message_at || room.created_at
        })
      })

      // 通知（マッチング前）を追加
      notifications.forEach(notification => {
        // 応募通知（発注側）
        if (notification.type === 'application') {
          messageList.push({
            id: `notification-${notification.id}`,
            type: 'notification',
            status: 'pending',
            notificationId: notification.id,
            notificationType: 'application',
            jobId: notification.job_id,
            jobTitle: notification.job_title,
            userName: notification.sender_name,
            userEmail: notification.sender_email,
            message: `${notification.sender_name}さんから応募がありました`,
            isRead: notification.is_read,
            createdAt: notification.created_at,
            applicationId: notification.application_id
          })
        }
        // 承認・拒否通知（受注側）
        else if (notification.type === 'approved' || notification.type === 'rejected') {
          messageList.push({
            id: `notification-${notification.id}`,
            type: 'notification',
            status: notification.type === 'approved' ? 'matched' : 'rejected',
            notificationId: notification.id,
            notificationType: notification.type,
            jobId: notification.job_id,
            jobTitle: notification.job_title,
            userName: notification.sender_name,
            userEmail: notification.sender_email,
            message: notification.type === 'approved' 
              ? '応募が承認されました' 
              : '応募は見送りとなりました',
            isRead: notification.is_read,
            createdAt: notification.created_at
          })
        }
      })

      // 日時順にソート（新しい順）
      messageList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      setMessages(messageList)
    } catch (err) {
      console.error('データ取得エラー:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMessageClick = async (message) => {
    // チャットルームの場合
    if (message.type === 'chat') {
      router.push(`/chat/${message.roomId}`)
      return
    }

    // 通知の場合
    if (message.type === 'notification') {
      // 既読にする
      if (!message.isRead) {
        await markNotificationAsRead(message.notificationId)
      }

      // 承認通知の場合はチャットルームに遷移
      if (message.notificationType === 'approved') {
        const chatMessage = messages.find(m => 
          m.type === 'chat' && 
          m.jobId?.toString() === message.jobId?.toString()
        )
        if (chatMessage) {
          router.push(`/chat/${chatMessage.roomId}`)
          return
        }
      }

      // それ以外は案件詳細へ
      router.push(`/job/${message.jobId}`)
    }
  }

  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        })
      })

      // ローカル状態を更新
      setMessages(prev =>
        prev.map(msg =>
          msg.notificationId === notificationId
            ? { ...msg, isRead: true }
            : msg
        )
      )
    } catch (err) {
      console.error('既読更新エラー:', err)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'マッチング前', color: 'yellow' }
      case 'matched':
        return { text: 'マッチング済', color: 'green' }
      case 'rejected':
        return { text: '見送り', color: 'gray' }
      default:
        return { text: '', color: 'gray' }
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
        <div className={styles.error}>
          <p>エラー: {error}</p>
          <button onClick={() => window.location.reload()}>再読み込み</button>
        </div>
      </div>
    )
  }

  // フィルター処理
  const filteredMessages = messages.filter(message => {
    if (filterStatus === 'all') return true
    return message.status === filterStatus
  })

  const pendingCount = messages.filter(m => m.status === 'pending').length
  const matchedCount = messages.filter(m => m.status === 'matched').length

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>💬 メッセージ</h1>
      </div>

      {/* フィルターボタン */}
      <div className={styles.filterButtons}>
        <button
          className={`${styles.filterButton} ${filterStatus === 'all' ? styles.active : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          すべて ({messages.length})
        </button>
        <button
          className={`${styles.filterButton} ${filterStatus === 'pending' ? styles.active : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          マッチング前({pendingCount})
        </button>
        <button
          className={`${styles.filterButton} ${filterStatus === 'matched' ? styles.active : ''}`}
          onClick={() => setFilterStatus('matched')}
        >
          マッチング済 ({matchedCount})
        </button>
      </div>

      {/* メッセージ一覧 */}
      <div className={styles.content}>
        {filteredMessages.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>メッセージがありません</h3>
            <p>案件に応募すると、ここにメッセージが表示されます。</p>
            <Link href="/" className={styles.emptyButton}>
              案件を探す
            </Link>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {filteredMessages.map((message) => {
              const statusBadge = getStatusBadge(message.status)
              const hasUnread = message.unreadCount > 0 || !message.isRead

              return (
                <div
                  key={message.id}
                  className={`${styles.messageCard} ${hasUnread ? styles.unread : ''}`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className={styles.messageAvatar}>
                    {message.userName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className={styles.messageContent}>
                    <div className={styles.messageHeader}>
                      <div className={styles.messageHeaderLeft}>
                        <h3 className={styles.messageUserName}>{message.userName}</h3>
                        <span className={`${styles.statusBadge} ${styles[`status${statusBadge.color}`]}`}>
                          {statusBadge.text}
                        </span>
                      </div>
                    </div>
                    
                    <p className={styles.messageJobTitle}>
                      📋 {message.jobTitle}
                    </p>
                    
                    {message.lastMessage && (
                      <p className={styles.messageText}>
                        {message.lastMessage}
                      </p>
                    )}
                    
                    {message.message && (
                      <p className={styles.messageText}>
                        {message.message}
                      </p>
                    )}

                    <span className={styles.messageTime}>
                      {formatDate(message.createdAt)}
                    </span>
                  </div>

                  {hasUnread && (
                    <div className={styles.unreadIndicator}>
                      {message.unreadCount > 0 ? message.unreadCount : '●'}
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
