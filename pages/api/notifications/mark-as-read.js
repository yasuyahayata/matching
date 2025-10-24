import { createClient } from '@supabase/supabase-js'

// サービスロールキーを使ってRLSをバイパス
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { notificationIds } = req.body

    console.log('既読処理開始:', notificationIds)

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds)

      if (error) {
        console.error('Supabase エラー:', error)
        throw error
      }

      console.log('既読処理成功')
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('既読更新エラー:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
