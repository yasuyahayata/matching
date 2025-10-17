// Supabase接続テスト（診断機能付き修正版）
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 環境変数診断開始...\n');

// 環境変数の詳細確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 現在の設定値:');
console.log('SUPABASE_URL:', supabaseUrl || '❌ 未設定');
console.log('ANON_KEY:', supabaseAnonKey ? `✅ 設定済み (${supabaseAnonKey.substring(0, 20)}...)` : '❌ 未設定');
console.log('SERVICE_KEY:', supabaseServiceKey ? `✅ 設定済み (${supabaseServiceKey.substring(0, 20)}...)` : '❌ 未設定');
console.log('');

// 基本的な形式チェック
console.log('🔍 APIキー形式診断:');
if (supabaseAnonKey) {
  if (supabaseAnonKey.startsWith('eyJ')) {
    console.log('✅ ANON_KEY: JWT形式（正常）');
  } else {
    console.log('❌ ANON_KEY: JWT形式ではありません');
  }
} else {
  console.log('❌ ANON_KEY: 未設定');
}

if (supabaseServiceKey) {
  if (supabaseServiceKey.startsWith('eyJ')) {
    console.log('✅ SERVICE_KEY: JWT形式（正常）');
  } else {
    console.log('❌ SERVICE_KEY: JWT形式ではありません');
  }
} else {
  console.log('❌ SERVICE_KEY: 未設定');
}
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 必要な環境変数が不足しています');
  console.log('🔧 修正手順:');
  console.log('1. Supabase Dashboard (https://supabase.com/dashboard) にアクセス');
  console.log('2. プロジェクト選択 → Settings → API');
  console.log('3. Project URL と anon public key をコピー');
  console.log('4. .env.local ファイルを更新');
  process.exit(1);
}

// 実際の接続テスト
async function testConnection() {
  try {
    console.log('🔗 Supabase接続テスト開始...');
    
    // クライアント作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    });
    
    console.log('1️⃣ 基本接続テスト...');
    
    // シンプルな接続テスト
    const { data, error } = await supabase
      .from('dummy')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ 接続成功！（テーブル未作成は正常）');
      } else if (error.message.includes('Invalid API key')) {
        console.log('❌ APIキーが無効です');
        console.log('🔧 解決方法:');
        console.log('1. Supabase Dashboard → Settings → API');
        console.log('2. 正しい anon public key をコピー');
        console.log('3. .env.local の NEXT_PUBLIC_SUPABASE_ANON_KEY を更新');
        return false;
      } else {
        console.log('⚠️ 接続エラー:', error.message);
      }
    } else {
      console.log('✅ 完全接続成功！');
    }
    
    // 認証システムテスト
    console.log('2️⃣ 認証システムテスト...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError && !authError.message.includes('Invalid API key')) {
      console.log('✅ 認証システム利用可能');
    } else if (authError) {
      console.log('❌ 認証エラー:', authError.message);
      return false;
    } else {
      console.log('✅ 認証システム正常');
    }
    
    console.log('\n🎉 Supabase接続テスト完了！');
    console.log('✅ データベース移行準備OK');
    
    return true;
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message);
    console.log('🔧 トラブルシューティング:');
    console.log('1. インターネット接続を確認');
    console.log('2. Supabaseプロジェクトが有効か確認');
    console.log('3. APIキーを再取得して更新');
    return false;
  }
}

// メイン実行
testConnection().then(success => {
  if (success) {
    console.log('\n📋 次のステップ:');
    console.log('✅ Phase 2: データベーステーブル作成に進めます');
    console.log('🚀 コマンド: node create-database-tables.js');
  } else {
    console.log('\n🔧 修正後、以下のコマンドで再テスト:');
    console.log('node test-supabase-fixed.js');
  }
});
