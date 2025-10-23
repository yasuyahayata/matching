import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // ログインユーザーを確認
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const currentUserEmail = session.user.email;
    const currentUserName = session.user.name || session.user.email;

    if (req.method === 'GET') {
      // 自分が参加している全てのチャットルームを取得（案件情報も含める）
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          jobs (
            id,
            title,
            category,
            status
          )
        `)
        .or(`user1_email.eq.${currentUserEmail},user2_email.eq.${currentUserEmail}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('チャットルーム取得エラー:', error);
        return res.status(500).json({ error: 'チャットルームの取得に失敗しました' });
      }

      // 各チャットルームのメッセージ数と最新メッセージを取得
      const roomsWithMessages = await Promise.all(
        (rooms || []).map(async (room) => {
          try {
            // メッセージ数を取得（chat_room_idに修正）
            const { count, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_room_id', room.id);

            if (countError) {
              console.error('メッセージ数取得エラー:', countError);
              return { ...room, messageCount: 0, latestMessage: null };
            }

            // 最新メッセージを取得（メッセージが存在する場合のみ）
            let latestMessage = null;
            if (count > 0) {
              const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_room_id', room.id)
                .order('created_at', { ascending: false })
                .limit(1);

              if (!msgError && msgData && msgData.length > 0) {
                latestMessage = msgData[0];
              }
            }

            return {
              ...room,
              messageCount: count || 0,
              latestMessage: latestMessage
            };
          } catch (err) {
            console.error('チャットルーム処理エラー:', err);
            return { ...room, messageCount: 0, latestMessage: null };
          }
        })
      );

      // メッセージが1件以上あるチャットルームのみ返す
      const roomsWithContent = roomsWithMessages.filter(room => room.messageCount > 0);

      return res.status(200).json(roomsWithContent);
    }

    if (req.method === 'POST') {
      // 新しいチャットルームを作成、または既存のものを取得
      const { otherUserEmail, otherUserName, jobId } = req.body;

      if (!otherUserEmail || !otherUserName) {
        return res.status(400).json({ error: '相手のメールアドレスと名前が必要です' });
      }

      if (!jobId) {
        return res.status(400).json({ error: 'ジョブIDが必要です' });
      }

      // 自分自身とはチャットできない
      if (otherUserEmail === currentUserEmail) {
        return res.status(400).json({ error: '自分自身とチャットすることはできません' });
      }

      // user1とuser2をアルファベット順にソート（重複防止）
      const [user1Email, user1Name, user2Email, user2Name] = 
        currentUserEmail < otherUserEmail
          ? [currentUserEmail, currentUserName, otherUserEmail, otherUserName]
          : [otherUserEmail, otherUserName, currentUserEmail, currentUserName];

      // 既存のチャットルームがあるか確認（同じユーザーペア + 同じjob_id）
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('user1_email', user1Email)
        .eq('user2_email', user2Email)
        .eq('job_id', jobId)
        .single();

      if (existingRoom) {
        // 既存のルームを返す
        return res.status(200).json(existingRoom);
      }

      // 新しいチャットルームを作成
      const roomData = {
        user1_email: user1Email,
        user1_name: user1Name,
        user2_email: user2Email,
        user2_name: user2Name,
        job_id: jobId,
      };

      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert([roomData])
        .select()
        .single();

      if (createError) {
        console.error('チャットルーム作成エラー:', createError);
        return res.status(500).json({ error: 'チャットルームの作成に失敗しました' });
      }

      return res.status(201).json(newRoom);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}
