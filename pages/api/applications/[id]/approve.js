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

      // 権限チェック（案件の投稿者のみ承認可能）
      if (application.jobs.client_email !== session.user.email) {
        return res.status(403).json({ error: '承認する権限がありません' })
      }

      // 既に承認済みかチェック
      if (application.status === 'approved') {
        return res.status(400).json({ error: 'この応募は既に承認済みです' })
      }

      // 応募を承認
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'approved' })
        .eq('id', id)

      if (updateError) throw updateError

      // チャットルームが既に存在するかチェック
      const { data: existingChatRoom, error: chatCheckError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('job_id', application.job_id)
        .or(`and(user1_email.eq.${application.jobs.client_email},user2_email.eq.${application.applicant_email}),and(user1_email.eq.${application.applicant_email},user2_email.eq.${application.jobs.client_email})`)
        .maybeSingle()

      if (chatCheckError) throw chatCheckError

      let chatRoomId

      if (existingChatRoom) {
        // 既存のチャットルームを使用
        chatRoomId = existingChatRoom.id
      } else {
        // チャットルームを作成
        const { data: chatRoom, error: chatError } = await supabase
          .from('chat_rooms')
          .insert([
            {
              job_id: application.job_id,
              user1_email: application.jobs.client_email,
              user1_name: session.user.name,
              user2_email: application.applicant_email,
              user2_name: application.applicant_name,
            }
          ])
          .select()
          .single()

        if (chatError) throw chatError

        chatRoomId = chatRoom.id
      }

      // 🔔 応募者に通知を作成
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            recipient_email: application.applicant_email,
            sender_email: session.user.email,
            sender_name: session.user.name,
            type: 'approved',
            job_id: application.job_id,
            job_title: application.jobs.title,
            application_id: application.id,
            message: `おめでとうございます！「${application.jobs.title}」への応募が承認されました。チャットルームが作成されました。`
          }
        ])

      if (notificationError) {
        console.error('通知作成エラー:', notificationError)
        // 通知作成に失敗しても承認自体は成功とする
      }

      return res.status(200).json({ 
        success: true,
        chatRoomId: chatRoomId
      })
    } catch (error) {
      console.error('承認エラー:', error)
      return res.status(500).json({ error: '承認処理に失敗しました' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
