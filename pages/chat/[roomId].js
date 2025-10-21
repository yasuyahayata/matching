import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Layout from '../../components/Layout'
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
      setMessages(data)
    } catch (err) {
      console.error('メッセージ取得エラー:', err)
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
      <Layout>
        <div className={styles.container}>
          <p>読み込み中...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.error}>
            <p>エラー: {error}</p>
            <button onClick={() => router.back()}>戻る</button>
          </div>
        </div>
      </Layout>
    )
  }

  if (!chatRoom) {
    return (
      <Layout>
        <div className={styles.container}>
          <p>チャットルームが見つかりません</p>
        </div>
      </Layout>
    )
  }

  // 相手のユーザー情報を取得
  const otherUser = 
    chatRoom.user1_email === session?.user?.email
      ? { email: chatRoom.user2_email, name: chatRoom.user2_name }
      : { email: chatRoom.user1_email, name: chatRoom.user1_name }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.chatHeader}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← 戻る
          </button>
          <h1>💬 {otherUser.name}とのチャット</h1>
        </div>

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
    </Layout>
  )
}
