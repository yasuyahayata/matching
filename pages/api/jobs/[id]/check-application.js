import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

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

    const { id } = req.query; // 案件ID
    const userEmail = session.user.email;

    // この案件に既に応募しているかチェック
    const { data: existingApplication, error } = await supabase
      .from('applications')
      .select('id, status')
      .eq('job_id', parseInt(id))
      .eq('freelancer_email', userEmail)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = データが見つからない
      console.error('応募チェックエラー:', error);
      return res.status(500).json({ error: '応募状況の確認に失敗しました' });
    }

    return res.status(200).json({
      hasApplied: !!existingApplication,
      application: existingApplication || null
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}
