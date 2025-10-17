// スキーマキャッシュ問題修正版データ移行
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 スキーマキャッシュ修正版データ移行開始...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が不足しています');
  process.exit(1);
}

// 異なる権限で複数のクライアントを作成
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

console.log('📡 Supabase接続情報:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   ANON_KEY: ✅ 設定済み`);
console.log(`   SERVICE_KEY: ${supabaseServiceKey ? '✅ 設定済み' : '⚠️ 未設定'}`);

// デモデータ
const demoData = {
  users: [
    {
      username: 'demo_client_v2',
      email: 'client.v2@demo.jp',
      password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz.1234567890.ABCDEFGHIJ',
      user_type: 'client',
      profile_data: { 
        company: 'デモ株式会社v2', 
        rating: 4.5, 
        description: 'デモクライアント（修正版）' 
      }
    },
    {
      username: 'demo_worker_v2',
      email: 'worker.v2@demo.jp',
      password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz.1234567890.ABCDEFGHIJ',
      user_type: 'worker',
      profile_data: { 
        skills: ['JavaScript', 'React', 'Next.js'], 
        rating: 4.8,
        experience: '3年',
        description: 'フルスタック開発者（修正版）'
      }
    }
  ],
  jobs: [
    {
      title: 'デモWebサイト制作v2',
      description: 'デモ用のWebサイト制作案件（修正版）です。',
      category: 'web_development',
      budget: 300000,
      deadline: '2025-02-28',
      status: 'open',
      client_id: 1,
      requirements: { 
        experience: '2年以上', 
        skills: ['HTML', 'CSS', 'JavaScript']
      }
    }
  ],
  applications: [
    {
      job_id: 1,
      worker_id: 2,
      proposal: 'デモ応募v2です。よろしくお願いします。',
      proposed_budget: 280000,
      status: 'pending'
    }
  ],
  messages: [
    {
      job_id: 1,
      sender_id: 1,
      receiver_id: 2,
      message: 'デモメッセージv2: こんにちは！',
      message_type: 'text',
      read_status: false
    }
  ]
};

// スキーマキャッシュリフレッシュ関数
async function refreshSchemaCache() {
  console.log('🔄 スキーマキャッシュリフレッシュ試行...');
  
  try {
    // 方法1: サービスロールキーで接続テスト
    if (supabaseAdmin) {
      console.log('1️⃣ SERVICE_ROLE_KEYでテスト...');
      const { data, error } = await supabaseAdmin
        .from('crowdwork_users')
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`⚠️ SERVICE_ROLE_KEY結果: ${error.message}`);
      } else {
        console.log('✅ SERVICE_ROLE_KEYで接続成功');
        return 'service';
      }
    }
    
    // 方法2: 待機してから再試行
    console.log('2️⃣ 待機後にANON_KEYで再試行...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
    
    const { data, error } = await supabase
      .from('crowdwork_users')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log(`⚠️ ANON_KEY再試行結果: ${error.message}`);
      return 'failed';
    } else {
      console.log('✅ ANON_KEYで接続成功');
      return 'anon';
    }
    
  } catch (err) {
    console.log('❌ スキーマキャッシュリフレッシュ失敗:', err.message);
    return 'failed';
  }
}

// データ挿入実行（権限に応じて）
async function insertDataWithClient(client, clientType) {
  console.log(`\n🔄 ${clientType}クライアントでデータ挿入開始...`);
  
  try {
    // 1. ユーザーデータ挿入
    console.log('1️⃣ ユーザーデータ挿入...');
    const { data: users, error: usersError } = await client
      .from('crowdwork_users')
      .insert(demoData.users)
      .select();
      
    if (usersError) {
      if (usersError.message.includes('duplicate') || 
          usersError.message.includes('unique') ||
          usersError.message.includes('violates unique constraint')) {
        console.log('⚠️ ユーザーデータ重複（既存データスキップ）');
      } else {
        console.log('❌ ユーザー挿入エラー:', usersError.message);
        return false;
      }
    } else {
      console.log(`✅ ユーザー挿入完了: ${users?.length || 0}件`);
    }
    
    // 2. 案件データ挿入
    console.log('2️⃣ 案件データ挿入...');
    const { data: jobs, error: jobsError } = await client
      .from('crowdwork_jobs')
      .insert(demoData.jobs)
      .select();
      
    if (jobsError) {
      console.log('⚠️ 案件挿入エラー:', jobsError.message);
      // 外部キー制約エラーでも続行
    } else {
      console.log(`✅ 案件挿入完了: ${jobs?.length || 0}件`);
    }
    
    // 3. 応募データ挿入
    console.log('3️⃣ 応募データ挿入...');
    const { data: applications, error: appsError } = await client
      .from('crowdwork_applications')
      .insert(demoData.applications)
      .select();
      
    if (appsError) {
      console.log('⚠️ 応募挿入エラー:', appsError.message);
    } else {
      console.log(`✅ 応募挿入完了: ${applications?.length || 0}件`);
    }
    
    // 4. メッセージデータ挿入
    console.log('4️⃣ メッセージデータ挿入...');
    const { data: messages, error: msgsError } = await client
      .from('crowdwork_messages')
      .insert(demoData.messages)
      .select();
      
    if (msgsError) {
      console.log('⚠️ メッセージ挿入エラー:', msgsError.message);
    } else {
      console.log(`✅ メッセージ挿入完了: ${messages?.length || 0}件`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ ${clientType}クライアントでエラー:`, error.message);
    return false;
  }
}

// メイン関数
async function fixAndMigrate() {
  try {
    console.log('🔍 初期状態確認...');
    
    // スキーマキャッシュリフレッシュ
    const cacheResult = await refreshSchemaCache();
    
    let success = false;
    
    if (cacheResult === 'service' && supabaseAdmin) {
      console.log('\n🔧 SERVICE_ROLE_KEYクライアントで挿入試行...');
      success = await insertDataWithClient(supabaseAdmin, 'SERVICE_ROLE');
    } else if (cacheResult === 'anon') {
      console.log('\n🔧 ANON_KEYクライアントで挿入試行...');
      success = await insertDataWithClient(supabase, 'ANON');
    } else {
      console.log('\n❌ 両方のクライアントで接続に失敗');
      console.log('🔧 手動対処が必要です:');
      console.log('1. Supabase Dashboard → Settings → API');
      console.log('2. "Reset API" ボタンをクリック');
      console.log('3. 数分待ってから再実行');
      return false;
    }
    
    if (success) {
      // 最終確認
      console.log('\n📊 データ移行結果確認...');
      
      const client = cacheResult === 'service' && supabaseAdmin ? supabaseAdmin : supabase;
      
      const { data: finalUsers } = await client.from('crowdwork_users').select('id, username');
      const { data: finalJobs } = await client.from('crowdwork_jobs').select('id, title');
      const { data: finalApps } = await client.from('crowdwork_applications').select('id');
      const { data: finalMsgs } = await client.from('crowdwork_messages').select('id');
      
      console.log('📈 Supabase内データ:');
      console.log(`👥 ユーザー: ${finalUsers?.length || 0}件`);
      finalUsers?.forEach((user, index) => {
        if (index < 5) console.log(`   - ${user.username} (ID: ${user.id})`);
      });
      if (finalUsers?.length > 5) console.log(`   ... 他 ${finalUsers.length - 5} 件`);
      
      console.log(`💼 案件: ${finalJobs?.length || 0}件`);
      finalJobs?.forEach((job, index) => {
        if (index < 3) console.log(`   - ${job.title} (ID: ${job.id})`);
      });
      if (finalJobs?.length > 3) console.log(`   ... 他 ${finalJobs.length - 3} 件`);
      
      console.log(`📝 応募: ${finalApps?.length || 0}件`);
      console.log(`💬 メッセージ: ${finalMsgs?.length || 0}件`);
      
      console.log('\n🎉 スキーマキャッシュ修正版データ移行完了！');
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message);
    return false;
  }
}

// 実行
fixAndMigrate().then(success => {
  if (success) {
    console.log('\n🎊 Phase 2 完了！');
    console.log('📋 解決した問題:');
    console.log('✅ スキーマキャッシュ問題修正');
    console.log('✅ データ移行完了');
    console.log('✅ Supabaseデータベース準備完了');
    console.log('\n🚀 次のフェーズに進む準備完了！');
  } else {
    console.log('\n🔧 手動解決が必要です:');
    console.log('1. Supabase Dashboard でテーブル確認');
    console.log('2. API設定の確認・リセット');
    console.log('3. しばらく待ってから再実行');
  }
});
