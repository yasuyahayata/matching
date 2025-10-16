import { SessionProvider } from 'next-auth/react'
import '../styles/globals.css'
import { useEffect } from 'react'
import { initializeSampleData } from '../utils/sampleData'

export default function App({
  Component,
  pageProps: { session, ...pageProps }
}) {
  useEffect(() => {
    // アプリ起動時にサンプルデータを初期化
    initializeSampleData();
  }, []);

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}