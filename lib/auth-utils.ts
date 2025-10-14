import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth-config'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('認証が必要です')
  }
  
  return session.user
}
