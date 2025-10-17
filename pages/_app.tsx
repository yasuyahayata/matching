import { SessionProvider } from "next-auth/react"
import type { AppProps } from 'next/app'
import type { Session } from "next-auth"
import Head from 'next/head'
import '../styles/globals.css'

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{
  session: Session;
}>) {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Crowd MVP - フリーランスプラットフォーム</title>
        <meta name="description" content="フリーランサーとクライアントをつなぐプラットフォーム" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
