import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: '認証が必要です' })
  }

  if (req.method === 'GET') {
    try {
      console.log('Fetching notifications for:', session.user.email)

      // 自分宛の通知を取得
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_email', session.user.email)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Notifications found:', data?.length || 0)

      return res.status(200).json(data || [])
    } catch (error) {
      console.error('通知取得エラー:', error)
      return res.status(500).json({ error: '通知の取得に失敗しました' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
