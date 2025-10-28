import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

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

  const fetchAllUnreadCounts = () => {
    fetchUnreadChatCount();
  };

  // 初回読み込み
  useEffect(() => {
    fetchAllUnreadCounts();
  }, [session, status]);

  // 5秒ごとに更新
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      fetchAllUnreadCounts();
    }, 5000);

    return () => clearInterval(interval);
  }, [session]);

  // ページ遷移時に更新
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

  // ページフォーカス時に更新
  useEffect(() => {
    const handleFocus = () => {
      if (session) {
        fetchAllUnreadCounts();
      }
    };

    // 既読イベントを受け取る
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

  // 🆕 チャットの未読数のみ表示（通知は含めない）
  const totalUnreadCount = unreadChatCount;

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          CrowdWork MVP
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
