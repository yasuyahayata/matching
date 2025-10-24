import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'link'
import { useRouter } from 'next/router'
import styles from '../styles/Navbar.module.css'

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session) {
      fetchUnreadCount()
      // 30秒ごとに未読数を更新
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/unread-count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error('未読数取得エラー:', error)
    }
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          CROWD-MVP
        </Link>

        <div className={styles.navLinks}>
          <Link 
            href="/" 
            className={`${styles.navLink} ${router.pathname === '/' ? styles.active : ''}`}
          >
            🏠 ホーム
          </Link>

          {session && (
            <>
              <Link 
                href="/messages" 
                className={`${styles.navLink} ${router.pathname === '/messages' ? styles.active : ''}`}
              >
                💬 メッセージ
                {unreadCount > 0 && (
                  <span className={styles.badge}>{unreadCount}</span>
                )}
              </Link>

              <Link 
                href="/my-applications" 
                className={`${styles.navLink} ${router.pathname === '/my-applications' ? styles.active : ''}`}
              >
                📋 応募管理
              </Link>

              <Link 
                href="/profile" 
                className={`${styles.navLink} ${router.pathname === '/profile' ? styles.active : ''}`}
              >
                👤 プロフィール
              </Link>

              <Link 
                href="/post-job" 
                className={styles.postButton}
              >
                ➕ 案件投稿
              </Link>
            </>
          )}

          {!session && (
            <Link 
              href="/api/auth/signin" 
              className={styles.loginButton}
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}