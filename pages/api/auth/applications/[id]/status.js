import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ログインユーザーを確認
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const { id } = req.query; // 応募ID
    const { status } = req.body; // 新しいステータス (approved または rejected)

    // ステータスのバリデーション
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '無効なステータスです' });
    }

    // 応募情報を取得して、案件のクライアントか確認
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        id,
        job_id,
        status,
        jobs (
          client_email
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !application) {
      return res.status(404).json({ error: '応募が見つかりません' });
    }

    // クライアント本人か確認
    if (application.jobs.client_email !== session.user.email) {
      return res.status(403).json({ error: 'この応募を操作する権限がありません' });
    }

    // すでに承認/却下済みの場合はエラー
    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'この応募はすでに処理されています' });
    }

    // ステータスを更新
    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('ステータス更新エラー:', updateError);
      return res.status(500).json({ error: 'ステータスの更新に失敗しました' });
    }

    return res.status(200).json({ 
      success: true, 
      application: updatedApplication 
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}
