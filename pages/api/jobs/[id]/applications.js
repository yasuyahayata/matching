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

    // 応募データを取得（案件IDで絞り込み）
    // chat_room_idを明示的に含める
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        job_id,
        freelancer_email,
        freelancer_name,
        message,
        status,
        chat_room_id,
        created_at,
        updated_at
      `)
      .eq('job_id', parseInt(id))
      .order('created_at', { ascending: false }); // 新しい順に並べる

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: '応募データの取得に失敗しました' });
    }

    // 応募データを返す（空の配列でもOK）
    return res.status(200).json(applications || []);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}
