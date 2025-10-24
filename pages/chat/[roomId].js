import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import styles from '../../styles/Chat.module.css'

export default function ChatRoom() {
  const router = useRouter()
  const { roomId } = router.query
  const { data: session, status } = useSession()

  const [chatRoom, setChatRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [notificationPermission, setNotificationPermission] = useState('default')
  
  const lastMessageCountRef = useRef(0)
  const hasMarkedAsReadRef = useRef(false)

  // 通知権限をリクエスト
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission)
        })
      } else {
        setNotificationPermission(Notification.permission)
      }
    }
  }, [])

  // チャットルーム情報とメッセージを取得
  useEffect(() => {
    if (!roomId || status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
      return
    }

    fetchChatData()
    // 5秒ごとに新しいメッセージをチェック
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [roomId, status])

  // ページを開いたら既読にする
  useEffect(() => {
    if (roomId && !hasMarkedAsReadRef.current && messages.length > 0) {
      markAsRead()
      hasMarkedAsReadRef.current = true
    }
  }, [roomId, messages])

  // ページがアクティブになったら既読にする
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && roomId) {
        markAsRead()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [roomId])

  const fetchChatData = async () => {
    try {
      setLoading(true)
      setError(null)

      // チャットルーム情報を取得
      const roomRes = await fetch(`/api/chat-rooms/${roomId}`)
      if (!roomRes.ok) {
        throw new Error('チャットルームが見つかりません')
      }
      const roomData = await roomRes.json()
      setChatRoom(roomData)

      // メッセージを取得
      await fetchMessages()
    } catch (err) {
      console.error('データ取得エラー:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat-rooms/${roomId}/messages`)
      if (!res.ok) {
        throw new Error('メッセージの取得に失敗しました')
      }
      const data = await res.json()
      
      // 新しいメッセージがあり、それが相手からのメッセージの場合に通知
      if (data.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
        const newMessages = data.slice(lastMessageCountRef.current)
        newMessages.forEach(msg => {
          // 自分以外のメッセージで通知
          if (msg.sender_email !== session?.user?.email) {
            showNotification(msg.sender_name, msg.message)
          }
        })
        
        // 新しいメッセージがあったら既読にする
        if (!document.hidden) {
          markAsRead()
        }
      }
      
      lastMessageCountRef.current = data.length
      setMessages(data)
    } catch (err) {
      console.error('メッセージ取得エラー:', err)
    }
  }

  // メッセージを既読にする
  const markAsRead = async () => {
    try {
      const response = await fetch(`/api/chat-rooms/${roomId}/mark-as-read`, {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('既読にしました:', data.markedCount, '件')
        
        // 既読にしたことをブラウザのイベントで通知
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('messagesRead'))
        }
      }
    } catch (err) {
      console.error('既読エラー:', err)
    }
  }

  const showNotification = (senderName, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // ページが非アクティブの時のみ通知を表示
      if (document.hidden) {
        const notification = new Notification(`💬 ${senderName}からメッセージ`, {
          body: message.length > 50 ? message.substring(0, 50) + '...' : message,
          icon: '/favicon.ico',
          tag: 'chat-message',
          requireInteraction: false
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        // 5秒後に自動で閉じる
        setTimeout(() => notification.close(), 5000)
      }
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return
    if (!session?.user?.email || !session?.user?.name) {
      alert('ユーザー情報が取得できません')
      return
    }

    setSending(true)

    try {
      const res = await fetch(`/api/chat-rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          senderEmail: session.user.email,
          senderName: session.user.name,
        }),
      })

      if (!res.ok) {
        throw new Error('メッセージの送信に失敗しました')
      }

      setNewMessage('')
      await fetchMessages()
    } catch (err) {
      console.error('送信エラー:', err)
      alert('メッセージの送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ maxWidth: '56rem', width: '100%' }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container} style={{ maxWidth: '56rem', width: '100%' }}>
        <div className={styles.error}>
          <p>エラー: {error}</p>
          <button onClick={() => router.back()}>戻る</button>
        </div>
      </div>
    )
  }

  if (!chatRoom) {
    return (
      <div className={styles.container} style={{ maxWidth: '56rem', width: '100%' }}>
        <p>チャットルームが見つかりません</p>
      </div>
    )
  }

  // 相手のユーザー情報を取得
  const otherUser = 
    chatRoom.user1_email === session?.user?.email
      ? { email: chatRoom.user2_email, name: chatRoom.user2_name }
      : { email: chatRoom.user1_email, name: chatRoom.user1_name }

  return (
    <div className={styles.container} style={{ maxWidth: '56rem', width: '100%' }}>
      {/* 改善されたヘッダー */}
      <div className={styles.chatHeader}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← 戻る
        </button>

        {/* 相手のアイコンと名前 */}
        <Link 
          href={`/profile?email=${otherUser.email}`}
          className={styles.userProfile}
        >
          <div className={styles.userAvatar}>
            {otherUser.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{otherUser.name}</h2>
            <span className={styles.userEmail}>{otherUser.email}</span>
          </div>
        </Link>

        {/* 案件詳細アイコン */}
        {chatRoom.jobs && (
          <Link 
            href={`/job/${chatRoom.jobs.id}`}
            className={styles.jobLink}
            title="案件詳細を見る"
          >
            <span className={styles.jobIcon}>📋</span>
            <span className={styles.jobTitle}>{chatRoom.jobs.title}</span>
          </Link>
        )}
      </div>

      {notificationPermission === 'default' && (
        <div className={styles.notificationBanner}>
          <p>
            💡 新しいメッセージの通知を受け取るには、ブラウザの通知を許可してください
          </p>
        </div>
      )}

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <p className={styles.noMessages}>
            まだメッセージがありません。最初のメッセージを送信しましょう！
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${
                msg.sender_email === session?.user?.email
                  ? styles.myMessage
                  : styles.otherMessage
              }`}
            >
              <div className={styles.messageHeader}>
                <span className={styles.senderName}>{msg.sender_name}</span>
                <span className={styles.timestamp}>
                  {new Date(msg.created_at).toLocaleString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className={styles.messageContent}>{msg.message}</div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className={styles.messageInput}
          disabled={sending}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? '送信中...' : '送信'}
        </button>
      </form>
    </div>
  )
}
