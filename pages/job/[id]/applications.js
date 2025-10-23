import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
// import Layout from '../../../components/Layout'; // ← この行を削除
import styles from '../../../styles/Applications.module.css';

export default function ApplicationsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (id && session) {
      fetchJobAndApplications();
    }
  }, [id, session]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      
      const jobRes = await fetch(`/api/jobs/${id}`);
      if (!jobRes.ok) throw new Error('案件の取得に失敗しました');
      const jobData = await jobRes.json();
      
      if (jobData.client_email !== session.user.email) {
        setError('この案件の応募者を見る権限がありません');
        setLoading(false);
        return;
      }
      
      setJob(jobData);
      
      const appsRes = await fetch(`/api/jobs/${id}/applications`);
      if (!appsRes.ok) throw new Error('応募の取得に失敗しました');
      const appsData = await appsRes.json();
      
      setApplications(appsData);
      setLoading(false);
      
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    const confirmMessage = newStatus === 'approved' 
      ? 'この応募を承認しますか？' 
      : 'この応募を却下しますか？';
    
    if (!confirm(confirmMessage)) return;

    try {
      setProcessingId(applicationId);
      
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ステータスの更新に失敗しました');
      }

      alert(newStatus === 'approved' ? '応募を承認しました' : '応募を却下しました');
      await fetchJobAndApplications();
      
    } catch (err) {
      console.error('ステータス更新エラー:', err);
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '審査中', className: styles.statusPending },
      approved: { label: '承認済み', className: styles.statusApproved },
      rejected: { label: '却下', className: styles.statusRejected },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`${styles.statusBadge} ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // ログインチェック - Layoutを削除
  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <p>ログインが必要です</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
        <button onClick={() => router.back()} className={styles.backButton}>
          戻る
        </button>
      </div>
    );
  }

  // メインコンテンツ - Layoutを削除
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>応募者一覧</h1>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← 案件詳細に戻る
        </button>
      </div>

      {job && (
        <div className={styles.jobInfo}>
          <h2>{job.title}</h2>
          <p className={styles.jobMeta}>
            予算: ¥{job.budget?.toLocaleString()} | 
            締切: {new Date(job.deadline).toLocaleDateString('ja-JP')}
          </p>
        </div>
      )}

      {applications.length === 0 ? (
        <div className={styles.noApplications}>
          <p>まだ応募がありません</p>
        </div>
      ) : (
        <div className={styles.applicationsList}>
          {applications.map((app) => (
            <div key={app.id} className={styles.applicationCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3>{app.freelancer_name}</h3>
                  <p className={styles.email}>{app.freelancer_email}</p>
                </div>
                {getStatusBadge(app.status)}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.proposalInfo}>
                  <div>
                    <span className={styles.label}>提案予算:</span>
                    <span className={styles.value}>¥{app.proposed_budget?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className={styles.label}>見積期間:</span>
                    <span className={styles.value}>{app.estimated_duration}</span>
                  </div>
                </div>

                <div className={styles.message}>
                  <span className={styles.label}>メッセージ:</span>
                  <p>{app.message}</p>
                </div>

                <p className={styles.appliedDate}>
                  応募日時: {new Date(app.created_at).toLocaleString('ja-JP')}
                </p>
              </div>

              {app.status === 'pending' && (
                <div className={styles.actionButtons}>
                  <button
                    onClick={() => handleStatusUpdate(app.id, 'approved')}
                    disabled={processingId === app.id}
                    className={styles.approveButton}
                  >
                    {processingId === app.id ? '処理中...' : '✓ 承認する'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(app.id, 'rejected')}
                    disabled={processingId === app.id}
                    className={styles.rejectButton}
                  >
                    {processingId === app.id ? '処理中...' : '✗ 却下する'}
                  </button>
                </div>
              )}

              {app.status === 'approved' && (
                <div className={styles.approvedSection}>
                  <div className={styles.statusMessage}>
                    この応募は承認されています
                  </div>
                  <button
                    onClick={() => router.push(`/chat/${app.id}`)}
                    className={styles.chatButton}
                  >
                    💬 チャットを開く
                  </button>
                </div>
              )}

              {app.status === 'rejected' && (
                <div className={styles.statusMessage}>
                  この応募は却下されています
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
