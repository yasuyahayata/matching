import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // ログインユーザーを確認
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: '認証が必要です' })
    }

    const currentUserEmail = session.user.email

    // 自分が参加しているチャットルームを取得
    const { data: chatRooms, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id')
      .or(`user1_email.eq.${currentUserEmail},user2_email.eq.${currentUserEmail}`)

    if (roomError) {
      console.error('チャットルーム取得エラー:', roomError)
      return res.status(500).json({ error: 'チャットルームの取得に失敗しました' })
    }

    if (!chatRooms || chatRooms.length === 0) {
      return res.status(200).json({ totalUnread: 0, unreadByRoom: {} })
    }

    const roomIds = chatRooms.map(room => room.id)

    // 各チャットルームの未読メッセージ数を取得
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('chat_room_id')
      .in('chat_room_id', roomIds)
      .neq('sender_email', currentUserEmail) // 自分以外が送信
      .eq('is_read', false) // 未読のみ

    if (msgError) {
      console.error('メッセージ取得エラー:', msgError)
      return res.status(500).json({ error: 'メッセージの取得に失敗しました' })
    }

    // チャットルームごとの未読数をカウント
    const unreadByRoom = {}
    messages.forEach(msg => {
      if (!unreadByRoom[msg.chat_room_id]) {
        unreadByRoom[msg.chat_room_id] = 0
      }
      unreadByRoom[msg.chat_room_id]++
    })

    const totalUnread = messages.length

    return res.status(200).json({ 
      totalUnread,
      unreadByRoom 
    })
  } catch (error) {
    console.error('サーバーエラー:', error)
    return res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}
