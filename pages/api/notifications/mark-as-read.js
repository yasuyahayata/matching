import { createClient } from '@supabase/supabase-js'
import { getSession } from 'next-auth/react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ error: '認証が必要です' })
  }

  if (req.method === 'POST') {
    const { notificationIds } = req.body

    try {
      // 指定された通知を既読にする
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds)
        .eq('recipient_email', session.user.email)

      if (error) throw error

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('既読更新エラー:', error)
      return res.status(500).json({ error: '既読の更新に失敗しました' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
