import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import styles from '../styles/Matching.module.css';

export default function MatchingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [matchings, setMatchings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'client', 'freelancer'

  useEffect(() => {
    if (session) {
      fetchMatchings();
    }
  }, [session]);

  const fetchMatchings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/matching');
      
      if (!res.ok) {
        throw new Error('マッチングの取得に失敗しました');
      }

      const data = await res.json();
      setMatchings(data);
      setLoading(false);
    } catch (err) {
      console.error('マッチング取得エラー:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleOpenChat = (chatRoomId) => {
    if (chatRoomId) {
      router.push(`/chat/${chatRoomId}`);
    } else {
      alert('チャットルームが見つかりません');
    }
  };

  const handleViewJob = (jobId) => {
    router.push(`/job/${jobId}`);
  };

  // フィルタリングされたマッチング一覧
  const filteredMatchings = matchings.filter(matching => {
    if (activeTab === 'all') return true;
    if (activeTab === 'client') return matching.isClient;
    if (activeTab === 'freelancer') return !matching.isClient;
    return true;
  });

  // 各タブの件数を計算
  const clientCount = matchings.filter(m => m.isClient).length;
  const freelancerCount = matchings.filter(m => !m.isClient).length;

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>ログインが必要です</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🤝 マッチング案件</h1>
        <p className={styles.subtitle}>承認された案件の一覧です</p>
      </div>

      {/* タブナビゲーション */}
      <div className={styles.tabNav}>
        <button
          onClick={() => setActiveTab('all')}
          className={`${styles.tabButton} ${activeTab === 'all' ? styles.tabButtonActive : ''}`}
        >
          <span className={styles.tabIcon}>📋</span>
          <span className={styles.tabLabel}>すべて</span>
          <span className={styles.tabCount}>{matchings.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('client')}
          className={`${styles.tabButton} ${activeTab === 'client' ? styles.tabButtonActive : ''}`}
        >
          <span className={styles.tabIcon}>📤</span>
          <span className={styles.tabLabel}>発注側</span>
          <span className={styles.tabCount}>{clientCount}</span>
        </button>
        <button
          onClick={() => setActiveTab('freelancer')}
          className={`${styles.tabButton} ${activeTab === 'freelancer' ? styles.tabButtonActive : ''}`}
        >
          <span className={styles.tabIcon}>📥</span>
          <span className={styles.tabLabel}>受注側</span>
          <span className={styles.tabCount}>{freelancerCount}</span>
        </button>
      </div>

      {filteredMatchings.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🤝</div>
          <p className={styles.emptyText}>
            {activeTab === 'all' && 'まだマッチングした案件はありません'}
            {activeTab === 'client' && '発注側のマッチング案件はありません'}
            {activeTab === 'freelancer' && '受注側のマッチング案件はありません'}
          </p>
          <button 
            onClick={() => router.push('/')}
            className={styles.browseButton}
          >
            案件を探す
          </button>
        </div>
      ) : (
        <div className={styles.matchingsList}>
          {filteredMatchings.map((matching) => (
            <div key={matching.applicationId} className={styles.matchingCard}>
              <div className={styles.cardHeader}>
                <div className={styles.jobInfo}>
                  <span className={styles.category}>{matching.jobCategory}</span>
                  <h3 className={styles.jobTitle}>{matching.jobTitle}</h3>
                </div>
                <span className={styles.roleBadge}>
                  {matching.isClient ? '📤 発注側' : '📥 受注側'}
                </span>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.description}>
                  {matching.jobDescription.length > 150 
                    ? `${matching.jobDescription.substring(0, 150)}...` 
                    : matching.jobDescription}
                </p>

                <div className={styles.partnerInfo}>
                  <span className={styles.label}>
                    {matching.isClient ? '受注企業:' : '発注企業:'}
                  </span>
                  <span className={styles.partnerName}>
                    {matching.isClient ? matching.freelancerName : matching.clientName}
                  </span>
                </div>

                <div className={styles.matchedDate}>
                  マッチング日時: {new Date(matching.matchedAt).toLocaleString('ja-JP')}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  onClick={() => handleViewJob(matching.jobId)}
                  className={styles.viewButton}
                >
                  📋 案件詳細
                </button>
                <button
                  onClick={() => handleOpenChat(matching.chatRoomId)}
                  className={styles.chatButton}
                >
                  💬 チャットを開く
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
