import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const fetchUnreadChatCount = async () => {
    if (status === 'loading') return;
    
    if (!session) {
      setUnreadChatCount(0);
      return;
    }

    try {
      const res = await fetch('/api/chat-rooms/unread-count');
      if (res.ok) {
        const data = await res.json();
        const count = Number(data.totalUnread) || 0;
        setUnreadChatCount(count);
      } else {
        setUnreadChatCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread chat count:', error);
      setUnreadChatCount(0);
    }
  };

  const fetchUnreadNotificationCount = async () => {
    if (status === 'loading') return;
    
    if (!session) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        const count = Number(data.count) || 0;
        setUnreadNotificationCount(count);
      } else {
        setUnreadNotificationCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      setUnreadNotificationCount(0);
    }
  };

  const fetchAllUnreadCounts = () => {
    fetchUnreadChatCount();
    fetchUnreadNotificationCount();
  };

  useEffect(() => {
    fetchAllUnreadCounts();
  }, [session, status]);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      fetchAllUnreadCounts();
    }, 30000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const handleRouteChange = () => {
      if (session) {
        fetchAllUnreadCounts();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [session, router.events]);

  // チャットとマッチング通知の合計未読数
  const totalUnreadCount = unreadChatCount + unreadNotificationCount;

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
              <Link href="/messages">
                <span className={styles.navLink}>
                  💬 メッセージ
                  {totalUnreadCount > 0 && (
                    <span className={styles.unreadBadge}>{totalUnreadCount}</span>
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
