import Layout from '../components/Layout';
import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';

console.log('@@@ _app.js FILE LOADED @@@');

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  console.log('@@@ MyApp FUNCTION CALLED @@@');
  
  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}

export default MyApp;
