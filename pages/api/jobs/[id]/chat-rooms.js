import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { supabase } from '../../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: '認証が必要です' })
  }

  const { id } = req.query

  if (req.method === 'GET') {
    try {
      // この案件に関連するチャットルームを取得
      const { data: chatRooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('job_id', parseInt(id))
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('チャットルーム取得エラー:', error)
        throw error
      }

      // 各チャットルームの最新メッセージと未読数を取得
      const roomsWithDetails = await Promise.all(
        chatRooms.map(async (room) => {
          // 最新メッセージを取得
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          // 未読数を取得（自分宛ての未読メッセージ）
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_room_id', room.id)
            .eq('is_read', false)
            .neq('sender_email', session.user.email)

          return {
            ...room,
            latestMessage,
            unreadCount: unreadCount || 0
          }
        })
      )

      res.status(200).json(roomsWithDetails)
    } catch (error) {
      console.error('チャットルーム取得エラー:', error)
      res.status(500).json({ error: 'チャットルームの取得に失敗しました' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
