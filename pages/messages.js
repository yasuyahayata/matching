import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import styles from '../styles/Messages.module.css'

export default function Messages() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('chat-rooms')
  const [matchingSubTab, setMatchingSubTab] = useState('client')
  const [chatRooms, setChatRooms] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingApplications, setProcessingApplications] = useState(new Set())

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
      return
    }

    fetchChatRooms()
    fetchNotifications()
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

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      
      if (!res.ok) {
        throw new Error('通知の取得に失敗しました')
      }

      const data = await res.json()
      setNotifications(data)
    } catch (err) {
      console.error('通知取得エラー:', err)
    }
  }

  const handleApprove = async (notification, e) => {
    e.stopPropagation()
    
    if (!notification.application_id) {
      alert('応募情報が見つかりません')
      return
    }

    if (processingApplications.has(notification.application_id)) {
      return
    }

    if (!confirm(`${notification.sender_name}さんの応募を承認しますか？`)) {
      return
    }

    setProcessingApplications(prev => new Set(prev).add(notification.application_id))

    try {
      const res = await fetch(`/api/applications/${notification.application_id}/approve`, {
        method: 'POST',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '承認に失敗しました')
      }

      const data = await res.json()

      alert('応募を承認しました！チャットルームが作成されました。')
      
      // 通知を既読にして削除
      await markNotificationAsRead(notification.id)
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
      
      // チャットルーム一覧を更新
      await fetchChatRooms()

      // チャットルームに遷移
      if (data.chatRoomId) {
        router.push(`/chat/${data.chatRoomId}`)
      }
    } catch (err) {
      console.error('承認エラー:', err)
      alert(err.message)
    } finally {
      setProcessingApplications(prev => {
        const newSet = new Set(prev)
        newSet.delete(notification.application_id)
        return newSet
      })
    }
  }

  const handleReject = async (notification, e) => {
    e.stopPropagation()
    
    if (!notification.application_id) {
      alert('応募情報が見つかりません')
      return
    }

    if (processingApplications.has(notification.application_id)) {
      return
    }

    if (!confirm(`${notification.sender_name}さんの応募を拒否しますか？`)) {
      return
    }

    setProcessingApplications(prev => new Set(prev).add(notification.application_id))

    try {
      const res = await fetch(`/api/applications/${notification.application_id}/reject`, {
        method: 'POST',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '拒否に失敗しました')
      }

      alert('応募を拒否しました。')
      
      // 通知を既読にして削除
      await markNotificationAsRead(notification.id)
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    } catch (err) {
      console.error('拒否エラー:', err)
      alert(err.message)
    } finally {
      setProcessingApplications(prev => {
        const newSet = new Set(prev)
        newSet.delete(notification.application_id)
        return newSet
      })
    }
  }

  const handleNotificationClick = async (notification) => {
    // 発注側の応募通知の場合はクリック無効（承認・拒否ボタンのみ）
    if (notification.type === 'application') {
      return
    }

    // 既読にする
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id)
    }

    // 承認通知の場合はチャットルームに遷移
    if (notification.type === 'approved') {
      const chatRoom = chatRooms.find(room => 
        room.jobs?.id?.toString() === notification.job_id?.toString()
      )

      if (chatRoom) {
        router.push(`/chat/${chatRoom.id}`)
      } else {
        router.push(`/job/${notification.job_id}`)
      }
    } else {
      router.push(`/job/${notification.job_id}`)
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

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      )
    } catch (err) {
      console.error('既読更新エラー:', err)
    }
  }

  const markAllNotificationsAsRead = async (type) => {
    try {
      let unreadIds
      
      if (type === 'client') {
        unreadIds = notifications
          .filter(notif => !notif.is_read && notif.type === 'application')
          .map(notif => notif.id)
      } else {
        unreadIds = notifications
          .filter(notif => !notif.is_read && (notif.type === 'approved' || notif.type === 'rejected'))
          .map(notif => notif.id)
      }

      if (unreadIds.length === 0) return

      await fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: unreadIds
        })
      })

      setNotifications(prev =>
        prev.map(notif => 
          unreadIds.includes(notif.id)
            ? { ...notif, is_read: true }
            : notif
        )
      )
    } catch (err) {
      console.error('一括既読更新エラー:', err)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application':
        return '📩'
      case 'approved':
        return '✅'
      case 'rejected':
        return '❌'
      default:
        return '🔔'
    }
  }

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'application':
        return '新しい応募があります'
      case 'approved':
        return 'おめでとうございます！'
      case 'rejected':
        return '応募結果のお知らせ'
      default:
        return '通知'
    }
  }

  const getNotificationDescription = (notification) => {
    switch (notification.type) {
      case 'application':
        return `${notification.sender_name}さんから「${notification.job_title}」に応募がありました。`
      case 'approved':
        return `「${notification.job_title}」への応募が承認されました。`
      case 'rejected':
        return `「${notification.job_title}」への応募は見送りとなりました。`
      default:
        return notification.message
    }
  }

  const formatDate = (dateString) => {
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

  const clientNotifications = notifications.filter(n => n.type === 'application')
  const unreadClientCount = clientNotifications.filter(n => !n.is_read).length

  const applicantNotifications = notifications.filter(n => n.type === 'approved' || n.type === 'rejected')
  const unreadApplicantCount = applicantNotifications.filter(n => !n.is_read).length

  const totalUnreadNotifications = unreadClientCount + unreadApplicantCount

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>💬 メッセージ</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'chat-rooms' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('chat-rooms')}
        >
          チャット
          {chatRooms.filter(room => room.unread_count > 0).length > 0 && (
            <span className={styles.badge}>
              {chatRooms.filter(room => room.unread_count > 0).length}
            </span>
          )}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notifications' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          マッチング
          {totalUnreadNotifications > 0 && (
            <span className={styles.badge}>
              {totalUnreadNotifications}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'chat-rooms' && (
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
            <div className={styles.chatRoomsList}>
              {chatRooms.map((room) => {
                const otherUser = 
                  room.user1_email === session?.user?.email
                    ? { email: room.user2_email, name: room.user2_name }
                    : { email: room.user1_email, name: room.user1_name }

                return (
                  <Link
                    key={room.id}
                    href={`/chat/${room.id}`}
                    className={styles.chatRoomCard}
                  >
                    <div className={styles.chatRoomAvatar}>
                      {otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.chatRoomInfo}>
                      <div className={styles.chatRoomHeader}>
                        <h3 className={styles.chatRoomName}>{otherUser.name}</h3>
                        {room.last_message_at && (
                          <span className={styles.chatRoomTime}>
                            {formatDate(room.last_message_at)}
                          </span>
                        )}
                      </div>
                      <p className={styles.chatRoomJob}>
                        📋 {room.jobs?.title || '案件情報なし'}
                      </p>
                      {room.last_message && (
                        <p className={styles.chatRoomLastMessage}>
                          {room.last_message}
                        </p>
                      )}
                    </div>
                    {room.unread_count > 0 && (
                      <div className={styles.unreadBadge}>
                        {room.unread_count}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className={styles.content}>
          <div className={styles.subTabs}>
            <button
              className={`${styles.subTab} ${matchingSubTab === 'client' ? styles.activeSubTab : ''}`}
              onClick={() => setMatchingSubTab('client')}
            >
              発注側
              {unreadClientCount > 0 && (
                <span className={styles.subBadge}>{unreadClientCount}</span>
              )}
            </button>
            <button
              className={`${styles.subTab} ${matchingSubTab === 'applicant' ? styles.activeSubTab : ''}`}
              onClick={() => setMatchingSubTab('applicant')}
            >
              受注側
              {unreadApplicantCount > 0 && (
                <span className={styles.subBadge}>{unreadApplicantCount}</span>
              )}
            </button>
          </div>

          {matchingSubTab === 'client' && (
            <>
              {clientNotifications.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>📩</div>
                  <h3>応募通知がありません</h3>
                  <p>あなたの案件に応募があると、ここに通知が表示されます。</p>
                </div>
              ) : (
                <>
                  {unreadClientCount > 0 && (
                    <div className={styles.notificationActions}>
                      <button
                        onClick={() => markAllNotificationsAsRead('client')}
                        className={styles.markAllReadButton}
                      >
                        すべて既読にする
                      </button>
                    </div>
                  )}
                  <div className={styles.notificationsList}>
                    {clientNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`${styles.notificationCard} ${
                          !notification.is_read ? styles.unread : ''
                        } ${styles.applicationCard}`}
                      >
                        <div className={styles.notificationIcon}>
                          <span className={styles.iconblue}>
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationHeader}>
                            <h4 className={styles.notificationTitle}>
                              {getNotificationTitle(notification.type)}
                            </h4>
                            <span className={styles.notificationTime}>
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                          <p className={styles.notificationMessage}>
                            {getNotificationDescription(notification)}
                          </p>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={(e) => handleApprove(notification, e)}
                              className={styles.approveButton}
                              disabled={processingApplications.has(notification.application_id)}
                            >
                              {processingApplications.has(notification.application_id) ? '処理中...' : '✓ 承認'}
                            </button>
                            <button
                              onClick={(e) => handleReject(notification, e)}
                              className={styles.rejectButton}
                              disabled={processingApplications.has(notification.application_id)}
                            >
                              {processingApplications.has(notification.application_id) ? '処理中...' : '✕ 拒否'}
                            </button>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <div className={styles.unreadDot}></div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {matchingSubTab === 'applicant' && (
            <>
              {applicantNotifications.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>✅</div>
                  <h3>承認・拒否通知がありません</h3>
                  <p>応募した案件の結果がここに表示されます。</p>
                </div>
              ) : (
                <>
                  {unreadApplicantCount > 0 && (
                    <div className={styles.notificationActions}>
                      <button
                        onClick={() => markAllNotificationsAsRead('applicant')}
                        className={styles.markAllReadButton}
                      >
                        すべて既読にする
                      </button>
                    </div>
                  )}
                  <div className={styles.notificationsList}>
                    {applicantNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`${styles.notificationCard} ${
                          !notification.is_read ? styles.unread : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={styles.notificationIcon}>
                          <span className={notification.type === 'approved' ? styles.icongreen : styles.iconred}>
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationHeader}>
                            <h4 className={styles.notificationTitle}>
                              {getNotificationTitle(notification.type)}
                            </h4>
                            <span className={styles.notificationTime}>
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                          <p className={styles.notificationMessage}>
                            {getNotificationDescription(notification)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className={styles.unreadDot}></div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
