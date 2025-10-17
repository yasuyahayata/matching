// テーブル作成確認スクリプト
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 データベーステーブル確認開始...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTables() {
  try {
    console.log('📊 作成されたテーブルを確認中...');
    
    // 各テーブルの存在確認
    const tablesToCheck = [
      'crowdwork_users',
      'crowdwork_jobs', 
      'crowdwork_applications',
      'crowdwork_messages'
    ];
    
    const results = [];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.code === 'PGRST116') {
            results.push({ table: tableName, status: '❌ 存在しない', error: error.message });
          } else {
            results.push({ table: tableName, status: '✅ 存在', error: null });
          }
        } else {
          results.push({ table: tableName, status: '✅ 存在', error: null });
        }
      } catch (err) {
        results.push({ table: tableName, status: '❌ エラー', error: err.message });
      }
    }
    
    // 結果表示
    console.log('\n📋 テーブル確認結果:');
    console.log('─'.repeat(60));
    results.forEach(result => {
      console.log(`${result.status} ${result.table}`);
      if (result.error) {
        console.log(`   🔍 詳細: ${result.error}`);
      }
    });
    console.log('─'.repeat(60));
    
    const existingTables = results.filter(r => r.status.includes('✅')).length;
    const totalTables = results.length;
    
    console.log(`\n📈 確認結果: ${existingTables}/${totalTables} テーブルが存在`);
    
    if (existingTables === totalTables) {
      console.log('🎉 全てのテーブルが正常に作成されています！');
      console.log('\n📋 次のステップ:');
      console.log('✅ Phase 2: データ移行スクリプト実行');
      console.log('🚀 コマンド: node migrate-data-to-supabase.js');
      return true;
    } else {
      console.log('⚠️ 一部のテーブルが不足しています');
      console.log('\n🔧 修正方法:');
      console.log('1. Supabase Dashboard → SQL Editor');
      console.log('2. supabase-tables.sql の内容をコピペして実行');
      console.log('3. node verify-tables.js で再確認');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 確認エラー:', error.message);
    return false;
  }
}

// メイン実行
verifyTables();
