import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query; // 案件ID

    // 案件IDのバリデーション
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: '無効な案件IDです' });
    }

    // 案件データを取得
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: '案件が見つかりません' });
    }

    if (!job) {
      return res.status(404).json({ error: '案件が見つかりません' });
    }

    // 案件データを返す
    return res.status(200).json(job);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}
