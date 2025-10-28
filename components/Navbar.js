import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (session?.user) {
      fetchUnreadCounts()
      const interval = setInterval(fetchUnreadCounts, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchUnreadCounts = async () => {
    try {
      const [notificationsRes, messagesRes] = await Promise.all([
        fetch('/api/notifications/unread-count'),
        fetch('/api/chat-rooms/unread-count')
      ])
      
      if (notificationsRes.ok) {
        const data = await notificationsRes.json()
        setUnreadCount(data.count)
      }
      
      if (messagesRes.ok) {
        const data = await messagesRes.json()
        setUnreadMessages(data.count)
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          マッチングシステム(汎用)
        </Link>

        <div className={styles.nav}>
          {session ? (
            <>
              <Link href="/messages" className={styles.navLink}>
                💬 メッセージ
                {unreadMessages > 0 && (
                  <span className={styles.badge}>{unreadMessages}</span>
                )}
              </Link>
              <Link href="/my-applications" className={styles.navLink}>
                📋 マイ応募
              </Link>
              <Link href="/profile" className={styles.navLink}>
                👤 プロフィール
              </Link>
              <button onClick={() => signOut()} className={styles.navButton}>
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className={styles.navLink}>
                ログイン
              </Link>
              <Link href="/auth/signup" className={styles.navLink}>
                新規登録
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
