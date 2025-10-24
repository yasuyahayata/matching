import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { createNotification } from '../../notifications/create';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const { id } = req.query;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '無効なステータスです' });
    }

    // 応募情報を取得（freelancer情報も含める）
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        id,
        job_id,
        status,
        freelancer_email,
        freelancer_name,
        jobs (
          id,
          title,
          client_email,
          client_name
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !application) {
      return res.status(404).json({ error: '応募が見つかりません' });
    }

    if (application.jobs.client_email !== session.user.email) {
      return res.status(403).json({ error: 'この応募を操作する権限がありません' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'この応募はすでに処理されています' });
    }

    let chatRoomId = null;

    // 承認の場合、チャットルームを作成
    if (status === 'approved') {
      // user1とuser2をアルファベット順にソート
      const [user1Email, user1Name, user2Email, user2Name] = 
        application.jobs.client_email < application.freelancer_email
          ? [
              application.jobs.client_email, 
              application.jobs.client_name || application.jobs.client_email,
              application.freelancer_email, 
              application.freelancer_name
            ]
          : [
              application.freelancer_email, 
              application.freelancer_name,
              application.jobs.client_email, 
              application.jobs.client_name || application.jobs.client_email
            ];

      // 既存のチャットルームがあるか確認
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('user1_email', user1Email)
        .eq('user2_email', user2Email)
        .eq('job_id', application.job_id)
        .single();

      if (existingRoom) {
        // 既存のチャットルームを使用
        chatRoomId = existingRoom.id;
      } else {
        // 新しいチャットルームを作成
        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert([{
            user1_email: user1Email,
            user1_name: user1Name,
            user2_email: user2Email,
            user2_name: user2Name,
            job_id: application.job_id
          }])
          .select()
          .single();

        if (roomError) {
          console.error('チャットルーム作成エラー:', roomError);
          return res.status(500).json({ error: 'チャットルームの作成に失敗しました' });
        }

        chatRoomId = newRoom.id;
      }
    }

    // ステータスとchat_room_idを更新
    const updateData = { 
      status: status,
      updated_at: new Date().toISOString()
    };

    if (chatRoomId) {
      updateData.chat_room_id = chatRoomId;
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('ステータス更新エラー:', updateError);
      return res.status(500).json({ error: 'ステータスの更新に失敗しました' });
    }

    // 🆕 応募者に通知を送信
    const notificationMessage = status === 'approved'
      ? `「${application.jobs.title}」への応募が承認されました！`
      : `「${application.jobs.title}」への応募が不承認となりました。`;

    await createNotification({
      recipientEmail: application.freelancer_email,
      senderEmail: session.user.email,
      senderName: session.user.name || '投稿者',
      type: status === 'approved' ? 'application_approved' : 'application_rejected',
      jobId: application.jobs.id.toString(),
      jobTitle: application.jobs.title,
      applicationId: application.id,
      message: notificationMessage
    });

    return res.status(200).json({ 
      success: true, 
      application: updatedApplication,
      chatRoomId: chatRoomId
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}
