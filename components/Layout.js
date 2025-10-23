import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (status === 'loading') return;
    
    if (!session) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch('/api/chat-rooms/unread-count');
      if (res.ok) {
        const data = await res.json();
        const count = Number(data.totalUnread) || 0;
        setUnreadCount(count);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [session, status]);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const handleRouteChange = () => {
      if (session) {
        fetchUnreadCount();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [session, router.events]);

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/">
          <span className={styles.logo}>CrowdWork MVP</span>
        </Link>
        <div className={styles.navLinks}>
          {status === 'loading' ? (
            <span className={styles.loadingText}>読み込み中...</span>
          ) : session ? (
            <>
              <Link href="/">
                <span className={styles.navLink}>案件一覧</span>
              </Link>
              <Link href="/matching">
                <span className={styles.navLink}>🤝 マッチング</span>
              </Link>
              <Link href="/messages">
                <span className={styles.navLink}>
                  💬 メッセージ
                  {unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{unreadCount}</span>
                  )}
                </span>
              </Link>
              <Link href="/profile">
                <span className={styles.navLink}>プロフィール</span>
              </Link>
              <Link href={`/profile?user=${session.user.name}`}>
                <span className={styles.userName}>{session.user.name}</span>
              </Link>
              <Link href="/api/auth/signout">
                <button className={styles.logoutButton}>ログアウト</button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/">
                <span className={styles.navLink}>案件一覧</span>
              </Link>
              <Link href="/post-job">
                <span className={styles.navLink}>案件投稿</span>
              </Link>
              <Link href="/api/auth/signin">
                <button className={styles.loginButton}>ログイン</button>
              </Link>
              <Link href="/api/auth/signin">
                <button className={styles.signupButton}>新規登録</button>
              </Link>
            </>
          )}
        </div>
      </nav>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
