import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import styles from '../styles/Messages.module.css'

export default function MessagesPage() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/')
      return
    }
    
    fetchConversations()
  }, [session, status])

  const getStatusLabel = (statusValue) => {
    switch (statusValue) {
      case 'approved':
        return 'マッチング'
      case 'pending':
        return '審査中'
      case 'inquiry':
        return 'お問い合わせ'
      default:
        return '審査中'
    }
  }

  const getStatusStyle = (statusValue) => {
    switch (statusValue) {
      case 'approved':
        return styles.statusMatching
      case 'pending':
        return styles.statusPending
      case 'inquiry':
        return styles.statusInquiry
      default:
        return styles.statusPending
    }
  }

  const fetchConversations = async () => {
    if (!session?.user?.email) return

    try {
      const userEmail = session.user.email
      console.log('User email:', userEmail)

      // Fetch chat rooms where user is participant
      const { data: chatRooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`user1_email.eq.${userEmail},user2_email.eq.${userEmail}`)
        .order('updated_at', { ascending: false })

      console.log('Chat rooms:', chatRooms)
      if (roomsError) {
        console.error('Rooms error:', roomsError)
        setLoading(false)
        return
      }

      if (!chatRooms || chatRooms.length === 0) {
        setLoading(false)
        return
      }

      // Get the latest message for each chat room and filter rooms with messages
      const conversationsData = []
      
      for (const room of chatRooms) {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)

        // Skip if no messages in this room
        if (!messages || messages.length === 0) {
          continue
        }

        const latestMessage = messages[0]

        // Determine partner email and name
        const partnerEmail = room.user1_email === userEmail 
          ? room.user2_email 
          : room.user1_email
        const partnerName = room.user1_email === userEmail 
          ? room.user2_name 
          : room.user1_name

        // Count unread messages
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_room_id', room.id)
          .eq('sender_email', partnerEmail)
          .eq('is_read', false)

        // Determine status
        let statusValue = 'inquiry' // デフォルトは「お問い合わせ」
        
        // Get job title if job_id exists
        let jobTitle = null
        if (room.job_id) {
          const { data: job } = await supabase
            .from('jobs')
            .select('title')
            .eq('id', room.job_id)
            .single()

          if (job) {
            jobTitle = job.title
          }

          // job_idがある場合、applicationsテーブルを確認
          const { data: applications } = await supabase
            .from('applications')
            .select('status, freelancer_email')
            .eq('job_id', room.job_id)

          console.log('Applications for job', room.job_id, ':', applications)

          if (applications && applications.length > 0) {
            // user1_emailまたはuser2_emailがfreelancer_emailと一致するものを探す
            const matchingApp = applications.find(app => 
              app.freelancer_email === room.user1_email || 
              app.freelancer_email === room.user2_email
            )

            if (matchingApp) {
              statusValue = matchingApp.status
              console.log('Matched application status:', matchingApp.status)
            }
          }
        }

        conversationsData.push({
          roomId: room.id,
          userId: partnerEmail,
          companyName: partnerName || partnerEmail,
          jobTitle: jobTitle,
          lastMessage: latestMessage.message,
          lastMessageTime: latestMessage.created_at,
          unreadCount: unreadCount || 0,
          status: statusValue
        })
      }

      console.log('Conversations with messages:', conversationsData)
      setConversations(conversationsData)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>メッセージ</h1>

        {conversations.length === 0 ? (
          <div className={styles.emptyState}>
            <p>メッセージはありません</p>
          </div>
        ) : (
          <div className={styles.conversationList}>
            {conversations.map((conv) => (
              <Link
                key={conv.roomId}
                href={`/chat/${conv.roomId}`}
                className={styles.conversationItem}
              >
                <div className={styles.conversationContent}>
                  <div className={styles.conversationHeader}>
                    <h3 className={styles.companyName}>{conv.companyName}</h3>
                    <span className={`${styles.statusBadge} ${getStatusStyle(conv.status)}`}>
                      {getStatusLabel(conv.status)}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className={styles.unreadBadge}>
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  {conv.jobTitle && (
                    <p className={styles.jobTitle}>{conv.jobTitle}</p>
                  )}
                </div>
                <div className={styles.conversationMeta}>
                  <p className={styles.lastMessage}>{conv.lastMessage}</p>
                  <span className={styles.timestamp}>
                    {new Date(conv.lastMessageTime).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
