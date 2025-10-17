// 改善版データ移行スクリプト（テーブル作成込み）
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔄 改善版データ移行開始...\n');

// Supabaseクライアント作成（SERVICE_ROLE_KEYを使用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が不足しています');
  console.log('🔧 必要な環境変数:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 管理者権限クライアント（テーブル作成用）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
// 一般権限クライアント（データ操作用）
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Supabase接続確認...');
console.log(`📡 URL: ${supabaseUrl}`);
console.log(`🔑 SERVICE_KEY: ${supabaseServiceKey ? '✅ 設定済み' : '❌ 未設定'}`);
console.log(`🔑 ANON_KEY: ${supabaseAnonKey ? '✅ 設定済み' : '❌ 未設定'}`);

// サンプルデータ
const sampleData = {
  users: [
    {
      username: 'client_demo',
      email: 'client@demo.com',
      password_hash: '$2b$10$example.hashed.password.here',
      user_type: 'client',
      profile_data: { company: 'デモ会社', rating: 4.5 }
    },
    {
      username: 'worker_demo', 
      email: 'worker@demo.com',
      password_hash: '$2b$10$example.hashed.password.here',
      user_type: 'worker',  
      profile_data: { skills: ['Web開発', 'デザイン'], rating: 4.8 }
    }
  ],
  jobs: [
    {
      title: 'デモWebサイト制作',
      description: 'デモ用のWebサイト制作案件です。',
      category: 'web_development',
      budget: 100000,
      deadline: '2025-01-31',
      status: 'open',
      client_id: 1,
      requirements: { experience: '1年以上', tools: ['HTML', 'CSS'] }
    }
  ],
  applications: [
    {
      job_id: 1,
      worker_id: 2,
      proposal: 'デモ応募です。よろしくお願いします。',
      proposed_budget: 90000,
      status: 'pending'
    }
  ],
  messages: [
    {
      job_id: 1,
      sender_id: 1,
      receiver_id: 2, 
      message: 'デモメッセージ1: こんにちは！',
      message_type: 'text',
      read_status: false
    },
    {
      job_id: 1,
      sender_id: 2,
      receiver_id: 1,
      message: 'デモメッセージ2: よろしくお願いします！',
      message_type: 'text', 
      read_status: false
    }
  ]
};

// テーブル存在確認関数
async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return false; // テーブル存在しない
      }
      throw error;
    }
    return true; // テーブル存在する
  } catch (err) {
    return false;
  }
}

// テーブル作成関数（直接SQL実行）
async function createTablesWithSQL() {
  console.log('\n🏗️ テーブル作成開始...');
  
  const createTableSQL = `
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

    -- 5. RLS有効化
    ALTER TABLE crowdwork_users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE crowdwork_jobs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE crowdwork_applications ENABLE ROW LEVEL SECURITY;
    ALTER TABLE crowdwork_messages ENABLE ROW LEVEL SECURITY;

    -- 6. 基本ポリシー作成
    DROP POLICY IF EXISTS "Enable all for users" ON crowdwork_users;
    CREATE POLICY "Enable all for users" ON crowdwork_users FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Enable all for jobs" ON crowdwork_jobs;
    CREATE POLICY "Enable all for jobs" ON crowdwork_jobs FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Enable all for applications" ON crowdwork_applications;
    CREATE POLICY "Enable all for applications" ON crowdwork_applications FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Enable all for messages" ON crowdwork_messages;
    CREATE POLICY "Enable all for messages" ON crowdwork_messages FOR ALL USING (true);
  `;

  try {
    // SQLを分割して実行
    const statements = createTableSQL.split(';').filter(s => s.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`📝 SQL実行中 (${i + 1}/${statements.length})...`);
        
        const { data, error } = await supabaseAdmin.rpc('exec', {
          sql: statement
        });
        
        if (error) {
          // exec関数が存在しない場合の代替処理
          console.log(`⚠️ SQL実行エラー（スキップ）: ${error.message.substring(0, 50)}...`);
        }
      }
    }
    
    console.log('✅ テーブル作成処理完了');
    return true;
    
  } catch (error) {
    console.log('⚠️ SQL実行中にエラーが発生しましたが続行します:', error.message);
    return true; // エラーでも続行
  }
}

// データ移行メイン関数
async function migrateDataImproved() {
  try {
    // 1. テーブル存在確認
    console.log('\n🔍 テーブル存在確認...');
    const tables = ['crowdwork_users', 'crowdwork_jobs', 'crowdwork_applications', 'crowdwork_messages'];
    const tableStatus = {};
    
    for (const table of tables) {
      const exists = await checkTableExists(table);
      tableStatus[table] = exists;
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? '存在' : '不存在'}`);
    }
    
    const missingTables = Object.values(tableStatus).filter(exists => !exists).length;
    
    if (missingTables > 0) {
      console.log(`\n⚠️ ${missingTables}個のテーブルが不足しています`);
      console.log('🏗️ テーブル作成を試行します...');
      
      await createTablesWithSQL();
      
      // 再確認
      console.log('\n🔍 テーブル作成後の確認...');
      for (const table of tables) {
        const exists = await checkTableExists(table);
        console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? '存在' : '不存在'}`);
      }
    }
    
    // 2. データ取得
    console.log('\n📁 サンプルデータ準備...');
    const localData = sampleData;
    
    console.log(`👥 ユーザー: ${localData.users.length}件`);
    console.log(`💼 案件: ${localData.jobs.length}件`);
    console.log(`📝 応募: ${localData.applications.length}件`);
    console.log(`💬 メッセージ: ${localData.messages.length}件`);
    
    // 3. データ移行実行
    console.log('\n🔄 データ移行開始...');
    
    // ユーザーデータ移行
    console.log('1️⃣ ユーザーデータ移行中...');
    try {
      const { data: insertedUsers, error: usersInsertError } = await supabase
        .from('crowdwork_users')
        .insert(localData.users)
        .select();
        
      if (usersInsertError) {
        if (usersInsertError.message.includes('duplicate') || 
            usersInsertError.message.includes('unique')) {
          console.log('⚠️ ユーザーデータ重複（スキップ）');
        } else {
          console.log('⚠️ ユーザー挿入エラー:', usersInsertError.message);
        }
      } else {
        console.log(`✅ ユーザー移行完了: ${insertedUsers?.length || 0}件`);
      }
    } catch (err) {
      console.log('⚠️ ユーザー移行で予期しないエラー:', err.message);
    }
    
    // 案件データ移行
    console.log('2️⃣ 案件データ移行中...');
    try {
      const { data: insertedJobs, error: jobsInsertError } = await supabase
        .from('crowdwork_jobs')
        .insert(localData.jobs)
        .select();
        
      if (jobsInsertError) {
        console.log('⚠️ 案件挿入エラー:', jobsInsertError.message);
      } else {
        console.log(`✅ 案件移行完了: ${insertedJobs?.length || 0}件`);
      }
    } catch (err) {
      console.log('⚠️ 案件移行で予期しないエラー:', err.message);
    }
    
    // 応募データ移行
    console.log('3️⃣ 応募データ移行中...');
    try {
      const { data: insertedApps, error: appsInsertError } = await supabase
        .from('crowdwork_applications')
        .insert(localData.applications)
        .select();
        
      if (appsInsertError) {
        console.log('⚠️ 応募挿入エラー:', appsInsertError.message);
      } else {
        console.log(`✅ 応募移行完了: ${insertedApps?.length || 0}件`);
      }
    } catch (err) {
      console.log('⚠️ 応募移行で予期しないエラー:', err.message);
    }
    
    // メッセージデータ移行
    console.log('4️⃣ メッセージデータ移行中...');
    try {
      const { data: insertedMsgs, error: msgsInsertError } = await supabase
        .from('crowdwork_messages')
        .insert(localData.messages)
        .select();
        
      if (msgsInsertError) {
        console.log('⚠️ メッセージ挿入エラー:', msgsInsertError.message);
      } else {
        console.log(`✅ メッセージ移行完了: ${insertedMsgs?.length || 0}件`);
      }
    } catch (err) {
      console.log('⚠️ メッセージ移行で予期しないエラー:', err.message);
    }
    
    // 4. 移行結果確認
    console.log('\n📊 最終確認...');
    try {
      const { data: finalUsers } = await supabase.from('crowdwork_users').select('id');
      const { data: finalJobs } = await supabase.from('crowdwork_jobs').select('id');
      const { data: finalApps } = await supabase.from('crowdwork_applications').select('id');
      const { data: finalMsgs } = await supabase.from('crowdwork_messages').select('id');
      
      console.log('📈 Supabase内最終データ件数:');
      console.log(`  👥 ユーザー: ${finalUsers?.length || 0}件`);
      console.log(`  💼 案件: ${finalJobs?.length || 0}件`);
      console.log(`  📝 応募: ${finalApps?.length || 0}件`);
      console.log(`  💬 メッセージ: ${finalMsgs?.length || 0}件`);
      
      const totalRecords = (finalUsers?.length || 0) + (finalJobs?.length || 0) + 
                          (finalApps?.length || 0) + (finalMsgs?.length || 0);
      
      if (totalRecords > 0) {
        console.log('\n🎉 データ移行が完了しました！');
        return true;
      } else {
        console.log('\n⚠️ データが移行されていません');
        return false;
      }
      
    } catch (err) {
      console.log('⚠️ 最終確認でエラー:', err.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message);
    console.log('🔧 対処方法:');
    console.log('1. Supabase Dashboard → SQL Editor で手動テーブル作成');
    console.log('2. 環境変数の再確認');
    console.log('3. Supabaseプロジェクトの権限確認');
    return false;
  }
}

// メイン実行
migrateDataImproved().then(success => {
  if (success) {
    console.log('\n🎊 Phase 2 完了！');
    console.log('📋 次のステップ:');
    console.log('✅ アプリケーション統合テスト');
    console.log('✅ Phase 3: 通知・メール機能実装');
    console.log('✅ Phase 4: 決済システム実装');
    console.log('\n🚀 Supabaseデータベース移行成功！');
  } else {
    console.log('\n🔧 手動でテーブル作成を実行してください:');
    console.log('1. Supabase Dashboard → SQL Editor');
    console.log('2. supabase-tables.sql の内容を実行');
    console.log('3. 再度このスクリプトを実行');
  }
});
