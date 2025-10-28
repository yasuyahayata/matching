import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useToast } from '../../../components/ToastManager';
import Link from 'next/link';

export default function ApplicationsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (id && session) {
      fetchJobAndApplications();
      markNotificationsAsRead();
    }
  }, [id, session]);

  const markNotificationsAsRead = async () => {
    if (!id) return;

    try {
      await fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new_application',
          jobId: id
        }),
      });
      
      console.log('応募通知を既読にしました');
      window.dispatchEvent(new Event('messagesRead'));
    } catch (error) {
      console.error('通知の既読処理エラー:', error);
    }
  };

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

      showToast(
        newStatus === 'approved' 
          ? '応募を承認しました！チャットルームが作成されました。' 
          : '応募を却下しました',
        newStatus === 'approved' ? 'success' : 'info'
      );
      await fetchJobAndApplications();
      
    } catch (err) {
      console.error('ステータス更新エラー:', err);
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '審査中', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '承認済み', className: 'bg-green-100 text-green-800' },
      rejected: { label: '却下', className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`px-4 py-2 rounded-lg text-sm font-bold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-xl shadow-lg max-w-md border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            トップページへ
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-xl shadow-lg max-w-md border border-gray-200">
          <p className="text-red-600 font-semibold mb-6 text-lg">{error}</p>
          <button 
            onClick={() => router.back()} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* ヘッダー */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()} 
            className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-flex items-center gap-2 text-lg"
          >
            ← 案件詳細に戻る
          </button>
          <h1 className="text-4xl font-bold text-gray-900">応募者一覧</h1>
        </div>

        {/* 案件情報 */}
        {job && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
                <p className="text-gray-600">
                  応募数: <span className="font-bold text-blue-600 text-xl">{applications.length}</span>件
                </p>
              </div>
              <Link
                href={`/job/${id}`}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                案件詳細を見る
              </Link>
            </div>
          </div>
        )}

        {/* 応募者リスト */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">まだ応募がありません</h3>
            <p className="text-gray-500">応募があるとここに表示されます</p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-8 hover:border-blue-300 transition-all">
                {/* カードヘッダー */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b-2 border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {app.freelancer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{app.freelancer_name}</h3>
                      <p className="text-gray-600 mb-2">{app.freelancer_email}</p>
                      <p className="text-sm text-gray-500">
                        応募日時: {new Date(app.created_at).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                {/* メッセージ */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">応募メッセージ:</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{app.message}</p>
                  </div>
                </div>

                {/* アクションボタン */}
                {app.status === 'pending' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'approved')}
                      disabled={processingId === app.id}
                      className="flex-1 bg-green-600 text-white py-4 px-8 rounded-lg hover:bg-green-700 transition-all font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === app.id ? '処理中...' : '✓ 承認する'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'rejected')}
                      disabled={processingId === app.id}
                      className="flex-1 bg-red-600 text-white py-4 px-8 rounded-lg hover:bg-red-700 transition-all font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === app.id ? '処理中...' : '✗ 却下する'}
                    </button>
                  </div>
                )}

                {app.status === 'approved' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-semibold">✓ この応募は承認されています</p>
                    </div>
                    <button
                      onClick={() => {
                        if (app.chat_room_id) {
                          router.push(`/chat/${app.chat_room_id}`);
                        } else {
                          showToast('チャットルームが見つかりません。ページを再読み込みしています...', 'info');
                          fetchJobAndApplications();
                        }
                      }}
                      className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg hover:bg-blue-700 transition-all font-semibold text-base"
                    >
                      💬 チャットを開く
                    </button>
                  </div>
                )}

                {app.status === 'rejected' && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-semibold">この応募は却下されています</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
