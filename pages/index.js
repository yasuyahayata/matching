import Head from 'next/head'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedSkillCategory, setSelectedSkillCategory] = useState(null);
  const router = useRouter();

  // タグカテゴリーの定義
  const tagCategories = {
    '業種別': [
      'EC・小売',
      'エンタメ・メディア',
      '飲食・サービス',
      'IT・テクノロジー',
      '美容・ファッション',
      '教育・スクール',
      '金融・保険',
      '不動産',
      '医療・ヘルスケア',
      '製造業',
      'コンサルティング',
      '人材・採用',
      '旅行・観光',
      'その他'
    ],
    '職種別': [
      'マーケティング担当',
      'プロダクトマネージャー',
      'セールス・営業',
      'カスタマーサクセス',
      'カスタマーサポート',
      'ブランドマネージャー',
      '広報・PR',
      'SNS運用',
      'コンテンツディレクター',
      'コミュニティマネージャー',
      'データアナリスト',
      'プロジェクトマネージャー',
      'エンジニア',
      'デザイナー',
      '編集者・ライター',
      'その他'
    ],
    '課題・目的別': [
      '新規顧客獲得',
      'リピート率向上',
      'ブランディング強化',
      'エンゲージメント向上',
      'LTV向上',
      '口コミ促進'
    ],
    '施策・手法別': [
      'コミュニティ運営',
      'SNSマーケティング',
      'イベント企画',
      'ロイヤリティプログラム',
      'UGC活用',
      'インフルエンサー連携'
    ],
    'スキル・専門分野別': [
      'プログラミング',
      'デザイン',
      '動画・映像',
      'ライティング',
      'マーケティング',
      'データ分析',
      'プロジェクト管理'
    ]
  };

  // スキル・専門分野の詳細（3階層目）
  const skillDetails = {
    'プログラミング': [
      'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular',
      'Python', 'Java', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
      'Node.js', 'Next.js', 'Nuxt.js', 'Django', 'Laravel'
    ],
    'デザイン': [
      'Illustrator', 'Photoshop', 'Figma', 'Adobe XD', 'Sketch',
      'InDesign', 'After Effects', 'Canva', 'UI/UXデザイン',
      'グラフィックデザイン', 'ロゴデザイン', 'Webデザイン'
    ],
    '動画・映像': [
      'Premiere Pro', 'After Effects', 'Final Cut Pro', 'DaVinci Resolve',
      '動画編集', 'モーショングラフィックス', 'アニメーション',
      'YouTube編集', 'TikTok編集', '撮影', '字幕作成'
    ],
    'ライティング': [
      'SEOライティング', 'コピーライティング', 'セールスライティング',
      'コンテンツライティング', '技術文書作成', '翻訳（英日）',
      '翻訳（日英）', '校正', '編集', 'ブログ執筆'
    ],
    'マーケティング': [
      'Google Analytics', 'SEO', 'SEM', 'SNS運用',
      'Facebook広告', 'Google広告', 'Instagram運用', 'Twitter運用',
      'コンテンツマーケティング', 'メールマーケティング', 'アフィリエイト'
    ],
    'データ分析': [
      'Excel', 'Google Sheets', 'SQL', 'Python（分析）',
      'Tableau', 'Power BI', 'Google Data Studio',
      'R言語', 'データビジュアライゼーション'
    ],
    'プロジェクト管理': [
      'Notion', 'Slack', 'Trello', 'Asana', 'Jira',
      'Backlog', 'Monday.com', 'アジャイル', 'スクラム'
    ]
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, description, deadline, skills, client_email, client_name, status, created_at')
        .neq('status', '完了')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('案件の取得エラー:', error);
    }
  }

  // メインカテゴリーをクリックした時の処理
  const handleMainCategoryClick = (category) => {
    if (selectedMainCategory === category) {
      setSelectedMainCategory(null);
      setSelectedSkillCategory(null);
    } else {
      setSelectedMainCategory(category);
      setSelectedSkillCategory(null);
    }
  };

  // サブカテゴリーをクリックした時の処理
  const handleSubCategoryClick = (subCategory) => {
    // スキル・専門分野別の場合は、詳細スキルを表示
    if (selectedMainCategory === 'スキル・専門分野別' && skillDetails[subCategory]) {
      setSelectedSkillCategory(subCategory);
      return;
    }

    // 通常のサブカテゴリー選択
    if (selectedSubCategories.includes(subCategory)) {
      setSelectedSubCategories(selectedSubCategories.filter(cat => cat !== subCategory));
    } else {
      setSelectedSubCategories([...selectedSubCategories, subCategory]);
    }
  };

  // 詳細スキルをクリックした時の処理
  const handleDetailSkillClick = (skill) => {
    if (selectedSubCategories.includes(skill)) {
      setSelectedSubCategories(selectedSubCategories.filter(s => s !== skill));
    } else {
      setSelectedSubCategories([...selectedSubCategories, skill]);
    }
  };

  // スキルカテゴリーに戻る
  const backToSkillCategories = () => {
    setSelectedSkillCategory(null);
  };

  // タグをクリアする
  const clearAllTags = () => {
    setSelectedSubCategories([]);
    setSelectedMainCategory(null);
    setSelectedSkillCategory(null);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedSubCategories.length === 0) {
      return matchesSearch;
    }
    
    // スキルタグでフィルタリング
    const jobSkills = job.skills || [];
    const hasMatchingSkill = selectedSubCategories.some(selectedTag => 
      jobSkills.includes(selectedTag)
    );
    
    return matchesSearch && hasMatchingSkill;
  });

  return (
    <>
      <Head>
        <title>matching</title>
        <meta name="description" content="企業と企業をマッチングするプラットフォーム" />
      </Head>

      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>ファンと共に成長する</h1>
          <p className={styles.heroSubtitle}>
            ファンマーケティングの実践事例、ノウハウ、最新トレンドを共有するプラットフォーム
          </p>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="キーワードで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <button className={styles.postButton} onClick={() => router.push('/post-job')}>
              案件を投稿する
            </button>
          </div>

          {/* メインカテゴリー */}
          <div className={styles.mainCategories}>
            {Object.keys(tagCategories).map(category => (
              <button
                key={category}
                onClick={() => handleMainCategoryClick(category)}
                className={`${styles.mainCategoryButton} ${
                  selectedMainCategory === category ? styles.mainCategoryButtonActive : ''
                }`}
              >
                {category}
                <span className={styles.arrow}>
                  {selectedMainCategory === category ? '▲' : '▼'}
                </span>
              </button>
            ))}
          </div>

          {/* サブカテゴリー（2階層目） */}
          {selectedMainCategory && !selectedSkillCategory && (
            <div className={styles.subCategories}>
              {tagCategories[selectedMainCategory].map(subCategory => (
                <button
                  key={subCategory}
                  onClick={() => handleSubCategoryClick(subCategory)}
                  className={`${styles.subCategoryButton} ${
                    selectedSubCategories.includes(subCategory) ? styles.subCategoryButtonActive : ''
                  }`}
                >
                  {subCategory}
                  {selectedMainCategory === 'スキル・専門分野別' && skillDetails[subCategory] && (
                    <span className={styles.arrowRight}>→</span>
                  )}
                  {selectedSubCategories.includes(subCategory) && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 詳細スキル（3階層目） */}
          {selectedSkillCategory && (
            <div className={styles.skillDetails}>
              <div className={styles.skillDetailsHeader}>
                <button onClick={backToSkillCategories} className={styles.backButton}>
                  ← {selectedSkillCategory}
                </button>
              </div>
              <div className={styles.detailSkills}>
                {skillDetails[selectedSkillCategory].map(skill => (
                  <button
                    key={skill}
                    onClick={() => handleDetailSkillClick(skill)}
                    className={`${styles.detailSkillButton} ${
                      selectedSubCategories.includes(skill) ? styles.detailSkillButtonActive : ''
                    }`}
                  >
                    {skill}
                    {selectedSubCategories.includes(skill) && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 選択中のタグ表示 */}
          {selectedSubCategories.length > 0 && (
            <div className={styles.selectedTags}>
              <span className={styles.selectedTagsLabel}>選択中:</span>
              {selectedSubCategories.map(tag => (
                <span key={tag} className={styles.selectedTag}>
                  {tag}
                  <button
                    onClick={() => {
                      setSelectedSubCategories(selectedSubCategories.filter(t => t !== tag));
                    }}
                    className={styles.removeTagButton}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button onClick={clearAllTags} className={styles.clearAllButton}>
                すべてクリア
              </button>
            </div>
          )}
        </div>

        <div className={styles.jobsGrid}>
          {filteredJobs.map(job => (
            <Link href={`/job/${job.id}`} key={job.id} className={styles.jobCard}>
              {/* 1. ユーザー名 */}
              <div className={styles.clientInfo}>
                <div className={styles.clientAvatar}>
                  {(job.client_name?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div className={styles.clientDetails}>
                  <span className={styles.clientName}>{job.client_name || '匿名ユーザー'}</span>
                  <span className={styles.clientLabel}>投稿者</span>
                </div>
              </div>

              {/* 2. 案件のタイトル */}
              <h3 className={styles.jobTitle}>{job.title}</h3>

              {/* 3. 詳細（説明文） */}
              <p className={styles.jobDescription}>
                {job.description.length > 120 
                  ? `${job.description.substring(0, 120)}...` 
                  : job.description}
              </p>

              {/* 4. 選択されたタグ一覧 */}
              {job.skills && job.skills.length > 0 && (
                <div className={styles.jobSkills}>
                  {job.skills.slice(0, 4).map((skill, index) => (
                    <span key={index} className={styles.skillTag}>
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className={styles.skillTag}>+{job.skills.length - 4}</span>
                  )}
                </div>
              )}

              {/* 5. 詳細を見るボタン */}
              <button className={styles.jobDetailButton}>詳細を見る →</button>
            </Link>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className={styles.noJobs}>
            <p>該当するコンテンツが見つかりませんでした</p>
          </div>
        )}
      </div>
    </>
  );
}
