import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const { roomId } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // チャットルーム情報を取得
    const { data: chatRoom, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error) {
      console.error('チャットルーム取得エラー:', error)
      return res.status(404).json({ error: 'チャットルームが見つかりません' })
    }

    if (!chatRoom) {
      return res.status(404).json({ error: 'チャットルームが見つかりません' })
    }

    return res.status(200).json(chatRoom)
  } catch (error) {
    console.error('サーバーエラー:', error)
    return res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}
