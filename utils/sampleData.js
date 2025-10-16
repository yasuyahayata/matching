// utils/sampleData.js - サンプルデータ初期化
export const initializeSampleData = () => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') return;
  
  try {
    // 既存データをチェック
    const existingJobs = localStorage.getItem('crowdwork_jobs');
    const jobs = existingJobs ? JSON.parse(existingJobs) : [];
    
    // データが空の場合のみサンプルデータを追加
    if (jobs.length === 0) {
      console.log('サンプルデータを初期化中...');
      
      const sampleJobs = [
        {
          id: 1,
          title: "ウェブサイトのロゴデザイン",
          description: "弊社の新サービス用のロゴデザインを募集します。モダンで親しみやすいデザインを希望。カラーパレットは青系統を基調としたものでお願いします。",
          budget: "50000",
          deadline: "2024-11-15",
          category: "デザイン",
          clientId: "1",
          clientName: "田中商事",
          status: "募集中",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: "ECサイトの商品写真撮影",
          description: "アパレル商品50点の撮影をお願いします。白背景での撮影を希望。各商品につき3アングルの撮影が必要です。",
          budget: "80000",
          deadline: "2024-11-20",
          category: "写真・動画",
          clientId: "2", 
          clientName: "ファッション株式会社",
          status: "募集中",
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          title: "WordPressサイトの修正・改善",
          description: "既存のWordPressサイトのレスポンシブ対応とページ表示速度の改善をお願いします。SEO最適化も含みます。",
          budget: "120000",
          deadline: "2024-12-01",
          category: "Web開発",
          clientId: "1",
          clientName: "田中商事", 
          status: "募集中",
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          title: "YouTube動画の編集",
          description: "企業紹介動画（15分程度）の編集作業。テロップ追加、BGM挿入、カット編集を含みます。",
          budget: "45000",
          deadline: "2024-11-25",
          category: "写真・動画",
          clientId: "3",
          clientName: "マーケティング会社ABC",
          status: "募集中",
          createdAt: new Date().toISOString()
        }
      ];

      const sampleApplications = [
        {
          id: 1,
          jobId: 1,
          applicantId: "worker1",
          applicantName: "佐藤デザイナー",
          message: "ロゴデザインを得意としており、これまで100件以上の実績があります。ご希望に沿った魅力的なロゴを制作いたします。ポートフォリオもご確認いただけます。",
          status: "応募中",
          appliedAt: new Date(Date.now() - 172800000).toISOString() // 2日前
        },
        {
          id: 2,
          jobId: 2,
          applicantId: "worker2", 
          applicantName: "山田フォトグラファー",
          message: "アパレル商品撮影の経験が豊富です。自然光を活かした美しい商品写真をお約束します。過去の作品もご覧いただけます。",
          status: "承認済み",
          appliedAt: new Date(Date.now() - 259200000).toISOString() // 3日前
        },
        {
          id: 3,
          jobId: 3,
          applicantId: "worker3",
          applicantName: "鈴木ウェブエンジニア", 
          message: "WordPress開発経験10年以上です。レスポンシブ対応とパフォーマンス改善を得意としています。",
          status: "応募中",
          appliedAt: new Date(Date.now() - 86400000).toISOString() // 1日前
        }
      ];

      const sampleMessages = [
        {
          id: 1,
          jobId: 2,
          senderId: "2",
          senderName: "ファッション株式会社", 
          receiverId: "worker2",
          receiverName: "山田フォトグラファー",
          message: "撮影の件でご相談があります。撮影日程はいつ頃がご都合よろしいでしょうか？商品は弊社オフィスにて受け渡し予定です。",
          timestamp: new Date(Date.now() - 86400000).toISOString() // 1日前
        },
        {
          id: 2,
          jobId: 2,
          senderId: "worker2",
          senderName: "山田フォトグラファー",
          receiverId: "2", 
          receiverName: "ファッション株式会社",
          message: "来週の火曜日から金曜日でしたら対応可能です。詳細な撮影要件や商品点数を教えていただけますでしょうか？",
          timestamp: new Date(Date.now() - 43200000).toISOString() // 12時間前
        },
        {
          id: 3,
          jobId: 2,
          senderId: "2",
          senderName: "ファッション株式会社",
          receiverId: "worker2", 
          receiverName: "山田フォトグラファー",
          message: "商品は全50点、Tシャツ20点、パンツ15点、アクセサリー15点です。各3アングルでお願いします。スタジオはお客様でご用意いただけますか？",
          timestamp: new Date(Date.now() - 21600000).toISOString() // 6時間前
        }
      ];

      // localStorageに保存
      localStorage.setItem('crowdwork_jobs', JSON.stringify(sampleJobs));
      localStorage.setItem('crowdwork_applications', JSON.stringify(sampleApplications));
      localStorage.setItem('crowdwork_messages', JSON.stringify(sampleMessages));
      
      console.log('✅ サンプルデータを追加しました:', {
        jobs: sampleJobs.length,
        applications: sampleApplications.length, 
        messages: sampleMessages.length
      });
      
      // データが正しく保存されたか確認
      const savedJobs = JSON.parse(localStorage.getItem('crowdwork_jobs') || '[]');
      console.log('保存確認:', savedJobs.length, '件の案件');
      
      return true; // 初期化完了
    } else {
      console.log('既存データが見つかりました:', jobs.length, '件');
      return false; // 既存データあり
    }
  } catch (error) {
    console.error('サンプルデータ初期化エラー:', error);
    return false;
  }
};

// 既存データをリセットする関数（開発用）
export const resetSampleData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('crowdwork_jobs');
    localStorage.removeItem('crowdwork_applications');
    localStorage.removeItem('crowdwork_messages');
    console.log('データをリセットしました');
    
    // 再初期化
    return initializeSampleData();
  }
};
