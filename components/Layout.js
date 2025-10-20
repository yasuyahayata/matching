import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const { data: session } = useSession();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            <h1>Crowd MVP</h1>
          </Link>
          
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              案件一覧
            </Link>
            
            {session ? (
              <>
                <Link href="/profile" className={styles.navLink}>
                  プロフィール
                </Link>
                <span className={styles.userInfo}>
                  {session.user.name || session.user.email}
                </span>
                <button 
                  onClick={() => signOut()} 
                  className={styles.authButton}
                >
                  ログアウト
                </button>
              </>
            ) : (
              <button 
                onClick={() => signIn('google')} 
                className={styles.authButton}
              >
                ログイン
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2024 Crowd MVP. All rights reserved.</p>
      </footer>
    </div>
  );
}
