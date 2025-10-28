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
      // 🆕 除外するタイプをクエリパラメータから取得
      const { exclude } = req.query

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_email', session.user.email)
        .eq('is_read', false)

      // 🆕 特定のタイプを除外
      if (exclude) {
        query = query.neq('type', exclude)
      }

      const { count, error } = await query

      if (error) throw error

      return res.status(200).json({ count: count || 0 })
    } catch (error) {
      console.error('未読数取得エラー:', error)
      return res.status(500).json({ error: '未読数の取得に失敗しました' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}