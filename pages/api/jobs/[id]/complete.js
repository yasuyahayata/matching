import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: '認証が必要です' })
    }

    const { id } = req.query

    // 案件情報を取得
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return res.status(404).json({ error: '案件が見つかりません' })
    }

    // 投稿者本人かチェック
    if (job.client_email !== session.user.email) {
      return res.status(403).json({ error: 'この案件を完了にする権限がありません' })
    }

    // 既に完了している場合
    if (job.status === '完了') {
      return res.status(400).json({ error: 'この案件は既に完了しています' })
    }

    // ステータスを「完了」に更新
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({ 
        status: '完了',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('ステータス更新エラー:', updateError)
      return res.status(500).json({ error: 'ステータスの更新に失敗しました' })
    }

    // 🆕 この案件に関連するチャットルームをアーカイブ
    const { data: archivedRooms, error: archiveError } = await supabase
      .from('chat_rooms')
      .update({ 
        is_archived: true,
        updated_at: new Date().toISOString()
      })
      .eq('job_id', id)

    if (archiveError) {
      console.error('チャットルームアーカイブエラー:', archiveError)
      // エラーが発生してもメイン処理は成功とする
    } else {
      console.log(`案件 ${id} に関連する ${archivedRooms?.length || 0} 件のチャットルームをアーカイブしました`)
    }

    return res.status(200).json({ 
      success: true, 
      job: updatedJob,
      archivedRoomsCount: archivedRooms?.length || 0
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}
