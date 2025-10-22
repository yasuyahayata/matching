import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: jobId } = req.query

  try {
    // ログインユーザーを確認
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: '認証が必要です' })
    }

    const currentUserEmail = session.user.email

    // 案件情報を取得
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('client_email')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return res.status(404).json({ error: '案件が見つかりません' })
    }

    // 自分が投稿主かチェック
    if (job.client_email !== currentUserEmail) {
      return res.status(403).json({ error: 'この案件の投稿主ではありません' })
    }

    // この案件の投稿主（自分）が参加しているチャットルームを取得
    const { data: chatRooms, error: chatError } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(`user1_email.eq.${currentUserEmail},user2_email.eq.${currentUserEmail}`)
      .order('updated_at', { ascending: false })

    if (chatError) {
      console.error('チャットルーム取得エラー:', chatError)
      return res.status(500).json({ error: 'チャットルームの取得に失敗しました' })
    }

    // 各チャットルームの最新メッセージと未読数を取得
    const chatRoomsWithMessages = await Promise.all(
      chatRooms.map(async (room) => {
        // 最新メッセージを取得
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)

        // 💬 新機能: 未読メッセージ数を取得
        const { data: unreadMessages, count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: false })
          .eq('chat_room_id', room.id)
          .neq('sender_email', currentUserEmail) // 自分以外が送信
          .eq('is_read', false) // 未読のみ

        return {
          ...room,
          latestMessage: messages && messages.length > 0 ? messages[0] : null,
          messageCount: messages ? messages.length : 0,
          unreadCount: unreadCount || 0
        }
      })
    )

    // メッセージがあるチャットルームのみを返す
    const activeChats = chatRoomsWithMessages.filter(room => room.latestMessage !== null)

    return res.status(200).json(activeChats)
  } catch (error) {
    console.error('サーバーエラー:', error)
    return res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}
