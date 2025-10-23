import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const currentUserEmail = session.user.email;

    // 応募者側：自分が応募して承認された案件
    const { data: asFreelancer, error: error1 } = await supabase
      .from('applications')
      .select(`
        id,
        job_id,
        freelancer_email,
        freelancer_name,
        status,
        chat_room_id,
        created_at,
        updated_at,
        jobs (
          id,
          title,
          description,
          category,
          client_email,
          client_name,
          status,
          created_at
        )
      `)
      .eq('status', 'approved')
      .eq('freelancer_email', currentUserEmail)
      .not('chat_room_id', 'is', null)
      .order('updated_at', { ascending: false });

    if (error1) {
      console.error('応募者側取得エラー:', error1);
    }

    // クライアント側：自分が投稿した案件への承認済み応募
    const { data: asClient, error: error2 } = await supabase
      .from('applications')
      .select(`
        id,
        job_id,
        freelancer_email,
        freelancer_name,
        status,
        chat_room_id,
        created_at,
        updated_at,
        jobs!inner (
          id,
          title,
          description,
          category,
          client_email,
          client_name,
          status,
          created_at
        )
      `)
      .eq('status', 'approved')
      .eq('jobs.client_email', currentUserEmail)
      .not('chat_room_id', 'is', null)
      .order('updated_at', { ascending: false });

    if (error2) {
      console.error('クライアント側取得エラー:', error2);
    }

    // チャットルーム情報とメッセージを取得
    const allApplications = [
      ...(asFreelancer || []),
      ...(asClient || [])
    ];

    const matchingsWithMessages = await Promise.all(
      allApplications.map(async (app) => {
        if (!app.chat_room_id) return null;

        // チャットルーム情報を取得
        const { data: room } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', app.chat_room_id)
          .single();

        // 最新メッセージを取得
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_room_id', app.chat_room_id)
          .order('created_at', { ascending: false })
          .limit(1);

        // 未読数を取得
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_room_id', app.chat_room_id)
          .eq('is_read', false)
          .neq('sender_email', currentUserEmail);

        return {
          chatRoomId: app.chat_room_id,
          jobId: app.job_id,
          jobTitle: app.jobs?.title || '案件情報なし',
          jobCategory: app.jobs?.category || '',
          clientEmail: app.jobs?.client_email,
          clientName: app.jobs?.client_name,
          freelancerEmail: app.freelancer_email,
          freelancerName: app.freelancer_name,
          isClient: app.jobs?.client_email === currentUserEmail,
          latestMessage: latestMessage?.[0] || null,
          unreadCount: unreadCount || 0,
          updatedAt: room?.updated_at || app.updated_at,
          room: room
        };
      })
    );

    const validMatchings = matchingsWithMessages
      .filter(m => m !== null)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.status(200).json(validMatchings);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}
