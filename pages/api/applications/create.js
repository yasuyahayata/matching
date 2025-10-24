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
    const { jobId, message } = req.body

    if (!jobId || !message) {
      return res.status(400).json({ error: '必須項目が不足しています' })
    }

    try {
      // 案件情報を取得
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, client_email, client_name')
        .eq('id', jobId)
        .single()

      if (jobError) throw jobError

      if (!job) {
        return res.status(404).json({ error: '案件が見つかりません' })
      }

      // 自分の案件には応募できない
      if (job.client_email === session.user.email) {
        return res.status(400).json({ error: '自分の案件には応募できません' })
      }

      // 既に応募済みかチェック
      const { data: existingApplication, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_email', session.user.email)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingApplication) {
        return res.status(400).json({ error: 'すでにこの案件に応募済みです' })
      }

      // 応募を作成
      const { data: application, error: insertError } = await supabase
        .from('applications')
        .insert([
          {
            job_id: jobId,
            applicant_email: session.user.email,
            applicant_name: session.user.name,
            message: message,
            status: 'pending'
          }
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // 🔔 案件投稿者に通知を作成
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            recipient_email: job.client_email,
            sender_email: session.user.email,
            sender_name: session.user.name,
            type: 'application',
            job_id: jobId,
            job_title: job.title,
            application_id: application.id,
            message: `${session.user.name}さんが「${job.title}」に応募しました。`
          }
        ])

      if (notificationError) {
        console.error('通知作成エラー:', notificationError)
        // 通知作成に失敗しても応募自体は成功とする
      }

      return res.status(200).json({ 
        success: true,
        application: application
      })
    } catch (error) {
      console.error('応募作成エラー:', error)
      return res.status(500).json({ error: '応募の作成に失敗しました' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
