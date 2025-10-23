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
      .order('updated_at', { ascending: false });

    if (error2) {
      console.error('クライアント側取得エラー:', error2);
    }

    // 2つのデータを結合
    const allApplications = [
      ...(asFreelancer || []),
      ...(asClient || [])
    ];

    // データを整形して返す
    const matchings = allApplications
      .filter(app => app.jobs)
      .map(app => ({
        applicationId: app.id,
        jobId: app.job_id,
        jobTitle: app.jobs.title,
        jobDescription: app.jobs.description,
        jobCategory: app.jobs.category,
        jobStatus: app.jobs.status,
        clientEmail: app.jobs.client_email,
        clientName: app.jobs.client_name,
        freelancerEmail: app.freelancer_email,
        freelancerName: app.freelancer_name,
        chatRoomId: app.chat_room_id,
        matchedAt: app.updated_at,
        isClient: app.jobs.client_email === currentUserEmail,
      }))
      .sort((a, b) => new Date(b.matchedAt) - new Date(a.matchedAt)); // 日付でソート

    return res.status(200).json(matchings);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}
