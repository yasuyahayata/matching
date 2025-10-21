import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const { roomId } = req.query

  // メッセージ取得 (GET)
  if (req.method === 'GET') {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('メッセージ取得エラー:', error)
        return res.status(500).json({ error: 'メッセージの取得に失敗しました' })
      }

      return res.status(200).json(messages || [])
    } catch (error) {
      console.error('サーバーエラー:', error)
      return res.status(500).json({ error: 'サーバーエラーが発生しました' })
    }
  }

  // メッセージ送信 (POST)
  if (req.method === 'POST') {
    try {
      const { message, senderEmail, senderName } = req.body

      if (!message || !senderEmail || !senderName) {
        return res.status(400).json({ error: '必須項目が不足しています' })
      }

      // メッセージを保存
      const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert([
          {
            chat_room_id: roomId,
            sender_email: senderEmail,
            sender_name: senderName,
            message: message,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error('メッセージ送信エラー:', insertError)
        return res.status(500).json({ error: 'メッセージの送信に失敗しました' })
      }

      // チャットルームのupdated_atを更新
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId)

      return res.status(201).json(newMessage)
    } catch (error) {
      console.error('サーバーエラー:', error)
      return res.status(500).json({ error: 'サーバーエラーが発生しました' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
