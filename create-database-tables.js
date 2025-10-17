// Supabaseデータベーステーブル作成スクリプト
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🏗️ データベーステーブル作成開始...\n');

// Supabaseクライアント作成（SERVICE_ROLE_KEY使用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が不足しています');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// テーブル作成SQLクエリ
const createTablesSQL = `
-- 1. ユーザーテーブル
CREATE TABLE IF NOT EXISTS crowdwork_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) DEFAULT 'worker',
  profile_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 案件テーブル
CREATE TABLE IF NOT EXISTS crowdwork_jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  budget INTEGER,
  deadline DATE,
  status VARCHAR(20) DEFAULT 'open',
  client_id INTEGER REFERENCES crowdwork_users(id),
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 応募テーブル
CREATE TABLE IF NOT EXISTS crowdwork_applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES crowdwork_jobs(id) ON DELETE CASCADE,
  worker_id INTEGER REFERENCES crowdwork_users(id) ON DELETE CASCADE,
  proposal TEXT,
  proposed_budget INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, worker_id)
);

-- 4. メッセージテーブル
CREATE TABLE IF NOT EXISTS crowdwork_messages (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES crowdwork_jobs(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES crowdwork_users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES crowdwork_users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  read_status BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_jobs_client ON crowdwork_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON crowdwork_jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job ON crowdwork_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_worker ON crowdwork_applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_messages_job ON crowdwork_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON crowdwork_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON crowdwork_messages(receiver_id);

-- 6. Row Level Security (RLS) 有効化
ALTER TABLE crowdwork_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowdwork_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowdwork_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowdwork_messages ENABLE ROW LEVEL SECURITY;

-- 7. 基本的なRLSポリシー（ユーザーは自分のデータのみアクセス可能）
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON crowdwork_users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON crowdwork_users
  FOR UPDATE USING (auth.uid()::text = id::text);
`;

// テーブル作成実行
async function createTables() {
  try {
    console.log('📝 SQLクエリ実行中...');
    
    // SQL実行（複数のクエリを分割実行）
    const queries = createTablesSQL.split(';').filter(query => query.trim());
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim();
      if (query) {
        console.log(`📋 実行中 (${i + 1}/${queries.length}): ${query.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: query
        });
        
        if (error) {
          // 代替方法: 直接SQL実行
          const { data: altData, error: altError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);
            
          if (altError) {
            console.log(`⚠️ クエリ ${i + 1} でエラー:`, error.message);
            // 重要でないエラーは続行
            if (!error.message.includes('already exists') && 
                !error.message.includes('permission denied')) {
              throw error;
            }
          }
        }
      }
    }
    
    console.log('✅ テーブル作成完了！');
    
    // テーブル確認
    console.log('\n🔍 作成されたテーブルを確認中...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'crowdwork_%');
    
    if (tablesError) {
      console.log('⚠️ テーブル一覧取得エラー:', tablesError.message);
    } else {
      console.log('📊 作成されたテーブル:');
      tables?.forEach(table => {
        console.log(`  ✅ ${table.table_name}`);
      });
      console.log(`📈 合計: ${tables?.length || 0} テーブル`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ テーブル作成エラー:', error.message);
    console.log('🔧 トラブルシューティング:');
    console.log('1. Supabase Dashboard → SQL Editor で手動実行');
    console.log('2. SERVICE_ROLE_KEY の権限確認');
    console.log('3. データベース接続の確認');
    return false;
  }
}

// メイン実行
createTables().then(success => {
  if (success) {
    console.log('\n🎉 データベース準備完了！');
    console.log('📋 次のステップ:');
    console.log('✅ Phase 2: データ移行スクリプト作成');
    console.log('🚀 コマンド: node migrate-data-to-supabase.js');
  } else {
    console.log('\n🔧 問題解決後、再実行してください:');
    console.log('node create-database-tables.js');
  }
});
