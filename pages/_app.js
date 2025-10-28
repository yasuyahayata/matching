import { SessionProvider } from 'next-auth/react'
import Layout from '../components/Layout'
import { ToastProvider } from '../components/ToastManager'
import '../styles/globals.css'

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ToastProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ToastProvider>
    </SessionProvider>
  )
}
