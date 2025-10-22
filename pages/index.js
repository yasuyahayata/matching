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
  const router = useRouter();

  // タグカテゴリーの定義
  const tagCategories = {
    'コンテンツタイプ別': [
      '事例・ケーススタディ',
      'ノウハウ・How to',
      '最新トレンド',
      'インタビュー',
      'レポート・調査'
    ],
    '業界・テーマ別': [
      'すべて',
      'EC・小売',
      'エンタメ・メディア',
      '飲食・サービス',
      'IT・テクノロジー',
      '美容・ファッション',
      '教育・スクール'
    ],
    '施策・手法別': [
      'コミュニティ運営',
      'SNSマーケティング',
      'イベント企画',
      'ロイヤリティプログラム',
      'UGC活用',
      'インフルエンサー連携'
    ],
    '課題・目的別': [
      '新規顧客獲得',
      'リピート率向上',
      'ブランディング強化',
      'エンゲージメント向上',
      'LTV向上',
      '口コミ促進'
    ]
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
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
    } else {
      setSelectedMainCategory(category);
    }
  };

  // サブカテゴリーをクリックした時の処理
  const handleSubCategoryClick = (subCategory) => {
    if (selectedSubCategories.includes(subCategory)) {
      setSelectedSubCategories(selectedSubCategories.filter(cat => cat !== subCategory));
    } else {
      setSelectedSubCategories([...selectedSubCategories, subCategory]);
    }
  };

  // タグをクリアする
  const clearAllTags = () => {
    setSelectedSubCategories([]);
    setSelectedMainCategory(null);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // サブカテゴリーが選択されていない場合は検索のみ
    if (selectedSubCategories.length === 0) {
      return matchesSearch;
    }
    
    // サブカテゴリーでフィルタリング（今後、jobsテーブルにタグカラムを追加する必要があります）
    // 現在は仮の実装
    return matchesSearch;
  });

  return (
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
            コンテンツを投稿する
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

        {/* サブカテゴリー */}
        {selectedMainCategory && (
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
                {selectedSubCategories.includes(subCategory) && (
                  <span className={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
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
                  onClick={() => handleSubCategoryClick(tag)}
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
            <div className={styles.jobCategory}>{job.category}</div>
            <h3 className={styles.jobTitle}>{job.title}</h3>
            <p className={styles.jobDescription}>{job.description}</p>
            <div className={styles.jobFooter}>
              <span className={styles.jobBudget}>¥{job.budget?.toLocaleString()}</span>
              <span className={styles.jobDeadline}>
                期限: {new Date(job.deadline).toLocaleDateString('ja-JP')}
              </span>
            </div>
            <div className={styles.jobApplications}>
              提案数: {job.application_count || 0}件
            </div>
            <button className={styles.jobDetailButton}>詳細を見る</button>
          </Link>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className={styles.noJobs}>
          <p>該当するコンテンツが見つかりませんでした</p>
        </div>
      )}
    </div>
  );
}
