import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// 🆕 Service Role Key を使用（サーバーサイド専用）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 🆕 Service Role Key
);

export default async function handler(req, res) {
  const { id } = req.query;

  // 案件IDのバリデーション
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: '無効な案件IDです' });
  }

  const jobId = parseInt(id);

  // GETメソッド - 案件取得
  if (req.method === 'GET') {
    try {
      const { data: job, error } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(404).json({ error: '案件が見つかりません' });
      }

      if (!job) {
        return res.status(404).json({ error: '案件が見つかりません' });
      }

      return res.status(200).json(job);

    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  }

  // PUTメソッド - 案件更新
  if (req.method === 'PUT') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      // 既存の案件を取得
      const { data: existingJob, error: fetchError } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError || !existingJob) {
        return res.status(404).json({ error: '案件が見つかりません' });
      }

      // 投稿者本人かチェック
      if (existingJob.client_email !== session.user.email) {
        return res.status(403).json({ error: 'この案件を編集する権限がありません' });
      }

      const { title, description, deadline, skills } = req.body;

      // バリデーション
      if (!title || !description) {
        return res.status(400).json({ error: 'タイトルと詳細は必須です' });
      }

      // 案件を更新
      const { data: updatedJob, error: updateError } = await supabaseAdmin
        .from('jobs')
        .update({
          title,
          description,
          deadline: deadline || null,
          skills: skills || [],
          category: skills && skills.length > 0 ? skills[0] : existingJob.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: '案件の更新に失敗しました' });
      }

      return res.status(200).json(updatedJob);

    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  }

  // DELETEメソッド - 案件削除
  if (req.method === 'DELETE') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      // 既存の案件を取得
      const { data: existingJob, error: fetchError } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      console.log('🔍 削除対象の案件:', existingJob);

      if (fetchError || !existingJob) {
        console.log('❌ 案件が見つかりません:', fetchError);
        return res.status(404).json({ error: '案件が見つかりません' });
      }

      // 投稿者本人かチェック
      if (existingJob.client_email !== session.user.email) {
        return res.status(403).json({ error: 'この案件を削除する権限がありません' });
      }

      // 応募がある場合は削除できないようにする
      const { data: applications, error: appError } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('job_id', jobId);

      console.log('📋 応募数:', applications?.length);

      if (appError) {
        console.error('Applications check error:', appError);
      }

      if (applications && applications.length > 0) {
        return res.status(400).json({ 
          error: 'この案件には応募があるため削除できません',
          hasApplications: true
        });
      }

      // 🆕 案件を削除（Service Role Key使用）
      const { error: deleteError } = await supabaseAdmin
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (deleteError) {
        console.error('❌ 削除エラー:', deleteError);
        return res.status(500).json({ error: '案件の削除に失敗しました' });
      }

      console.log('✅ 削除成功:', jobId);
      return res.status(200).json({ message: '案件を削除しました' });

    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  }

  // その他のメソッドは許可しない
  return res.status(405).json({ error: 'Method not allowed' });
}
