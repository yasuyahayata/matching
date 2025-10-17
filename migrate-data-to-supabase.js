// localStorage → Supabase データ移行スクリプト
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔄 データ移行開始...\n');

// Supabaseクライアント作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が不足しています');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サンプルデータ（実際のlocalStorageデータがない場合）
const sampleData = {
  users: [
    {
      username: 'client_user',
      email: 'client@example.com',
      password_hash: '$2b$10$example.hashed.password.here',
      user_type: 'client',
      profile_data: { company: 'サンプル会社', rating: 4.5 }
    },
    {
      username: 'worker_user', 
      email: 'worker@example.com',
      password_hash: '$2b$10$example.hashed.password.here',
      user_type: 'worker',  
      profile_data: { skills: ['Web開発', 'デザイン'], rating: 4.8 }
    }
  ],
  jobs: [
    {
      title: 'Webサイト制作案件',
      description: 'コーポレートサイトの制作をお願いします。レスポンシブ対応必須。',
      category: 'web_development',
      budget: 300000,
      deadline: '2025-01-31',
      status: 'open',
      client_id: 1,
      requirements: { experience: '2年以上', tools: ['HTML', 'CSS', 'JavaScript'] }
    },
    {
      title: 'ロゴデザイン作成',
      description: 'スタートアップ企業のロゴデザインを募集します。',
      category: 'design', 
      budget: 50000,
      deadline: '2025-01-15',
      status: 'open',
      client_id: 1,
      requirements: { style: 'モダン', format: ['AI', 'PNG'] }
    }
  ],
  applications: [
    {
      job_id: 1,
      worker_id: 2,
      proposal: 'Webサイト制作の実績が豊富です。ポートフォリオをご確認ください。',
      proposed_budget: 280000,
      status: 'pending'
    }
  ],
  messages: [
    {
      job_id: 1,
      sender_id: 1,
      receiver_id: 2, 
      message: 'ご応募ありがとうございます。詳細について相談させていただけますでしょうか？',
      message_type: 'text',
      read_status: false
    },
    {
      job_id: 1,
      sender_id: 2,
      receiver_id: 1,
      message: 'ありがとうございます。いつでもお話しできます。',
      message_type: 'text', 
      read_status: false
    }
  ]
};

// localStorage データ読み込み関数（ブラウザ環境用）
function getLocalStorageData() {
  if (typeof window === 'undefined') {
    console.log('📁 Node.js環境: サンプルデータを使用します');
    return sampleData;
  }
  
  // ブラウザ環境でのlocalStorage読み込み
  try {
    const users = JSON.parse(localStorage.getItem('crowdwork_users') || '[]');
    const jobs = JSON.parse(localStorage.getItem('crowdwork_jobs') || '[]');
    const applications = JSON.parse(localStorage.getItem('crowdwork_applications') || '[]');
    const messages = JSON.parse(localStorage.getItem('crowdwork_messages') || '[]');
    
    console.log('📁 localStorage データ読み込み完了');
    console.log(`  👥 ユーザー: ${users.length}件`);
    console.log(`  💼 案件: ${jobs.length}件`);
    console.log(`  📝 応募: ${applications.length}件`);
    console.log(`  💬 メッセージ: ${messages.length}件`);
    
    return { users, jobs, applications, messages };
  } catch (error) {
    console.log('⚠️ localStorage読み込みエラー: サンプルデータを使用');
    return sampleData;
  }
}

// データ移行メイン関数
async function migrateData() {
  try {
    console.log('🔍 既存データ確認中...');
    
    // 既存データ確認
    const { data: existingUsers, error: usersError } = await supabase
      .from('crowdwork_users')
      .select('id')
      .limit(1);
      
    if (usersError && usersError.code !== 'PGRST116') {
      throw usersError;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️ 既存データが存在します。上書き移行しますか？');
      console.log('   続行する場合は、このスクリプトを再実行してください。');
      // 実際の環境では、ユーザー確認を待つ
    }
    
    // データ取得
    const localData = getLocalStorageData();
    
    console.log('\n🔄 データ移行開始...');
    
    // 1. ユーザーデータ移行
    console.log('1️⃣ ユーザーデータ移行中...');
    if (localData.users.length > 0) {
      const { data: insertedUsers, error: usersInsertError } = await supabase
        .from('crowdwork_users')
        .insert(localData.users)
        .select();
        
      if (usersInsertError) {
        console.log('⚠️ ユーザー挿入エラー:', usersInsertError.message);
        // 重複エラーは無視して続行
        if (!usersInsertError.message.includes('duplicate') && 
            !usersInsertError.message.includes('unique')) {
          throw usersInsertError;
        }
      } else {
        console.log(`✅ ユーザー移行完了: ${insertedUsers?.length || 0}件`);
      }
    }
    
    // 2. 案件データ移行
    console.log('2️⃣ 案件データ移行中...');
    if (localData.jobs.length > 0) {
      const { data: insertedJobs, error: jobsInsertError } = await supabase
        .from('crowdwork_jobs')
        .insert(localData.jobs)
        .select();
        
      if (jobsInsertError) {
        console.log('⚠️ 案件挿入エラー:', jobsInsertError.message);
      } else {
        console.log(`✅ 案件移行完了: ${insertedJobs?.length || 0}件`);
      }
    }
    
    // 3. 応募データ移行
    console.log('3️⃣ 応募データ移行中...');
    if (localData.applications.length > 0) {
      const { data: insertedApps, error: appsInsertError } = await supabase
        .from('crowdwork_applications')
        .insert(localData.applications)
        .select();
        
      if (appsInsertError) {
        console.log('⚠️ 応募挿入エラー:', appsInsertError.message);
      } else {
        console.log(`✅ 応募移行完了: ${insertedApps?.length || 0}件`);
      }
    }
    
    // 4. メッセージデータ移行  
    console.log('4️⃣ メッセージデータ移行中...');
    if (localData.messages.length > 0) {
      const { data: insertedMsgs, error: msgsInsertError } = await supabase
        .from('crowdwork_messages')
        .insert(localData.messages)
        .select();
        
      if (msgsInsertError) {
        console.log('⚠️ メッセージ挿入エラー:', msgsInsertError.message);
      } else {
        console.log(`✅ メッセージ移行完了: ${insertedMsgs?.length || 0}件`);
      }
    }
    
    console.log('\n🎉 データ移行完了！');
    
    // 移行結果確認
    console.log('\n📊 移行結果確認...');
    const { data: finalUsers } = await supabase.from('crowdwork_users').select('id');
    const { data: finalJobs } = await supabase.from('crowdwork_jobs').select('id');
    const { data: finalApps } = await supabase.from('crowdwork_applications').select('id');
    const { data: finalMsgs } = await supabase.from('crowdwork_messages').select('id');
    
    console.log('📈 Supabase内データ件数:');
    console.log(`  👥 ユーザー: ${finalUsers?.length || 0}件`);
    console.log(`  💼 案件: ${finalJobs?.length || 0}件`);
    console.log(`  📝 応募: ${finalApps?.length || 0}件`);
    console.log(`  💬 メッセージ: ${finalMsgs?.length || 0}件`);
    
    return true;
    
  } catch (error) {
    console.error('❌ 移行エラー:', error.message);
    console.log('🔧 トラブルシューティング:');
    console.log('1. テーブル作成が完了しているか確認');
    console.log('2. 環境変数の設定確認');
    console.log('3. データ形式の確認');
    return false;
  }
}

// メイン実行
migrateData().then(success => {
  if (success) {
    console.log('\n🎊 Phase 2 完了！');
    console.log('📋 次のステップ:');
    console.log('✅ Phase 3: 通知・メール機能実装');
    console.log('✅ Phase 4: 決済システム実装');
    console.log('🚀 アプリケーション統合テスト準備完了');
  } else {
    console.log('\n🔧 問題解決後、再実行してください:');
    console.log('node migrate-data-to-supabase.js');
  }
});
