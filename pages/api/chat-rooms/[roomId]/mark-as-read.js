import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { roomId } = req.query

  try {
    // ログインユーザーを確認
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: '認証が必要です' })
    }

    const currentUserEmail = session.user.email

    // このチャットルームの、自分宛ての未読メッセージをすべて既読にする
    const { data, error } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('chat_room_id', roomId)
      .neq('sender_email', currentUserEmail) // 自分以外が送信したメッセージ
      .eq('is_read', false) // 未読のもののみ
      .select()

    if (error) {
      console.error('既読更新エラー:', error)
      return res.status(500).json({ error: '既読更新に失敗しました' })
    }

    return res.status(200).json({ 
      success: true, 
      markedCount: data ? data.length : 0 
    })
  } catch (error) {
    console.error('サーバーエラー:', error)
    return res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}
