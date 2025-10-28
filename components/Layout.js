import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadProfileCount, setUnreadProfileCount] = useState(0);

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
        console.log('未読チャット数:', count);
        setUnreadChatCount(count);
      } else {
        setUnreadChatCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread chat count:', error);
      setUnreadChatCount(0);
    }
  };

  const fetchUnreadProfileCount = async () => {
    if (status === 'loading') return;
    
    if (!session) {
      setUnreadProfileCount(0);
      return;
    }

    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const notifications = await res.json();
        const count = notifications.filter(notif => 
          !notif.is_read && 
          (notif.type === 'new_application' || 
           notif.type === 'application_approved' || 
           notif.type === 'application_rejected')
        ).length;
        console.log('未読プロフィール通知数:', count);
        setUnreadProfileCount(count);
      } else {
        setUnreadProfileCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread profile count:', error);
      setUnreadProfileCount(0);
    }
  };

  const fetchAllUnreadCounts = () => {
    fetchUnreadChatCount();
    fetchUnreadProfileCount();
  };

  useEffect(() => {
    fetchAllUnreadCounts();
  }, [session, status]);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      fetchAllUnreadCounts();
    }, 5000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const handleRouteChange = () => {
      if (session) {
        setTimeout(() => {
          fetchAllUnreadCounts();
        }, 300);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [session, router.events]);

  useEffect(() => {
    const handleFocus = () => {
      if (session) {
        fetchAllUnreadCounts();
      }
    };

    const handleMessagesRead = () => {
      if (session) {
        console.log('既読イベントを受信、未読数を更新します');
        fetchAllUnreadCounts();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('messagesRead', handleMessagesRead);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('messagesRead', handleMessagesRead);
    };
  }, [session]);

  const totalUnreadCount = unreadChatCount;

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          マッチングシステム(汎用)
        </Link>
        <div className={styles.navLinks}>
          {status === 'loading' ? (
            <span className={styles.loadingText}>読み込み中...</span>
          ) : session ? (
            <>
              <Link href="/" className={styles.navLink}>
                案件一覧
              </Link>
              <Link href="/messages" className={styles.navLink}>
                💬 メッセージ
                {totalUnreadCount > 0 && (
                  <span className={styles.unreadBadge}>{totalUnreadCount}</span>
                )}
              </Link>
              <Link href="/profile" className={styles.navLink}>
                プロフィール
                {unreadProfileCount > 0 && (
                  <span className={styles.unreadBadge}>{unreadProfileCount}</span>
                )}
              </Link>
              <Link href={`/profile?user=${session.user.name}`} className={styles.userName}>
                {session.user.name}
              </Link>
              <Link href="/api/auth/signout">
                <button className={styles.logoutButton}>ログアウト</button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className={styles.navLink}>
                案件一覧
              </Link>
              <Link href="/post-job" className={styles.navLink}>
                案件投稿
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
