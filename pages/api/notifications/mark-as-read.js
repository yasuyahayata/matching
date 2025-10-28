import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

// サービスロールキーを使ってRLSをバイパス
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // セッション確認
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: '認証が必要です' })
  }

  const { notificationIds, type, jobId } = req.body

  console.log('既読処理開始:', { notificationIds, type, jobId, userEmail: session.user.email })

  try {
    // パターン1: 通知IDの配列で既読にする（既存の機能）
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds)
        .eq('recipient_email', session.user.email) // セキュリティ: 自分の通知のみ

      if (error) {
        console.error('Supabase エラー:', error)
        throw error
      }

      console.log('既読処理成功（ID指定）')
      return res.status(200).json({ success: true })
    }

    // パターン2: タイプや案件IDで既読にする（新機能）
    if (type || jobId) {
      let query = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_email', session.user.email)
        .eq('is_read', false)

      // タイプで絞り込み
      if (type) {
        query = query.eq('type', type)
      }

      // 案件IDで絞り込み
      if (jobId) {
        query = query.eq('job_id', jobId)
      }

      const { error } = await query

      if (error) {
        console.error('Supabase エラー:', error)
        throw error
      }

      console.log('既読処理成功（条件指定）')
      return res.status(200).json({ success: true })
    }

    // どちらのパラメータもない場合
    return res.status(400).json({ error: 'notificationIds, type, または jobId が必要です' })

  } catch (error) {
    console.error('既読更新エラー:', error)
    return res.status(500).json({ error: error.message })
  }
}
