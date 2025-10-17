import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import socketService from '@/lib/socket'

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  
  useEffect(() => {
    // Socket.IO接続の初期化
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);
      }

      // ブラウザ通知の許可を求める
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
