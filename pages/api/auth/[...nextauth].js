import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🚀🚀🚀 NEXTAUTH AUTHORIZE 関数 呼び出し確認！ 🚀🚀🚀')
        console.log('メール:', credentials?.email)
        console.log('パスワード:', credentials?.password)
        
        // 超簡易テスト：メールアドレスがあれば認証成功
        if (credentials?.email && credentials?.password) {
          console.log('✅✅✅ 簡易認証成功！ ✅✅✅')
          return {
            id: '1',
            email: credentials.email,
            name: 'Test User'
          }
        }
        
        console.log('❌❌❌ 簡易認証失敗！ ❌❌❌')
        return null
      }
    })
  ],
  
  session: {
    strategy: 'jwt'
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('🎫🎫🎫 JWT作成確認！ 🎫🎫🎫')
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    
    async session({ session, token }) {
      if (token) {
        console.log('🔐🔐🔐 セッション作成確認！ 🔐🔐🔐')
        session.user.id = token.id
        session.user.email = token.email
        session.user.name = token.name
      }
      return session
    }
  },
  
  debug: true,
  secret: 'simple-test-key'
})
