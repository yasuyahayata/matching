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

  const { id } = req.query

  if (req.method === 'POST') {
    try {
      // 応募情報を取得
      const { data: application, error: fetchError } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            client_email
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (!application) {
        return res.status(404).json({ error: '応募が見つかりません' })
      }

      // 権限チェック（案件の投稿者のみ拒否可能）
      if (application.jobs.client_email !== session.user.email) {
        return res.status(403).json({ error: '拒否する権限がありません' })
      }

      // 既に拒否済みかチェック
      if (application.status === 'rejected') {
        return res.status(400).json({ error: 'この応募は既に拒否済みです' })
      }

      // 応募を拒否
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (updateError) throw updateError

      // 🔔 応募者に通知を作成
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            recipient_email: application.applicant_email,
            sender_email: session.user.email,
            sender_name: session.user.name,
            type: 'rejected',
            job_id: application.job_id,
            job_title: application.jobs.title,
            application_id: application.id,
            message: `申し訳ございません。「${application.jobs.title}」への応募は見送りとなりました。`
          }
        ])

      if (notificationError) {
        console.error('通知作成エラー:', notificationError)
        // 通知作成に失敗しても拒否自体は成功とする
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('拒否エラー:', error)
      return res.status(500).json({ error: '拒否処理に失敗しました' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
