import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('=== NextAuth Credentials 認証開始 ===')
        console.log('Email:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.error('認証エラー: メールアドレスまたはパスワードが空です')
          throw new Error("メールアドレスとパスワードを入力してください")
        }

        try {
          console.log('Supabase認証を試行中...')
          
          // Supabaseでユーザー認証
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          console.log('Supabase認証結果:', {
            success: !!data.user,
            error: error?.message,
            user: data.user ? {
              id: data.user.id,
              email: data.user.email,
              email_confirmed_at: data.user.email_confirmed_at
            } : null
          })

          if (error) {
            console.error("Supabase認証エラー:", error.message)
            
            // より具体的なエラーメッセージ
            if (error.message.includes('Invalid login credentials')) {
              throw new Error("メールアドレスまたはパスワードが正しくありません")
            } else if (error.message.includes('Email not confirmed')) {
              throw new Error("メールアドレスの確認が完了していません")
            } else {
              throw new Error("認証に失敗しました: " + error.message)
            }
          }

          if (data.user && data.session) {
            console.log('認証成功: ユーザー情報を返却')
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
            }
          }

          console.error('認証失敗: ユーザーまたはセッションが見つかりません')
          return null
          
        } catch (error) {
          console.error("認証処理エラー:", error)
          
          if (error instanceof Error) {
            throw error
          } else {
            throw new Error("認証に失敗しました")
          }
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('JWT コールバック: ユーザー情報をトークンに追加', user.id)
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        console.log('Session コールバック: セッションにIDを追加', token.id)
        session.user.id = token.id
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log('SignIn コールバック:', { 
        provider: account?.provider, 
        userId: user.id,
        userEmail: user.email 
      })
      
      if (account?.provider === "google") {
        try {
          // Googleログイン時のユーザー情報をSupabaseに保存
          const { error } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              name: user.name,
              provider: 'google',
              updated_at: new Date().toISOString()
            })

          if (error) {
            console.error("ユーザー情報保存エラー:", error)
            return false
          }
        } catch (error) {
          console.error("サインインコールバックエラー:", error)
          return false
        }
      }
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  debug: process.env.NODE_ENV === 'development',
}
